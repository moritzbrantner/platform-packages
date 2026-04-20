import {
  createPipelineFromRun,
  type Pipeline,
  type PipelineRunContext,
} from "@moritzbrantner/pipeline-core";

const DEFAULT_HUGGING_FACE_BASE_URL = "https://router.huggingface.co/hf-inference/models";

export const HUGGING_FACE_TASK_CATEGORIES = [
  "multimodal",
  "natural-language-processing",
  "computer-vision",
  "audio",
  "tabular",
  "reinforcement-learning",
] as const;

export type HuggingFaceTaskCategory = (typeof HUGGING_FACE_TASK_CATEGORIES)[number];

export type UniversalValueKind =
  | "any"
  | "audio"
  | "boxes"
  | "depth-map"
  | "document"
  | "embedding"
  | "image"
  | "keypoints"
  | "labels"
  | "mask"
  | "model-policy"
  | "point-cloud"
  | "ranking"
  | "table"
  | "text"
  | "video";

interface HuggingFaceTaskDefinition {
  task: string;
  label: string;
  category: HuggingFaceTaskCategory;
  inputs: readonly UniversalValueKind[];
  outputs: readonly UniversalValueKind[];
  description: string;
}

const TASK_DEFINITIONS = [
  {
    task: "any-to-any",
    label: "Any-to-Any",
    category: "multimodal",
    inputs: ["any"],
    outputs: ["any"],
    description: "Routes arbitrary input modalities to arbitrary output modalities.",
  },
  {
    task: "audio-text-to-text",
    label: "Audio-Text-to-Text",
    category: "multimodal",
    inputs: ["audio", "text"],
    outputs: ["text"],
    description: "Generates text from combined audio and text context.",
  },
  {
    task: "document-question-answering",
    label: "Document Question Answering",
    category: "multimodal",
    inputs: ["document", "text"],
    outputs: ["text"],
    description: "Answers natural-language questions against document images or PDFs.",
  },
  {
    task: "visual-document-retrieval",
    label: "Visual Document Retrieval",
    category: "multimodal",
    inputs: ["document", "text"],
    outputs: ["ranking"],
    description: "Retrieves visually relevant documents for a text or multimodal query.",
  },
  {
    task: "image-text-to-text",
    label: "Image-Text-to-Text",
    category: "multimodal",
    inputs: ["image", "text"],
    outputs: ["text"],
    description: "Generates text from an image plus optional text prompt.",
  },
  {
    task: "image-text-to-image",
    label: "Image-Text-to-Image",
    category: "multimodal",
    inputs: ["image", "text"],
    outputs: ["image"],
    description: "Generates or edits images from image and text conditioning.",
  },
  {
    task: "image-text-to-video",
    label: "Image-Text-to-Video",
    category: "multimodal",
    inputs: ["image", "text"],
    outputs: ["video"],
    description: "Generates video from image and text conditioning.",
  },
  {
    task: "video-text-to-text",
    label: "Video-Text-to-Text",
    category: "multimodal",
    inputs: ["video", "text"],
    outputs: ["text"],
    description: "Generates text from video plus optional text prompt.",
  },
  {
    task: "visual-question-answering",
    label: "Visual Question Answering",
    category: "multimodal",
    inputs: ["image", "text"],
    outputs: ["text"],
    description: "Answers natural-language questions about visual inputs.",
  },
  {
    task: "feature-extraction",
    label: "Feature Extraction",
    category: "natural-language-processing",
    inputs: ["text"],
    outputs: ["embedding"],
    description: "Converts text into vector features or embeddings.",
  },
  {
    task: "fill-mask",
    label: "Fill-Mask",
    category: "natural-language-processing",
    inputs: ["text"],
    outputs: ["text"],
    description: "Predicts masked tokens in text.",
  },
  {
    task: "question-answering",
    label: "Question Answering",
    category: "natural-language-processing",
    inputs: ["text"],
    outputs: ["text"],
    description: "Answers questions against text context.",
  },
  {
    task: "sentence-similarity",
    label: "Sentence Similarity",
    category: "natural-language-processing",
    inputs: ["text"],
    outputs: ["embedding", "ranking"],
    description: "Scores or embeds sentences for semantic similarity.",
  },
  {
    task: "summarization",
    label: "Summarization",
    category: "natural-language-processing",
    inputs: ["text"],
    outputs: ["text"],
    description: "Condenses text into a shorter summary.",
  },
  {
    task: "table-question-answering",
    label: "Table Question Answering",
    category: "natural-language-processing",
    inputs: ["table", "text"],
    outputs: ["text"],
    description: "Answers questions against structured tables.",
  },
  {
    task: "text-classification",
    label: "Text Classification",
    category: "natural-language-processing",
    inputs: ["text"],
    outputs: ["labels"],
    description: "Assigns labels or scores to text.",
  },
  {
    task: "text-generation",
    label: "Text Generation",
    category: "natural-language-processing",
    inputs: ["text"],
    outputs: ["text"],
    description: "Generates text continuations or responses.",
  },
  {
    task: "text-ranking",
    label: "Text Ranking",
    category: "natural-language-processing",
    inputs: ["text"],
    outputs: ["ranking"],
    description: "Ranks candidate text passages for a query.",
  },
  {
    task: "token-classification",
    label: "Token Classification",
    category: "natural-language-processing",
    inputs: ["text"],
    outputs: ["labels"],
    description: "Assigns labels to spans or tokens in text.",
  },
  {
    task: "translation",
    label: "Translation",
    category: "natural-language-processing",
    inputs: ["text"],
    outputs: ["text"],
    description: "Translates text between languages.",
  },
  {
    task: "zero-shot-classification",
    label: "Zero-Shot Classification",
    category: "natural-language-processing",
    inputs: ["text", "labels"],
    outputs: ["labels"],
    description: "Classifies text against caller-provided labels.",
  },
  {
    task: "depth-estimation",
    label: "Depth Estimation",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["depth-map"],
    description: "Estimates per-pixel scene depth from an image.",
  },
  {
    task: "image-classification",
    label: "Image Classification",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["labels"],
    description: "Assigns labels or scores to images.",
  },
  {
    task: "image-feature-extraction",
    label: "Image Feature Extraction",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["embedding"],
    description: "Converts images into vector features or embeddings.",
  },
  {
    task: "image-segmentation",
    label: "Image Segmentation",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["mask"],
    description: "Segments an image into object or semantic masks.",
  },
  {
    task: "image-to-image",
    label: "Image-to-Image",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["image"],
    description: "Transforms an input image into another image.",
  },
  {
    task: "image-to-text",
    label: "Image-to-Text",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["text"],
    description: "Generates text from image input.",
  },
  {
    task: "image-to-video",
    label: "Image-to-Video",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["video"],
    description: "Generates video from an image.",
  },
  {
    task: "keypoint-detection",
    label: "Keypoint Detection",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["keypoints"],
    description: "Detects landmark or pose keypoints in images.",
  },
  {
    task: "mask-generation",
    label: "Mask Generation",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["mask"],
    description: "Generates masks for objects or regions in images.",
  },
  {
    task: "object-detection",
    label: "Object Detection",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["boxes", "labels"],
    description: "Detects labeled objects and bounding boxes in images.",
  },
  {
    task: "video-classification",
    label: "Video Classification",
    category: "computer-vision",
    inputs: ["video"],
    outputs: ["labels"],
    description: "Assigns labels or scores to videos.",
  },
  {
    task: "text-to-image",
    label: "Text-to-Image",
    category: "computer-vision",
    inputs: ["text"],
    outputs: ["image"],
    description: "Generates images from text prompts.",
  },
  {
    task: "text-to-video",
    label: "Text-to-Video",
    category: "computer-vision",
    inputs: ["text"],
    outputs: ["video"],
    description: "Generates video from text prompts.",
  },
  {
    task: "unconditional-image-generation",
    label: "Unconditional Image Generation",
    category: "computer-vision",
    inputs: ["any"],
    outputs: ["image"],
    description: "Generates images without a conditioning prompt.",
  },
  {
    task: "video-to-video",
    label: "Video-to-Video",
    category: "computer-vision",
    inputs: ["video"],
    outputs: ["video"],
    description: "Transforms an input video into another video.",
  },
  {
    task: "zero-shot-image-classification",
    label: "Zero-Shot Image Classification",
    category: "computer-vision",
    inputs: ["image", "labels"],
    outputs: ["labels"],
    description: "Classifies images against caller-provided labels.",
  },
  {
    task: "zero-shot-object-detection",
    label: "Zero-Shot Object Detection",
    category: "computer-vision",
    inputs: ["image", "labels"],
    outputs: ["boxes", "labels"],
    description: "Detects objects using caller-provided text labels.",
  },
  {
    task: "text-to-3d",
    label: "Text-to-3D",
    category: "computer-vision",
    inputs: ["text"],
    outputs: ["point-cloud"],
    description: "Generates 3D assets or point clouds from text prompts.",
  },
  {
    task: "image-to-3d",
    label: "Image-to-3D",
    category: "computer-vision",
    inputs: ["image"],
    outputs: ["point-cloud"],
    description: "Generates 3D assets or point clouds from image input.",
  },
  {
    task: "audio-classification",
    label: "Audio Classification",
    category: "audio",
    inputs: ["audio"],
    outputs: ["labels"],
    description: "Assigns labels or scores to audio.",
  },
  {
    task: "audio-to-audio",
    label: "Audio-to-Audio",
    category: "audio",
    inputs: ["audio"],
    outputs: ["audio"],
    description: "Transforms input audio into output audio.",
  },
  {
    task: "automatic-speech-recognition",
    label: "Automatic Speech Recognition",
    category: "audio",
    inputs: ["audio"],
    outputs: ["text"],
    description: "Transcribes speech audio into text.",
  },
  {
    task: "text-to-speech",
    label: "Text-to-Speech",
    category: "audio",
    inputs: ["text"],
    outputs: ["audio"],
    description: "Synthesizes speech audio from text.",
  },
  {
    task: "tabular-classification",
    label: "Tabular Classification",
    category: "tabular",
    inputs: ["table"],
    outputs: ["labels"],
    description: "Assigns labels or scores to tabular rows.",
  },
  {
    task: "tabular-regression",
    label: "Tabular Regression",
    category: "tabular",
    inputs: ["table"],
    outputs: ["labels"],
    description: "Predicts continuous values from tabular rows.",
  },
  {
    task: "reinforcement-learning",
    label: "Reinforcement Learning",
    category: "reinforcement-learning",
    inputs: ["model-policy"],
    outputs: ["model-policy"],
    description: "Runs or exchanges reinforcement learning policies.",
  },
] as const satisfies readonly HuggingFaceTaskDefinition[];

