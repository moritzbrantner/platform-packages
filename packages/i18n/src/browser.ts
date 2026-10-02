import type { i18n as I18nInstance } from "i18next";
import {
  createI18n,
  matchSupportedLocale,
  resolveLocale,
  type LocaleSource,
  type TranslationResources,
} from "./core";

export const DEFAULT_LOCALE_QUERY_PARAMETER = "lang";
export const DEFAULT_LOCALE_STORAGE_KEY = "moritzbrantner.locale";

export type BrowserLocaleOptions<Locale extends string> = {
  fallbackLocale: Locale;
  queryParameter?: string;
  storageKey?: string;
  supportedLocales: readonly Locale[];
};

export type CreateBrowserI18nOptions<Locale extends string> = BrowserLocaleOptions<Locale> & {
  resources: TranslationResources<Locale>;
};

export type BrowserI18nResult<Locale extends string> = {
  i18n: I18nInstance;
  locale: Locale;
  source: LocaleSource;
};

export function resolveBrowserLocale<Locale extends string>(
  options: BrowserLocaleOptions<Locale>,
): { locale: Locale; source: LocaleSource } {
  const queryParameter = options.queryParameter ?? DEFAULT_LOCALE_QUERY_PARAMETER;
  const storageKey = options.storageKey ?? DEFAULT_LOCALE_STORAGE_KEY;
  const search = typeof window === "undefined" ? "" : window.location.search;
  const storedLocale = readStoredLocale(storageKey);
  const browserLocales = typeof navigator === "undefined" ? [] : navigator.languages;

  return resolveLocale({
    browserLocales,
    fallbackLocale: options.fallbackLocale,
    storedLocale,
    supportedLocales: options.supportedLocales,
    urlLocale: new URLSearchParams(search).get(queryParameter),
  });
}

export async function createBrowserI18n<Locale extends string>(
  options: CreateBrowserI18nOptions<Locale>,
): Promise<BrowserI18nResult<Locale>> {
  const resolved = resolveBrowserLocale(options);
  const i18n = await createI18n({
    fallbackLocale: options.fallbackLocale,
    locale: resolved.locale,
    resources: options.resources,
  });

  syncDocumentLocale(resolved.locale);
  return { i18n, ...resolved };
}

export async function setBrowserLocale<Locale extends string>(
  i18n: I18nInstance,
  locale: Locale,
  options: BrowserLocaleOptions<Locale>,
): Promise<void> {
  const supportedLocale = matchSupportedLocale(locale, options.supportedLocales);
  if (!supportedLocale || supportedLocale !== locale) {
    throw new Error(`Locale ${locale} is not supported.`);
  }

  await i18n.changeLanguage(locale);
  persistBrowserLocale(locale, options);
}

export function persistBrowserLocale<Locale extends string>(
  locale: Locale,
  options: Pick<BrowserLocaleOptions<Locale>, "queryParameter" | "storageKey"> = {},
): void {
  const queryParameter = options.queryParameter ?? DEFAULT_LOCALE_QUERY_PARAMETER;
  const storageKey = options.storageKey ?? DEFAULT_LOCALE_STORAGE_KEY;

  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.set(queryParameter, locale);
    window.history.replaceState(window.history.state, "", url);

    try {
      window.localStorage.setItem(storageKey, locale);
    } catch {
      // Persistence is optional; the URL remains the shareable source of truth.
    }
  }

  syncDocumentLocale(locale);
}

export function syncDocumentLocale(locale: string): void {
  if (typeof document !== "undefined") document.documentElement.lang = locale;
}

function readStoredLocale(storageKey: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}
