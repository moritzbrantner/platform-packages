import {
  adaptInformationExtractionOutput,
  applyRuleBasedPostprocessors,
  filterExtractionByPolicy,
  validateExtractionOutput,
  type CanonicalizationOptions,
  type ConfidenceThresholdPolicy,
  type ExtractionSchema,
  type FilterExtractionByPolicyOptions,
  type InformationExtractionOutput as SchemaInformationExtractionOutput,
  type NormalizedExtraction,
  type PostprocessOptions,
  type ValidationResult,
} from "@moritzbrantner/extraction-schema";
import {
  chunkTextForInference,
  ensureTextDocument,
  type ChunkTextOptions,
  type HuggingFaceModelReference,
  type TextInferenceInput,
  type TokenClassificationProvider,
} from "@moritzbrantner/text-inference";
import type { TextAnalysisResult } from "@moritzbrantner/text-analysis";

const DEFAULT_RELATION_PATTERNS: readonly RelationPattern[] = [
  {
    regex:
      /(?<subject>[A-Z][\w.&-]*(?:\s+[A-Z][\w.&-]*)*)\s+(?<relation>acquired|bought|founded|joined|left|led|announced|launched|met|visited|hired)\s+(?<object>[A-Z][\w.&-]*(?:\s+[A-Z][\w.&-]*)*)/gu,
    relationMap: {
      acquired: "acquired",
      bought: "acquired",
      founded: "founded",
      joined: "joined",
      left: "left",
      led: "led",
      announced: "announced",
      launched: "launched",
      met: "met",
      visited: "visited",
      hired: "hired",
    },
    baseConfidence: 0.72,
  },
  {
    regex:
      /(?<subject>[A-Z][\w.&-]*(?:\s+[A-Z][\w.&-]*)*)\s+(?<relation>is|are|was|were|became|becomes)\s+(?:an?|the\s+)?(?<object>[A-Z][\w.&-]*(?:\s+[A-Z][\w.&-]*)*|[a-z][\w-]*(?:\s+[a-z][\w-]*)*)/gu,
    relationMap: {
      is: "is",
      are: "is",
      was: "is",
      were: "is",
      became: "became",
      becomes: "became",
    },
    baseConfidence: 0.62,
  },
];

const DEFAULT_EVENT_TRIGGERS = new Set([
  "acquired",
  "announced",
  "appointed",
  "attacked",
  "became",
  "founded",
  "hired",
  "joined",
  "launched",
  "left",
  "met",
  "released",
  "visited",
]);

const TIME_PATTERN =
  /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)|today|yesterday|tomorrow)\b/giu;

export interface EvidenceSpan {
  text: string;
  start: number;
  end: number;
  chunkId: string;
  chunkIndex: number;
  sentenceIndex: number;
}

export interface ExtractedRelation {
  subject: string;
  relation: string;
  object: string;
  confidence: number;
  evidenceSpan: EvidenceSpan;
  source: "rule" | "provider";
}

export interface ExtractedEventArgument {
  role: string;
  value: string;
  confidence: number;
}

export interface ExtractedEventFrame {
  trigger: string;
  arguments: ExtractedEventArgument[];
  time?: string;
  confidence: number;
  evidenceSpan: EvidenceSpan;
  source: "rule" | "provider";
}

export interface InformationExtractionChunkResult {
  chunkId: string;
  chunkIndex: number;
  text: string;
  relations: ExtractedRelation[];
  events: ExtractedEventFrame[];
}

export interface GraphNode {
  id: string;
  type: "entity" | "event";
  label: string;
  confidence: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  relation: string;
  confidence: number;
  evidenceSpan: EvidenceSpan;
}

export interface GraphReadyJson {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    documentId: string;
    relationCount: number;
    eventCount: number;
  };
}

export interface InformationExtractionResult<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  documentId: string;
  relations: ExtractedRelation[];
  events: ExtractedEventFrame[];
  chunks: InformationExtractionChunkResult[];
  graph?: GraphReadyJson;
  analysis?: TextAnalysisResult<Metadata>;
  normalizedExtraction?: NormalizedExtraction;
  validation?: ValidationResult;
}

