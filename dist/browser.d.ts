import { i18n } from 'i18next';
import { LocaleSource, TranslationResources } from './core.js';

declare const DEFAULT_LOCALE_QUERY_PARAMETER = "lang";
declare const DEFAULT_LOCALE_STORAGE_KEY = "moritzbrantner.locale";
type BrowserLocaleOptions<Locale extends string> = {
    fallbackLocale: Locale;
    queryParameter?: string;
    storageKey?: string;
    supportedLocales: readonly Locale[];
};
type CreateBrowserI18nOptions<Locale extends string> = BrowserLocaleOptions<Locale> & {
    resources: TranslationResources<Locale>;
};
type BrowserI18nResult<Locale extends string> = {
    i18n: i18n;
    locale: Locale;
    source: LocaleSource;
};
declare function resolveBrowserLocale<Locale extends string>(options: BrowserLocaleOptions<Locale>): {
    locale: Locale;
    source: LocaleSource;
};
declare function createBrowserI18n<Locale extends string>(options: CreateBrowserI18nOptions<Locale>): Promise<BrowserI18nResult<Locale>>;
declare function setBrowserLocale<Locale extends string>(i18n: i18n, locale: Locale, options: BrowserLocaleOptions<Locale>): Promise<void>;
declare function persistBrowserLocale<Locale extends string>(locale: Locale, options?: Pick<BrowserLocaleOptions<Locale>, "queryParameter" | "storageKey">): void;
declare function syncDocumentLocale(locale: string): void;

export { type BrowserI18nResult, type BrowserLocaleOptions, type CreateBrowserI18nOptions, DEFAULT_LOCALE_QUERY_PARAMETER, DEFAULT_LOCALE_STORAGE_KEY, createBrowserI18n, persistBrowserLocale, resolveBrowserLocale, setBrowserLocale, syncDocumentLocale };
