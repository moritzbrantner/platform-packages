import { describe, expect, test } from "vitest";

import {
  adaptDocumentStructureExtractionOutput,
  adaptInformationExtractionOutput,
  applyRuleBasedPostprocessors,
  createConfidenceThresholdPolicy,
  filterExtractionByPolicy,
  normalizeDate,
  parseNumericWithUnit,
  validateExtractionOutput,
  validateExtractionSchema,
  type ExtractionSchema,
} from "./index";

const schema: ExtractionSchema = {
  entities: [
    {
      type: "person",
      fields: [
        { name: "name", type: "string", required: true },
        { name: "birth_date", type: "date" },
      ],
    },
    {
      type: "organization",
      fields: [{ name: "name", type: "string", required: true }],
    },
  ],
  relations: [{ type: "member_of", from: "person", to: "organization" }],
};

describe("@moritzbrantner/extraction-schema", () => {
  test("validates schema consistency", () => {
    expect(validateExtractionSchema(schema).ok).toBe(true);
    expect(
      validateExtractionSchema({
        entities: [{ type: "person", fields: [{ name: "name", type: "string" }] }],
        relations: [{ type: "works_for", from: "person", to: "company" }],
      }).ok,
    ).toBe(false);
  });

  test("normalizes dates and numeric units", () => {
    expect(normalizeDate("31/12/2025", { locale: "de-DE" })).toBe("2025-12-31");
    expect(parseNumericWithUnit("1.234,56 kg", { locale: "de-DE" })).toEqual({
      value: 1234.56,
      unit: "kg",
    });
  });

  test("adapts information extraction output deterministically", () => {
    const normalized = adaptInformationExtractionOutput({
      entities: [
        {
          id: "p1",
          type: "Person",
          confidence: 0.91,
          fields: [
            { name: "name", value: "Ada Lovelace", confidence: 0.95 },
            { name: "birth date", value: "10/12/1815", confidence: 0.7 },
          ],
        },
        {
          id: "o1",
          type: "Organization",
          properties: { name: "Analytical Society" },
          confidence: 0.88,
        },
      ],
      relations: [{ type: "Member Of", from: "p1", to: "o1", confidence: 0.92 }],
    });

    expect(normalized.entities.map((entity) => entity.id)).toEqual(["o1", "p1"]);
    expect(normalized.entities[1]?.fields.birth_date?.value).toBe("1815-10-12");
    expect(normalized.relations[0]).toMatchObject({
      type: "member_of",
      fromEntityId: "p1",
      toEntityId: "o1",
    });
  });

  test("adapts document structure outputs and postprocesses duplicates/placeholders", () => {
    const normalized = adaptDocumentStructureExtractionOutput({
      blocks: [
        {
          id: "b1",
          kind: "Person",
          confidence: 0.81,
          values: { name: " Unknown ", age: "33 years" },
        },
      ],
      links: [{ relation: "member_of", fromBlockId: "b1", toBlockId: "missing", confidence: 0.8 }],
    });

    expect(normalized.relations).toEqual([]);

    const post = applyRuleBasedPostprocessors({
      entities: [
        {
          ...normalized.entities[0]!,
          fields: {
            ...normalized.entities[0]!.fields,
            alias: {
              name: "alias",
              value: "Unknown",
              rawValue: "Unknown",
              confidence: 0.7,
            },
          },
        },
      ],
      relations: [
        { type: "knows", fromEntityId: "b1", toEntityId: "b2", confidence: 0.8 },
        { type: "knows", fromEntityId: "b1", toEntityId: "b2", confidence: 0.4 },
      ],
    });

    expect(post.entities[0]?.fields.alias).toBeUndefined();
    expect(post.relations).toHaveLength(1);
  });

  test("enforces confidence policies and strict schema validation", () => {
    const extraction = adaptInformationExtractionOutput({
      entities: [
        {
          id: "p1",
          type: "person",
          confidence: 0.4,
          properties: { name: "Ada Lovelace" },
        },
        {
          id: "o1",
          type: "organization",
          confidence: 0.9,
          properties: { name: "Analytical Society" },
        },
      ],
      relations: [{ type: "member_of", from: "p1", to: "o1", confidence: 0.6 }],
    });

    const policy = createConfidenceThresholdPolicy({
      entityMinimum: 0.5,
      relationMinimum: 0.65,
      perFieldPath: { "person.name": 0.8 },
    });

    const filtered = filterExtractionByPolicy(extraction, policy);

    expect(filtered.entities).toHaveLength(1);
    expect(filtered.relations).toHaveLength(0);

    const validation = validateExtractionOutput(extraction, schema, policy);
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((issue) => issue.code === "LOW_CONFIDENCE")).toBe(true);
  });

  test("reports duplicate nested schema fields and invalid output shapes", () => {
    const invalidSchema = validateExtractionSchema({
      entities: [
        {
          type: "invoice",
          fields: [
            { name: "total", type: "number" },
            { name: "total", type: "number" },
          ],
        },
        { type: "invoice", fields: [] },
      ],
      relations: [{ type: "paid_by", from: "invoice", to: "person" }],
    });

    expect(invalidSchema.ok).toBe(false);
    expect(invalidSchema.issues.map((issue) => issue.code)).toEqual([
      "INVALID_FIELD",
      "INVALID_FIELD",
      "INVALID_RELATION_ENDPOINT",
    ]);

    const invalidOutput = validateExtractionOutput(
      {
        entities: [
          {
            id: "i1",
            type: "person",
            confidence: 1,
            fields: {
              name: { name: "name", value: 42, rawValue: 42, confidence: 1 },
              extra: { name: "extra", value: true, rawValue: true, confidence: 1 },
            },
          },
        ],
        relations: [
          { type: "member_of", fromEntityId: "i1", toEntityId: "missing", confidence: 1 },
        ],
      },
      schema,
    );

    expect(invalidOutput.ok).toBe(false);
    expect(invalidOutput.issues.map((issue) => issue.code)).toEqual([
      "INVALID_FIELD",
      "INVALID_FIELD",
      "INVALID_RELATION_ENDPOINT",
    ]);
  });
});
