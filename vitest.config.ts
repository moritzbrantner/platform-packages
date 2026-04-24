import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@moritzbrantner/any-to-any": path.resolve(rootDir, "packages/any-to-any/src/index.ts"),
      "@moritzbrantner/audio-classification": path.resolve(
        rootDir,
        "packages/audio-classification/src/index.ts",
      ),
      "@moritzbrantner/audio-text-to-text": path.resolve(
        rootDir,
        "packages/audio-text-to-text/src/index.ts",
      ),
      "@moritzbrantner/audio-to-audio": path.resolve(
        rootDir,
        "packages/audio-to-audio/src/index.ts",
      ),
      "@moritzbrantner/auth-contract": path.resolve(rootDir, "packages/auth-contract/src/index.ts"),
      "@moritzbrantner/automatic-speech-recognition": path.resolve(
        rootDir,
        "packages/automatic-speech-recognition/src/index.ts",
      ),
      "@moritzbrantner/card-games": path.resolve(rootDir, "packages/card-games/src/index.ts"),
      "@moritzbrantner/charts": path.resolve(rootDir, "packages/charts/src/index.ts"),
      "@moritzbrantner/collaboration": path.resolve(rootDir, "packages/collaboration/src/index.ts"),
      "@moritzbrantner/data-density": path.resolve(rootDir, "packages/data-density/src/index.ts"),
      "@moritzbrantner/depth-estimation": path.resolve(
        rootDir,
        "packages/depth-estimation/src/index.ts",
      ),
      "@moritzbrantner/document-analysis": path.resolve(
        rootDir,
        "packages/document-analysis/src/index.ts",
      ),
      "@moritzbrantner/document-question-answering": path.resolve(
        rootDir,
        "packages/document-question-answering/src/index.ts",
      ),
      "@moritzbrantner/document-structure-extraction": path.resolve(
        rootDir,
        "packages/document-structure-extraction/src/index.ts",
      ),
      "@moritzbrantner/extraction-schema": path.resolve(
        rootDir,
        "packages/extraction-schema/src/index.ts",
      ),
      "@moritzbrantner/feature-extraction": path.resolve(
        rootDir,
        "packages/feature-extraction/src/index.ts",
      ),
      "@moritzbrantner/fill-mask": path.resolve(rootDir, "packages/fill-mask/src/index.ts"),
      "@moritzbrantner/flat-design": path.resolve(rootDir, "packages/flat-design/src/index.ts"),
      "@moritzbrantner/flat-design/core": path.resolve(
        rootDir,
        "packages/flat-design/src/core.ts",
      ),
      "@moritzbrantner/flat-design/react": path.resolve(
        rootDir,
        "packages/flat-design/src/react.tsx",
      ),
      "@moritzbrantner/foundation-contract": path.resolve(
        rootDir,
        "packages/foundation-contract/src/index.ts",
      ),
      "@moritzbrantner/graphs": path.resolve(rootDir, "packages/graphs/src/index.ts"),
      "@moritzbrantner/hexagon-grids": path.resolve(rootDir, "packages/hexagon-grids/src/index.ts"),
      "@moritzbrantner/huggingface-universal": path.resolve(
        rootDir,
        "packages/huggingface-universal/src/index.ts",
      ),
      "@moritzbrantner/image-classification": path.resolve(
        rootDir,
        "packages/image-classification/src/index.ts",
      ),
      "@moritzbrantner/image-feature-extraction": path.resolve(
        rootDir,
        "packages/image-feature-extraction/src/index.ts",
      ),
      "@moritzbrantner/image-segmentation": path.resolve(
        rootDir,
        "packages/image-segmentation/src/index.ts",
      ),
      "@moritzbrantner/image-text-to-image": path.resolve(
        rootDir,
        "packages/image-text-to-image/src/index.ts",
      ),
      "@moritzbrantner/image-text-to-text": path.resolve(
        rootDir,
        "packages/image-text-to-text/src/index.ts",
      ),
      "@moritzbrantner/image-text-to-video": path.resolve(
        rootDir,
        "packages/image-text-to-video/src/index.ts",
      ),
      "@moritzbrantner/image-to-3d": path.resolve(rootDir, "packages/image-to-3d/src/index.ts"),
      "@moritzbrantner/image-to-image": path.resolve(
        rootDir,
        "packages/image-to-image/src/index.ts",
      ),
      "@moritzbrantner/image-to-text": path.resolve(rootDir, "packages/image-to-text/src/index.ts"),
      "@moritzbrantner/image-to-video": path.resolve(
        rootDir,
        "packages/image-to-video/src/index.ts",
      ),
      "@moritzbrantner/information-extraction": path.resolve(
        rootDir,
        "packages/information-extraction/src/index.ts",
      ),
      "@moritzbrantner/keyboard": path.resolve(rootDir, "packages/keyboard/src/index.ts"),
      "@moritzbrantner/keypoint-detection": path.resolve(
        rootDir,
        "packages/keypoint-detection/src/index.ts",
      ),
      "@moritzbrantner/linguistics-core": path.resolve(
        rootDir,
        "packages/linguistics-core/src/index.ts",
      ),
      "@moritzbrantner/linguistics-corpus": path.resolve(
        rootDir,
        "packages/linguistics-corpus/src/index.ts",
      ),
      "@moritzbrantner/linguistics-learning": path.resolve(
        rootDir,
        "packages/linguistics-learning/src/index.ts",
      ),
      "@moritzbrantner/maps": path.resolve(rootDir, "packages/maps/src/index.ts"),
      "@moritzbrantner/mask-generation": path.resolve(
        rootDir,
        "packages/mask-generation/src/index.ts",
      ),
      "@moritzbrantner/media-editor": path.resolve(rootDir, "packages/media-editor/src/index.ts"),
      "@moritzbrantner/media-editor/core": path.resolve(
        rootDir,
        "packages/media-editor/src/core.ts",
      ),
      "@moritzbrantner/media-editor/react": path.resolve(
        rootDir,
        "packages/media-editor/src/react.tsx",
      ),
      "@moritzbrantner/object-detection": path.resolve(
        rootDir,
        "packages/object-detection/src/index.ts",
      ),
      "@moritzbrantner/ocr": path.resolve(rootDir, "packages/ocr/src/index.ts"),
      "@moritzbrantner/parallel-text": path.resolve(rootDir, "packages/parallel-text/src/index.ts"),
      "@moritzbrantner/parallel-text/model": path.resolve(
        rootDir,
        "packages/parallel-text/src/model.ts",
      ),
      "@moritzbrantner/pipeline-core": path.resolve(rootDir, "packages/pipeline-core/src/index.ts"),
      "@moritzbrantner/question-answering": path.resolve(
        rootDir,
        "packages/question-answering/src/index.ts",
      ),
      "@moritzbrantner/reinforcement-learning": path.resolve(
        rootDir,
        "packages/reinforcement-learning/src/index.ts",
      ),
      "@moritzbrantner/sentence-similarity": path.resolve(
        rootDir,
        "packages/sentence-similarity/src/index.ts",
      ),
      "@moritzbrantner/sentiment-analysis": path.resolve(
        rootDir,
        "packages/sentiment-analysis/src/index.ts",
      ),
      "@moritzbrantner/source-ingestion": path.resolve(
        rootDir,
        "packages/source-ingestion/src/index.ts",
      ),
      "@moritzbrantner/speech": path.resolve(rootDir, "packages/speech/src/index.ts"),
      "@moritzbrantner/speech/core": path.resolve(rootDir, "packages/speech/src/core.ts"),
      "@moritzbrantner/speech/react": path.resolve(rootDir, "packages/speech/src/react.ts"),
      "@moritzbrantner/speed-reading": path.resolve(rootDir, "packages/speed-reading/src/index.ts"),
      "@moritzbrantner/speed-reading/core": path.resolve(
        rootDir,
        "packages/speed-reading/src/core.ts",
      ),
      "@moritzbrantner/storytelling": path.resolve(rootDir, "packages/storytelling/src/index.ts"),
      "@moritzbrantner/subtitles": path.resolve(rootDir, "packages/subtitles/src/index.ts"),
      "@moritzbrantner/summarization": path.resolve(rootDir, "packages/summarization/src/index.ts"),
      "@moritzbrantner/syntax-analysis": path.resolve(
        rootDir,
        "packages/syntax-analysis/src/index.ts",
      ),
      "@moritzbrantner/table-question-answering": path.resolve(
        rootDir,
        "packages/table-question-answering/src/index.ts",
      ),
      "@moritzbrantner/tables": path.resolve(rootDir, "packages/tables/src/index.ts"),
      "@moritzbrantner/tabular-classification": path.resolve(
        rootDir,
        "packages/tabular-classification/src/index.ts",
      ),
      "@moritzbrantner/tabular-regression": path.resolve(
        rootDir,
        "packages/tabular-regression/src/index.ts",
      ),
      "@moritzbrantner/text-analysis": path.resolve(rootDir, "packages/text-analysis/src/index.ts"),
      "@moritzbrantner/text-classification": path.resolve(
        rootDir,
        "packages/text-classification/src/index.ts",
      ),
      "@moritzbrantner/text-generation": path.resolve(
        rootDir,
        "packages/text-generation/src/index.ts",
      ),
      "@moritzbrantner/text-inference": path.resolve(
        rootDir,
        "packages/text-inference/src/index.ts",
      ),
      "@moritzbrantner/text-ranking": path.resolve(rootDir, "packages/text-ranking/src/index.ts"),
      "@moritzbrantner/text-summarization": path.resolve(
        rootDir,
        "packages/text-summarization/src/index.ts",
      ),
      "@moritzbrantner/text-to-3d": path.resolve(rootDir, "packages/text-to-3d/src/index.ts"),
      "@moritzbrantner/text-to-image": path.resolve(rootDir, "packages/text-to-image/src/index.ts"),
      "@moritzbrantner/text-to-speech": path.resolve(
        rootDir,
        "packages/text-to-speech/src/index.ts",
      ),
      "@moritzbrantner/text-to-video": path.resolve(rootDir, "packages/text-to-video/src/index.ts"),
      "@moritzbrantner/token-classification": path.resolve(
        rootDir,
        "packages/token-classification/src/index.ts",
      ),
      "@moritzbrantner/translation": path.resolve(rootDir, "packages/translation/src/index.ts"),
      "@moritzbrantner/tree-structures": path.resolve(
        rootDir,
        "packages/tree-structures/src/index.ts",
      ),
      "@moritzbrantner/ui": path.resolve(rootDir, "packages/ui/src/index.ts"),
      "@moritzbrantner/unconditional-image-generation": path.resolve(
        rootDir,
        "packages/unconditional-image-generation/src/index.ts",
      ),
      "@moritzbrantner/upload-playbook": path.resolve(
        rootDir,
        "packages/upload-playbook/src/index.ts",
      ),
      "@moritzbrantner/video-classification": path.resolve(
        rootDir,
        "packages/video-classification/src/index.ts",
      ),
      "@moritzbrantner/video-text-to-text": path.resolve(
        rootDir,
        "packages/video-text-to-text/src/index.ts",
      ),
      "@moritzbrantner/video-to-video": path.resolve(
        rootDir,
        "packages/video-to-video/src/index.ts",
      ),
      "@moritzbrantner/visual-document-retrieval": path.resolve(
        rootDir,
        "packages/visual-document-retrieval/src/index.ts",
      ),
      "@moritzbrantner/visual-question-answering": path.resolve(
        rootDir,
        "packages/visual-question-answering/src/index.ts",
      ),
      "@moritzbrantner/word-prediction": path.resolve(
        rootDir,
        "packages/word-prediction/src/index.ts",
      ),
      "@moritzbrantner/word-prediction/core": path.resolve(
        rootDir,
        "packages/word-prediction/src/core.ts",
      ),
      "@moritzbrantner/word-prediction/react": path.resolve(
        rootDir,
        "packages/word-prediction/src/react.ts",
      ),
      "@moritzbrantner/word-vectors": path.resolve(rootDir, "packages/word-vectors/src/index.ts"),
      "@moritzbrantner/word-vectors/documents": path.resolve(
        rootDir,
        "packages/word-vectors/src/documents.ts",
      ),
      "@moritzbrantner/zero-shot-classification": path.resolve(
        rootDir,
        "packages/zero-shot-classification/src/index.ts",
      ),
      "@moritzbrantner/zero-shot-image-classification": path.resolve(
        rootDir,
        "packages/zero-shot-image-classification/src/index.ts",
      ),
      "@moritzbrantner/zero-shot-object-detection": path.resolve(
        rootDir,
        "packages/zero-shot-object-detection/src/index.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/*/tests/**/*.test.ts", "packages/*/tests/**/*.test.tsx"],
  },
});