export interface ExtractionSpan {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface ProviderRelation {
  subject: ExtractionSpan;
  relation: string;
  object: ExtractionSpan;
  confidence: number;
}

export interface ProviderEvent {
  trigger: ExtractionSpan;
  arguments: Array<ExtractionSpan & { role: string }>;
  time?: ExtractionSpan;
  confidence: number;
}

export interface RelationExtractionRequest {
  text: string;
  entities: ExtractedEntity[];
}

export interface EventExtractionRequest {
  text: string;
  entities: ExtractedEntity[];
}

export interface RelationExtractionProvider {
  id: string;
  extractRelations(request: RelationExtractionRequest): Promise<ProviderRelation[]>;
}

export interface EventExtractionProvider {
  id: string;
  extractEvents(request: EventExtractionRequest): Promise<ProviderEvent[]>;
}

export interface ExtractedEntity {
  text: string;
  label: string;
  score: number;
  start: number;
  end: number;
}

interface RelationPattern {
  regex: RegExp;
  relationMap: Record<string, string>;
  baseConfidence: number;
}

export interface CreateInformationExtractionPipelineOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  entityRecognizer?: {
    provider: TokenClassificationProvider;
    model: HuggingFaceModelReference<"token-classification">;
  };
  relationProvider?: RelationExtractionProvider;
  eventProvider?: EventExtractionProvider;
  chunking?: ChunkTextOptions<Metadata>;
  relationPatterns?: readonly RelationPattern[];
  eventTriggers?: ReadonlySet<string>;
  merge?: {
    minimumConfidence?: number;
    relationSimilarityWindow?: number;
  };
  schema?: SchemaAwareInformationExtractionOptions;
}

export interface ExtractInformationOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  analysis?: TextAnalysisResult<Metadata>;
  chunking?: ChunkTextOptions<Metadata>;
  emitGraph?: boolean;
  minimumConfidence?: number;
  schema?: SchemaAwareInformationExtractionOptions;
}

export interface SchemaAwareInformationExtractionOptions {
  schema: ExtractionSchema;
  confidencePolicy?: ConfidenceThresholdPolicy;
  canonicalization?: CanonicalizationOptions;
  postprocess?: PostprocessOptions;
  filter?: FilterExtractionByPolicyOptions;
  defaultEntityType?: string;
  eventEntityType?: string;
  valueFieldName?: string;
}

export interface InformationExtractionPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  extract(
    input: TextInferenceInput<Metadata>,
    options?: ExtractInformationOptions<Metadata>,
  ): Promise<InformationExtractionResult<Metadata>>;
}