export type HuggingFaceTaskSlug = (typeof TASK_DEFINITIONS)[number]["task"];

export interface HuggingFaceTaskDescriptor<
  Task extends HuggingFaceTaskSlug = HuggingFaceTaskSlug,
> {
  task: Task;
  label: string;
  category: HuggingFaceTaskCategory;
  inputs: readonly UniversalValueKind[];
  outputs: readonly UniversalValueKind[];
  description: string;
  modelSearchUrl: string;
}

export interface HuggingFaceModelReference<
  Task extends HuggingFaceTaskSlug = HuggingFaceTaskSlug,
> {
  task: Task;
  model: string;
  endpoint?: string;
  provider?: "hf-inference" | string;
  parameters?: Record<string, unknown>;
}

export interface UniversalTaskRequest<
  Task extends HuggingFaceTaskSlug = HuggingFaceTaskSlug,
  Input = unknown,
> {
  task: Task;
  model: HuggingFaceModelReference<Task>;
  input: Input;
  parameters?: Record<string, unknown>;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface UniversalTaskResult<
  Task extends HuggingFaceTaskSlug = HuggingFaceTaskSlug,
  Output = unknown,
> {
  task: Task;
  model: string;
  output: Output;
  raw: unknown;
  metadata?: Record<string, unknown>;
}

export interface UniversalHuggingFaceProvider {
  id: string;
  run<Task extends HuggingFaceTaskSlug, Input = unknown>(
    request: UniversalTaskRequest<Task, Input>,
  ): Promise<UniversalTaskResult<Task, unknown>>;
}

export interface UniversalTaskRunOptions extends PipelineRunContext {
  parameters?: Record<string, unknown>;
}

export interface UniversalTaskPipeline<
  Task extends HuggingFaceTaskSlug = HuggingFaceTaskSlug,
  Input = unknown,
  Output = unknown,
> {
  descriptor: HuggingFaceTaskDescriptor<Task>;
  model: HuggingFaceModelReference<Task>;
  run(input: Input, options?: UniversalTaskRunOptions): Promise<UniversalTaskResult<Task, Output>>;
  batch(
    inputs: Iterable<Input>,
    options?: UniversalTaskRunOptions,
  ): Promise<Array<UniversalTaskResult<Task, Output>>>;
  pipe<NextOutput>(
    next: Pipeline<UniversalTaskResult<Task, Output>, NextOutput>,
  ): Pipeline<Input, NextOutput>;
  map<NextOutput>(
    mapper: (
      output: UniversalTaskResult<Task, Output>,
      context: PipelineRunContext,
    ) => NextOutput | Promise<NextOutput>,
  ): Pipeline<Input, NextOutput>;
  tap(
    effect: (
      output: UniversalTaskResult<Task, Output>,
      context: PipelineRunContext,
    ) => void | Promise<void>,
  ): Pipeline<Input, UniversalTaskResult<Task, Output>>;
  connect<NextTask extends HuggingFaceTaskSlug, NextOutput = unknown>(
    next: UniversalTaskPipeline<NextTask, Output, NextOutput>,
    map?: (result: UniversalTaskResult<Task, Output>) => Output | Promise<Output>,
  ): UniversalTaskPipeline<NextTask, Input, NextOutput>;
  connect<NextTask extends HuggingFaceTaskSlug, NextInput, NextOutput = unknown>(
    next: UniversalTaskPipeline<NextTask, NextInput, NextOutput>,
    map: (result: UniversalTaskResult<Task, Output>) => NextInput | Promise<NextInput>,
  ): UniversalTaskPipeline<NextTask, Input, NextOutput>;
}

export interface CreateUniversalTaskPipelineOptions<
  Task extends HuggingFaceTaskSlug = HuggingFaceTaskSlug,
> {
  descriptor: HuggingFaceTaskDescriptor<Task>;
  provider: UniversalHuggingFaceProvider;
  model: HuggingFaceModelReference<Task>;
  defaultParameters?: Record<string, unknown>;
}

export interface HuggingFaceTaskPackage<
  Task extends HuggingFaceTaskSlug = HuggingFaceTaskSlug,
> {
  descriptor: HuggingFaceTaskDescriptor<Task>;
  createModelReference(
    model: string,
    options?: Omit<HuggingFaceModelReference<Task>, "model" | "task">,
  ): HuggingFaceModelReference<Task>;
  createPipeline<Input = unknown, Output = unknown>(
    options: Omit<CreateUniversalTaskPipelineOptions<Task>, "descriptor">,
  ): UniversalTaskPipeline<Task, Input, Output>;
}

export interface CreateHuggingFaceRouterProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
  buildPayload?: (request: UniversalTaskRequest) => unknown;
  normalizeOutput?: (raw: unknown, request: UniversalTaskRequest) => unknown;
}

