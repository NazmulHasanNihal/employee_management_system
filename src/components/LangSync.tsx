'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * Syncs the persisted language preference to:
 *  - document.documentElement.lang (a11y / SEO / correct font shaping)
 *  - a `lang-bn` class on <html> so globals.css can swap to the Bengali font
 * On first mount it reconciles the client store with the server-set `ems_lang`
 * cookie so the two sources never diverge.
 */
export function LangSync() {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )ems_lang=(bn|en)(?:;|$)/);
    const cookieLang = match?.[1] as 'bn' | 'en' | undefined;
    if (cookieLang && cookieLang !== language) setLanguage(cookieLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language === 'bn' ? 'bn' : 'en';
    root.classList.toggle('lang-bn', language === 'bn');
  }, [language]);

  return null;
}
