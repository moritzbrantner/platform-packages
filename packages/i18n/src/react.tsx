import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { i18n as I18nInstance } from "i18next";
import { I18nextProvider, Trans, useTranslation } from "react-i18next";
import { setBrowserLocale, syncDocumentLocale, type BrowserLocaleOptions } from "./browser";
import { matchSupportedLocale } from "./core";

type LocaleContextValue = {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  supportedLocales: readonly string[];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export type LocalizationProviderProps<Locale extends string> = PropsWithChildren<
  BrowserLocaleOptions<Locale> & {
    i18n: I18nInstance;
  }
>;

export function LocalizationProvider<Locale extends string>({
  children,
  fallbackLocale,
  i18n,
  queryParameter,
  storageKey,
  supportedLocales,
}: LocalizationProviderProps<Locale>) {
  const resolveCurrentLocale = useCallback(
    () =>
      matchSupportedLocale(i18n.resolvedLanguage ?? i18n.language, supportedLocales) ??
      fallbackLocale,
    [fallbackLocale, i18n, supportedLocales],
  );
  const [locale, setLocaleState] = useState<Locale>(resolveCurrentLocale);

  useEffect(() => {
    function onLanguageChanged(language: string) {
      const nextLocale = matchSupportedLocale(language, supportedLocales) ?? fallbackLocale;
      setLocaleState(nextLocale);
      syncDocumentLocale(nextLocale);
    }

    onLanguageChanged(i18n.resolvedLanguage ?? i18n.language);
    i18n.on("languageChanged", onLanguageChanged);
    return () => {
      i18n.off("languageChanged", onLanguageChanged);
    };
  }, [fallbackLocale, i18n, supportedLocales]);

  const setLocale = useCallback(
    async (nextLocale: string) => {
      const localeToSet = matchSupportedLocale(nextLocale, supportedLocales);
      if (!localeToSet || localeToSet !== nextLocale) {
        throw new Error(`Locale ${nextLocale} is not supported.`);
      }

      await setBrowserLocale(i18n, localeToSet, {
        fallbackLocale,
        queryParameter,
        storageKey,
        supportedLocales,
      });
    },
    [fallbackLocale, i18n, queryParameter, storageKey, supportedLocales],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, supportedLocales }),
    [locale, setLocale, supportedLocales],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    </I18nextProvider>
  );
}

export type LocaleController<Locale extends string = string> = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  supportedLocales: readonly Locale[];
};

export function useLocale<Locale extends string = string>(): LocaleController<Locale> {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocalizationProvider.");

  return context as unknown as LocaleController<Locale>;
}

export { Trans, useTranslation };
