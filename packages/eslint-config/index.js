const ignorePatterns = ["dist/**", "node_modules/**", "storybook-static/**", ".turbo/**"];

export const ignores = [
  {
    ignores: ignorePatterns,
  },
];

export const base = [
  ...ignores,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
    rules: {
      "array-callback-return": "error",
      "consistent-return": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-constant-binary-expression": "error",
      "no-duplicate-imports": "error",
      "no-implicit-coercion": "error",
      "no-promise-executor-return": "error",
      "no-self-compare": "error",
      "no-template-curly-in-string": "error",
      "no-unmodified-loop-condition": "error",
      "no-unreachable-loop": "error",
      "no-unused-private-class-members": "error",
      "no-use-before-define": ["error", { classes: false, functions: false }],
      "object-shorthand": ["error", "always"],
      "prefer-const": "error",
      "prefer-template": "error",
    },
  },
];

export const typescript = [
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];

export const react = [
  ...typescript,
  {
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "event",
          message: "Use an explicit event parameter instead of the browser global.",
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];

export const next = [
  ...react,
  {
    files: ["app/**/*.{ts,tsx}", "pages/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/router",
              message: "Use next/navigation in App Router code.",
            },
          ],
        },
      ],
    },
  },
];

export const library = [
  ...typescript,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "next/*"],
              message:
                "Published packages must not depend on app-local aliases or Next.js runtime modules.",
            },
          ],
        },
      ],
    },
  },
];

export default library;
