import { describe, expect, test } from "vitest";

import {
  HUGGING_FACE_TASKS,
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  listHuggingFaceTasks,
  normalizeAutomaticSpeechRecognitionOutput,
  normalizeImageOutput,
  normalizeObjectDetectionOutput,
  normalizeRankingOutput,
  normalizeScoredLabelsOutput,
  normalizeTextGenerationOutput,
  type UniversalHuggingFaceProvider,
  type UniversalTaskInput,
  type UniversalTaskOutput,
} from "@moritzbrantner/huggingface-universal";

describe("@moritzbrantner/huggingface-universal", () => {
  test("lists every Hugging Face model task descriptor", () => {
    expect(HUGGING_FACE_TASKS).toHaveLength(47);
    expect(listHuggingFaceTasks("audio").map((task) => task.task)).toEqual([
      "audio-classification",
      "audio-to-audio",
      "automatic-speech-recognition",
      "text-to-speech",
    ]);
    expect(getHuggingFaceTaskDescriptor("text-to-image")).toMatchObject({
      category: "computer-vision",
      inputs: ["text"],
      outputs: ["image"],
    });
  });

  test("creates universal task packages and pipelines", async () => {
    const provider: UniversalHuggingFaceProvider = {
      id: "fake",
      async run(request) {
        return {
          task: request.task,
          model: request.model.model,
          output: { received: request.input, parameters: request.parameters },
          raw: null,
        };
      },
    };
    const taskPackage = createHuggingFaceTaskPackage("text-generation");
    const pipeline = taskPackage.createPipeline({
      provider,
      model: taskPackage.createModelReference("demo/text-generator", {
        parameters: { max_new_tokens: 4 },
      }),
      defaultParameters: { temperature: 0.1 },
    });

    await expect(pipeline.run("Hello", { parameters: { top_p: 0.9 } })).resolves.toMatchObject({
      task: "text-generation",
      model: "demo/text-generator",
      output: {
        received: "Hello",
        parameters: {
          max_new_tokens: 4,
          temperature: 0.1,
          top_p: 0.9,
        },
      },
    });
  });

  test("connects pipeline outputs to the next task", async () => {
    const provider: UniversalHuggingFaceProvider = {
      id: "fake",
      async run(request) {
        return {
          task: request.task,
          model: request.model.model,
          output: `${request.task}:${String(request.input)}`,
          raw: null,
        };
      },
    };
    const first = createUniversalTaskPipeline<"image-to-text", string, string>({
      descriptor: getHuggingFaceTaskDescriptor("image-to-text"),
      provider,
      model: { task: "image-to-text", model: "demo/captioner" },
    });
    const second = createUniversalTaskPipeline<"translation", string | { inputs: string }, string>({
      descriptor: getHuggingFaceTaskDescriptor("translation"),
      provider,
      model: { task: "translation", model: "demo/translator" },
    });

    await expect(first.connect(second).run("image-bytes")).resolves.toMatchObject({
      task: "translation",
      output: "translation:image-to-text:image-bytes",
    });

    await expect(
      first
        .connect(second, (result) => ({ inputs: result.output }))
        .map((result) => result.output)
        .run("image-bytes"),
    ).resolves.toBe("translation:[object Object]");
  });

  test("normalizes common task outputs while preserving raw escape hatches", () => {
    expect(normalizeTextGenerationOutput([{ generated_text: "Hello" }])).toEqual([
      { generatedText: "Hello" },
    ]);
    expect(normalizeScoredLabelsOutput([{ label: "cat", score: 0.9 }])).toEqual([
      { label: "cat", score: 0.9 },
    ]);
    expect(
      normalizeObjectDetectionOutput([
        { box: { xmax: 3, xmin: 1, ymax: 4, ymin: 2 }, label: "box", score: 0.8 },
      ]),
    ).toEqual([{ box: { xmax: 3, xmin: 1, ymax: 4, ymin: 2 }, label: "box", score: 0.8 }]);
    expect(
      normalizeAutomaticSpeechRecognitionOutput({
        chunks: [{ text: "hi", timestamp: [0, 1] }],
        text: "hi",
      }),
    ).toEqual({ chunks: [{ text: "hi", timestamp: [0, 1] }], text: "hi" });
    expect(normalizeImageOutput({ image: "base64", mime_type: "image/png" })).toEqual({
      data: "base64",
      mimeType: "image/png",
      url: undefined,
    });
    expect(normalizeRankingOutput([{ index: 1, score: 0.7, text: "passage" }])).toEqual([
      { index: 1, score: 0.7, text: "passage" },
    ]);
  });

  test("exposes task-specific input and output defaults", () => {
    const textInput: UniversalTaskInput<"text-generation"> = "Prompt";
    const labels: UniversalTaskOutput<"image-classification"> = [{ label: "invoice", score: 0.98 }];

    expect(textInput).toBe("Prompt");
    expect(labels[0]?.label).toBe("invoice");
  });
});
