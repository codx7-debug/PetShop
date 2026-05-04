import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager, Platform } from "react-native";
import {
  AppLocale,
  isRtlLocale,
  SUPPORTED_LOCALES,
} from "../i18n/translations";
import { translate } from "../i18n/translate";

const STORAGE_KEY = "@petshop_locale";

function deviceLocale(): AppLocale {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase() ?? "en";
  if (code === "tr") return "tr";
  if (code === "ru") return "ru";
  if (code === "ar") return "ar";
  if (code === "es") return "es";
  if (code === "fr") return "fr";
  if (code === "de") return "de";
  return "en";
}

function parseStoredLocale(raw: string | null): AppLocale | null {
  if (!raw) return null;
  if (raw === "nl") return "de";
  return SUPPORTED_LOCALES.includes(raw as AppLocale) ? (raw as AppLocale) : null;
}

type LanguageContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  ready: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(deviceLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = parseStoredLocale(await AsyncStorage.getItem(STORAGE_KEY));
        if (!cancelled && stored) setLocaleState(stored);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", isRtlLocale(locale) ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", locale);
    }
  }, [locale]);

  // Keep native RTL flag in sync without reloading the whole app (reload caused
  // repeated flashes / loops when picking Arabic, especially in dev + Strict Mode).
  useEffect(() => {
    if (Platform.OS === "web") return;
    const needRTL = isRtlLocale(locale);
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL !== needRTL) {
      I18nManager.forceRTL(needRTL);
    }
  }, [locale]);

  const setLocale = useCallback(async (next: AppLocale) => {
    await AsyncStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      isRTL: isRtlLocale(locale),
      ready,
    }),
    [locale, setLocale, t, ready]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
