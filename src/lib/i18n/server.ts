import "server-only";
import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { translate, type TFunction } from "./dictionaries";

/** Read the active locale from the request cookie (defaults to Arabic). */
export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** A bound translation function for use in server components. */
export function getT(locale: Locale = getLocale()): TFunction {
  return (key, vars) => translate(locale, key, vars);
}