export function createInformationExtractionPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreateInformationExtractionPipelineOptions<Metadata> = {},
): InformationExtractionPipeline<Metadata> {
  return {
    async extract(input, extractionOptions = {}) {
      const document = ensureTextDocument(input, options.chunking);
      const chunking = extractionOptions.chunking ?? options.chunking;
      const chunks = chunkTextForInference(input, chunking);
      const minimumConfidence =
        extractionOptions.minimumConfidence ?? options.merge?.minimumConfidence ?? 0;

      const chunkResults = await Promise.all(
        chunks.map(async (chunk): Promise<InformationExtractionChunkResult> => {
          const chunkEntities = await collectChunkEntities(
            chunk.text,
            chunk.start,
            extractionOptions.analysis,
            options.entityRecognizer,
          );
          const sentences = splitSentences(chunk.text, chunk.start);

          const ruleRelations = sentences.flatMap((sentence, sentenceIndex) =>
            extractRuleRelations(
              sentence,
              sentenceIndex,
              chunk.id,
              chunk.index,
              chunkEntities,
              options.relationPatterns ?? DEFAULT_RELATION_PATTERNS,
            ),
          );
          const providerRelations = options.relationProvider
            ? await extractProviderRelations(
                options.relationProvider,
                chunk.text,
                chunk.id,
                chunk.index,
                chunkEntities,
                sentences,
              )
            : [];

          const ruleEvents = sentences.flatMap((sentence, sentenceIndex) =>
            extractRuleEvents(
              sentence,
              sentenceIndex,
              chunk.id,
              chunk.index,
              chunkEntities,
              options.eventTriggers ?? DEFAULT_EVENT_TRIGGERS,
            ),
          );
          const providerEvents = options.eventProvider
            ? await extractProviderEvents(
                options.eventProvider,
                chunk.text,
                chunk.id,
                chunk.index,
                chunkEntities,
                sentences,
              )
            : [];

          return {
            chunkId: chunk.id,
            chunkIndex: chunk.index,
            text: chunk.text,
            relations: [...ruleRelations, ...providerRelations].filter(
              (relation) => relation.confidence >= minimumConfidence,
            ),
            events: [...ruleEvents, ...providerEvents].filter(
              (event) => event.confidence >= minimumConfidence,
            ),
          };
        }),
      );

      const mergedRelations = mergeRelations(
        chunkResults.flatMap((chunk) => chunk.relations),
        options.merge?.relationSimilarityWindow ?? 24,
      );
      const mergedEvents = mergeEvents(chunkResults.flatMap((chunk) => chunk.events));
      const schemaResult = normalizeForSchema(
        mergedRelations,
        mergedEvents,
        extractionOptions.schema ?? options.schema,
      );

      return {
        documentId: document.id,
        relations: mergedRelations,
        events: mergedEvents,
        chunks: chunkResults,
        analysis: extractionOptions.analysis,
        normalizedExtraction: schemaResult?.normalizedExtraction,
        validation: schemaResult?.validation,
        graph: extractionOptions.emitGraph ? toGraphJson({
          documentId: document.id,
          relations: mergedRelations,
          events: mergedEvents,
        }) : undefined,
      };
    },
  };
}

export function normalizeInformationExtractionForSchema(
  relations: readonly ExtractedRelation[],
  events: readonly ExtractedEventFrame[],
  options: SchemaAwareInformationExtractionOptions,
): {
  normalizedExtraction: NormalizedExtraction;
  validation: ValidationResult;
} {
  let normalizedExtraction = adaptInformationExtractionOutput(
    toSchemaInformationExtractionOutput(relations, events, {
      ...options,
      includeEvents: hasSchemaEntityType(
        options.schema,
        options.eventEntityType ?? "event",
      ),
    }),
    options.canonicalization,
  );

  normalizedExtraction = applyRuleBasedPostprocessors(normalizedExtraction, options.postprocess);

  if (options.confidencePolicy) {
    normalizedExtraction = filterExtractionByPolicy(
      normalizedExtraction,
      options.confidencePolicy,
      options.filter,
    );
  }

  return {
    normalizedExtraction,
    validation: validateExtractionOutput(
      normalizedExtraction,
      options.schema,
      options.confidencePolicy,
    ),
  };
}