export const HUGGING_FACE_TASKS = TASK_DEFINITIONS.map((definition) =>
  withModelSearchUrl(definition),
) as readonly HuggingFaceTaskDescriptor[];

export function getHuggingFaceTaskDescriptor<Task extends HuggingFaceTaskSlug>(
  task: Task,
): HuggingFaceTaskDescriptor<Task> {
  const descriptor = HUGGING_FACE_TASKS.find((candidate) => candidate.task === task);

  if (!descriptor) {
    throw new Error(`Unknown Hugging Face task: ${task}`);
  }

  return descriptor as HuggingFaceTaskDescriptor<Task>;
}

export function listHuggingFaceTasks(
  category?: HuggingFaceTaskCategory,
): readonly HuggingFaceTaskDescriptor[] {
  if (!category) {
    return HUGGING_FACE_TASKS;
  }

  return HUGGING_FACE_TASKS.filter((task) => task.category === category);
}

export function createHuggingFaceTaskPackage<Task extends HuggingFaceTaskSlug>(
  task: Task,
): HuggingFaceTaskPackage<Task> {
  const descriptor = getHuggingFaceTaskDescriptor(task);

  return {
    descriptor,
    createModelReference(model, options = {}) {
      return {
        ...options,
        task,
        model,
      };
    },
    createPipeline(options) {
      return createUniversalTaskPipeline({
        ...options,
        descriptor,
      });
    },
  };
}

