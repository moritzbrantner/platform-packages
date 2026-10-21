// src/core.ts
import { createInstance } from "i18next";
function matchSupportedLocale(candidate, supportedLocales) {
  if (!candidate) return null;
  const normalizedCandidate = normalizeLocale(candidate);
  const exactMatch = supportedLocales.find(
    (locale) => normalizeLocale(locale) === normalizedCandidate
  );
  if (exactMatch) return exactMatch;
  const primaryLanguage = normalizedCandidate.split("-")[0];
  return supportedLocales.find((locale) => normalizeLocale(locale).split("-")[0] === primaryLanguage) ?? null;
}
function resolveLocale(options) {
  assertSupportedFallback(options.fallbackLocale, options.supportedLocales);
  const candidates = [
    ["url", options.urlLocale],
    ["stored", options.storedLocale],
    ...(options.browserLocales ?? []).map((locale) => ["browser", locale])
  ];
  for (const [source, candidate] of candidates) {
    const locale = matchSupportedLocale(candidate, options.supportedLocales);
    if (locale) return { locale, source };
  }
  return { locale: options.fallbackLocale, source: "fallback" };
}
async function createI18n(options) {
  assertSupportedFallback(options.fallbackLocale, Object.keys(options.resources));
  const instance = createInstance();
  const resources = Object.fromEntries(
    Object.entries(options.resources).map(([locale, translation]) => [
      locale,
      { translation }
    ])
  );
  await instance.init({
    fallbackLng: options.fallbackLocale,
    interpolation: { escapeValue: false },
    lng: options.locale,
    resources,
    returnNull: false,
    supportedLngs: Object.keys(options.resources)
  });
  return instance;
}
function validateTranslationResources(resources, referenceLocale) {
  if (!(referenceLocale in resources)) {
    throw new Error(`Reference locale ${referenceLocale} is missing from translation resources.`);
  }
  const referenceKeys = collectTranslationKeys(resources[referenceLocale]);
  const issues = [];
  for (const locale of Object.keys(resources).sort()) {
    const localeKeys = collectTranslationKeys(resources[locale]);
    for (const key of [...referenceKeys].sort()) {
      if (!localeKeys.has(key)) issues.push({ key, locale, type: "missing" });
    }
    for (const key of [...localeKeys].sort()) {
      if (!referenceKeys.has(key)) issues.push({ key, locale, type: "extra" });
    }
  }
  return issues;
}
function assertTranslationResources(resources, referenceLocale) {
  const issues = validateTranslationResources(resources, referenceLocale);
  if (issues.length === 0) return;
  const details = issues.map((issue) => `${issue.locale}: ${issue.type} ${issue.key}`).join("\n");
  throw new Error(`Translation resources are inconsistent:
${details}`);
}
function formatNumber(locale, value, options) {
  return new Intl.NumberFormat(locale, options).format(value);
}
function formatDate(locale, value, options) {
  return new Intl.DateTimeFormat(locale, options).format(value);
}
function formatRelativeTime(locale, value, unit, options) {
  return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
}
function collectTranslationKeys(tree, prefix = "", keys = /* @__PURE__ */ new Set()) {
  for (const [segment, value] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${segment}` : segment;
    if (typeof value === "string") {
      keys.add(key);
    } else {
      collectTranslationKeys(value, key, keys);
    }
  }
  return keys;
}
function normalizeLocale(locale) {
  return locale.trim().replaceAll("_", "-").toLocaleLowerCase();
}
function assertSupportedFallback(fallbackLocale, supportedLocales) {
  if (!supportedLocales.includes(fallbackLocale)) {
    throw new Error(`Fallback locale ${fallbackLocale} is not supported.`);
  }
}

export {
  matchSupportedLocale,
  resolveLocale,
  createI18n,
  validateTranslationResources,
  assertTranslationResources,
  formatNumber,
  formatDate,
  formatRelativeTime
};
