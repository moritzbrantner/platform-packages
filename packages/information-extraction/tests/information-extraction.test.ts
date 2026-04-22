import { describe, expect, test } from "vitest";

import {
  createInformationExtractionPipeline,
  toGraphJson,
  toSchemaInformationExtractionOutput,
  type RelationExtractionProvider,
} from "../src/index";
import type { TokenClassificationProvider } from "@moritzbrantner/text-inference";
import type { TextAnalysisResult } from "@moritzbrantner/text-analysis";

describe("@moritzbrantner/information-extraction", () => {
  test("extracts relations and event frames from text-analysis entities", async () => {
    const pipeline = createInformationExtractionPipeline();
    const analysis = {
      document: {
        id: "doc-1",
        text: "Alice founded Bright Labs on January 5, 2025.",
        tokens: [],
        sentences: [],
        paragraphs: [],
      },
      categories: [],
      entities: [
        { text: "Alice", label: "PER", score: 0.99, count: 1 },
        { text: "Bright Labs", label: "ORG", score: 0.95, count: 1 },
      ],
      keywords: [],
      chunks: [],
    } satisfies Partial<TextAnalysisResult> as TextAnalysisResult;

    const result = await pipeline.extract(analysis.document.text, {
      analysis,
      emitGraph: true,
    });

    expect(result.relations.some((relation) => relation.subject === "Alice")).toBe(true);
    expect(result.events.some((event) => event.trigger.toLocaleLowerCase() === "founded")).toBe(
      true,
    );
    expect(result.events[0]?.time).toBe("January 5, 2025");
    expect(result.graph?.nodes.length).toBeGreaterThan(1);
    expect(result.relations[0]?.evidenceSpan.start).toBeTypeOf("number");
  });

  test("falls back to token classification provider when text-analysis entities are unavailable", async () => {
    const tokenProvider: TokenClassificationProvider = {
      id: "token-mock",
      async classifyTokens() {
        return {
          model: "mock-model",
          raw: null,
          entities: [
            { text: "Maya", label: "PER", score: 0.9, start: 0, end: 4 },
            { text: "Zenith Corp", label: "ORG", score: 0.88, start: 11, end: 22 },
          ],
        };
      },
    };

    const pipeline = createInformationExtractionPipeline({
      entityRecognizer: {
        provider: tokenProvider,
        model: { task: "token-classification", model: "mock" },
      },
    });

    const result = await pipeline.extract("Maya joined Zenith Corp yesterday.");

    expect(result.relations.some((relation) => relation.subject === "Maya")).toBe(true);
    expect(result.events.some((event) => event.trigger.toLocaleLowerCase() === "joined")).toBe(
      true,
    );
    expect(result.events[0]?.time?.toLocaleLowerCase()).toBe("yesterday");
  });

  test("merges duplicated relations across chunk boundaries", async () => {
    const relationProvider: RelationExtractionProvider = {
      id: "relation-mock",
      async extractRelations({ text }) {
        if (!text.includes("Nova acquired Luma")) {
          return [];
        }

        return [
          {
            subject: { text: "Nova", start: 0, end: 4, confidence: 0.86 },
            relation: "acquired",
            object: { text: "Luma", start: 14, end: 18, confidence: 0.84 },
            confidence: 0.85,
          },
        ];
      },
    };

    const pipeline = createInformationExtractionPipeline({
      relationProvider,
      chunking: {
        strategy: "character",
        maxCharacters: 30,
        overlapCharacters: 8,
      },
    });

    const text =
      "Nova acquired Luma in 2024. Later, Nova acquired Luma again in a follow-up announcement.";
    const result = await pipeline.extract(text);

    const acquired = result.relations.filter((relation) => relation.relation === "acquired");
    expect(acquired.length).toBe(1);
    expect(acquired[0]?.confidence).toBeGreaterThan(0.8);

    const graph = toGraphJson({
      documentId: result.documentId,
      relations: result.relations,
      events: result.events,
    });
    expect(graph.metadata.relationCount).toBe(result.relations.length);
  });

  test("normalizes and validates extraction output against a schema", async () => {
    const pipeline = createInformationExtractionPipeline({
      schema: {
        schema: {
          entities: [
            {
              type: "entity",
              fields: [{ name: "value", type: "string", required: true }],
            },
          ],
          relations: [{ type: "acquired", from: "entity", to: "entity" }],
        },
      },
    });

    const result = await pipeline.extract("Nova acquired Luma in 2024.");

    expect(result.validation?.ok).toBe(true);
    expect(result.normalizedExtraction?.entities.map((entity) => entity.id)).toEqual([
      "entity:luma",
      "entity:nova",
    ]);
    expect(result.normalizedExtraction?.relations[0]).toMatchObject({
      type: "acquired",
      fromEntityId: "entity:nova",
      toEntityId: "entity:luma",
    });

    const raw = toSchemaInformationExtractionOutput(result.relations, result.events);
    expect(raw.entities?.length).toBeGreaterThanOrEqual(2);
  });
});
