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
    expect(byDate.get('2026-02-21')?.name).toMatch(/Language Martyrs/i);
    expect(byDate.get('2026-03-26')?.name).toBe('Independence Day');
    expect(byDate.get('2026-03-17')?.name).toMatch(/Mujibur Rahman/i);
    expect(byDate.get('2026-08-15')?.name).toBe('National Mourning Day');
    expect(byDate.get('2026-12-16')?.name).toBe('Victory Day');
    expect(byDate.get('2026-04-14')?.name).toBe('Bengali New Year');
    expect(byDate.get('2026-05-01')?.name).toBe('May Day');
  });

  it('flags all lunar/religious holidays as tentative', () => {
    const religious = BANGLADESH_HOLIDAYS.filter((h) => h.type === 'Religious');
    expect(religious.length).toBeGreaterThan(0);
    for (const h of religious) {
      expect(h.tentative).toBe(true);
    }
    // Fixed national holidays must NOT be flagged tentative.
    const fixed = BANGLADESH_HOLIDAYS.filter((h) => h.type === 'National');
    for (const h of fixed) {
      expect(h.tentative).not.toBe(true);
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
      { date: '2026-03-26', name: 'Independence Day', nameBn: 'স্বাধীনতা দিবস', type: 'National' },
      { date: '2026-03-22', name: 'Eid-ul-Fitr', nameBn: 'ঈদ-উল-ফিতর', type: 'Religious', tentative: true },
    ];
    const count = await seedBangladeshHolidays(fakePrisma as any, data);
    expect(count).toBe(2);
    expect(calls).toHaveLength(2);
    // Upsert key is the unique date, not an id.
    expect(calls[0].where).toEqual({ date: new Date('2026-03-26T00:00:00Z') });
    expect(calls[1].create.isTentative).toBe(true);
  });
});
