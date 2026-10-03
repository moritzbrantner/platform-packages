import { describe, expect, test } from "vitest";

import { importFlatSceneFromSvg } from "./svg-interchange";

describe("flat-design SVG import diagnostics", () => {
  test("treats omitted rectangle corner radii as optional", () => {
    const result = importFlatSceneFromSvg(`
      <svg width="100" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect id="plain" width="40" height="20" />
      </svg>
    `);

    expect(result.isLossless).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.scene.layers[0]?.shapes[0]).toMatchObject({
      kind: "rect",
      id: "plain",
      width: 40,
      height: 20,
    });
  });

  test.each(["display", "visibility"])(
    "diagnoses unsupported %s presentation instead of silently changing appearance",
    (attribute) => {
      const result = importFlatSceneFromSvg(`
        <svg width="100" height="60" xmlns="http://www.w3.org/2000/svg">
          <rect id="hidden" width="40" height="20" rx="0" ry="0" ${attribute}="hidden" />
        </svg>
      `);

      expect(result.isLossless).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: "unsupported-presentation",
          element: "rect",
          id: "hidden",
          message: expect.stringContaining(attribute),
        }),
      );
    },
  );
});
