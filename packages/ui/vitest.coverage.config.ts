import { mergeConfig } from "vitest/config";

import baseConfig from "../../vitest.config";

export default mergeConfig(baseConfig, {
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/components/calendar.tsx",
        "src/components/hotkey-visibility.ts",
        "src/components/query-builder.tsx",
        "src/components/timeline-editor.tsx",
        "src/components/workflow-builder.tsx",
      ],
      thresholds: {
        branches: 25,
        functions: 35,
        lines: 35,
        statements: 35,
      },
    },
  },
});
