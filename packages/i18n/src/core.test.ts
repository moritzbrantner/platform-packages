import { describe, expect, test } from "vitest";

import {
  assertTranslationResources,
  createI18n,
  matchSupportedLocale,
  resolveLocale,
  validateTranslationResources,
} from "./core";

const supportedLocales = ["en", "de"] as const;

const resources = {
  en: {
    menu: {
      resume: "Resume",
      settings: "Settings",
    },
  },
  de: {
    menu: {
      resume: "Fortsetzen",
      settings: "Einstellungen",
    },
  },
} as const;

describe("locale resolution", () => {
  test("uses URL, stored preference, browser locale, then fallback", () => {
    expect(
      resolveLocale({
        browserLocales: ["de-DE"],
        fallbackLocale: "en",
        storedLocale: "en",
        supportedLocales,
        urlLocale: "de",
      }),
    ).toEqual({ locale: "de", source: "url" });

    expect(
      resolveLocale({
        browserLocales: ["de-DE"],
        fallbackLocale: "en",
        storedLocale: "en",
        supportedLocales,
      }),
    ).toEqual({ locale: "en", source: "stored" });

    expect(
      resolveLocale({
        browserLocales: ["de-DE"],
        fallbackLocale: "en",
        supportedLocales,
      }),
    ).toEqual({ locale: "de", source: "browser" });

    expect(
      resolveLocale({
        browserLocales: ["fr-FR"],
        fallbackLocale: "en",
        supportedLocales,
      }),
    ).toEqual({ locale: "en", source: "fallback" });
  });

  test("matches language variants without changing the canonical app locale", () => {
    expect(matchSupportedLocale("DE_de", supportedLocales)).toBe("de");
    expect(matchSupportedLocale("en-GB", supportedLocales)).toBe("en");
  });
});

describe("translation resources", () => {
  test("initializes isolated i18next instances", async () => {
    const i18n = await createI18n({ fallbackLocale: "en", locale: "de", resources });

    expect(i18n.t("menu.resume")).toBe("Fortsetzen");
    await i18n.changeLanguage("en");
    expect(i18n.t("menu.resume")).toBe("Resume");
  });

  test("reports missing and extra keys deterministically", () => {
    const inconsistent = {
      en: { menu: { resume: "Resume", settings: "Settings" } },
      de: { menu: { resume: "Fortsetzen", start: "Starten" } },
    } as const;

    expect(validateTranslationResources(inconsistent, "en")).toEqual([
      { key: "menu.settings", locale: "de", type: "missing" },
      { key: "menu.start", locale: "de", type: "extra" },
    ]);
    expect(() => assertTranslationResources(inconsistent, "en")).toThrow(
      "de: missing menu.settings\nde: extra menu.start",
    );
  });

  test("accepts complete resources", () => {
    expect(() => assertTranslationResources(resources, "en")).not.toThrow();
  });
});
