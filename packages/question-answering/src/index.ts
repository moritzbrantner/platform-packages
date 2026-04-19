import type { TextDocument } from "@moritzbrantner/linguistics-core";
import {
  createHuggingFaceTaskPackage,
  createUniversalTaskPipeline,
  getHuggingFaceTaskDescriptor,
  type CreateUniversalTaskPipelineOptions,
  type UniversalTaskPipeline,
} from "@moritzbrantner/huggingface-universal";
import {
  chunkTextForInference,
  type ChunkTextOptions,
  type HuggingFaceModelReference,
  type QuestionAnsweringProvider,
  type TextInferenceInput,
} from "@moritzbrantner/text-inference";

const DEFAULT_MAX_ANSWERS = 3;
const DEFAULT_MIN_SCORE = 0;

export const huggingFaceTaskDescriptor = getHuggingFaceTaskDescriptor("question-answering");
export const huggingFaceTask = createHuggingFaceTaskPackage("question-answering");
export const createModelReference = huggingFaceTask.createModelReference;

export type QuestionAnsweringUniversalPipeline<Input = unknown, Output = unknown> =
  UniversalTaskPipeline<"question-answering", Input, Output>;

export type CreateQuestionAnsweringUniversalPipelineOptions = Omit<
  CreateUniversalTaskPipelineOptions<"question-answering">,
  "descriptor"
>;

export interface QuestionAnswer {
  question: string;
  answer: string;
  score: number;
  start?: number;
  end?: number;
  chunkId: string;
  chunkIndex: number;
  context: string;
}

export interface AnswerQuestionOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  limit?: number;
  minScore?: number;
  chunking?: ChunkTextOptions<Metadata>;
}

export interface CreateQuestionAnsweringPipelineOptions<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  provider: QuestionAnsweringProvider;
  model: HuggingFaceModelReference<"question-answering">;
  chunking?: ChunkTextOptions<Metadata>;
  defaultLimit?: number;
  minimumScore?: number;
}

export interface QuestionAnsweringPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> {
  answer(
    question: string,
    context: TextInferenceInput<Metadata>,
    options?: AnswerQuestionOptions<Metadata>,
  ): Promise<QuestionAnswer[]>;
  answerMany(
    questions: Iterable<string>,
    context: TextInferenceInput<Metadata>,
    options?: AnswerQuestionOptions<Metadata>,
  ): Promise<Record<string, QuestionAnswer[]>>;
  findBestAnswer(
    question: string,
    context: TextInferenceInput<Metadata>,
    options?: AnswerQuestionOptions<Metadata>,
  ): Promise<QuestionAnswer | null>;
  answerDocument(
    question: string,
    document: TextDocument<Metadata>,
    options?: AnswerQuestionOptions<Metadata>,
  ): Promise<QuestionAnswer[]>;
}

export function createQuestionAnsweringPipeline<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreateQuestionAnsweringPipelineOptions<Metadata>,
): QuestionAnsweringPipeline<Metadata> {
  return {
    async answer(question, context, answerOptions = {}) {
      const limit = clampLimit(answerOptions.limit ?? options.defaultLimit ?? DEFAULT_MAX_ANSWERS);
      const minScore = answerOptions.minScore ?? options.minimumScore ?? DEFAULT_MIN_SCORE;
      const chunking = answerOptions.chunking ?? options.chunking;
      const chunks = chunkTextForInference(context, chunking);
      const answers = await Promise.all(
        chunks.map(async (chunk): Promise<QuestionAnswer | null> => {
          const result = await options.provider.answerQuestion({
            model: options.model,
            question,
            context: chunk.text,
          });

          if (!result.answer.trim() || result.score < minScore) {
            return null;
          }

          const answer: QuestionAnswer = {
            question,
            answer: result.answer,
            score: result.score,
            chunkId: chunk.id,
            chunkIndex: chunk.index,
            context: chunk.text,
          };

          if (result.start !== undefined) {
            answer.start = result.start;
          }

          if (result.end !== undefined) {
            answer.end = result.end;
          }

          return answer;
        }),
      );

      return dedupeAnswers(answers.filter((answer): answer is QuestionAnswer => answer !== null)).slice(0, limit);
    },
    async answerMany(questions, context, answerOptions) {
      const entries = await Promise.all(
        Array.from(questions, async (question) => [question, await this.answer(question, context, answerOptions)]),
      );

      return Object.fromEntries(entries);
    },
    async findBestAnswer(question, context, answerOptions) {
      const answers = await this.answer(question, context, {
        ...answerOptions,
        limit: 1,
      });

      return answers[0] ?? null;
    },
    answerDocument(question, document, answerOptions) {
      return this.answer(question, document, answerOptions);
    },
  };
}

export function createQuestionAnsweringUniversalPipeline<Input = unknown, Output = unknown>(
  options: CreateQuestionAnsweringUniversalPipelineOptions,
): QuestionAnsweringUniversalPipeline<Input, Output> {
  return createUniversalTaskPipeline({
    ...options,
    descriptor: huggingFaceTaskDescriptor,
  });
}

function dedupeAnswers(answers: readonly QuestionAnswer[]): QuestionAnswer[] {
  const seen = new Set<string>();

  return [...answers]
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.chunkIndex - right.chunkIndex ||
        left.answer.localeCompare(right.answer),
    )
    .filter((answer) => {
      const key = normalizeAnswerKey(answer.answer);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function normalizeAnswerKey(answer: string): string {
  return answer.trim().toLocaleLowerCase();
}

function clampLimit(limit: number): number {
  return Math.max(1, Math.floor(limit));
}
