import { i18n } from 'i18next';

type TranslationTree = {
    readonly [key: string]: string | TranslationTree;
};
type TranslationResources<Locale extends string = string> = Record<Locale, TranslationTree>;
type LocaleSource = "browser" | "fallback" | "stored" | "url";
type ResolvedLocale<Locale extends string> = {
    locale: Locale;
    source: LocaleSource;
};
type LocaleResolutionOptions<Locale extends string> = {
    browserLocales?: readonly string[];
    fallbackLocale: Locale;
    storedLocale?: string | null;
    supportedLocales: readonly Locale[];
    urlLocale?: string | null;
};
type CreateI18nOptions<Locale extends string> = {
    fallbackLocale: Locale;
    locale: Locale;
    resources: TranslationResources<Locale>;
};
type TranslationValidationIssue<Locale extends string> = {
    key: string;
    locale: Locale;
    type: "extra" | "missing";
};
declare function matchSupportedLocale<Locale extends string>(candidate: string | null | undefined, supportedLocales: readonly Locale[]): Locale | null;
declare function resolveLocale<Locale extends string>(options: LocaleResolutionOptions<Locale>): ResolvedLocale<Locale>;
declare function createI18n<Locale extends string>(options: CreateI18nOptions<Locale>): Promise<i18n>;
declare function validateTranslationResources<Locale extends string>(resources: TranslationResources<Locale>, referenceLocale: Locale): TranslationValidationIssue<Locale>[];
declare function assertTranslationResources<Locale extends string>(resources: TranslationResources<Locale>, referenceLocale: Locale): void;
declare function formatNumber(locale: string, value: bigint | number, options?: Intl.NumberFormatOptions): string;
declare function formatDate(locale: string, value: Date | number, options?: Intl.DateTimeFormatOptions): string;
declare function formatRelativeTime(locale: string, value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions): string;

export { type CreateI18nOptions, type LocaleResolutionOptions, type LocaleSource, type ResolvedLocale, type TranslationResources, type TranslationTree, type TranslationValidationIssue, assertTranslationResources, createI18n, formatDate, formatNumber, formatRelativeTime, matchSupportedLocale, resolveLocale, validateTranslationResources };