export function toSchemaInformationExtractionOutput(
  relations: readonly ExtractedRelation[],
  events: readonly ExtractedEventFrame[],
  options: Pick<
    SchemaAwareInformationExtractionOptions,
    "defaultEntityType" | "eventEntityType" | "valueFieldName"
  > & { includeEvents?: boolean } = {},
): SchemaInformationExtractionOutput {
  const valueFieldName = options.valueFieldName ?? "value";
  const defaultEntityType = options.defaultEntityType ?? "entity";
  const eventEntityType = options.eventEntityType ?? "event";
  const includeEvents = options.includeEvents ?? true;
  const entities = new Map<string, NonNullable<SchemaInformationExtractionOutput["entities"]>[number]>();
  const outputRelations: NonNullable<SchemaInformationExtractionOutput["relations"]> = [];

  for (const relation of relations) {
    const subjectId = toSchemaEntityId(defaultEntityType, relation.subject);
    const objectId = toSchemaEntityId(defaultEntityType, relation.object);

    entities.set(subjectId, {
      id: subjectId,
      type: defaultEntityType,
      confidence: relation.confidence,
      fields: [{ name: valueFieldName, value: relation.subject, confidence: relation.confidence }],
    });
    entities.set(objectId, {
      id: objectId,
      type: defaultEntityType,
      confidence: relation.confidence,
      fields: [{ name: valueFieldName, value: relation.object, confidence: relation.confidence }],
    });
    outputRelations.push({
      type: relation.relation,
      from: subjectId,
      to: objectId,
      confidence: relation.confidence,
    });
  }

  for (const [eventIndex, event] of includeEvents ? events.entries() : []) {
    const eventId = `${eventEntityType}-${normalizeKey(event.trigger)}-${eventIndex}`;
    entities.set(eventId, {
      id: eventId,
      type: eventEntityType,
      confidence: event.confidence,
      fields: [
        { name: "trigger", value: event.trigger, confidence: event.confidence },
        ...(event.time
          ? [{ name: "time", value: event.time, confidence: event.confidence }]
          : []),
      ],
    });

    for (const argument of event.arguments) {
      const argumentId = toSchemaEntityId(defaultEntityType, argument.value);
      entities.set(argumentId, {
        id: argumentId,
        type: defaultEntityType,
        confidence: argument.confidence,
        fields: [{ name: valueFieldName, value: argument.value, confidence: argument.confidence }],
      });
      outputRelations.push({
        type: argument.role,
        from: eventId,
        to: argumentId,
        confidence: Math.min(event.confidence, argument.confidence),
      });
    }
  }

  return {
    entities: Array.from(entities.values()),
    relations: outputRelations,
  };
}

function normalizeForSchema(
  relations: readonly ExtractedRelation[],
  events: readonly ExtractedEventFrame[],
  options: SchemaAwareInformationExtractionOptions | undefined,
):
  | {
      normalizedExtraction: NormalizedExtraction;
      validation: ValidationResult;
    }
  | undefined {
  if (!options) {
    return undefined;
  }

  return normalizeInformationExtractionForSchema(relations, events, options);
}

function toSchemaEntityId(type: string, value: string): string {
  return `${normalizeKey(type)}:${normalizeKey(value)}`;
}

function hasSchemaEntityType(schema: ExtractionSchema, entityType: string): boolean {
  const normalizedEntityType = normalizeKey(entityType);
  return schema.entities.some((entity) => normalizeKey(entity.type) === normalizedEntityType);
}

export function toGraphJson<Metadata extends Record<string, unknown> = Record<string, unknown>>(
  result: Pick<InformationExtractionResult<Metadata>, "documentId" | "relations" | "events">,
): GraphReadyJson {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const relation of result.relations) {
    const subjectId = toEntityNodeId(relation.subject);
    const objectId = toEntityNodeId(relation.object);

    upsertGraphNode(nodeMap, {
      id: subjectId,
      type: "entity",
      label: relation.subject,
      confidence: relation.confidence,
    });
    upsertGraphNode(nodeMap, {
      id: objectId,
      type: "entity",
      label: relation.object,
      confidence: relation.confidence,
    });

    edges.push({
      id: `rel:${subjectId}:${relation.relation}:${objectId}:${relation.evidenceSpan.start}`,
      from: subjectId,
      to: objectId,
      relation: relation.relation,
      confidence: relation.confidence,
      evidenceSpan: relation.evidenceSpan,
    });
  }

  for (const [eventIndex, event] of result.events.entries()) {
    const eventId = `event:${normalizeKey(event.trigger)}:${eventIndex}`;
    upsertGraphNode(nodeMap, {
      id: eventId,
      type: "event",
      label: event.trigger,
      confidence: event.confidence,
    });

    edges.push({
      id: `edge:${eventId}:trigger`,
      from: eventId,
      to: eventId,
      relation: "trigger",
      confidence: event.confidence,
      evidenceSpan: event.evidenceSpan,
    });

    for (const argument of event.arguments) {
      const argNodeId = toEntityNodeId(argument.value);
      upsertGraphNode(nodeMap, {
        id: argNodeId,
        type: "entity",
        label: argument.value,
        confidence: argument.confidence,
      });
      edges.push({
        id: `edge:${eventId}:${argument.role}:${argNodeId}`,
        from: eventId,
        to: argNodeId,
        relation: argument.role,
        confidence: Math.min(event.confidence, argument.confidence),
        evidenceSpan: event.evidenceSpan,
      });
    }

    if (event.time) {
      const timeNodeId = `time:${normalizeKey(event.time)}`;
      upsertGraphNode(nodeMap, {
        id: timeNodeId,
        type: "entity",
        label: event.time,
        confidence: event.confidence,
      });
      edges.push({
        id: `edge:${eventId}:time:${timeNodeId}`,
        from: eventId,
        to: timeNodeId,
        relation: "time",
        confidence: event.confidence,
        evidenceSpan: event.evidenceSpan,
      });
    }
  }

  return {
    nodes: Array.from(nodeMap.values()).sort((left, right) => left.id.localeCompare(right.id)),
    edges: edges.sort((left, right) => left.id.localeCompare(right.id)),
    metadata: {
      documentId: result.documentId,
      relationCount: result.relations.length,
      eventCount: result.events.length,
    },
  };
}

