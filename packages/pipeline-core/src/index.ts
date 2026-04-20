export type PipelineValueKind =
  | "text"
  | "text-document"
  | "text-chunks"
  | "ocr-document"
  | "document-structure"
  | "labels"
  | "entities"
  | "embedding"
  | "image"
  | "audio"
  | "video"
  | "table"
  | "geo-points"
  | "density-index"
  | "graph"
  | "any";

export interface PipelinePort<Kind extends PipelineValueKind = PipelineValueKind> {
  kind: Kind;
  label?: string;
  schema?: unknown;
  metadata?: Record<string, unknown>;
}

export interface PipelineProvenance {
  stepId: string;
  at: string;
  input?: PipelinePort;
  output?: PipelinePort;
  metadata?: Record<string, unknown>;
}

export interface PipelineRunContext {
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
  provenance?: PipelineProvenance[];
}

export interface PipelineArtifact<
  Kind extends PipelineValueKind = PipelineValueKind,
  Value = unknown,
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  kind: Kind;
  value: Value;
  metadata?: Metadata;
  provenance?: PipelineProvenance[];
}

export interface PipelineStep<Input, Output> {
  id: string;
  input: PipelinePort;
  output: PipelinePort;
  run(input: Input, context: PipelineRunContext): Promise<Output>;
}

export interface CreatePipelineStepOptions<Input, Output> {
  id: string;
  input?: PipelinePort;
  output?: PipelinePort;
  run(input: Input, context: PipelineRunContext): Output | Promise<Output>;
}

export interface Pipeline<Input, Output> {
  run(input: Input, context?: PipelineRunContext): Promise<Output>;
  batch(inputs: Iterable<Input>, context?: PipelineRunContext): Promise<Output[]>;
  pipe<NextOutput>(next: Pipeline<Output, NextOutput>): Pipeline<Input, NextOutput>;
  map<NextOutput>(
    mapper: (output: Output, context: PipelineRunContext) => NextOutput | Promise<NextOutput>,
  ): Pipeline<Input, NextOutput>;
  tap(
    effect: (output: Output, context: PipelineRunContext) => void | Promise<void>,
  ): Pipeline<Input, Output>;
}

export interface CreateArtifactOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  metadata?: Metadata;
  provenance?: PipelineProvenance[];
}

const ANY_PORT: PipelinePort = { kind: "any" };

export function artifact<
  Kind extends PipelineValueKind,
  Value,
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  kind: Kind,
  value: Value,
  options: CreateArtifactOptions<Metadata> = {},
): PipelineArtifact<Kind, Value, Metadata> {
  return {
    kind,
    value,
    metadata: options.metadata,
    provenance: options.provenance ? [...options.provenance] : undefined,
  };
}

export function isPipelineArtifact(value: unknown): value is PipelineArtifact {
  return Boolean(
    value &&
      typeof value === "object" &&
      "kind" in value &&
      "value" in value &&
      typeof (value as PipelineArtifact).kind === "string",
  );
}

export function createPipelineStep<Input, Output>(
  options: CreatePipelineStepOptions<Input, Output>,
): PipelineStep<Input, Output> {
  return {
    id: options.id,
    input: options.input ?? ANY_PORT,
    output: options.output ?? ANY_PORT,
    async run(input, context) {
      return options.run(input, context);
    },
  };
}

export function createPipeline<Input, Output>(
  step: PipelineStep<Input, Output>,
): Pipeline<Input, Output> {
  return createPipelineFromRun(async (input, context) => {
    const output = await step.run(input, context);
    context.provenance?.push({
      stepId: step.id,
      input: step.input,
      output: step.output,
      at: new Date().toISOString(),
    });
    return output;
  });
}

export function pipe<Input, Middle, Output>(
  first: Pipeline<Input, Middle>,
  second: Pipeline<Middle, Output>,
): Pipeline<Input, Output> {
  return first.pipe(second);
}

export function map<Input, Output, NextOutput>(
  pipeline: Pipeline<Input, Output>,
  mapper: (output: Output, context: PipelineRunContext) => NextOutput | Promise<NextOutput>,
): Pipeline<Input, NextOutput> {
  return pipeline.map(mapper);
}

export function tap<Input, Output>(
  pipeline: Pipeline<Input, Output>,
  effect: (output: Output, context: PipelineRunContext) => void | Promise<void>,
): Pipeline<Input, Output> {
  return pipeline.tap(effect);
}

export function batch<Input, Output>(
  pipeline: Pipeline<Input, Output>,
  inputs: Iterable<Input>,
  context?: PipelineRunContext,
): Promise<Output[]> {
  return pipeline.batch(inputs, context);
}

export function createPipelineFromRun<Input, Output>(
  run: (input: Input, context: PipelineRunContext) => Promise<Output>,
): Pipeline<Input, Output> {
  return {
    run(input, context) {
      return run(input, normalizeRunContext(context));
    },
    batch(inputs, context) {
      const runContext = normalizeRunContext(context);
      return Promise.all(Array.from(inputs, (input) => run(input, runContext)));
    },
    pipe(next) {
      return createPipelineFromRun(async (input: Input, context) => {
        const output = await run(input, context);
        return next.run(output, context);
      });
    },
    map(mapper) {
      return createPipelineFromRun(async (input: Input, context) => {
        const output = await run(input, context);
        return mapper(output, context);
      });
    },
    tap(effect) {
      return createPipelineFromRun(async (input: Input, context) => {
        const output = await run(input, context);
        await effect(output, context);
        return output;
      });
    },
  };
}

export function normalizeRunContext(context: PipelineRunContext = {}): PipelineRunContext {
  return {
    ...context,
    metadata: context.metadata ? { ...context.metadata } : undefined,
    provenance: context.provenance ?? [],
  };
}
