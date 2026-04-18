import {
  createTextDocument,
  segmentTextDocument,
  type TextDocument,
} from "@moritzbrantner/linguistics-core";
import {
  extractDocumentStructure,
  type CreateStructureExtractorOptions,
  type DocumentStructureResult,
} from "@moritzbrantner/document-structure-extraction";
import { ocrToTextDocument, type OcrDocument } from "@moritzbrantner/ocr";
import type { QuestionAnswer, QuestionAnsweringPipeline } from "@moritzbrantner/question-answering";
import type {
  SentimentAnalysisPipeline,
  SentimentAnalysisResult,
} from "@moritzbrantner/sentiment-analysis";
import type {
  SyntaxAnalysisResult,
  SyntaxDocumentSummary,
  SyntaxPipeline,
} from "@moritzbrantner/syntax-analysis";
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
  summary?: TextSummaryResult;
  sentiment?: SentimentAnalysisResult;
  analysis?: TextAnalysisResult<Metadata>;
  syntax?: SyntaxAnalysisResult<Metadata>;
  syntaxSummary?: SyntaxDocumentSummary;
  structure?: DocumentStructureResult;
  answers: Array<{ question: string; answer: QuestionAnswer | null }>;
}

export interface DocumentStructureHook {
  extract(document: OcrDocument): Promise<DocumentStructureResult>;
}

export interface CreateDocumentAnalysisPipelineOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  questionAnswering?: QuestionAnsweringPipeline<Metadata>;
  textAnalysis?: TextAnalysisPipeline<Metadata>;
  syntaxAnalysis?: SyntaxPipeline<Metadata>;
  sentimentAnalysis?: SentimentAnalysisPipeline<Metadata>;
  summarization?: TextSummarizationPipeline<Metadata>;
  defaultQuestions?: string[];
  structureExtraction?:
    | DocumentStructureHook
    | {
        extractorOptions?: CreateStructureExtractorOptions;
      };
}

export interface AnalyzeDocumentOptions {
  questions?: string[];
  includeSummary?: boolean;
  includeSentiment?: boolean;
  includeTextAnalysis?: boolean;
  includeSyntax?: boolean;
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

      const [summary, sentiment, analysis, syntax, answers, structure] = await Promise.all([
        analysisOptions.includeSummary !== false && options.summarization
          ? options.summarization.summarize(normalized.document)
          : Promise.resolve(undefined),
        analysisOptions.includeSentiment !== false && options.sentimentAnalysis
          ? options.sentimentAnalysis.analyze(normalized.document)
          : Promise.resolve(undefined),
        analysisOptions.includeTextAnalysis !== false && options.textAnalysis
          ? options.textAnalysis.analyze(normalized.document)
          : Promise.resolve(undefined),
        analysisOptions.includeSyntax !== false && options.syntaxAnalysis
          ? options.syntaxAnalysis.analyzeSyntax(normalized.document)
          : Promise.resolve(undefined),
        options.questionAnswering
          ? Promise.all(
              questions.map(async (question) => ({
                question,
                answer: await options.questionAnswering!.findBestAnswer(question, normalized.document),
              })),
            )
          : Promise.resolve([]),
        analysisOptions.includeStructure !== false && normalized.ocrDocument
          ? extractStructure(normalized.ocrDocument, options.structureExtraction)
          : Promise.resolve(undefined),
      ]);

      return {
        sourceType: normalized.sourceType,
        document: normalized.document,
        summary,
        sentiment,
        analysis,
        syntax,
        syntaxSummary: syntax?.summary,
        structure,
        answers,
      };
    },
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
      document: ocrToTextDocument(input, {
        granularity: "word",
      }) as TextDocument<Metadata>,
      ocrDocument: input,
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

async function extractStructure(
  ocrDocument: OcrDocument,
  hook: CreateDocumentAnalysisPipelineOptions["structureExtraction"],
): Promise<DocumentStructureResult> {
  if (hook && "extract" in hook && typeof hook.extract === "function") {
    return hook.extract(ocrDocument);
  }

  const extractorOptions = hook && "extractorOptions" in hook ? hook.extractorOptions : undefined;
  return extractDocumentStructure(ocrDocument, extractorOptions);
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
