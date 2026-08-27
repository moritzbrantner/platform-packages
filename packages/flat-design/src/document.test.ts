import { describe, expect, test } from "vitest";

import {
  FLAT_DESIGN_SCHEMA_VERSION,
  FlatDesignDocumentError,
  analyzeFlatDesignDocument,
  assertFlatDesignDocument,
  defineFlatDesignDocument,
  parseFlatDesignDocument,
  serializeFlatDesignDocument,
  validateFlatDesignDocument,
} from "./document";
import { flatDesignDocumentJsonSchema } from "./schema";
import type { FlatDesignScene } from "./scene-types";

function createScene(): FlatDesignScene {
  return {
    width: 320,
    height: 180,
    title: "Contract scene",
    gradients: [
      {
        id: "sky",
        kind: "linear",
        stops: [
          { offset: 0, color: "#dbeafe" },
          { offset: 1, color: "#93c5fd" },
        ],
      },
    ],
    layers: [
      {
        id: "foreground",
        shapes: [
          {
            id: "card",
            kind: "rect",
            x: 40,
            y: 40,
            width: 120,
            height: 80,
            fill: "url(#sky)",
            motion: {
              kind: "timeline",
              durationMs: 1_000,
              keyframes: [
                { timeMs: 0, x: 0, opacity: 1 },
                { timeMs: 1_000, x: 24, opacity: 0.6 },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe("flat-design document contract", () => {
  test("upgrades legacy scenes into versioned documents", () => {
    const document = defineFlatDesignDocument(createScene());

    expect(document.schemaVersion).toBe(FLAT_DESIGN_SCHEMA_VERSION);
    expect(validateFlatDesignDocument(document)).toEqual([]);
  });

  test("round-trips versioned documents through JSON", () => {
    const source = defineFlatDesignDocument(createScene());
    const serialized = serializeFlatDesignDocument(source);
    const parsed = parseFlatDesignDocument(serialized, { acceptLegacyScene: false });

    expect(parsed).toEqual(source);
  });

  test("parses legacy serialized scenes by default", () => {
    const parsed = parseFlatDesignDocument(JSON.stringify(createScene()));

    expect(parsed.schemaVersion).toBe(1);
  });

  test("rejects unsupported versions when legacy migration is disabled", () => {
    expect(() =>
      parseFlatDesignDocument(JSON.stringify({ ...createScene(), schemaVersion: 2 }), {
        acceptLegacyScene: false,
      }),
    ).toThrow(FlatDesignDocumentError);
  });

  test("reports duplicate ids, unknown gradients, and invalid keyframe ordering", () => {
    const document = defineFlatDesignDocument(createScene());
    const invalid = {
      ...document,
      layers: [
        {
          shapes: [
            {
              id: "duplicate",
              kind: "circle",
              cx: 20,
              cy: 20,
              r: 12,
              fill: "url(#missing)",
            },
            {
              id: "duplicate",
              kind: "rect",
              x: 20,
              y: 20,
              width: 10,
              height: 10,
              motion: {
                kind: "timeline",
                durationMs: 1_000,
                keyframes: [
                  { timeMs: 800, x: 0 },
                  { timeMs: 200, x: 10 },
                ],
              },
            },
          ],
        },
      ],
    };

    const codes = validateFlatDesignDocument(invalid).map((issue) => issue.code);

    expect(codes).toContain("duplicate-node-id");
    expect(codes).toContain("unknown-gradient");
    expect(codes).toContain("invalid-keyframe-order");
    expect(() => assertFlatDesignDocument(invalid)).toThrow(FlatDesignDocumentError);
  });

  test("keeps CSS-facing compatibility fields as portability warnings", () => {
    const document = defineFlatDesignDocument({
      ...createScene(),
      layers: [
        {
          className: "legacy-layer",
          transform: "translate(4 8)",
          shapes: [
            {
              className: "legacy-node",
              kind: "circle",
              cx: 20,
              cy: 20,
              r: 10,
            },
          ],
        },
      ],
    });

    const analysis = analyzeFlatDesignDocument(document);

    expect(analysis.valid).toBe(true);
    expect(analysis.issues.filter((issue) => issue.severity === "warning")).toHaveLength(3);
    expect(validateFlatDesignDocument(document)).toEqual([]);
  });

  test("publishes a version-locked JSON schema", () => {
    expect(flatDesignDocumentJsonSchema.$schema).toBe(
      "https://json-schema.org/draft/2020-12/schema",
    );
    expect(flatDesignDocumentJsonSchema.properties.schemaVersion.const).toBe(1);
    expect(flatDesignDocumentJsonSchema.required).toContain("layers");
  });
});
