import {
  createI18n,
  matchSupportedLocale,
  resolveLocale
} from "./chunk-CY3NLY44.js";

// src/browser.ts
var DEFAULT_LOCALE_QUERY_PARAMETER = "lang";
var DEFAULT_LOCALE_STORAGE_KEY = "moritzbrantner.locale";
function resolveBrowserLocale(options) {
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
    urlLocale: new URLSearchParams(search).get(queryParameter)
  });
}
async function createBrowserI18n(options) {
  const resolved = resolveBrowserLocale(options);
  const i18n = await createI18n({
    fallbackLocale: options.fallbackLocale,
    locale: resolved.locale,
    resources: options.resources
  });
  syncDocumentLocale(resolved.locale);
  return { i18n, ...resolved };
}
async function setBrowserLocale(i18n, locale, options) {
  const supportedLocale = matchSupportedLocale(locale, options.supportedLocales);
  if (!supportedLocale || supportedLocale !== locale) {
    throw new Error(`Locale ${locale} is not supported.`);
  }
  await i18n.changeLanguage(locale);
  persistBrowserLocale(locale, options);
}
function persistBrowserLocale(locale, options = {}) {
  const queryParameter = options.queryParameter ?? DEFAULT_LOCALE_QUERY_PARAMETER;
  const storageKey = options.storageKey ?? DEFAULT_LOCALE_STORAGE_KEY;
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.set(queryParameter, locale);
    window.history.replaceState(window.history.state, "", url);
    try {
      window.localStorage.setItem(storageKey, locale);
    } catch {
    }
  }
  syncDocumentLocale(locale);
}
function syncDocumentLocale(locale) {
  if (typeof document !== "undefined") document.documentElement.lang = locale;
}
function readStoredLocale(storageKey) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export {
  DEFAULT_LOCALE_QUERY_PARAMETER,
  DEFAULT_LOCALE_STORAGE_KEY,
  resolveBrowserLocale,
  createBrowserI18n,
  setBrowserLocale,
  persistBrowserLocale,
  syncDocumentLocale
};
