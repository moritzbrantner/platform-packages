import { describe, expect, test } from "vitest";

import {
  browserTranslationCapabilities,
  browserTranslationPairs,
  createBrowserTranslationAdapter,
  resolveBrowserTranslationPair,
} from "./browser";

test("new language pairs acquire their pinned model and preserve segment identity", async () => {
  for (const language of ["fr", "es", "nl"]) {
    for (const [sourceLanguage, targetLanguage] of [
      [language, "en"],
      ["en", language],
    ]) {
      const profile = resolveBrowserTranslationPair(sourceLanguage, targetLanguage);
      let loads = 0;
      const adapter = createBrowserTranslationAdapter({
        webGpuAvailable: async () => true,
        loadPipeline: async (request) => {
          loads += 1;
          expect(request.modelId).toBe(profile.modelId);
          expect(request).toHaveProperty("revision", expect.stringMatching(/^[a-f0-9]{40}$/));
          return async () => [{ translation_text: "Translated fixture" }];
        },
      });
      const options = { sourceLanguage, targetLanguage };
      const first = await adapter.translateSegments([{ id: 7, text: "Input fixture" }], options);
      await adapter.translateSegments([{ id: 9, text: "Second fixture" }], options);
      expect(first.segments).toEqual([{ id: 7, text: "Translated fixture" }]);
      expect(first.attributes).toHaveProperty(
        "modelRevision",
        expect.stringMatching(/^[a-f0-9]{40}$/),
      );
      expect(loads).toBe(1);
    }
  }
});

