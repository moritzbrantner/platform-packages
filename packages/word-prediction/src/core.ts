export { DEFAULT_WORD_PREDICTION_TEXTS } from "./default-data";
export {
  createDefaultWordPredictionModel,
  createWordPredictionModel,
  deserializeWordPredictionModel,
  initWordPredictionKernel,
  isWordPredictionKernelReady,
  serializeWordPredictionModel,
  trainWordPredictionModel,
  type CreateWordPredictionModelOptions,
  type PredictCompletionOptions,
  type PredictWordOptions,
  type SemanticBackoffCandidate,
  type SemanticBackoffSource,
  type SerializableWordPredictionModel,
  type WordCompletion,
  type WordPrediction,
  type WordPredictionModel,
} from "./model";
