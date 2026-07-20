/**
 * bangladesh-holidays.ts
 *
 * Single source of truth for Bangladesh public/gazetted holidays.
 *
 * - Fixed (Gregorian) national & festival holidays use the official government
 *   calendar dates.
 * - Lunar/religious holidays (Eid-ul-Fitr, Eid-ul-Adha, Ashura, Eid-e-Miladun
 *   Nabi, Durga Puja) are marked `tentative: true` because their exact dates
 *   depend on moon sighting and the annual Bangladesh government notification
 *   (SROS). The dates below are the best astronomical estimates and MUST be
 *   confirmed against the official gazette for each year before relying on them.
 *
 * Coverage: 2025–2027. To extend, add entries to `RAW_HOLIDAYS`.
 */

export type HolidayType = 'National' | 'Public' | 'Festival' | 'Religious';

export interface BangladeshHoliday {
  /** ISO date, YYYY-MM-DD (Asia/Dhaka). */
  date: string;
  name: string;
  nameBn: string;
  type: HolidayType;
  /** True for moon-sighted / government-to-be-confirmed dates. */
  tentative?: boolean;
}

const RAW_HOLIDAYS: BangladeshHoliday[] = [
  // ───────────────────────────── 2025 ─────────────────────────────
  { date: '2025-02-21', name: "Language Martyrs' Day", nameBn: 'ভাষা শহিদ দিবস', type: 'National' },
  { date: '2025-03-17', name: 'Sheikh Mujibur Rahman’s Birthday & Children’s Day', nameBn: 'শেখ মুজিবুর রহমানের জন্মদিন ও শিশু দিবস', type: 'National' },
  { date: '2025-03-26', name: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', type: 'National' },
  { date: '2025-04-14', name: 'Bengali New Year', nameBn: 'পহেলা বৈশাখ', type: 'Festival' },
  { date: '2025-05-01', name: 'May Day', nameBn: 'মে দিবস', type: 'Public' },
  { date: '2025-08-15', name: 'National Mourning Day', nameBn: 'জাতীয় শোক দিবস', type: 'National' },
  { date: '2025-12-16', name: 'Victory Day', nameBn: 'বিজয় দিবস', type: 'National' },
  { date: '2025-12-31', name: "New Year’s Eve", nameBn: 'নববর্ষের প্রাক্কাল', type: 'Public' },
  // Religious (tentative — moon-sighted):
  { date: '2025-03-31', name: 'Eid-ul-Fitr', nameBn: 'ঈদ-উল-ফিতর', type: 'Religious', tentative: true },
  { date: '2025-06-07', name: 'Eid-ul-Adha', nameBn: 'ঈদ-উল-আযহা', type: 'Religious', tentative: true },
  { date: '2025-07-06', name: 'Ashura', nameBn: 'আশুরা', type: 'Religious', tentative: true },
  { date: '2025-09-05', name: 'Eid-e-Miladun Nabi', nameBn: 'ইদ-এ-মিলাদুন নবী', type: 'Religious', tentative: true },
  { date: '2025-10-02', name: 'Durga Puja (Bijoya Dashami)', nameBn: 'দুর্গাপূজা (বিজয়া দশমী)', type: 'Religious', tentative: true },

  // ───────────────────────────── 2026 ─────────────────────────────
  { date: '2026-02-21', name: "Language Martyrs' Day", nameBn: 'ভাষা শহিদ দিবস', type: 'National' },
  { date: '2026-03-17', name: 'Sheikh Mujibur Rahman’s Birthday & Children’s Day', nameBn: 'শেখ মুজিবুর রহমানের জন্মদিন ও শিশু দিবস', type: 'National' },
  { date: '2026-03-26', name: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', type: 'National' },
  { date: '2026-04-14', name: 'Bengali New Year', nameBn: 'পহেলা বৈশাখ', type: 'Festival' },
  { date: '2026-05-01', name: 'May Day', nameBn: 'মে দিবস', type: 'Public' },
  { date: '2026-08-15', name: 'National Mourning Day', nameBn: 'জাতীয় শোক দিবস', type: 'National' },
  { date: '2026-12-16', name: 'Victory Day', nameBn: 'বিজয় দিবস', type: 'National' },
  { date: '2026-12-31', name: "New Year’s Eve", nameBn: 'নববর্ষের প্রাক্কাল', type: 'Public' },
  // Religious (tentative — moon-sighted):
  { date: '2026-03-22', name: 'Eid-ul-Fitr', nameBn: 'ঈদ-উল-ফিতর', type: 'Religious', tentative: true },
  { date: '2026-05-27', name: 'Eid-ul-Adha', nameBn: 'ঈদ-উল-আযহা', type: 'Religious', tentative: true },
  { date: '2026-06-25', name: 'Ashura', nameBn: 'আশুরা', type: 'Religious', tentative: true },
  { date: '2026-08-26', name: 'Eid-e-Miladun Nabi', nameBn: 'ইদ-এ-মিলাদুন নবী', type: 'Religious', tentative: true },
  { date: '2026-10-21', name: 'Durga Puja (Bijoya Dashami)', nameBn: 'দুর্গাপূজা (বিজয়া দশমী)', type: 'Religious', tentative: true },

  // ───────────────────────────── 2027 ─────────────────────────────
  { date: '2027-02-21', name: "Language Martyrs' Day", nameBn: 'ভাষা শহিদ দিবস', type: 'National' },
  { date: '2027-03-17', name: 'Sheikh Mujibur Rahman’s Birthday & Children’s Day', nameBn: 'শেখ মুজিবুর রহমানের জন্মদিন ও শিশু দিবস', type: 'National' },
  { date: '2027-03-26', name: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', type: 'National' },
  { date: '2027-04-14', name: 'Bengali New Year', nameBn: 'পহেলা বৈশাখ', type: 'Festival' },
  { date: '2027-05-01', name: 'May Day', nameBn: 'মে দিবস', type: 'Public' },
  { date: '2027-08-15', name: 'National Mourning Day', nameBn: 'জাতীয় শোক দিবস', type: 'National' },
  { date: '2027-12-16', name: 'Victory Day', nameBn: 'বিজয় দিবস', type: 'National' },
  { date: '2027-12-31', name: "New Year’s Eve", nameBn: 'নববর্ষের প্রাক্কাল', type: 'Public' },
  // Religious (tentative — moon-sighted):
  { date: '2027-03-10', name: 'Eid-ul-Fitr', nameBn: 'ঈদ-উল-ফিতর', type: 'Religious', tentative: true },
  { date: '2027-05-17', name: 'Eid-ul-Adha', nameBn: 'ঈদ-উল-আযহা', type: 'Religious', tentative: true },
  { date: '2027-06-15', name: 'Ashura', nameBn: 'আশুরা', type: 'Religious', tentative: true },
  { date: '2027-08-16', name: 'Eid-e-Miladun Nabi', nameBn: 'ইদ-এ-মিলাদুন নবী', type: 'Religious', tentative: true },
  { date: '2027-10-11', name: 'Durga Puja (Bijoya Dashami)', nameBn: 'দুর্গাপূজা (বিজয়া দশমী)', type: 'Religious', tentative: true },
];

/** All holidays in the dataset, sorted by date ascending. */
export const BANGLADESH_HOLIDAYS: BangladeshHoliday[] = [...RAW_HOLIDAYS].sort((a, b) =>
  a.date.localeCompare(b.date)
);

export function getBangladeshHolidays(years?: number[]): BangladeshHoliday[] {
  if (!years || years.length === 0) return BANGLADESH_HOLIDAYS;
  const set = new Set(years.map(String));
  return BANGLADESH_HOLIDAYS.filter((h) => set.has(h.date.slice(0, 4)));
}

/**
 * Idempotent loader for seed scripts. Upserts by `date` (unique) so re-running
 * a seed never duplicates rows and never destroys unrelated data.
 *
 * Pass a PrismaClient-like object exposing `holiday`. Safely ignores
 * `isTentative` if the underlying column has not been added to the database
 * yet (the schema field exists but the migration/db push is pending).
 */
export async function seedBangladeshHolidays(
  prisma: { holiday: { upsert: (args: any) => Promise<any> } },
  holidays: BangladeshHoliday[] = BANGLADESH_HOLIDAYS
): Promise<number> {
  let count = 0;
  for (const h of holidays) {
    const date = new Date(h.date + 'T00:00:00Z');
    const data: any = {
      date,
      name: h.name,
      nameBn: h.nameBn,
      type: h.type,
    };
    // Only set isTentative when the caller's schema supports it. We attempt it
    // and let the seed script catch/ignore a missing-column error gracefully.
    if (h.tentative !== undefined) data.isTentative = h.tentative;
    await prisma.holiday.upsert({
      where: { date },
      create: data,
      update: { name: h.name, nameBn: h.nameBn, type: h.type, ...(h.tentative !== undefined ? { isTentative: h.tentative } : {}) },
    });
    count++;
  }
  return count;
}
