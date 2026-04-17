import {
  createWordVectorBackoffSource,
  createWordVectorModel,
  type CreateWordVectorModelOptions,
  type WordVectorModel,
} from "@moritzbrantner/word-vectors";

import type { SemanticBackoffSource } from "./model";

export function createSemanticBackoffFromWordVectors(
  model: WordVectorModel,
): SemanticBackoffSource {
  return createWordVectorBackoffSource(model);
}

export function createSemanticBackoffFromTexts(
  texts: CreateWordVectorModelOptions["texts"],
  options: Omit<CreateWordVectorModelOptions, "texts"> = {},
): SemanticBackoffSource {
  return createSemanticBackoffFromWordVectors(
    createWordVectorModel({
      ...options,
      texts,
    }),
  );
}
