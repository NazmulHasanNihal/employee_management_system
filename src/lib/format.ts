// Centralized Intl formatting for Bangladesh (BDT / bn-BD).
// Replaces the scattered hardcoded `Intl.NumberFormat('en-US', { currency: 'USD' })`
// and `$` literals so currency/date rendering respects the active language.

export type Lang = 'en' | 'bn';

const LOCALE: Record<Lang, string> = {
  en: 'en-US',
  bn: 'bn-BD',
};

export function formatCurrency(
  value: number | null | undefined,
  currency = 'BDT',
  lang: Lang = 'en'
): string {
  if (value == null || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat(LOCALE[lang] || 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // Fallback for runtimes without the bn-BD locale data.
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }
}

export function formatNumber(value: number | null | undefined, lang: Lang = 'en'): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(LOCALE[lang] || 'en-US').format(value);
}

export function formatDate(
  date: Date | string | number | null | undefined,
  lang: Lang = 'en',
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '—';
  const d = typeof date === 'object' ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE[lang] || 'en-US', opts || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(
  date: Date | string | number | null | undefined,
  lang: Lang = 'en'
): string {
  if (!date) return '—';
  const d = typeof date === 'object' ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE[lang] || 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
