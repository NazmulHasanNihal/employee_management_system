import { cookies } from 'next/headers';
import { getTranslation, LANG_COOKIE, type Lang } from '@/lib/translations';

/**
 * Reads the active language on the server (from the `ems_lang` cookie set by
 * the client language toggle). Falls back to 'en'. Safe to call from Server
 * Components and Route Handlers.
 */
export async function getLanguage(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return value === 'bn' ? 'bn' : 'en';
}

/** Convenience: get a `t()` bound to the request's language. */
export async function getServerT() {
  const lang = await getLanguage();
  return getTranslation(lang);
}
