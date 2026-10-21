import {
  setBrowserLocale,
  syncDocumentLocale
} from "./chunk-EUGWPOPJ.js";
import {
  matchSupportedLocale
} from "./chunk-CY3NLY44.js";

// src/react.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { I18nextProvider, Trans, useTranslation } from "react-i18next";
import { jsx } from "react/jsx-runtime";
var LocaleContext = createContext(null);
function LocalizationProvider({
  children,
  fallbackLocale,
  i18n,
  queryParameter,
  storageKey,
  supportedLocales
}) {
  const resolveCurrentLocale = useCallback(
    () => matchSupportedLocale(i18n.resolvedLanguage ?? i18n.language, supportedLocales) ?? fallbackLocale,
    [fallbackLocale, i18n, supportedLocales]
  );
  const [locale, setLocaleState] = useState(resolveCurrentLocale);
  useEffect(() => {
    function onLanguageChanged(language) {
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
    async (nextLocale) => {
      const localeToSet = matchSupportedLocale(nextLocale, supportedLocales);
      if (!localeToSet || localeToSet !== nextLocale) {
        throw new Error(`Locale ${nextLocale} is not supported.`);
      }
      await setBrowserLocale(i18n, localeToSet, {
        fallbackLocale,
        queryParameter,
        storageKey,
        supportedLocales
      });
    },
    [fallbackLocale, i18n, queryParameter, storageKey, supportedLocales]
  );
  const value = useMemo(
    () => ({ locale, setLocale, supportedLocales }),
    [locale, setLocale, supportedLocales]
  );
  return /* @__PURE__ */ jsx(I18nextProvider, { i18n, children: /* @__PURE__ */ jsx(LocaleContext.Provider, { value, children }) });
}
function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocalizationProvider.");
  return context;
}
export {
  LocalizationProvider,
  Trans,
  useLocale,
  useTranslation
};
