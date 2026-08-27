import { flatDesignDocumentJsonSchema as baseSchema } from "./schema";

const clockValue = {
  pattern: "^\\d+(?:\\.\\d+)?(?:ms|s)$",
  type: "string",
} as const;

const animationTimingProperties = {
  additive: { enum: ["replace", "sum"] },
  begin: clockValue,
  calcMode: { enum: ["discrete", "linear", "paced", "spline"] },
  dur: clockValue,
  fillMode: { enum: ["freeze", "remove"] },
  keySplines: { items: { type: "string" }, type: "array" },
  keyTimes: {
    items: { maximum: 1, minimum: 0, type: "number" },
    type: "array",
  },
  repeatCount: { type: "string" },
} as const;

const attributeAnimation = {
  additionalProperties: false,
  properties: {
    ...animationTimingProperties,
    attributeName: { minLength: 1, type: "string" },
    kind: { const: "attribute" },
    values: {
      items: {
        anyOf: [{ type: "number" }, { type: "string" }],
      },
      minItems: 1,
      type: "array",
    },
  },
  required: ["kind", "attributeName", "values"],
  type: "object",
} as const;

const translateAnimation = {
  additionalProperties: false,
  properties: {
    ...animationTimingProperties,
    kind: { const: "transform" },
    transformType: { const: "translate" },
    values: {
      items: {
        additionalProperties: false,
        properties: {
          x: { type: "number" },
          y: { type: "number" },
        },
        required: ["x", "y"],
        type: "object",
      },
      minItems: 1,
      type: "array",
    },
  },
  required: ["kind", "transformType", "values"],
  type: "object",
} as const;

const scaleAnimation = {
  additionalProperties: false,
  properties: {
    ...animationTimingProperties,
    kind: { const: "transform" },
    transformType: { const: "scale" },
    values: {
      items: {
        anyOf: [
          { type: "number" },
          {
            additionalProperties: false,
            properties: {
              x: { type: "number" },
              y: { type: "number" },
            },
            required: ["x", "y"],
            type: "object",
          },
        ],
      },
      minItems: 1,
      type: "array",
    },
  },
  required: ["kind", "transformType", "values"],
  type: "object",
} as const;

const rotateAnimation = {
  additionalProperties: false,
  properties: {
    ...animationTimingProperties,
    kind: { const: "transform" },
    transformType: { const: "rotate" },
    values: {
      items: {
        anyOf: [
          { type: "number" },
          {
            additionalProperties: false,
            properties: {
              angle: { type: "number" },
              cx: { type: "number" },
              cy: { type: "number" },
            },
            required: ["angle"],
            type: "object",
          },
        ],
      },
      minItems: 1,
      type: "array",
    },
  },
  required: ["kind", "transformType", "values"],
  type: "object",
} as const;

const gradientOffset = {
  anyOf: [
    { maximum: 1, minimum: 0, type: "number" },
    {
      pattern: "^(?:100|\\d{1,2})(?:\\.\\d+)?%$",
      type: "string",
    },
  ],
} as const;

const presetMotion = {
  ...baseSchema.$defs.motion.oneOf[0],
  properties: {
    ...baseSchema.$defs.motion.oneOf[0].properties,
    preset: {
      enum: ["bobbing", "drift", "float", "pulse", "pop", "sway", "spin", "blink"],
    },
  },
} as const;

export const flatDesignDocumentJsonSchema = {
  ...baseSchema,
  $defs: {
    ...baseSchema.$defs,
    animation: {
      oneOf: [attributeAnimation, translateAnimation, scaleAnimation, rotateAnimation],
    },
    gradient: {
      ...baseSchema.$defs.gradient,
      properties: {
        ...baseSchema.$defs.gradient.properties,
        stops: {
          ...baseSchema.$defs.gradient.properties.stops,
          items: {
            ...baseSchema.$defs.gradient.properties.stops.items,
            properties: {
              ...baseSchema.$defs.gradient.properties.stops.items.properties,
              offset: gradientOffset,
            },
          },
        },
      },
    },
    motion: {
      ...baseSchema.$defs.motion,
      oneOf: [presetMotion, baseSchema.$defs.motion.oneOf[1]],
    },
  },
} as const;
