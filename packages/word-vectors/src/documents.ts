import type { TextDocument } from "@moritzbrantner/linguistics-core";

import {
  createWordVectorModel,
  type CreateWordVectorModelOptions,
  type WordVectorModel,
} from "./index";

export function trainFromDocuments(
  documents: readonly TextDocument[],
  options: Omit<CreateWordVectorModelOptions, "texts"> = {},
): WordVectorModel {
  return createWordVectorModel({
    ...options,
    texts: documents.map((document) => document.text),
  });
}