async function collectChunkEntities<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  chunkText: string,
  chunkStart: number,
  analysis: TextAnalysisResult<Metadata> | undefined,
  recognizer:
    | {
        provider: TokenClassificationProvider;
        model: HuggingFaceModelReference<"token-classification">;
      }
    | undefined,
): Promise<ExtractedEntity[]> {
  const fromAnalysis = collectAnalysisEntities(chunkText, chunkStart, analysis);

  if (fromAnalysis.length > 0 || !recognizer) {
    return fromAnalysis;
  }

  const response = await recognizer.provider.classifyTokens({
    model: recognizer.model,
    input: chunkText,
  });

  return response.entities.flatMap((entity) => {
    const span = locateEntitySpan(chunkText, entity.text, entity.start, entity.end);

    if (!span) {
      return [];
    }

    return [
      {
        text: entity.text,
        label: entity.label,
        score: entity.score,
        start: chunkStart + span.start,
        end: chunkStart + span.end,
      },
    ];
  });
}

function collectAnalysisEntities<Metadata extends Record<string, unknown> = Record<string, unknown>>(
  chunkText: string,
  chunkStart: number,
  analysis: TextAnalysisResult<Metadata> | undefined,
): ExtractedEntity[] {
  if (!analysis || analysis.entities.length === 0) {
    return [];
  }

  return analysis.entities.flatMap((entity) => {
    const localStart = chunkText.toLocaleLowerCase().indexOf(entity.text.toLocaleLowerCase());

    if (localStart < 0) {
      return [];
    }

    return [
      {
        text: entity.text,
        label: entity.label,
        score: entity.score,
        start: chunkStart + localStart,
        end: chunkStart + localStart + entity.text.length,
      },
    ];
  });
}

function extractRuleRelations(
  sentence: LocalSentence,
  sentenceIndex: number,
  chunkId: string,
  chunkIndex: number,
  entities: readonly ExtractedEntity[],
  relationPatterns: readonly RelationPattern[],
): ExtractedRelation[] {
  const relations: ExtractedRelation[] = [];

  for (const pattern of relationPatterns) {
    for (const match of sentence.text.matchAll(pattern.regex)) {
      const groups = match.groups;

      if (!groups) {
        continue;
      }

      const subject = groups.subject?.trim();
      const relationTerm = groups.relation?.trim().toLocaleLowerCase();
      const object = groups.object?.trim();

      if (!subject || !relationTerm || !object) {
        continue;
      }

      const relation = pattern.relationMap[relationTerm] ?? relationTerm;
      const spanStart = sentence.start + (match.index ?? 0);
      const spanEnd = spanStart + match[0].length;
      const spanText = sentence.text.slice(match.index ?? 0, (match.index ?? 0) + match[0].length);
      const subjectEntity = findBestEntity(subject, spanStart, entities);
      const objectEntity = findBestEntity(object, spanStart, entities);
      const confidence = clamp01(
        pattern.baseConfidence *
          combineEntityConfidence(subjectEntity?.score, objectEntity?.score),
      );

      relations.push({
        subject: subjectEntity?.text ?? subject,
        relation,
        object: objectEntity?.text ?? object,
        confidence,
        source: "rule",
        evidenceSpan: {
          text: spanText,
          start: spanStart,
          end: spanEnd,
          chunkId,
          chunkIndex,
          sentenceIndex,
        },
      });
    }
  }

  return relations;
}

