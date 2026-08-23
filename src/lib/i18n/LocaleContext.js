"use client";

/*
  LocaleContext — the seam for multi-language support, built now and
  switched on for the homepage only. Everything else (the assessment
  questions, /plan, and the ~15,000-word play library in plays.json)
  stays English until there is a real signal that a Spanish- or
  Chinese-speaking audience is actually showing up — see
  claude/faimgo-open-items.md's "Sixth pass" entry for the full reasoning.

  Same shape as every other seam in this codebase (meter.js/allowance(),
  Gate.js): build the switch-point, make it real where it costs little,
  leave it a no-op everywhere it would cost a lot until there's a reason.

  Persistence follows the same pattern store.js already uses for `fid` —
  a plain localStorage key, read once on mount, never blocking render.
*/

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "./messages/en.json";
import es from "./messages/es.json";
import zh from "./messages/zh.json";

export const LOCALES = ["en", "es", "zh"];
export const DEFAULT_LOCALE = "en";
const STORAGE_KEY = "faimgo_locale";

const CATALOGS = { en, es, zh };

function get(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

/* Looks up `key` (dot-notation, e.g. "hero.subtitle") in the active
   locale's catalog. Falls back to English on any miss — a missing
   translation should degrade to a correct English sentence, never to
   a blank string or a raw key like "hero.subtitle" on screen. */
function translate(locale, key) {
  const own = get(CATALOGS[locale], key);
  if (typeof own === "string") return own;
  const fallback = get(CATALOGS[DEFAULT_LOCALE], key);
  return typeof fallback === "string" ? fallback : key;
}

/* Same lookup, but returns whatever value is there (array, object) rather
   than coercing to a string — used for the four-item lists (problem/steps/
   examples/faq) where the value is a translated array of objects. */
function translateRaw(locale, key) {
  const own = get(CATALOGS[locale], key);
  if (own !== undefined) return own;
  return get(CATALOGS[DEFAULT_LOCALE], key);
}

const LocaleCtx = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => translate(DEFAULT_LOCALE, key),
  tRaw: (key) => translateRaw(DEFAULT_LOCALE, key),
});

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  /* Read the saved choice once on mount. Deliberately after first paint
     (same reasoning as store.js's own read-on-mount pattern) — a server-
     rendered page always starts in English, then swaps client-side if the
     visitor picked something else last time. Avoids a hydration mismatch
     between server and client markup. */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && LOCALES.includes(saved)) setLocaleState(saved);
    } catch {
      /* localStorage can throw in a locked-down browser context — fail
         open to English, same discipline as every other storage read
         in this codebase. */
    }
  }, []);

  const setLocale = (next) => {
    if (!LOCALES.includes(next)) return;
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Non-fatal — the choice just won't survive a reload. */
    }
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key) => translate(locale, key),
      tRaw: (key) => translateRaw(locale, key),
    }),
    [locale]
  );

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  return useContext(LocaleCtx);
}
