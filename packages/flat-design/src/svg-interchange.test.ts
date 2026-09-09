import { describe, expect, test } from "vitest";

import {
  FlatSvgImportError,
  importFlatSceneFromSvg,
  renderFlatSceneAnimationToSvg,
  renderFlatSceneFrameToSvg,
} from "./svg-interchange";

describe("flat-design SVG interchange", () => {
  test("imports the editable SVG shape, style, hierarchy, and gradient subset", () => {
    const result = importFlatSceneFromSvg(`
      <?xml version="1.0" encoding="UTF-8"?>
      <svg id="poster" width="320" height="180" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <title>Imported poster</title>
        <desc>Editable starter artwork</desc>
        <defs>
          <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#123456;stop-opacity:0.8" />
            <stop offset="100%" stop-color="#abcdef" />
          </linearGradient>
        </defs>
        <g id="hero" transform="translate(10 12)" style="fill:url(#sky);stroke:#202020;stroke-width:2">
          <rect id="card" x="20" y="24" width="120" height="72" rx="12" />
          <circle id="badge" cx="178" cy="70" r="24" opacity="0.75" />
          <polyline id="accent" points="10,140 80,116 150,140" fill="none" />
        </g>
      </svg>
    `);

    expect(result.isLossless).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.scene).toMatchObject({
      width: 320,
      height: 180,
      viewBox: "0 0 320 180",
      title: "Imported poster",
      description: "Editable starter artwork",
      gradients: [
        {
          id: "sky",
          kind: "linear",
          x1: "0%",
          y1: "0%",
          x2: "100%",
          y2: "0%",
          stops: [
            { offset: "0%", color: "#123456", opacity: 0.8 },
            { offset: "100%", color: "#abcdef" },
          ],
        },
      ],
      layers: [
        {
          id: "poster",
          shapes: [
            {
              kind: "group",
              id: "hero",
              fill: "url(#sky)",
              stroke: "#202020",
              strokeWidth: 2,
              transform: "translate(10 12)",
              children: [
                {
                  kind: "rect",
                  id: "card",
                  x: 20,
                  y: 24,
                  width: 120,
                  height: 72,
                  rx: 12,
                },
                {
                  kind: "circle",
                  id: "badge",
                  cx: 178,
                  cy: 70,
                  r: 24,
                  opacity: 0.75,
                },
                {
                  kind: "path",
                  id: "accent",
                  d: "M 10 140 L 80 116 L 150 140",
                  fill: "none",
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("round-trips supported SVG animation and exports a deterministic static frame", () => {
    const result = importFlatSceneFromSvg(`
      <svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        <circle id="orb" cx="20" cy="40" r="10" fill="#3366ff">
          <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite" />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;20 0"
            dur="1s"
            repeatCount="indefinite"
            additive="sum"
          />
        </circle>
      </svg>
    `);

    expect(result.isLossless).toBe(true);

    const animatedSvg = renderFlatSceneAnimationToSvg(result.scene);
    expect(animatedSvg).toContain('<animate attributeName="opacity"');
    expect(animatedSvg).toContain('<animateTransform attributeName="transform" type="translate"');
    expect(animatedSvg).toContain('values="0 0;20 0"');

    const frameSvg = renderFlatSceneFrameToSvg(result.scene, 500);
    expect(frameSvg).not.toContain("<animate");
    expect(frameSvg).toContain('opacity="0.5"');
    expect(frameSvg).toContain('transform="translate(10 0)"');
  });

  test("imports group animation once and preserves SVG's default single repeat", () => {
    const result = importFlatSceneFromSvg(`
      <svg width="120" height="80" xmlns="http://www.w3.org/2000/svg">
        <g id="moving-group">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;10 0"
            dur="1s"
          />
          <rect x="0" y="0" width="20" height="20" />
        </g>
      </svg>
    `);

    expect(result.isLossless).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.scene.layers[0]?.shapes[0]).toMatchObject({
      kind: "group",
      id: "moving-group",
      animations: [
        expect.objectContaining({
          kind: "transform",
          transformType: "translate",
          repeatCount: "1",
        }),
      ],
    });

    const animatedSvg = renderFlatSceneAnimationToSvg(result.scene);
    expect(animatedSvg).toContain('repeatCount="1"');

    const midFrameSvg = renderFlatSceneFrameToSvg(result.scene, 500);
    expect(midFrameSvg).toContain('transform="translate(5 0)"');

    const afterFrameSvg = renderFlatSceneFrameToSvg(result.scene, 1_500);
    expect(afterFrameSvg).not.toContain('transform="translate(10 0)"');
  });

  test("rejects malformed animation number lists instead of partially accepting them", () => {
    const result = importFlatSceneFromSvg(`
      <svg width="120" height="80" xmlns="http://www.w3.org/2000/svg">
        <circle id="orb" cx="20" cy="40" r="10">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;20 nope"
            dur="1s"
          />
        </circle>
      </svg>
    `);

    expect(result.isLossless).toBe(false);
    expect(result.scene.layers[0]?.shapes[0]).toMatchObject({
      kind: "circle",
      id: "orb",
    });
    expect(result.scene.layers[0]?.shapes[0]?.animations).toBeUndefined();
    expect(result.issues.some((issue) => issue.code === "invalid-value")).toBe(true);
  });

  test("reports unsupported SVG constructs instead of silently pretending a lossless import", () => {
    const result = importFlatSceneFromSvg(`
      <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
        <style>.label { fill: red; }</style>
        <defs>
          <filter id="shadow"><feGaussianBlur stdDeviation="2" /></filter>
        </defs>
        <text class="label" x="10" y="20">Hello</text>
        <image href="https://example.com/image.png" x="0" y="0" width="20" height="20" />
        <circle id="orb" cx="40" cy="40" r="10">
          <animate attributeName="cx" values="40;80" dur="1s" />
          <animateMotion path="M 0 0 L 20 0" dur="1s" />
        </circle>
      </svg>
    `);

    expect(result.isLossless).toBe(false);
    expect(result.scene.width).toBe(200);
    expect(result.scene.height).toBe(100);
    expect(result.scene.layers[0]?.shapes).toEqual([
      expect.objectContaining({ kind: "circle", id: "orb", cx: 40, cy: 40, r: 10 }),
    ]);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "unsupported-animation",
        "unsupported-element",
        "unsupported-presentation",
        "unsupported-resource",
      ]),
    );
    expect(result.issues.some((issue) => issue.message.includes("cx"))).toBe(true);
    expect(result.issues.some((issue) => issue.message.includes("animateMotion"))).toBe(true);
  });

  test("rejects DTD-bearing XML and drops executable SVG elements", () => {
    expect(() =>
      importFlatSceneFromSvg(`
        <!DOCTYPE svg [<!ENTITY payload "unsafe">]>
        <svg xmlns="http://www.w3.org/2000/svg"><text>&payload;</text></svg>
      `),
    ).toThrow(FlatSvgImportError);

    const result = importFlatSceneFromSvg(`
      <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <script>alert("never imported")</script>
        <foreignObject width="64" height="64"><div>HTML</div></foreignObject>
        <rect x="0" y="0" width="64" height="64" fill="#fff" />
      </svg>
    `);

    expect(result.scene.layers[0]?.shapes).toEqual([
      expect.objectContaining({ kind: "rect", width: 64, height: 64 }),
    ]);
    expect(result.issues).toHaveLength(2);
  });
});