async function extractProviderRelations(
  provider: RelationExtractionProvider,
  chunkText: string,
  chunkId: string,
  chunkIndex: number,
  entities: readonly ExtractedEntity[],
  sentences: readonly LocalSentence[],
): Promise<ExtractedRelation[]> {
  const relations = await provider.extractRelations({
    text: chunkText,
    entities: [...entities],
  });
  const chunkBase = sentences[0]?.start ?? 0;

  return relations.flatMap((relation) => {
    const sentenceIndex = locateSentence(sentences, relation.subject.start);

    if (sentenceIndex < 0) {
      return [];
    }

    const sentence = sentences[sentenceIndex];
    const start = chunkBase + relation.subject.start;
    const end = chunkBase + Math.max(relation.subject.end, relation.object.end);

    return [
      {
        subject: relation.subject.text,
        relation: relation.relation,
        object: relation.object.text,
        confidence: clamp01(relation.confidence),
        source: "provider" as const,
        evidenceSpan: {
          text: chunkText.slice(relation.subject.start, Math.max(relation.subject.end, relation.object.end)),
          start,
          end,
          chunkId,
          chunkIndex,
          sentenceIndex,
        },
      },
    ];
  });
}

function extractRuleEvents(
  sentence: LocalSentence,
  sentenceIndex: number,
  chunkId: string,
  chunkIndex: number,
  entities: readonly ExtractedEntity[],
  eventTriggers: ReadonlySet<string>,
): ExtractedEventFrame[] {
  const words = Array.from(sentence.text.matchAll(/\b[A-Za-z][\w-]*\b/gu));
  const events: ExtractedEventFrame[] = [];

  for (const word of words) {
    const token = word[0];
    const normalized = token.toLocaleLowerCase();

    if (!eventTriggers.has(normalized)) {
      continue;
    }

    const triggerStart = sentence.start + (word.index ?? 0);
    const triggerEnd = triggerStart + token.length;
    const nearby = entities.filter((entity) =>
      entity.start >= sentence.start && entity.end <= sentence.end,
    );
    const argumentsList = buildEventArguments(nearby, triggerStart);
    const time = TIME_PATTERN.exec(sentence.text)?.[0];
    TIME_PATTERN.lastIndex = 0;
    const confidence = clamp01(
      0.55 + Math.min(0.35, argumentsList.length * 0.1) + (time ? 0.08 : 0),
    );

    events.push({
      trigger: token,
      arguments: argumentsList,
      time,
      confidence,
      source: "rule",
      evidenceSpan: {
        text: sentence.text,
        start: sentence.start,
        end: sentence.end,
        chunkId,
        chunkIndex,
        sentenceIndex,
      },
    });

    if (triggerEnd >= sentence.end) {
      break;
    }
  }

  return events;
}

async function extractProviderEvents(
  provider: EventExtractionProvider,
  chunkText: string,
  chunkId: string,
  chunkIndex: number,
  entities: readonly ExtractedEntity[],
  sentences: readonly LocalSentence[],
): Promise<ExtractedEventFrame[]> {
  const events = await provider.extractEvents({
    text: chunkText,
    entities: [...entities],
  });
  const chunkBase = sentences[0]?.start ?? 0;

  return events.flatMap((event) => {
    const sentenceIndex = locateSentence(sentences, event.trigger.start);

    if (sentenceIndex < 0) {
      return [];
    }

    const sentence = sentences[sentenceIndex];
    const argumentsList = event.arguments.map((argument) => ({
      role: argument.role,
      value: argument.text,
      confidence: clamp01(argument.confidence),
    }));

    return [
      {
        trigger: event.trigger.text,
        arguments: argumentsList,
        time: event.time?.text,
        confidence: clamp01(event.confidence),
        source: "provider" as const,
        evidenceSpan: {
          text: sentence.text,
          start: chunkBase + event.trigger.start,
          end: chunkBase + event.trigger.end,
          chunkId,
          chunkIndex,
          sentenceIndex,
        },
      },
    ];
  });
}

