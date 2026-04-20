import { describe, expect, test } from "vitest";

import {
  artifact,
  batch,
  createPipeline,
  createPipelineStep,
  isPipelineArtifact,
  map,
  pipe,
  tap,
} from "@moritzbrantner/pipeline-core";

describe("@moritzbrantner/pipeline-core", () => {
  test("creates typed artifacts", () => {
    const value = artifact("text", "Hello", {
      metadata: { source: "test" },
    });

    expect(isPipelineArtifact(value)).toBe(true);
    expect(value).toMatchObject({
      kind: "text",
      value: "Hello",
      metadata: { source: "test" },
    });
  });

  test("composes pipeline steps with pipe, map, tap, and batch", async () => {
    const seen: string[] = [];
    const trim = createPipeline(
      createPipelineStep<string, string>({
        id: "trim",
        input: { kind: "text" },
        output: { kind: "text" },
        run: (input) => input.trim(),
      }),
    );
    const upper = createPipeline(
      createPipelineStep<string, string>({
        id: "upper",
        input: { kind: "text" },
        output: { kind: "text" },
        run: (input) => input.toUpperCase(),
      }),
    );
    const pipeline = tap(
      map(pipe(trim, upper), (output) => `${output}!`),
      (output) => {
        seen.push(output);
      },
    );

    await expect(pipeline.run(" hello ")).resolves.toBe("HELLO!");
    await expect(batch(pipeline, [" a ", " b "])).resolves.toEqual(["A!", "B!"]);
    expect(seen).toEqual(["HELLO!", "A!", "B!"]);
  });

  test("rejects incompatible pipeline composition at type-check time", () => {
    const textLength = createPipeline(
      createPipelineStep<string, number>({
        id: "length",
        run: (input) => input.length,
      }),
    );
    const booleanLabel = createPipeline(
      createPipelineStep<boolean, string>({
        id: "boolean-label",
        run: (input) => (input ? "yes" : "no"),
      }),
    );

    // @ts-expect-error The second pipeline expects boolean input, not number output.
    pipe(textLength, booleanLabel);
    expect(textLength).toBeDefined();
  });
});
