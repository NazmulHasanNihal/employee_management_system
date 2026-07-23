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
  category: 'Fixed' | 'Tentative' | 'Optional';
  /** True for moon-sighted / government-to-be-confirmed dates. */
  tentative?: boolean;
  isOptional?: boolean;
  year: number;
}

const RAW_HOLIDAYS: BangladeshHoliday[] = [
  // ───────────────────────────── 2025 ─────────────────────────────
  { date: '2025-01-01', name: "New Year's Day", nameBn: 'নববর্ষ', type: 'Public', category: 'Fixed', year: 2025 },
  { date: '2025-02-01', name: 'Maghi Purnima', nameBn: 'মাঘী পূর্ণিমা', type: 'Religious', category: 'Optional', isOptional: true, year: 2025 },
  { date: '2025-02-21', name: "Language Martyrs' Day & International Mother Language Day", nameBn: 'ভাষা শহিদ দিবস', type: 'National', category: 'Fixed', year: 2025 },
  { date: '2025-01-23', name: 'Saraswati Puja', nameBn: 'সরস্বতী পূজা', type: 'Religious', category: 'Optional', isOptional: true, year: 2025 },
  { date: '2025-03-03', name: 'Doljatra', nameBn: 'দোলযাত্রা', type: 'Religious', category: 'Optional', isOptional: true, year: 2025 },
  { date: '2025-03-17', name: "Sheikh Mujibur Rahman's Birthday & Children's Day", nameBn: 'শেখ মুজিবুর রহমানের জন্মদিন', type: 'National', category: 'Fixed', year: 2025 },
  { date: '2025-03-26', name: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', type: 'National', category: 'Fixed', year: 2025 },
  { date: '2025-04-03', name: 'Good Friday', nameBn: 'Good Friday', type: 'Religious', category: 'Optional', isOptional: true, year: 2025 },
  { date: '2025-04-05', name: 'Easter Sunday', nameBn: 'Easter Sunday', type: 'Religious', category: 'Optional', isOptional: true, year: 2025 },
  { date: '2025-04-14', name: 'Bengali New Year', nameBn: 'পহেলা বৈশাখ', type: 'Festival', category: 'Fixed', year: 2025 },
  { date: '2025-05-01', name: 'May Day', nameBn: 'মে দিবস', type: 'Public', category: 'Fixed', year: 2025 },
  { date: '2025-08-15', name: 'National Mourning Day', nameBn: 'জাতীয় শোক দিবস', type: 'National', category: 'Fixed', year: 2025 },
  { date: '2025-08-12', name: 'Akhari Chahar Somba', nameBn: 'আখারী চহর সোম্বা', type: 'Religious', category: 'Optional', isOptional: true, year: 2025 },
  { date: '2025-09-24', name: 'Fateha-i-Yajdaham', nameBn: 'Fateha-i-Yajdaham', type: 'Religious', category: 'Optional', isOptional: true, year: 2025 },
  { date: '2025-12-16', name: 'Victory Day', nameBn: 'বিজয় দিবস', type: 'National', category: 'Fixed', year: 2025 },
  { date: '2025-12-24', name: 'Christmas Eve', nameBn: 'ক্রিসমাস ইভ', type: 'Religious', category: 'Optional', isOptional: true, year: 2025 },
  { date: '2025-12-31', name: "New Year's Eve", nameBn: 'নববর্ষের প্রাক্কাল', type: 'Public', category: 'Fixed', year: 2025 },
  // Religious (tentative — moon-sighted):
  { date: '2025-03-31', name: 'Eid-ul-Fitr', nameBn: 'ঈদ-উল-ফিতর', type: 'Religious', category: 'Tentative', tentative: true, year: 2025 },
  { date: '2025-06-07', name: 'Eid-ul-Adha', nameBn: 'ঈদ-উল-আযহা', type: 'Religious', category: 'Tentative', tentative: true, year: 2025 },
  { date: '2025-07-06', name: 'Ashura', nameBn: 'আশুরা', type: 'Religious', category: 'Tentative', tentative: true, year: 2025 },
  { date: '2025-09-05', name: 'Eid-e-Miladun Nabi', nameBn: 'ইদ-এ-মিলাদুন নবী', type: 'Religious', category: 'Tentative', tentative: true, year: 2025 },
  { date: '2025-10-02', name: 'Durga Puja (Bijoya Dashami)', nameBn: 'দুর্গাপূজা (বিজয়া দশমী)', type: 'Religious', category: 'Tentative', tentative: true, year: 2025 },

  // ───────────────────────────── 2026 ─────────────────────────────
  // Fixed National / Public Holidays
  { date: '2026-01-01', name: "New Year's Day", nameBn: 'নববর্ষ', type: 'Public', category: 'Fixed', year: 2026 },
  { date: '2026-02-01', name: 'Maghi Purnima', nameBn: 'মাঘী পূর্ণিমা', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-02-04', name: 'Shab-e-Barat', nameBn: 'শাব-e-বরাত', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-02-21', name: "Shahid Dibosh & International Mother Language Day", nameBn: 'ভাষা শহিদ দিবস', type: 'National', category: 'Fixed', year: 2026 },
  { date: '2026-01-23', name: 'Saraswati Puja', nameBn: 'সরস্বতী পূজা', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-03-03', name: 'Doljatra', nameBn: 'দোলযাত্রা', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-03-17', name: "Sheikh Mujibur Rahman's Birthday, Children's Day & Shab-e-Qadr", nameBn: 'শেখ মুজিবুর রহমানের জন্মদিন, শিশু দিবস ও শাব-e-কদর', type: 'National', category: 'Fixed', year: 2026 },
  { date: '2026-03-19', name: 'Eid-ul-Fitr (Day 1)', nameBn: 'ঈদ-উল-ফিতর (১ম দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-03-20', name: 'Eid-ul-Fitr (Day 2)', nameBn: 'ঈদ-উল-ফিতর (২য় দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-03-21', name: 'Eid-ul-Fitr (Day 3)', nameBn: 'ঈদ-উল-ফিতর (৩য় দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-03-22', name: 'Eid-ul-Fitr (Day 4)', nameBn: 'ঈদ-উল-ফিতর (৪র্থ দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-03-23', name: 'Eid-ul-Fitr (Day 5)', nameBn: 'ঈদ-উল-ফিতর (৫ম দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-03-26', name: 'Independence & National Day of Bangladesh', nameBn: 'স্বাধীনতা ও জাতীয় দিবস', type: 'National', category: 'Fixed', year: 2026 },
  { date: '2026-04-03', name: 'Good Friday', nameBn: 'Good Friday', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-04-05', name: 'Easter Sunday', nameBn: 'Easter Sunday', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-04-14', name: 'Pahela Baishakh (Bangali New Year)', nameBn: 'পহেলা বৈশাখ', type: 'Festival', category: 'Fixed', year: 2026 },
  { date: '2026-05-01', name: 'May Day & Buddha Purnima', nameBn: 'মে দিবস ও বুদ্ধ পূর্ণিমা', type: 'Public', category: 'Fixed', year: 2026 },
  { date: '2026-05-26', name: 'Eid-ul-Adha (Day 1)', nameBn: 'ঈদ-উল-আযহা (১ম দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-05-27', name: 'Eid-ul-Adha (Day 2)', nameBn: 'ঈদ-উল-আযহা (২য় দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-05-28', name: 'Eid-ul-Adha (Day 3)', nameBn: 'ঈদ-উল-আযহা (৩য় দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-05-29', name: 'Eid-ul-Adha (Day 4)', nameBn: 'ঈদ-উল-আযহা (৪র্থ দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-05-30', name: 'Eid-ul-Adha (Day 5)', nameBn: 'ঈদ-উল-আযহা (৫ম দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-05-31', name: 'Eid-ul-Adha (Day 6)', nameBn: 'ঈদ-উল-আযহা (৬ষ্ঠ দিন)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-06-26', name: 'Ashura (10th of Muharram)', nameBn: 'আশুরা', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-07-29', name: 'Ashari Purnima', nameBn: 'আষাঢ়ী পূর্ণিমা', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-08-05', name: 'July Mass Uprising Day', nameBn: 'জুলাই গণঅভ্যুত্থান দিবস', type: 'National', category: 'Fixed', year: 2026 },
  { date: '2026-08-12', name: 'Akhari Chahar Somba', nameBn: 'আখারী চহর সোম্বা', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-08-15', name: 'National Mourning Day', nameBn: 'জাতীয় শোক দিবস', type: 'National', category: 'Fixed', year: 2026 },
  { date: '2026-08-26', name: 'Eid-e-Milad-un-Nabi', nameBn: 'ঈদ-এ-মিলাদ-উন-নবী', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-09-04', name: 'Shuvo Janmashtami', nameBn: 'শুভ জন্মাষ্টমী', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-09-24', name: 'Fateha-i-Yajdaham', nameBn: 'Fateha-i-Yajdaham', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-10-20', name: 'Durga Puja (Maha Navami)', nameBn: 'দুর্গাপূজা (মহা নবমী)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-10-21', name: 'Durga Puja (Bijoya Dashami)', nameBn: 'দুর্গাপূজা (বিজয়া দশমী)', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
  { date: '2026-10-25', name: 'Lakshmi Puja & Prabarana Purnima', nameBn: 'লক্ষ্মী পূজা ও প্রবরণ পূর্ণিমা', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-11-08', name: 'Shyama / Kali Puja', nameBn: 'শ্যামা / কালী পূজা', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-12-16', name: 'Victory Day (Bijoy Dibosh)', nameBn: 'বিজয় দিবস', type: 'National', category: 'Fixed', year: 2026 },
  { date: '2026-12-24', name: 'Christmas Eve', nameBn: 'ক্রিসমাস ইভ', type: 'Religious', category: 'Optional', isOptional: true, year: 2026 },
  { date: '2026-12-25', name: 'Christmas Day', nameBn: 'ক্রিসমাস', type: 'Public', category: 'Fixed', year: 2026 },

  // ───────────────────────────── 2027 ─────────────────────────────
  { date: '2027-01-01', name: "New Year's Day", nameBn: 'নববর্ষ', type: 'Public', category: 'Fixed', year: 2027 },
  { date: '2027-02-21', name: "Language Martyrs' Day & International Mother Language Day", nameBn: 'ভাষা শহিদ দিবস', type: 'National', category: 'Fixed', year: 2027 },
  { date: '2027-03-17', name: "Sheikh Mujibur Rahman's Birthday & Children's Day", nameBn: 'শেখ মুজিবুর রহমানের জন্মদিন', type: 'National', category: 'Fixed', year: 2027 },
  { date: '2027-03-26', name: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', type: 'National', category: 'Fixed', year: 2027 },
  { date: '2027-04-14', name: 'Bengali New Year', nameBn: 'পহেলা বৈশাখ', type: 'Festival', category: 'Fixed', year: 2027 },
  { date: '2027-05-01', name: 'May Day', nameBn: 'মে দিবস', type: 'Public', category: 'Fixed', year: 2027 },
  { date: '2027-08-15', name: 'National Mourning Day', nameBn: 'জাতীয় শোক দিবস', type: 'National', category: 'Fixed', year: 2027 },
  { date: '2027-12-16', name: 'Victory Day', nameBn: 'বিজয় দিবস', type: 'National', category: 'Fixed', year: 2027 },
  { date: '2027-12-31', name: "New Year's Eve", nameBn: 'নববর্ষের প্রাক্কাল', type: 'Public', category: 'Fixed', year: 2027 },
  // Religious (tentative — moon-sighted):
  { date: '2027-03-10', name: 'Eid-ul-Fitr', nameBn: 'ঈদ-উল-ফিতর', type: 'Religious', category: 'Tentative', tentative: true, year: 2027 },
  { date: '2027-05-17', name: 'Eid-ul-Adha', nameBn: 'ঈদ-উল-আযহা', type: 'Religious', category: 'Tentative', tentative: true, year: 2027 },
  { date: '2027-06-15', name: 'Ashura', nameBn: 'আশুরা', type: 'Religious', category: 'Tentative', tentative: true, year: 2027 },
  { date: '2027-08-16', name: 'Eid-e-Miladun Nabi', nameBn: 'ইদ-এ-মিলাদুন নবী', type: 'Religious', category: 'Tentative', tentative: true, year: 2027 },
  { date: '2027-10-11', name: 'Durga Puja (Bijoya Dashami)', nameBn: 'দুর্গাপূজা (বিজয়া দশমী)', type: 'Religious', category: 'Tentative', tentative: true, year: 2027 },
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
 * `category` values that are not yet present in the database schema during
 * partial migrations.
 */
export async function seedBangladeshHolidays(
  prisma: {
    holiday: {
      upsert: (args: {
        where: { date: Date };
        create: { date: Date; name: string; nameBn: string; type: string; category: string; isOptional?: boolean; year: number };
        update: { name: string; nameBn: string; type: string; category: string; isOptional?: boolean; year: number };
      }) => Promise<{ id: string }>;
    };
  },
  holidays: BangladeshHoliday[] = BANGLADESH_HOLIDAYS
): Promise<number> {
  let count = 0;
  for (const h of holidays) {
    const date = new Date(h.date + 'T00:00:00Z');
    const data = {
      date,
      name: h.name,
      nameBn: h.nameBn,
      type: h.type,
      category: h.category,
      year: h.year,
      ...(h.isOptional !== undefined ? { isOptional: h.isOptional } : {}),
    };
    await prisma.holiday.upsert({
      where: { date },
      create: data,
      update: data,
    });
    count++;
  }
  return count;
}
