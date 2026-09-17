const DEFAULT_TRANSFORMERS_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0";
const DEFAULT_DTYPE = "q4";
const DEFAULT_MAX_NEW_TOKENS = 256;
const RUNTIME_ID = "platform-packages-transformers-js-webgpu-translation";

const PAIRS = [
  {
    sourceLanguage: "de",
    targetLanguage: "en",
    modelId: "onnx-community/opus-mt-de-en",
  },
  {
    sourceLanguage: "en",
    targetLanguage: "de",
    modelId: "onnx-community/opus-mt-en-de",
  },
] as const;

export type BrowserTranslationLanguage = (typeof PAIRS)[number]["sourceLanguage"];

export interface BrowserTranslationPair {
  sourceLanguage: string;
  targetLanguage: string;
  modelId: string;
}

export interface BrowserTranslationSegment {
  id: string | number;
  text: string;
}

export interface BrowserTranslationProgress {
  stage: "model" | "translate";
  message: string;
  detail?: Record<string, unknown>;
}

export interface BrowserTranslationRequest {
  sourceLanguage: string;
  targetLanguage: string;
  modelId?: string;
  dtype?: string;
  maxNewTokens?: number;
  onProgress?: (progress: BrowserTranslationProgress) => void;
}

export interface BrowserTranslationResult {
  segments: BrowserTranslationSegment[];
  sourceLanguage: string;
  targetLanguage: string;
  attributes: {
    runtime: string;
    acceleration: "webgpu";
    modelId: string;
    dtype: string;
    modelProvisioning: "browser-cache";
  };
}

interface PipelineLoaderRequest {
  modelId: string;
  dtype: string;
  onProgress: (detail: Record<string, unknown>) => void;
}

type TranslationPipeline = (
  input: string | string[],
  options: { max_new_tokens: number },
) => Promise<unknown>;

type PipelineLoader = (request: PipelineLoaderRequest) => Promise<TranslationPipeline>;
type WebGpuProbe = () => Promise<boolean>;

export interface BrowserTranslationAdapterOptions {
  loadPipeline?: PipelineLoader;
  webGpuAvailable?: WebGpuProbe;
}

export function browserTranslationPairs(): BrowserTranslationPair[] {
  return PAIRS.map((pair) => ({ ...pair }));
}

export function browserTranslationCapabilities() {
  return {
    runtime: RUNTIME_ID,
    requiredAcceleration: "webgpu" as const,
    modelProvisioning: "browser-cache" as const,
    defaultDtype: DEFAULT_DTYPE,
    pairs: browserTranslationPairs(),
    input: {
      kind: "text-segments" as const,
      identity: ["string", "number"] as const,
    },
    features: {
      translation: true,
      orderedSegments: true,
      callerOwnedTiming: true,
    },
    fallbacks: {
      server: false,
      python: false,
      cpu: false,
    },
  };
}

export function resolveBrowserTranslationPair(
  sourceLanguage: string,
  targetLanguage: string,
  requestedModelId?: string,
): BrowserTranslationPair {
  const source = normalizedLanguage(sourceLanguage, "sourceLanguage");
  const target = normalizedLanguage(targetLanguage, "targetLanguage");
  if (source === target) {
    throw new RangeError("Browser translation source and target languages must differ.");
  }

  const pair = PAIRS.find(
    (candidate) => candidate.sourceLanguage === source && candidate.targetLanguage === target,
  );
  if (!pair) {
    throw new RangeError(
      `Browser translation does not support ${source} → ${target}. Supported pairs: ${PAIRS.map((candidate) => `${candidate.sourceLanguage}→${candidate.targetLanguage}`).join(", ")}.`,
    );
  }

  const requested = requestedModelId?.trim();
  if (requested && requested !== pair.modelId) {
    throw new RangeError(
      `Browser translation model ${requested} does not match ${source} → ${target}; expected ${pair.modelId}.`,
    );
  }
  return { ...pair };
}

