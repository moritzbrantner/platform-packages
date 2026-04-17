"use client";

import { useId, useState } from "react";
import type { CSSProperties, HTMLAttributes, KeyboardEvent, TextareaHTMLAttributes } from "react";

import { Button } from "@moritzbrantner/ui";

import type { PredictWordOptions, WordPrediction, WordPredictionModel } from "./model";

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const TRAILING_WORD_PATTERN = /([\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*)$/u;
const DEFAULT_LIMIT = 5;

export interface WordPredictionComposerMessage {
  id: string;
  text: string;
  role?: "incoming" | "outgoing";
  author?: string;
}

export interface WordPredictionComposerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange" | "onSubmit"> {
  model: WordPredictionModel;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  messages?: WordPredictionComposerMessage[];
  limit?: number;
  predictionOptions?: Omit<PredictWordOptions, "limit">;
  placeholder?: string;
  composeLabel?: string;
  suggestionsLabel?: string;
  submitLabel?: string;
  emptySuggestionsText?: string;
  initialShowScore?: boolean;
  initialShowContext?: boolean;
  textareaProps?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "defaultValue" | "onChange">;
}

export function WordPredictionComposer({
  model,
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  messages = [],
  limit = DEFAULT_LIMIT,
  predictionOptions,
  placeholder = "Type your message",
  composeLabel = "Compose message",
  suggestionsLabel = "Suggestions",
  submitLabel = "Send",
  emptySuggestionsText = "No suggestions yet. Add more examples or type a longer prefix.",
  initialShowScore = false,
  initialShowContext = false,
  textareaProps,
  className,
  style,
  ...divProps
}: WordPredictionComposerProps) {
  const composerId = useId();
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [showScore, setShowScore] = useState(initialShowScore);
  const [showContext, setShowContext] = useState(initialShowContext);
  const currentValue = isControlled ? value : uncontrolledValue;
  const suggestions = model.predictForInput(currentValue, {
    ...predictionOptions,
    limit,
  });

  function updateValue(nextValue: string) {
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function acceptPrediction(word: string) {
    updateValue(applyPrediction(currentValue, word));
  }

  function submitDraft() {
    const trimmed = currentValue.trim();

    if (!trimmed) {
      return;
    }

    onSubmit?.(trimmed);
    updateValue("");
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
      const index = Number.parseInt(event.key, 10);

      if (Number.isInteger(index) && index >= 1 && index <= Math.min(9, suggestions.length)) {
        event.preventDefault();
        acceptPrediction(suggestions[index - 1]!.word);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey && onSubmit) {
      event.preventDefault();
      submitDraft();
    }

    textareaProps?.onKeyDown?.(event);
  }

  return (
    <div
      {...divProps}
      className={className}
      style={{
        ...styles.container,
        ...style,
      }}
    >
      <section aria-label="Conversation" style={styles.thread}>
        {messages.length > 0 ? (
          messages.map((message) => {
            const isOutgoing = message.role === "outgoing";

            return (
              <article
                key={message.id}
                style={{
                  ...styles.messageRow,
                  ...(isOutgoing ? styles.messageRowOutgoing : null),
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(isOutgoing ? styles.messageBubbleOutgoing : null),
                  }}
                >
                  <p style={styles.messageAuthor}>
                    {message.author ?? (isOutgoing ? "You" : "Assistant")}
                  </p>
                  <p style={styles.messageText}>{message.text}</p>
                </div>
              </article>
            );
          })
        ) : (
          <div style={styles.emptyThread}>
            <p style={styles.emptyThreadTitle}>Conversation preview</p>
            <p style={styles.emptyThreadText}>
              Add messages or start typing to use the composer as a chat-style input.
            </p>
          </div>
        )}

        {currentValue.trim() ? (
          <article style={{ ...styles.messageRow, ...styles.messageRowOutgoing }}>
            <div style={{ ...styles.messageBubble, ...styles.messageBubbleOutgoing, ...styles.draftBubble }}>
              <p style={styles.messageAuthor}>Draft</p>
              <p style={styles.messageText}>{currentValue}</p>
            </div>
          </article>
        ) : null}
      </section>

      <section style={styles.composer}>
        <div style={styles.suggestionHeader}>
          <div>
            <p style={styles.sectionLabel}>{suggestionsLabel}</p>
            <p style={styles.shortcutHint}>Use Ctrl+1-9. Cmd+1-9 also works on macOS.</p>
          </div>
          <div style={styles.toggleRow}>
            <Button
              type="button"
              aria-pressed={showScore}
              onClick={() => setShowScore((current) => !current)}
              style={{
                ...styles.toggleButton,
                ...(showScore ? styles.toggleButtonActive : null),
              }}
            >
              Show score
            </Button>
            <Button
              type="button"
              aria-pressed={showContext}
              onClick={() => setShowContext((current) => !current)}
              style={{
                ...styles.toggleButton,
                ...(showContext ? styles.toggleButtonActive : null),
              }}
            >
              Show context
            </Button>
          </div>
        </div>

        {suggestions.length > 0 ? (
          <div style={styles.suggestionList}>
            {suggestions.map((prediction, index) => (
              <SuggestionButton
                key={`${prediction.word}-${prediction.contextSize}-${index}`}
                index={index}
                input={currentValue}
                prediction={prediction}
                showContext={showContext}
                showScore={showScore}
                onSelect={acceptPrediction}
              />
            ))}
          </div>
        ) : (
          <p style={styles.emptySuggestions}>{emptySuggestionsText}</p>
        )}

        <label htmlFor={composerId} style={styles.sectionLabel}>
          {composeLabel}
        </label>
        <div style={styles.inputRow}>
          <textarea
            {...textareaProps}
            id={composerId}
            value={currentValue}
            onChange={(event) => updateValue(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={placeholder}
            rows={textareaProps?.rows ?? 4}
            style={{
              ...styles.textarea,
              ...textareaProps?.style,
            }}
          />
          {onSubmit ? (
            <Button type="button" onClick={submitDraft} style={styles.submitButton}>
              {submitLabel}
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SuggestionButton({
  index,
  input,
  prediction,
  showScore,
  showContext,
  onSelect,
}: {
  index: number;
  input: string;
  prediction: WordPrediction;
  showScore: boolean;
  showContext: boolean;
  onSelect: (word: string) => void;
}) {
  const shortcut = index < 9 ? `Ctrl+${index + 1}` : null;
  const contextLabel = describePredictionContext(input, prediction.contextSize);

  return (
    <Button
      type="button"
      data-word-prediction-suggestion="true"
      onClick={() => onSelect(prediction.word)}
      style={styles.suggestionButton}
    >
      <div style={styles.suggestionTopRow}>
        <span style={styles.suggestionWord}>{prediction.word}</span>
        {shortcut ? <span style={styles.shortcutBadge}>{shortcut}</span> : null}
      </div>
      {showScore || showContext ? (
        <div style={styles.suggestionMeta}>
          {showScore ? <span>{`Score ${prediction.score.toFixed(3)}`}</span> : null}
          {showContext ? <span>{`Context ${contextLabel}`}</span> : null}
        </div>
      ) : null}
    </Button>
  );
}

function applyPrediction(input: string, word: string): string {
  const trailingWord = input.match(TRAILING_WORD_PATTERN)?.[1];

  if (!trailingWord || /\s$/u.test(input)) {
    if (!input) {
      return `${word} `;
    }

    return `${input}${/\s$/u.test(input) ? "" : " "}${word} `;
  }

  return `${input.slice(0, input.length - trailingWord.length)}${word} `;
}

function describePredictionContext(input: string, contextSize: number): string {
  if (contextSize === 0) {
    return "global frequency";
  }

  const tokens = input.match(WORD_PATTERN) ?? [];
  const hasIncompleteWord = Boolean(input.match(TRAILING_WORD_PATTERN)?.[1] && !/\s$/u.test(input));
  const committedTokens = hasIncompleteWord ? tokens.slice(0, -1) : tokens;
  const contextTokens = committedTokens.slice(-contextSize);

  if (contextTokens.length === 0) {
    return "global frequency";
  }

  return contextTokens.join(" ");
}

const styles = {
  container: {
    display: "grid",
    gap: "1rem",
    borderRadius: "1.5rem",
    border: "1px solid rgba(120, 132, 154, 0.28)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,247,250,0.98) 100%)",
    padding: "1rem",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.08)",
  } satisfies CSSProperties,
  thread: {
    display: "grid",
    gap: "0.75rem",
    minHeight: "18rem",
    alignContent: "start",
    padding: "0.25rem",
  } satisfies CSSProperties,
  messageRow: {
    display: "flex",
    justifyContent: "flex-start",
  } satisfies CSSProperties,
  messageRowOutgoing: {
    justifyContent: "flex-end",
  } satisfies CSSProperties,
  messageBubble: {
    maxWidth: "min(34rem, 88%)",
    borderRadius: "1.25rem",
    background: "rgba(233, 237, 244, 0.9)",
    padding: "0.85rem 1rem",
    color: "rgb(15, 23, 42)",
  } satisfies CSSProperties,
  messageBubbleOutgoing: {
    background: "linear-gradient(135deg, rgb(16, 163, 127) 0%, rgb(11, 120, 98) 100%)",
    color: "white",
  } satisfies CSSProperties,
  draftBubble: {
    opacity: 0.72,
    border: "1px dashed rgba(255,255,255,0.35)",
  } satisfies CSSProperties,
  messageAuthor: {
    margin: 0,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.75,
  } satisfies CSSProperties,
  messageText: {
    margin: "0.35rem 0 0",
    fontSize: "0.98rem",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  } satisfies CSSProperties,
  emptyThread: {
    borderRadius: "1.25rem",
    border: "1px dashed rgba(120, 132, 154, 0.42)",
    padding: "1rem",
    background: "rgba(248, 250, 252, 0.9)",
  } satisfies CSSProperties,
  emptyThreadTitle: {
    margin: 0,
    fontWeight: 700,
    color: "rgb(15, 23, 42)",
  } satisfies CSSProperties,
  emptyThreadText: {
    margin: "0.4rem 0 0",
    color: "rgb(71, 85, 105)",
    lineHeight: 1.5,
  } satisfies CSSProperties,
  composer: {
    display: "grid",
    gap: "0.85rem",
    borderRadius: "1.25rem",
    background: "rgba(255,255,255,0.8)",
    border: "1px solid rgba(120, 132, 154, 0.2)",
    padding: "1rem",
  } satisfies CSSProperties,
  suggestionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.75rem",
    flexWrap: "wrap",
  } satisfies CSSProperties,
  sectionLabel: {
    display: "block",
    margin: 0,
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgb(51, 65, 85)",
  } satisfies CSSProperties,
  shortcutHint: {
    margin: "0.2rem 0 0",
    fontSize: "0.85rem",
    color: "rgb(100, 116, 139)",
  } satisfies CSSProperties,
  toggleRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  } satisfies CSSProperties,
  toggleButton: {
    borderRadius: "999px",
    border: "1px solid rgba(120, 132, 154, 0.3)",
    background: "white",
    color: "rgb(51, 65, 85)",
    padding: "0.45rem 0.8rem",
    fontSize: "0.88rem",
    fontWeight: 600,
    cursor: "pointer",
  } satisfies CSSProperties,
  toggleButtonActive: {
    background: "rgb(15, 23, 42)",
    borderColor: "rgb(15, 23, 42)",
    color: "white",
  } satisfies CSSProperties,
  suggestionList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
    gap: "0.65rem",
  } satisfies CSSProperties,
  suggestionButton: {
    borderRadius: "1rem",
    border: "1px solid rgba(120, 132, 154, 0.24)",
    background: "white",
    padding: "0.8rem 0.9rem",
    textAlign: "left",
    cursor: "pointer",
    color: "rgb(15, 23, 42)",
  } satisfies CSSProperties,
  suggestionTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
  } satisfies CSSProperties,
  suggestionWord: {
    fontSize: "0.98rem",
    fontWeight: 700,
  } satisfies CSSProperties,
  shortcutBadge: {
    borderRadius: "999px",
    background: "rgba(226, 232, 240, 0.9)",
    color: "rgb(51, 65, 85)",
    padding: "0.2rem 0.55rem",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
  } satisfies CSSProperties,
  suggestionMeta: {
    display: "grid",
    gap: "0.25rem",
    marginTop: "0.55rem",
    fontSize: "0.84rem",
    color: "rgb(71, 85, 105)",
  } satisfies CSSProperties,
  emptySuggestions: {
    margin: 0,
    borderRadius: "1rem",
    border: "1px dashed rgba(120, 132, 154, 0.35)",
    padding: "0.9rem",
    color: "rgb(100, 116, 139)",
  } satisfies CSSProperties,
  inputRow: {
    display: "grid",
    gap: "0.75rem",
  } satisfies CSSProperties,
  textarea: {
    width: "100%",
    minHeight: "7.5rem",
    resize: "vertical",
    borderRadius: "1rem",
    border: "1px solid rgba(120, 132, 154, 0.32)",
    padding: "0.9rem 1rem",
    font: "inherit",
    lineHeight: 1.5,
    color: "rgb(15, 23, 42)",
    background: "white",
    outline: "none",
  } satisfies CSSProperties,
  submitButton: {
    justifySelf: "end",
    borderRadius: "999px",
    border: 0,
    background: "rgb(15, 23, 42)",
    color: "white",
    padding: "0.7rem 1.1rem",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
  } satisfies CSSProperties,
} as const;
