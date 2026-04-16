import type {
  SpeechTranscriber,
  SpeechTranscriptionRequest,
  SpeechTranscriptionResult,
} from "./transcript";
import { buildAudioFileName, normalizeProviderResponse } from "./provider-response";

export interface OpenAICompatibleTranscriberOptions {
  endpoint: string;
  model: string;
  apiKey?: string | (() => string | Promise<string> | undefined) | Promise<string | undefined>;
  headers?:
    | HeadersInit
    | (() => HeadersInit | Promise<HeadersInit | undefined> | undefined)
    | Promise<HeadersInit | undefined>;
  fetch?: typeof fetch;
  fileFieldName?: string;
  modelFieldName?: string;
  languageFieldName?: string;
  promptFieldName?: string;
  extraFields?:
    | Record<string, string | number | boolean | null | undefined>
    | ((
        request: SpeechTranscriptionRequest,
      ) =>
        | Record<string, string | number | boolean | null | undefined>
        | Promise<Record<string, string | number | boolean | null | undefined>>);
  mapResponse?: (
    payload: unknown,
    request: SpeechTranscriptionRequest,
  ) => SpeechTranscriptionResult;
}

export function createOpenAICompatibleTranscriber(
  options: OpenAICompatibleTranscriberOptions,
): SpeechTranscriber {
  const fetchImplementation = options.fetch ?? globalThis.fetch?.bind(globalThis);

  if (!fetchImplementation) {
    throw new Error("Fetch is not available. Provide options.fetch to create a transcriber.");
  }

  return {
    async transcribe(request) {
      const headers = new Headers(await resolveConfigValue(options.headers));
      const apiKey = await resolveConfigValue(options.apiKey);

      if (apiKey && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${apiKey}`);
      }

      const formData = new FormData();
      const fileFieldName = options.fileFieldName ?? "file";
      const modelFieldName = options.modelFieldName ?? "model";
      const languageFieldName = options.languageFieldName ?? "language";
      const promptFieldName = options.promptFieldName ?? "prompt";

      formData.append(fileFieldName, request.audio, buildAudioFileName(request));
      formData.append(modelFieldName, options.model);

      if (request.language) {
        formData.append(languageFieldName, request.language);
      }

      if (request.prompt) {
        formData.append(promptFieldName, request.prompt);
      }

      const extraFields =
        typeof options.extraFields === "function"
          ? await options.extraFields(request)
          : options.extraFields;

      for (const [key, value] of Object.entries(extraFields ?? {})) {
        if (value === null || value === undefined) {
          continue;
        }

        formData.append(key, `${value}`);
      }

      const response = await fetchImplementation(options.endpoint, {
        method: "POST",
        headers,
        body: formData,
        signal: request.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const statusText = errorText || response.statusText || "Unknown error";
        throw new Error(`Transcription request failed with ${response.status}: ${statusText}`);
      }

      const payload = (await response.json()) as unknown;

      if (options.mapResponse) {
        return options.mapResponse(payload, request);
      }

      return normalizeProviderResponse(payload, request);
    },
  };
}

async function resolveConfigValue<T>(
  value: T | Promise<T> | (() => T | Promise<T>) | undefined,
): Promise<T | undefined> {
  if (typeof value === "function") {
    return (value as () => T | Promise<T>)();
  }

  return value;
}
