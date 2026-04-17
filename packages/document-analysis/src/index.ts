import {
  createTextDocument,
  segmentTextDocument,
  type TextDocument,
} from "@moritzbrantner/linguistics-core";
import {
  extractDocumentStructure,
  runStructureIntegrationHooks,
  type DocumentStructureIntegrationHook,
  type StructuredDocument,
} from "@moritzbrantner/document-structure-extraction";
import { ocrToTextDocument, type OcrDocument } from "@moritzbrantner/ocr";
import type { QuestionAnswer, QuestionAnsweringPipeline } from "@moritzbrantner/question-answering";
import type {
  SentimentAnalysisPipeline,
  SentimentAnalysisResult,
} from "@moritzbrantner/sentiment-analysis";
import type { TextAnalysisPipeline, TextAnalysisResult } from "@moritzbrantner/text-analysis";
import type {
  TextSummarizationPipeline,
  TextSummaryResult,
} from "@moritzbrantner/text-summarization";

export type DocumentAnalysisInput<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> = OcrDocument | string | TextDocument<Metadata>;

export interface DocumentAnalysisReport<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  sourceType: "ocr" | "text";
  document: TextDocument<Metadata>;
  structured?: StructuredDocument;
  structureFindings: string[];
  structureMetadata?: Record<string, unknown>;
  summary?: TextSummaryResult;
  sentiment?: SentimentAnalysisResult;
  analysis?: TextAnalysisResult<Metadata>;
  answers: Array<{ question: string; answer: QuestionAnswer | null }>;
}

export interface CreateDocumentAnalysisPipelineOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  questionAnswering?: QuestionAnsweringPipeline<Metadata>;
  textAnalysis?: TextAnalysisPipeline<Metadata>;
  sentimentAnalysis?: SentimentAnalysisPipeline<Metadata>;
  summarization?: TextSummarizationPipeline<Metadata>;
  structureHooks?: DocumentStructureIntegrationHook[];
  defaultQuestions?: string[];
}

export interface AnalyzeDocumentOptions {
  questions?: string[];
  includeSummary?: boolean;
  includeSentiment?: boolean;
  includeTextAnalysis?: boolean;
  includeStructure?: boolean;
}

export interface DocumentAnalysisPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  analyze(
    input: DocumentAnalysisInput<Metadata>,
    options?: AnalyzeDocumentOptions,
  ): Promise<DocumentAnalysisReport<Metadata>>;
}

export function createDocumentAnalysisPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreateDocumentAnalysisPipelineOptions<Metadata>,
): DocumentAnalysisPipeline<Metadata> {
  return {
    async analyze(input, analysisOptions = {}) {
      const normalized = normalizeDocumentInput(input);
      const questions = analysisOptions.questions ?? options.defaultQuestions ?? [];
      const includeStructure =
        analysisOptions.includeStructure !== false &&
        normalized.sourceType === "ocr" &&
        normalized.ocrDocument;

      const structurePromise = includeStructure
        ? buildStructuredFindings(
            normalized.ocrDocument,
            options.structureHooks,
          )
        : Promise.resolve(undefined);

      const [structure, summary, sentiment, analysis, answers] = await Promise.all([
        structurePromise,
        analysisOptions.includeSummary !== false && options.summarization
          ? options.summarization.summarize(normalized.document)
          : Promise.resolve(undefined),
        analysisOptions.includeSentiment !== false && options.sentimentAnalysis
          ? options.sentimentAnalysis.analyze(normalized.document)
          : Promise.resolve(undefined),
        analysisOptions.includeTextAnalysis !== false && options.textAnalysis
          ? options.textAnalysis.analyze(normalized.document)
          : Promise.resolve(undefined),
        options.questionAnswering
          ? Promise.all(
              questions.map(async (question) => ({
                question,
                answer: await options.questionAnswering!.findBestAnswer(question, normalized.document),
              })),
            )
          : Promise.resolve([]),
      ]);

      return {
        sourceType: normalized.sourceType,
        document: normalized.document,
        structured: structure?.structured,
        structureFindings: structure?.findings ?? [],
        structureMetadata: structure?.metadata,
        summary,
        sentiment,
        analysis,
        answers,
      };
    },
  };
}

async function buildStructuredFindings(
  document: OcrDocument,
  hooks: DocumentStructureIntegrationHook[] | undefined,
): Promise<{
  structured: StructuredDocument;
  findings: string[];
  metadata: Record<string, unknown>;
}> {
  const structured = extractDocumentStructure(document);
  const integration = await runStructureIntegrationHooks(document, structured, hooks);

  return {
    structured,
    findings: integration.findings,
    metadata: integration.metadata,
  };
}

function normalizeDocumentInput<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  input: DocumentAnalysisInput<Metadata>,
): {
  sourceType: "ocr" | "text";
  document: TextDocument<Metadata>;
  ocrDocument?: OcrDocument;
} {
  if (isOcrDocument(input)) {
    return {
      sourceType: "ocr",
      ocrDocument: input,
      document: ocrToTextDocument(input, {
        granularity: "word",
      }) as TextDocument<Metadata>,
    };
  }

  if (typeof input === "string") {
    return {
      sourceType: "text",
      document: segmentTextDocument(
        createTextDocument({
          id: "document",
          text: input,
        }),
        { granularity: "word" },
      ) as TextDocument<Metadata>,
    };
  }

  return {
    sourceType: "text",
    document: input,
  };
}

function isOcrDocument(value: unknown): value is OcrDocument {
  return Boolean(
    value &&
      typeof value === "object" &&
      "pages" in value &&
      Array.isArray((value as OcrDocument).pages) &&
      "sourceType" in value,
  );
}
