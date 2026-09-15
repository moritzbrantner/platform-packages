# @moritzbrantner/i18n

Shared internationalization mechanics for browser and React applications. Applications own their translation text; this package owns locale resolution, i18next setup, browser persistence, `Intl` formatting, React integration, and deterministic translation-resource validation.

## Boundary

- Application repositories own `en`, `de`, and other translation resources.
- Locale resolution is deterministic: URL -> stored preference -> browser languages -> fallback.
- The active locale is shareable through the `lang` query parameter by default.
- The browser adapter preserves unrelated URL query parameters.
- Formatting delegates to the platform `Intl` APIs.
- React consumers use the `./react` adapter; non-React consumers can use the core/browser entry points directly.
- Domain or simulation cores should expose semantic identifiers and must not depend on this package.

## Basic browser setup

```ts
import { createBrowserI18n } from "@moritzbrantner/i18n/browser";

const supportedLocales = ["en", "de"] as const;
const resources = {
  en: { menu: { settings: "Settings" } },
  de: { menu: { settings: "Einstellungen" } },
};

const { i18n } = await createBrowserI18n({
  fallbackLocale: "en",
  resources,
  supportedLocales,
});
```

For React, wrap the application in `LocalizationProvider` from `@moritzbrantner/i18n/react` and use `useTranslation` plus `useLocale`.

## CI validation

Use `assertTranslationResources(resources, "en")` in a focused test so missing or accidental extra keys fail deterministically instead of silently degrading the deployed Pages application.
