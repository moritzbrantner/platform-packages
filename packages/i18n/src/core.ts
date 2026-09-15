import { createInstance, type i18n as I18nInstance, type Resource } from "i18next";

export type TranslationTree = {
  readonly [key: string]: string | TranslationTree;
};

export type TranslationResources<Locale extends string = string> = Record<Locale, TranslationTree>;

export type LocaleSource = "browser" | "fallback" | "stored" | "url";

export type ResolvedLocale<Locale extends string> = {
  locale: Locale;
  source: LocaleSource;
};

export type LocaleResolutionOptions<Locale extends string> = {
  browserLocales?: readonly string[];
  fallbackLocale: Locale;
  storedLocale?: string | null;
  supportedLocales: readonly Locale[];
  urlLocale?: string | null;
};

export type CreateI18nOptions<Locale extends string> = {
  fallbackLocale: Locale;
  locale: Locale;
  resources: TranslationResources<Locale>;
};

export type TranslationValidationIssue<Locale extends string> = {
  key: string;
  locale: Locale;
  type: "extra" | "missing";
};

export function matchSupportedLocale<Locale extends string>(
  candidate: string | null | undefined,
  supportedLocales: readonly Locale[],
): Locale | null {
  if (!candidate) return null;

  const normalizedCandidate = normalizeLocale(candidate);
  const exactMatch = supportedLocales.find(
    (locale) => normalizeLocale(locale) === normalizedCandidate,
  );
  if (exactMatch) return exactMatch;

  const primaryLanguage = normalizedCandidate.split("-")[0];
  return (
    supportedLocales.find((locale) => normalizeLocale(locale).split("-")[0] === primaryLanguage) ??
    null
  );
}

export function resolveLocale<Locale extends string>(
  options: LocaleResolutionOptions<Locale>,
): ResolvedLocale<Locale> {
  assertSupportedFallback(options.fallbackLocale, options.supportedLocales);

  const candidates: readonly [LocaleSource, string | null | undefined][] = [
    ["url", options.urlLocale],
    ["stored", options.storedLocale],
    ...((options.browserLocales ?? []).map((locale) => ["browser", locale] as const)),
  ];

  for (const [source, candidate] of candidates) {
    const locale = matchSupportedLocale(candidate, options.supportedLocales);
    if (locale) return { locale, source };
  }

  return { locale: options.fallbackLocale, source: "fallback" };
}

export async function createI18n<Locale extends string>(
  options: CreateI18nOptions<Locale>,
): Promise<I18nInstance> {
  assertSupportedFallback(options.fallbackLocale, Object.keys(options.resources) as Locale[]);

  const instance = createInstance();
  const resources = Object.fromEntries(
    Object.entries<TranslationTree>(options.resources).map(([locale, translation]) => [
      locale,
      { translation },
    ]),
  ) as Resource;

  await instance.init({
    fallbackLng: options.fallbackLocale,
    interpolation: { escapeValue: false },
    lng: options.locale,
    resources,
    returnNull: false,
    supportedLngs: Object.keys(options.resources),
  });

  return instance;
}

export function validateTranslationResources<Locale extends string>(
  resources: TranslationResources<Locale>,
  referenceLocale: Locale,
): TranslationValidationIssue<Locale>[] {
  if (!(referenceLocale in resources)) {
    throw new Error(`Reference locale ${referenceLocale} is missing from translation resources.`);
  }

  const referenceKeys = collectTranslationKeys(resources[referenceLocale]);
  const issues: TranslationValidationIssue<Locale>[] = [];

  for (const locale of Object.keys(resources).sort() as Locale[]) {
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

export function assertTranslationResources<Locale extends string>(
  resources: TranslationResources<Locale>,
  referenceLocale: Locale,
): void {
  const issues = validateTranslationResources(resources, referenceLocale);
  if (issues.length === 0) return;

  const details = issues.map((issue) => `${issue.locale}: ${issue.type} ${issue.key}`).join("\n");
  throw new Error(`Translation resources are inconsistent:\n${details}`);
}

export function formatNumber(
  locale: string,
  value: bigint | number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDate(
  locale: string,
  value: Date | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(value);
}

export function formatRelativeTime(
  locale: string,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
): string {
  return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
}

function collectTranslationKeys(tree: TranslationTree, prefix = "", keys = new Set<string>()) {
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

function normalizeLocale(locale: string) {
  return locale.trim().replaceAll("_", "-").toLocaleLowerCase();
}

function assertSupportedFallback<Locale extends string>(
  fallbackLocale: Locale,
  supportedLocales: readonly Locale[],
) {
  if (!supportedLocales.includes(fallbackLocale)) {
    throw new Error(`Fallback locale ${fallbackLocale} is not supported.`);
  }
}
