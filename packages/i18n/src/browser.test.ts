import { beforeEach, describe, expect, test } from "vitest";

import { createI18n } from "./core";
import { persistBrowserLocale, resolveBrowserLocale, setBrowserLocale } from "./browser";

const supportedLocales = ["en", "de"] as const;
const resources = {
  en: { menu: { settings: "Settings" } },
  de: { menu: { settings: "Einstellungen" } },
} as const;
const storageKey = "test.locale";

describe("browser locale adapter", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/raid-defense/?screen=settings");
    document.documentElement.lang = "";
  });

  test("prefers the URL without losing unrelated query state", () => {
    window.localStorage.setItem(storageKey, "en");
    window.history.replaceState({}, "", "/raid-defense/?screen=settings&lang=de");

    expect(
      resolveBrowserLocale({
        fallbackLocale: "en",
        storageKey,
        supportedLocales,
      }),
    ).toEqual({ locale: "de", source: "url" });
  });

  test("persists an explicit locale in URL, storage, and document metadata", () => {
    persistBrowserLocale("de", { storageKey });

    const search = new URLSearchParams(window.location.search);
    expect(search.get("screen")).toBe("settings");
    expect(search.get("lang")).toBe("de");
    expect(window.localStorage.getItem(storageKey)).toBe("de");
    expect(document.documentElement.lang).toBe("de");
  });

  test("changes the i18next language through the same browser contract", async () => {
    const i18n = await createI18n({ fallbackLocale: "en", locale: "en", resources });

    await setBrowserLocale(i18n, "de", {
      fallbackLocale: "en",
      storageKey,
      supportedLocales,
    });

    expect(i18n.resolvedLanguage).toBe("de");
    expect(i18n.t("menu.settings")).toBe("Einstellungen");
    expect(new URLSearchParams(window.location.search).get("lang")).toBe("de");
  });
});
