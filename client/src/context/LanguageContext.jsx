// Global UI-language state for the bilingual (English / Sinhala) toggle.
//
// Holds the active interface language, persists it to localStorage so the choice
// survives reloads and navigation, and exposes a `t(key)` translator backed by
// src/i18n/translations.js. Any component can read the language or switch it via
// the useLanguage() hook; the floating <LanguageToggle/> drives it app-wide.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate } from '../i18n/translations';

const STORAGE_KEY = 'agrisl_lang';
const SUPPORTED = ['en', 'si'];

const LanguageContext = createContext(null);

// Read the persisted language, defaulting to English for first-time visitors.
function initialLang() {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return SUPPORTED.includes(saved) ? saved : 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  // Persist every change and keep the document's lang attribute in sync so the
  // browser applies the correct font/locale behaviour for screen readers.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    if (SUPPORTED.includes(next)) setLangState(next);
  }, []);

  const toggle = useCallback(() => {
    setLangState((cur) => (cur === 'en' ? 'si' : 'en'));
  }, []);

  // Translator bound to the current language. Stable per-language render.
  const t = useCallback((key) => translate(lang, key), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, toggle, t, isSinhala: lang === 'si' }),
    [lang, setLang, toggle, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