export function createBrowserTranslationAdapter(options: BrowserTranslationAdapterOptions = {}) {
  const loadPipeline = options.loadPipeline ?? loadBrowserTranslationPipeline;
  const webGpuAvailable = options.webGpuAvailable ?? supportsBrowserTranslation;
  const pipelineCache = new Map<string, Promise<TranslationPipeline>>();

  async function translateSegments(
    segments: BrowserTranslationSegment[],
    request: BrowserTranslationRequest,
  ): Promise<BrowserTranslationResult> {
    const normalizedSegments = normalizeSegments(segments);
    const config = normalizeRequest(request);
    if (normalizedSegments.length === 0) {
      return translationResult(normalizedSegments, [], config);
    }

    if (!(await webGpuAvailable())) {
      throw new Error(
        "WebGPU is required for browser translation. No CPU, server, or Python fallback is used.",
      );
    }

    emitProgress(request, {
      stage: "translate",
      message: `Preparing local ${config.sourceLanguage} → ${config.targetLanguage} translation for ${normalizedSegments.length} segment${normalizedSegments.length === 1 ? "" : "s"}…`,
      detail: {
        modelId: config.modelId,
        sourceLanguage: config.sourceLanguage,
        targetLanguage: config.targetLanguage,
      },
    });

    const pipeline = await requirePipeline(config, request);
    const texts = normalizedSegments.map((segment) => segment.text);
    let output: unknown;
    try {
      output = await pipeline(texts.length === 1 ? texts[0] : texts, {
        max_new_tokens: config.maxNewTokens,
      });
    } catch (error) {
      throw new Error(`Browser translation failed: ${formatError(error)}`);
    }

    const translations = normalizeTranslationOutput(output, normalizedSegments.length);
    emitProgress(request, {
      stage: "translate",
      message: `Translated ${translations.length} segment${translations.length === 1 ? "" : "s"} locally.`,
      detail: {
        modelId: config.modelId,
        sourceLanguage: config.sourceLanguage,
        targetLanguage: config.targetLanguage,
        status: "done",
      },
    });
    return translationResult(normalizedSegments, translations, config);
  }

  async function requirePipeline(
    config: NormalizedRequest,
    request: BrowserTranslationRequest,
  ): Promise<TranslationPipeline> {
    const key = `${config.modelId}\n${config.dtype}`;
    let promise = pipelineCache.get(key);
    if (!promise) {
      emitProgress(request, {
        stage: "model",
        message: `Loading browser translation model ${config.modelId}…`,
        detail: { modelId: config.modelId, dtype: config.dtype, status: "loading" },
      });
      promise = Promise.resolve(
        loadPipeline({
          modelId: config.modelId,
          dtype: config.dtype,
          onProgress: (detail) =>
            emitProgress(request, {
              stage: "model",
              message: `Loading browser translation model ${config.modelId}…`,
              detail,
            }),
        }),
      ).catch((error) => {
        pipelineCache.delete(key);
        throw new Error(`Unable to load browser translation model: ${formatError(error)}`);
      });
      pipelineCache.set(key, promise);
    } else {
      emitProgress(request, {
        stage: "model",
        message: `Reusing cached browser translation model ${config.modelId}.`,
        detail: { modelId: config.modelId, dtype: config.dtype, status: "cached" },
      });
    }
    return promise;
  }

  return {
    capabilities: browserTranslationCapabilities,
    pairs: browserTranslationPairs,
    resolvePair: resolveBrowserTranslationPair,
    supports: webGpuAvailable,
    translateSegments,
  };
}

export async function supportsBrowserTranslation(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const navigatorWithGpu = navigator as Navigator & {
    gpu?: { requestAdapter(): Promise<unknown | null> };
  };
  if (!navigatorWithGpu.gpu) return false;
  return (await navigatorWithGpu.gpu.requestAdapter()) !== null;
}

const defaultBrowserTranslationAdapter = createBrowserTranslationAdapter();

export async function translateBrowserSegments(
  segments: BrowserTranslationSegment[],
  request: BrowserTranslationRequest,
): Promise<BrowserTranslationResult> {
  return defaultBrowserTranslationAdapter.translateSegments(segments, request);
}

interface NormalizedRequest extends BrowserTranslationPair {
  dtype: string;
  maxNewTokens: number;
}

