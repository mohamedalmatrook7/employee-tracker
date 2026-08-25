"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirFor,
  type Locale,
} from "./config";
import { translate, type TFunction } from "./dictionaries";

interface I18nContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: TFunction;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      // Persist for a year and reflect the change on <html> immediately so the
      // direction flips without waiting for the server round-trip.
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
      router.refresh();
    },
    [router]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: dirFor(locale),
      t: (key, vars) => translate(locale, key, vars),
      setLocale,
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Access the current locale and translation function. Falls back to the default
 * locale when rendered outside a provider (e.g. print/report pages), so it never
 * throws.
 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return {
    locale: DEFAULT_LOCALE,
    dir: dirFor(DEFAULT_LOCALE),
    t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
    setLocale: () => {},
  };
}
