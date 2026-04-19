import { describe, expect, test } from "vitest";

import {
  HUGGING_FACE_TASKS,
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  listHuggingFaceTasks,
  type UniversalHuggingFaceProvider,
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
    const first = createUniversalTaskPipeline({
      descriptor: getHuggingFaceTaskDescriptor("image-to-text"),
      provider,
      model: { task: "image-to-text", model: "demo/captioner" },
    });
    const second = createUniversalTaskPipeline({
      descriptor: getHuggingFaceTaskDescriptor("translation"),
      provider,
      model: { task: "translation", model: "demo/translator" },
    });

    await expect(first.connect(second).run("image-bytes")).resolves.toMatchObject({
      task: "translation",
      output: "translation:image-to-text:image-bytes",
    });
  });
});