function buildEventArguments(
  entities: readonly ExtractedEntity[],
  triggerStart: number,
): ExtractedEventArgument[] {
  if (entities.length === 0) {
    return [];
  }

  const sorted = [...entities].sort((left, right) => left.start - right.start);
  const before = sorted.filter((entity) => entity.end <= triggerStart);
  const after = sorted.filter((entity) => entity.start >= triggerStart);
  const args: ExtractedEventArgument[] = [];

  const actor = before.at(-1);

  if (actor) {
    args.push({
      role: "actor",
      value: actor.text,
      confidence: clamp01(actor.score),
    });
  }

  for (const target of after.slice(0, 3)) {
    args.push({
      role: args.length === 0 ? "target" : `target_${args.length}`,
      value: target.text,
      confidence: clamp01(target.score),
    });
  }

  return args;
}

function mergeRelations(
  relations: readonly ExtractedRelation[],
  relationSimilarityWindow: number,
): ExtractedRelation[] {
  const merged = new Map<
    string,
    ExtractedRelation & { totalConfidence: number; maxConfidence: number; count: number }
  >();

  for (const relation of relations) {
    const exactKey = relationMergeKey(relation);
    const key =
      findSimilarRelationKey(merged, relation, relationSimilarityWindow) ?? exactKey;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...relation,
        totalConfidence: relation.confidence,
        maxConfidence: relation.confidence,
        count: 1,
      });
      continue;
    }

    const isNearby =
      Math.abs(existing.evidenceSpan.start - relation.evidenceSpan.start) <= relationSimilarityWindow;

    existing.totalConfidence += relation.confidence;
    existing.maxConfidence = Math.max(existing.maxConfidence, relation.confidence);
    existing.count += 1;

    if (isNearby || relation.confidence > existing.confidence) {
      existing.evidenceSpan = relation.evidenceSpan;
      existing.source = relation.source;
    }
  }

  return Array.from(merged.values())
    .map((item) => ({
      ...item,
      confidence: clamp01(item.maxConfidence),
    }))
    .map(
      ({
        totalConfidence: _totalConfidence,
        maxConfidence: _maxConfidence,
        count: _count,
        ...relation
      }) => relation,
    )
    .sort(
      (left, right) =>
        right.confidence - left.confidence ||
        left.subject.localeCompare(right.subject) ||
        left.relation.localeCompare(right.relation) ||
        left.object.localeCompare(right.object),
    );
}

function relationMergeKey(relation: ExtractedRelation): string {
  return `${normalizeKey(relation.subject)}\u0000${normalizeKey(relation.relation)}\u0000${normalizeKey(relation.object)}`;
}

function findSimilarRelationKey(
  relations: ReadonlyMap<string, ExtractedRelation>,
  relation: ExtractedRelation,
  relationSimilarityWindow: number,
): string | undefined {
  for (const [key, existing] of relations) {
    if (
      normalizeKey(existing.subject) !== normalizeKey(relation.subject) ||
      normalizeKey(existing.relation) !== normalizeKey(relation.relation)
    ) {
      continue;
    }

    const objectSimilarity = hasNearObjectPrefix(existing.object, relation.object);
    const isNearby =
      Math.abs(existing.evidenceSpan.start - relation.evidenceSpan.start) <= relationSimilarityWindow;

    if (objectSimilarity && (isNearby || existing.object.length !== relation.object.length)) {
      return key;
    }
  }

  return undefined;
}

function hasNearObjectPrefix(left: string, right: string): boolean {
  const normalizedLeft = normalizeKey(left);
  const normalizedRight = normalizeKey(right);

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  const [shorter, longer] =
    normalizedLeft.length <= normalizedRight.length
      ? [normalizedLeft, normalizedRight]
      : [normalizedRight, normalizedLeft];

  return longer.startsWith(shorter) && longer.length - shorter.length <= 2;
}