export function createUniversalTaskPipeline<
  Task extends HuggingFaceTaskSlug,
  Input = unknown,
  Output = unknown,
>(
  options: CreateUniversalTaskPipelineOptions<Task>,
): UniversalTaskPipeline<Task, Input, Output> {
  return createUniversalPipelineFromRun({
    descriptor: options.descriptor,
    model: options.model,
    run: async (input, runOptions = {}) => {
      const result = await options.provider.run<Task, Input>({
        task: options.descriptor.task,
        model: options.model,
        input,
        parameters: {
          ...options.model.parameters,
          ...options.defaultParameters,
          ...runOptions.parameters,
        },
        signal: runOptions.signal,
        metadata: runOptions.metadata,
      });

      return result as UniversalTaskResult<Task, Output>;
    },
  });
}

export function createHuggingFaceRouterProvider(
  options: CreateHuggingFaceRouterProviderOptions = {},
): UniversalHuggingFaceProvider {
  const fetchImpl = options.fetch ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new Error("A fetch implementation is required to create a Hugging Face provider.");
  }

  return {
    id: "huggingface-router",
    async run(request) {
      const endpoint = resolveHuggingFaceEndpoint(request.model, options.baseUrl);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.defaultHeaders,
      };

      if (options.apiKey) {
        headers.Authorization = `Bearer ${options.apiKey}`;
      }

      const rawResponse = await fetchImpl(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify((options.buildPayload ?? buildDefaultPayload)(request)),
        signal: request.signal,
      });
      const responseText = await rawResponse.text();
      const raw = responseText.length > 0 ? safeParseJson(responseText) : null;

      if (!rawResponse.ok) {
        throw new Error(
          `Hugging Face inference request failed (${rawResponse.status} ${rawResponse.statusText}): ${responseText}`,
        );
      }

      return {
        task: request.task,
        model: request.model.model,
        output: (options.normalizeOutput ?? defaultNormalizeOutput)(raw, request),
        raw,
        metadata: request.metadata,
      };
    },
  };
}