describe("browser translation adapter", () => {
  test("advertises WebGPU-only browser-cache execution", () => {
    expect(browserTranslationCapabilities()).toEqual({
      runtime: "platform-packages-transformers-js-webgpu-translation",
      requiredAcceleration: "webgpu",
      modelProvisioning: "browser-cache",
      defaultDtype: "q4",
      pairs: [
        {
          sourceLanguage: "de",
          targetLanguage: "en",
          modelId: "onnx-community/opus-mt-de-en",
          revision: "85f2f23c5f1863b741db8b9128cfbe7a5cbc0653",
        },
        {
          sourceLanguage: "en",
          targetLanguage: "de",
          modelId: "onnx-community/opus-mt-en-de",
          revision: "b4306231768977e5956c21c26c3ae14d6b2713c4",
        },
        {
          sourceLanguage: "fr",
          targetLanguage: "en",
          modelId: "onnx-community/opus-mt-fr-en",
          revision: "f7e3c392bacfe300a66b0ddbd20de1d2dfc3b77e",
        },
        {
          sourceLanguage: "en",
          targetLanguage: "fr",
          modelId: "onnx-community/opus-mt-en-fr",
          revision: "060ab253b6aae185f277c1e048fb0cf61a02c6c0",
        },
        {
          sourceLanguage: "es",
          targetLanguage: "en",
          modelId: "onnx-community/opus-mt-es-en",
          revision: "0ca6ea53b39356aece8a15bd92eaf7bb40035ea6",
        },
        {
          sourceLanguage: "en",
          targetLanguage: "es",
          modelId: "onnx-community/opus-mt-en-es",
          revision: "b5eba94a023a1954c90401b43537f479f962981d",
        },
        {
          sourceLanguage: "nl",
          targetLanguage: "en",
          modelId: "onnx-community/opus-mt-nl-en",
          revision: "2da2cd590ecd6ed7f46907df7fa01435aef5a8b9",
        },
        {
          sourceLanguage: "en",
          targetLanguage: "nl",
          modelId: "onnx-community/opus-mt-en-nl",
          revision: "67fd5925ddb7382a131b7d3ee1a8cc1b1bd0cdf4",
        },
      ],
      input: { kind: "text-segments", identity: ["string", "number"] },
      features: {
        translation: true,
        orderedSegments: true,
        callerOwnedTiming: true,
      },
      fallbacks: { server: false, python: false, cpu: false },
    });
  });

  test("resolves only curated pair-compatible models", () => {
    expect(resolveBrowserTranslationPair("de", "en")).toEqual({
      sourceLanguage: "de",
      targetLanguage: "en",
      modelId: "onnx-community/opus-mt-de-en",
      revision: "85f2f23c5f1863b741db8b9128cfbe7a5cbc0653",
    });
    expect(resolveBrowserTranslationPair("EN", "de")).toEqual({
      sourceLanguage: "en",
      targetLanguage: "de",
      modelId: "onnx-community/opus-mt-en-de",
      revision: "b4306231768977e5956c21c26c3ae14d6b2713c4",
    });
    expect(() => resolveBrowserTranslationPair("ja", "en")).toThrow("does not support ja → en");
    expect(() => resolveBrowserTranslationPair("en", "de", "onnx-community/opus-mt-de-en")).toThrow(
      "does not match en → de",
    );
    expect(() => resolveBrowserTranslationPair("de", "de")).toThrow(
      "source and target languages must differ",
    );
  });

  test("returns defensive pair metadata", () => {
    const pairs = browserTranslationPairs();
    pairs[0]!.modelId = "modified";
    expect(browserTranslationPairs()[0]!.modelId).toBe("onnx-community/opus-mt-de-en");
  });

  test("preserves segment identity/order and caches a pair model", async () => {
    let loads = 0;
    const progress: Array<{ stage: string; detail?: Record<string, unknown> }> = [];
    const adapter = createBrowserTranslationAdapter({
      webGpuAvailable: async () => true,
      loadPipeline: async ({ modelId, dtype, onProgress }) => {
        loads += 1;
        expect(modelId).toBe("onnx-community/opus-mt-de-en");
        expect(dtype).toBe("q4");
        onProgress({ status: "ready", modelId });
        return async (input, options) => {
          expect(options.max_new_tokens).toBe(64);
          const texts = Array.isArray(input) ? input : [input];
          return texts.map((text) => [{ translation_text: `EN: ${text}` }]);
        };
      },
    });

    const request = {
      sourceLanguage: "de",
      targetLanguage: "en",
      maxNewTokens: 64,
      onProgress: (update: { stage: string; detail?: Record<string, unknown> }) =>
        progress.push(update),
    };
    const first = await adapter.translateSegments(
      [
        { id: 7, text: "Guten Morgen" },
        { id: "b", text: "Wie geht es dir?" },
      ],
      request,
    );
    const second = await adapter.translateSegments([{ id: 8, text: "Danke" }], request);

    expect(loads).toBe(1);
    expect(first.segments).toEqual([
      { id: 7, text: "EN: Guten Morgen" },
      { id: "b", text: "EN: Wie geht es dir?" },
    ]);
    expect(second.segments).toEqual([{ id: 8, text: "EN: Danke" }]);
    expect(first.attributes).toEqual({
      runtime: "platform-packages-transformers-js-webgpu-translation",
      acceleration: "webgpu",
      modelId: "onnx-community/opus-mt-de-en",
      modelRevision: "85f2f23c5f1863b741db8b9128cfbe7a5cbc0653",
      dtype: "q4",
      modelProvisioning: "browser-cache",
    });
    expect(
      progress.some((update) => update.stage === "model" && update.detail?.status === "cached"),
    ).toBe(true);
  });

  test("keeps different curated pair models in distinct cache entries", async () => {
    const loadedModels: string[] = [];
    const adapter = createBrowserTranslationAdapter({
      webGpuAvailable: async () => true,
      loadPipeline: async ({ modelId }) => {
        loadedModels.push(modelId);
        return async () => [{ translation_text: "ok" }];
      },
    });

    await adapter.translateSegments([{ id: 1, text: "eins" }], {
      sourceLanguage: "de",
      targetLanguage: "en",
    });
    await adapter.translateSegments([{ id: 2, text: "one" }], {
      sourceLanguage: "en",
      targetLanguage: "de",
    });

    expect(loadedModels).toEqual(["onnx-community/opus-mt-de-en", "onnx-community/opus-mt-en-de"]);
  });

  test("fails closed without WebGPU", async () => {
    const adapter = createBrowserTranslationAdapter({
      webGpuAvailable: async () => false,
      loadPipeline: async () => {
        throw new Error("must not load");
      },
    });

    await expect(
      adapter.translateSegments([{ id: 1, text: "Hallo" }], {
        sourceLanguage: "de",
        targetLanguage: "en",
      }),
    ).rejects.toThrow("No CPU, server, or Python fallback");
  });

  test("rejects malformed segments, token limits, and model output", async () => {
    const adapter = createBrowserTranslationAdapter({
      webGpuAvailable: async () => true,
      loadPipeline: async () => async () => [{ generated_text: "wrong field" }],
    });

    await expect(
      adapter.translateSegments([{ text: "missing id" } as never], {
        sourceLanguage: "de",
        targetLanguage: "en",
      }),
    ).rejects.toThrow("requires a string or number id");
    await expect(
      adapter.translateSegments([{ id: 1, text: "Hallo" }], {
        sourceLanguage: "de",
        targetLanguage: "en",
        maxNewTokens: 0,
      }),
    ).rejects.toThrow("positive integer");
    await expect(
      adapter.translateSegments([{ id: 1, text: "Hallo" }], {
        sourceLanguage: "de",
        targetLanguage: "en",
      }),
    ).rejects.toThrow("empty or malformed translation");
  });

  test("empty segment input does not load a model", async () => {
    let loads = 0;
    const adapter = createBrowserTranslationAdapter({
      webGpuAvailable: async () => true,
      loadPipeline: async () => {
        loads += 1;
        return async () => [];
      },
    });

    const result = await adapter.translateSegments([], {
      sourceLanguage: "de",
      targetLanguage: "en",
    });
    expect(loads).toBe(0);
    expect(result.segments).toEqual([]);
  });
});