function mergeEvents(events: readonly ExtractedEventFrame[]): ExtractedEventFrame[] {
  const merged = new Map<string, ExtractedEventFrame & { totalConfidence: number; count: number }>();

  for (const event of events) {
    const key = `${normalizeKey(event.trigger)}\u0000${event.time ?? ""}\u0000${event.arguments
      .map((argument) => `${argument.role}:${normalizeKey(argument.value)}`)
      .join("|")}`;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...event,
        totalConfidence: event.confidence,
        count: 1,
      });
      continue;
    }

    existing.totalConfidence += event.confidence;
    existing.count += 1;

    if (event.confidence >= existing.confidence) {
      existing.evidenceSpan = event.evidenceSpan;
      existing.source = event.source;
    }
  }

  return Array.from(merged.values())
    .map((item) => ({
      ...item,
      confidence: clamp01(item.totalConfidence / item.count),
    }))
    .map(({ totalConfidence: _totalConfidence, count: _count, ...event }) => event)
    .sort(
      (left, right) =>
        right.confidence - left.confidence ||
        left.trigger.localeCompare(right.trigger),
    );
}

interface LocalSentence {
  text: string;
  start: number;
  end: number;
}

function splitSentences(text: string, baseOffset: number): LocalSentence[] {
  const result: LocalSentence[] = [];
  const sentenceRegex = /[^.!?]+[.!?]?/gu;

  for (const match of text.matchAll(sentenceRegex)) {
    const sentenceText = (match[0] ?? "").trim();

    if (!sentenceText) {
      continue;
    }

    const localIndex = match.index ?? 0;
    const localStart = localIndex + (match[0]?.indexOf(sentenceText) ?? 0);

    result.push({
      text: sentenceText,
      start: baseOffset + localStart,
      end: baseOffset + localStart + sentenceText.length,
    });
  }

  if (result.length > 0) {
    return result;
  }

  return [
    {
      text,
      start: baseOffset,
      end: baseOffset + text.length,
    },
  ];
}

function locateEntitySpan(
  text: string,
  entityText: string,
  suggestedStart?: number,
  suggestedEnd?: number,
): { start: number; end: number } | null {
  if (suggestedStart !== undefined && suggestedEnd !== undefined) {
    return {
      start: suggestedStart,
      end: suggestedEnd,
    };
  }

  const index = text.toLocaleLowerCase().indexOf(entityText.toLocaleLowerCase());

  if (index < 0) {
    return null;
  }

  return {
    start: index,
    end: index + entityText.length,
  };
}

function locateSentence(sentences: readonly LocalSentence[], localOffset: number): number {
  const chunkBase = sentences[0]?.start ?? 0;

  for (const [index, sentence] of sentences.entries()) {
    const relativeStart = sentence.start - chunkBase;
    const relativeEnd = sentence.end - chunkBase;

    if (localOffset >= relativeStart && localOffset <= relativeEnd) {
      return index;
    }
  }

  return -1;
}

function findBestEntity(
  text: string,
  anchor: number,
  entities: readonly ExtractedEntity[],
): ExtractedEntity | undefined {
  const normalized = normalizeKey(text);
  const candidates = entities.filter((entity) => normalizeKey(entity.text) === normalized);

  if (candidates.length === 0) {
    return undefined;
  }

  return candidates.sort(
    (left, right) =>
      Math.abs(left.start - anchor) - Math.abs(right.start - anchor) || right.score - left.score,
  )[0];
}

function combineEntityConfidence(subject?: number, object?: number): number {
  const subjectScore = subject ?? 0.55;
  const objectScore = object ?? 0.55;

  return (subjectScore + objectScore) / 2;
}

function upsertGraphNode(target: Map<string, GraphNode>, node: GraphNode): void {
  const existing = target.get(node.id);

  if (!existing) {
    target.set(node.id, node);
    return;
  }

  existing.confidence = Math.max(existing.confidence, node.confidence);
}

function toEntityNodeId(label: string): string {
  return `entity:${normalizeKey(label)}`;
}

function normalizeKey(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/gu, " ");
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
