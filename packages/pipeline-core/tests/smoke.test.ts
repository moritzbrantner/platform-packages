import { describe, expect, test } from "vitest";

import {
  artifact,
  batch,
  createPipeline,
  createPipelineFromRun,
  createPipelineStep,
  isPipelineArtifact,
  map,
  pipe,
  tap,
  type PipelineRunContext,
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

  test("preserves provenance ordering through piped steps", async () => {
    const first = createPipeline(
      createPipelineStep<number, number>({
        id: "first",
        run: (input) => input + 1,
      }),
    );
    const second = createPipeline(
      createPipelineStep<number, number>({
        id: "second",
        run: (input) => input * 2,
      }),
    );
    const context: PipelineRunContext = { provenance: [] };

    await first.pipe(second).run(2, context);

    expect(context.provenance?.map((entry) => entry.stepId)).toEqual(["first", "second"]);
  });

  test("shares batch context and propagates map and tap errors", async () => {
    const seenContexts = new Set<object>();
    const pipeline = createPipelineFromRun<number, number>(async (input, context) => {
      seenContexts.add(context);
      context.metadata = { count: Number(context.metadata?.count ?? 0) + 1 };
      return input * 2;
    });

    await expect(batch(pipeline, [1, 2, 3], { metadata: { count: 0 } })).resolves.toEqual([
      2, 4, 6,
    ]);
    expect(seenContexts.size).toBe(1);

    await expect(
      map(pipeline, () => {
        throw new Error("map failed");
      }).run(1),
    ).rejects.toThrow("map failed");
    await expect(
      tap(pipeline, () => {
        throw new Error("tap failed");
      }).run(1),
    ).rejects.toThrow("tap failed");
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
