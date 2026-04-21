export type StoryTheme = {
  background?: string;
  foreground?: string;
  mutedForeground?: string;
  accent?: string;
  fontFamily?: string;
};

export const defaultStoryTheme: Required<StoryTheme> = {
  background: "#ffffff",
  foreground: "#111827",
  mutedForeground: "#6b7280",
  accent: "#2563eb",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
};
