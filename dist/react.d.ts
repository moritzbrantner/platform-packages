import * as react_jsx_runtime from 'react/jsx-runtime';
import { PropsWithChildren } from 'react';
import { i18n } from 'i18next';
export { Trans, useTranslation } from 'react-i18next';
import { BrowserLocaleOptions } from './browser.js';
import './core.js';

type LocalizationProviderProps<Locale extends string> = PropsWithChildren<BrowserLocaleOptions<Locale> & {
    i18n: i18n;
}>;
declare function LocalizationProvider<Locale extends string>({ children, fallbackLocale, i18n, queryParameter, storageKey, supportedLocales, }: LocalizationProviderProps<Locale>): react_jsx_runtime.JSX.Element;
type LocaleController<Locale extends string = string> = {
    locale: Locale;
    setLocale: (locale: Locale) => Promise<void>;
    supportedLocales: readonly Locale[];
};
declare function useLocale<Locale extends string = string>(): LocaleController<Locale>;

export { type LocaleController, LocalizationProvider, type LocalizationProviderProps, useLocale };
