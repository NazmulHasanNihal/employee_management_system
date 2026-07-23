import { describe, it, expect } from 'vitest';
import {
  BANGLADESH_HOLIDAYS,
  getBangladeshHolidays,
  seedBangladeshHolidays,
  type BangladeshHoliday,
} from '@/lib/bangladesh-holidays';

describe('bangladesh-holidays dataset', () => {
  it('contains entries across 2025–2027', () => {
    const years = new Set(BANGLADESH_HOLIDAYS.map((h) => h.date.slice(0, 4)));
    expect(years.has('2025')).toBe(true);
    expect(years.has('2026')).toBe(true);
    expect(years.has('2027')).toBe(true);
  });

  it('is sorted ascending by date and has unique dates', () => {
    const dates = BANGLADESH_HOLIDAYS.map((h) => h.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('includes the core fixed national holidays on official dates', () => {
    const byDate = new Map(BANGLADESH_HOLIDAYS.map((h) => [h.date, h]));
    expect(byDate.get('2026-02-21')?.name).toMatch(/Shahid Dibosh|Language Martyrs/i);
    expect(byDate.get('2026-03-26')?.name).toMatch(/Independence/i);
    expect(byDate.get('2026-03-17')?.name).toMatch(/Mujibur Rahman/i);
    expect(byDate.get('2026-08-15')?.name).toBe('National Mourning Day');
    expect(byDate.get('2026-12-16')?.name).toMatch(/Victory Day/i);
    expect(byDate.get('2026-04-14')?.name).toMatch(/Bengali New Year|Pahela Baishakh/i);
    expect(byDate.get('2026-05-01')?.name).toMatch(/May Day/i);
    expect(byDate.get('2026-08-05')?.name).toBe('July Mass Uprising Day');
    expect(byDate.get('2026-12-25')?.name).toBe('Christmas Day');
  });

  it('flags all lunar/religious holidays as tentative', () => {
    const religious = BANGLADESH_HOLIDAYS.filter((h) => h.type === 'Religious');
    expect(religious.length).toBeGreaterThan(0);
    // Moon-sighted / government-to-confirm holidays must be Tentative.
    const lunar = religious.filter((h) => !h.isOptional);
    for (const h of lunar) {
      expect(h.category).toBe('Tentative');
    }
    // Optional religious holidays must be marked Optional.
    const optional = religious.filter((h) => h.isOptional);
    for (const h of optional) {
      expect(h.category).toBe('Optional');
    }
    // Fixed national holidays must NOT be flagged tentative.
    const fixed = BANGLADESH_HOLIDAYS.filter((h) => h.type === 'National');
    for (const h of fixed) {
      expect(h.category).not.toBe('Tentative');
    }
  });

  it('provides Bengali names for every holiday', () => {
    for (const h of BANGLADESH_HOLIDAYS) {
      expect(h.nameBn).toBeTruthy();
    }
  });

  it('getBangladeshHolidays filters by year', () => {
    const y2026 = getBangladeshHolidays([2026]);
    expect(y2026.every((h) => h.date.startsWith('2026'))).toBe(true);
    expect(y2026.length).toBeGreaterThan(0);
    expect(getBangladeshHolidays([2026]).length).toBe(y2026.length);
  });

  it('seedBangladeshHolidays upserts by date without duplicating', async () => {
    const calls: { where: any; create: any; update: any }[] = [];
    const fakePrisma = {
      holiday: {
        async upsert(args: any) {
          calls.push(args);
          return { id: 'x', ...args.create };
        },
      },
    };
    const data: BangladeshHoliday[] = [
      { date: '2026-03-26', name: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', type: 'National', category: 'Fixed', year: 2026 },
      { date: '2026-03-22', name: 'Eid-ul-Fitr', nameBn: 'ঈদ-উল-ফিতর', type: 'Religious', category: 'Tentative', tentative: true, year: 2026 },
    ];
    const count = await seedBangladeshHolidays(fakePrisma as any, data);
    expect(count).toBe(2);
    expect(calls).toHaveLength(2);
    // Upsert key is the unique date, not an id.
    expect(calls[0].where).toEqual({ date: new Date('2026-03-26T00:00:00Z') });
    expect(calls[1].create.category).toBe('Tentative');
  });
});
