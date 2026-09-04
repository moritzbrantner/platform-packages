import { FLAT_DESIGN_SCHEMA_VERSION } from "./document";

const number = { type: "number" } as const;
const nonNegativeNumber = { minimum: 0, type: "number" } as const;
const optionalPaint = { type: "string" } as const;

const renderableProperties = {
  animations: {
    items: { $ref: "#/$defs/animation" },
    type: "array",
  },
  className: { type: "string" },
  fill: optionalPaint,
  id: { minLength: 1, type: "string" },
  motion: { $ref: "#/$defs/motion" },
  opacity: { maximum: 1, minimum: 0, type: "number" },
  stroke: optionalPaint,
  strokeLinecap: { enum: ["butt", "round", "square"] },
  strokeLinejoin: { enum: ["bevel", "miter", "round"] },
  strokeWidth: nonNegativeNumber,
  transform: { type: "string" },
} as const;

export const flatDesignDocumentJsonSchema = {
  $id: "https://moritzbrantner.dev/schemas/flat-design/document-v1.schema.json",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  additionalProperties: false,
  $defs: {
    animation: {
      oneOf: [
        {
          additionalProperties: true,
          properties: {
            attributeName: { minLength: 1, type: "string" },
            begin: { type: "string" },
            dur: { type: "string" },
            keySplines: { items: { type: "string" }, type: "array" },
            keyTimes: {
              items: { maximum: 1, minimum: 0, type: "number" },
              type: "array",
            },
            kind: { const: "attribute" },
            repeatCount: { type: "string" },
            values: { minItems: 1, type: "array" },
          },
          required: ["kind", "attributeName", "values"],
          type: "object",
        },
        {
          additionalProperties: true,
          properties: {
            begin: { type: "string" },
            dur: { type: "string" },
            keySplines: { items: { type: "string" }, type: "array" },
            keyTimes: {
              items: { maximum: 1, minimum: 0, type: "number" },
              type: "array",
            },
            kind: { const: "transform" },
            repeatCount: { type: "string" },
            transformType: { enum: ["translate", "scale", "rotate"] },
            values: { minItems: 1, type: "array" },
          },
          required: ["kind", "transformType", "values"],
          type: "object",
        },
      ],
    },
    gradient: {
      additionalProperties: false,
      properties: {
        cx: { anyOf: [number, { type: "string" }] },
        cy: { anyOf: [number, { type: "string" }] },
        fx: { anyOf: [number, { type: "string" }] },
        fy: { anyOf: [number, { type: "string" }] },
        id: { minLength: 1, type: "string" },
        kind: { enum: ["linear", "radial"] },
        r: { anyOf: [number, { type: "string" }] },
        stops: {
          items: {
            additionalProperties: false,
            properties: {
              color: { minLength: 1, type: "string" },
              offset: { anyOf: [number, { type: "string" }] },
              opacity: { maximum: 1, minimum: 0, type: "number" },
            },
            required: ["offset", "color"],
            type: "object",
          },
          minItems: 1,
          type: "array",
        },
        x1: { anyOf: [number, { type: "string" }] },
        x2: { anyOf: [number, { type: "string" }] },
        y1: { anyOf: [number, { type: "string" }] },
        y2: { anyOf: [number, { type: "string" }] },
      },
      required: ["id", "kind", "stops"],
      type: "object",
    },
    keyframe: {
      additionalProperties: false,
      properties: {
        opacity: { maximum: 1, minimum: 0, type: "number" },
        rotate: {
          anyOf: [
            number,
            {
              additionalProperties: false,
              properties: { angle: number, cx: number, cy: number },
              required: ["angle"],
              type: "object",
            },
          ],
        },
        scale: {
          anyOf: [
            { exclusiveMinimum: 0, type: "number" },
            {
              additionalProperties: false,
              properties: {
                x: { exclusiveMinimum: 0, type: "number" },
                y: { exclusiveMinimum: 0, type: "number" },
              },
              required: ["x", "y"],
              type: "object",
            },
          ],
        },
        timeMs: nonNegativeNumber,
        x: number,
        y: number,
      },
      required: ["timeMs"],
      type: "object",
    },
    layer: {
      additionalProperties: false,
      properties: {
        className: { type: "string" },
        id: { minLength: 1, type: "string" },
        opacity: { maximum: 1, minimum: 0, type: "number" },
        shapes: { items: { $ref: "#/$defs/shape" }, type: "array" },
        transform: { type: "string" },
      },
      required: ["shapes"],
      type: "object",
    },
    motion: {
      oneOf: [
        {
          additionalProperties: false,
          properties: {
            kind: { const: "preset" },
            options: { additionalProperties: true, type: "object" },
            preset: { minLength: 1, type: "string" },
          },
          required: ["kind", "preset"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            direction: { enum: ["normal", "reverse", "alternate"] },
            durationMs: { exclusiveMinimum: 0, type: "number" },
            keyframes: {
              items: { $ref: "#/$defs/keyframe" },
              minItems: 2,
              type: "array",
            },
            kind: { const: "timeline" },
            repeatCount: {
              anyOf: [
                { const: "indefinite" },
                { exclusiveMinimum: 0, type: "number" },
              ],
            },
            rotateCenter: {
              additionalProperties: false,
              properties: { cx: number, cy: number },
              required: ["cx", "cy"],
              type: "object",
            },
          },
          required: ["kind", "durationMs", "keyframes"],
          type: "object",
        },
      ],
    },
    shape: {
      oneOf: [
        {
          additionalProperties: false,
          properties: {
            ...renderableProperties,
            children: { items: { $ref: "#/$defs/shape" }, type: "array" },
            kind: { const: "group" },
          },
          required: ["kind", "children"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            ...renderableProperties,
            height: nonNegativeNumber,
            kind: { const: "rect" },
            rx: nonNegativeNumber,
            ry: nonNegativeNumber,
            width: nonNegativeNumber,
            x: number,
            y: number,
          },
          required: ["kind", "x", "y", "width", "height"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            ...renderableProperties,
            cx: number,
            cy: number,
            kind: { const: "circle" },
            r: nonNegativeNumber,
          },
          required: ["kind", "cx", "cy", "r"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            ...renderableProperties,
            cx: number,
            cy: number,
            kind: { const: "ellipse" },
            rx: nonNegativeNumber,
            ry: nonNegativeNumber,
          },
          required: ["kind", "cx", "cy", "rx", "ry"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            ...renderableProperties,
            d: { minLength: 1, type: "string" },
            kind: { const: "path" },
          },
          required: ["kind", "d"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            ...renderableProperties,
            kind: { const: "polygon" },
            points: {
              anyOf: [
                { minLength: 1, type: "string" },
                {
                  items: {
                    additionalProperties: false,
                    properties: { x: number, y: number },
                    required: ["x", "y"],
                    type: "object",
                  },
                  minItems: 3,
                  type: "array",
                },
              ],
            },
          },
          required: ["kind", "points"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            ...renderableProperties,
            kind: { const: "line" },
            x1: number,
            x2: number,
            y1: number,
            y2: number,
          },
          required: ["kind", "x1", "y1", "x2", "y2"],
          type: "object",
        },
      ],
    },
  },
  properties: {
    background: { type: "string" },
    description: { type: "string" },
    gradients: { items: { $ref: "#/$defs/gradient" }, type: "array" },
    height: { exclusiveMinimum: 0, type: "number" },
    layers: { items: { $ref: "#/$defs/layer" }, type: "array" },
    schemaVersion: { const: FLAT_DESIGN_SCHEMA_VERSION },
    title: { type: "string" },
    viewBox: { type: "string" },
    width: { exclusiveMinimum: 0, type: "number" },
  },
  required: ["schemaVersion", "width", "height", "layers"],
  title: "Flat Design Document",
  type: "object",
} as const;