function createUniversalPipelineFromRun<
  Task extends HuggingFaceTaskSlug,
  Input = unknown,
  Output = unknown,
>(options: {
  descriptor: HuggingFaceTaskDescriptor<Task>;
  model: HuggingFaceModelReference<Task>;
  run(input: Input, runOptions?: UniversalTaskRunOptions): Promise<UniversalTaskResult<Task, Output>>;
}): UniversalTaskPipeline<Task, Input, Output> {
  const pipeline = createPipelineFromRun<Input, UniversalTaskResult<Task, Output>>((input, context) =>
    options.run(input, context as UniversalTaskRunOptions),
  );

  return {
    descriptor: options.descriptor,
    model: options.model,
    run: pipeline.run,
    batch: pipeline.batch,
    pipe: pipeline.pipe,
    map: pipeline.map,
    tap: pipeline.tap,
    connect<NextTask extends HuggingFaceTaskSlug, NextInput = Output, NextOutput = unknown>(
      next: UniversalTaskPipeline<NextTask, NextInput, NextOutput>,
      map?: (result: UniversalTaskResult<Task, Output>) => NextInput | Promise<NextInput>,
    ) {
      return createUniversalPipelineFromRun({
        descriptor: next.descriptor,
        model: next.model,
        run: async (input: Input, runOptions) => {
          const current = await options.run(input, runOptions);
          const nextInput = map ? await map(current) : (current.output as unknown as NextInput);
          return next.run(nextInput, runOptions);
        },
      });
    },
  };
}

function withModelSearchUrl<Task extends HuggingFaceTaskDefinition>(
  definition: Task,
): HuggingFaceTaskDescriptor<Task["task"] & HuggingFaceTaskSlug> {
  return {
    ...definition,
    modelSearchUrl: `https://huggingface.co/models?pipeline_tag=${encodeURIComponent(
      definition.task,
    )}`,
  } as HuggingFaceTaskDescriptor<Task["task"] & HuggingFaceTaskSlug>;
}

function resolveHuggingFaceEndpoint(
  model: HuggingFaceModelReference,
  baseUrl = DEFAULT_HUGGING_FACE_BASE_URL,
): string {
  if (model.endpoint) {
    return model.endpoint;
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/u, "");
  return `${normalizedBaseUrl}/${model.model
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function buildDefaultPayload(request: UniversalTaskRequest): unknown {
  if (isRecord(request.input) && ("inputs" in request.input || "messages" in request.input)) {
    return {
      ...request.input,
      parameters: request.parameters,
    };
  }

  return {
    inputs: request.input,
    parameters: request.parameters,
  };
}

function defaultNormalizeOutput(raw: unknown): unknown {
  return raw;
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