function normalizeRequest(request: BrowserTranslationRequest): NormalizedRequest {
  if (!request || typeof request !== "object") {
    throw new TypeError("Browser translation requires an explicit translation request.");
  }
  const pair = resolveBrowserTranslationPair(
    request.sourceLanguage,
    request.targetLanguage,
    request.modelId,
  );
  const dtype = normalizedNonEmptyString(request.dtype ?? DEFAULT_DTYPE, "dtype");
  const maxNewTokens = request.maxNewTokens ?? DEFAULT_MAX_NEW_TOKENS;
  if (!Number.isSafeInteger(maxNewTokens) || maxNewTokens <= 0) {
    throw new RangeError("Browser translation maxNewTokens must be a positive integer.");
  }
  return { ...pair, dtype, maxNewTokens };
}

async function loadBrowserTranslationPipeline({
  modelId,
  dtype,
  onProgress,
}: PipelineLoaderRequest): Promise<TranslationPipeline> {
  const transformers = await importTransformers();
  return transformers.pipeline("translation", modelId, {
    device: "webgpu",
    dtype,
    progress_callback: onProgress,
  });
}

interface TransformersModule {
  pipeline(
    task: "translation",
    modelId: string,
    options: {
      device: "webgpu";
      dtype: string;
      progress_callback: (detail: Record<string, unknown>) => void;
    },
  ): Promise<TranslationPipeline>;
}

let transformersModulePromise: Promise<TransformersModule> | undefined;

function importTransformers(): Promise<TransformersModule> {
  const moduleUrl = DEFAULT_TRANSFORMERS_MODULE_URL;
  transformersModulePromise ??= import(/* @vite-ignore */ moduleUrl) as Promise<TransformersModule>;
  return transformersModulePromise;
}

function normalizeSegments(segments: BrowserTranslationSegment[]): BrowserTranslationSegment[] {
  if (!Array.isArray(segments)) {
    throw new TypeError("Browser translation requires an array of text segments.");
  }
  return segments.map((segment, index) => {
    if (!segment || typeof segment !== "object") {
      throw new TypeError(`Browser translation segment ${index} must be an object.`);
    }
    if (typeof segment.id !== "string" && typeof segment.id !== "number") {
      throw new TypeError(`Browser translation segment ${index} requires a string or number id.`);
    }
    const text = typeof segment.text === "string" ? segment.text.trim() : "";
    if (!text) {
      throw new TypeError(`Browser translation segment ${index} requires non-empty text.`);
    }
    return { id: segment.id, text };
  });
}

function normalizeTranslationOutput(output: unknown, expectedCount: number): string[] {
  const items = Array.isArray(output) ? output : [output];
  const normalized = items.map((item) => {
    const candidate = Array.isArray(item) ? item[0] : item;
    const translationText =
      candidate && typeof candidate === "object" && "translation_text" in candidate
        ? (candidate as { translation_text?: unknown }).translation_text
        : undefined;
    if (typeof translationText !== "string" || translationText.trim().length === 0) {
      throw new Error("Browser translation returned an empty or malformed translation.");
    }
    return translationText.trim();
  });
  if (normalized.length !== expectedCount) {
    throw new Error(
      `Browser translation returned ${normalized.length} result(s) for ${expectedCount} segment(s).`,
    );
  }
  return normalized;
}

function translationResult(
  segments: BrowserTranslationSegment[],
  translations: string[],
  config: NormalizedRequest,
): BrowserTranslationResult {
  return {
    segments: segments.map((segment, index) => ({
      id: segment.id,
      text: translations[index] ?? segment.text,
    })),
    sourceLanguage: config.sourceLanguage,
    targetLanguage: config.targetLanguage,
    attributes: {
      runtime: RUNTIME_ID,
      acceleration: "webgpu",
      modelId: config.modelId,
      dtype: config.dtype,
      modelProvisioning: "browser-cache",
    },
  };
}

function normalizedLanguage(value: string, name: string): string {
  return normalizedNonEmptyString(value, name).toLowerCase();
}

function normalizedNonEmptyString(value: string, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`Browser translation ${name} must be a non-empty string.`);
  }
  return value.trim();
}

function emitProgress(
  request: BrowserTranslationRequest,
  progress: BrowserTranslationProgress,
): void {
  request.onProgress?.(progress);
}

function formatError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : String(error);
}
