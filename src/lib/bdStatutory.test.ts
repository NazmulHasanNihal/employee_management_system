import { describe, it, expect } from 'vitest';
import {
  estimateProvidentFund,
  estimateGratuity,
  estimateFestivalBonus,
  festivalBonusPerOccasion,
  PF_RATE,
  GRATUITY_MIN_YEARS,
  FESTIVAL_BONUS_OCCASIONS,
} from '@/lib/bdStatutory';

describe('estimateProvidentFund', () => {
  it('computes 10% employer and matching employee contribution', () => {
    const r = estimateProvidentFund(50000);
    expect(r.monthlyEmployer).toBe(5000);
    expect(r.monthlyEmployee).toBe(5000);
    expect(r.annualEmployer).toBe(60000);
  });

  it('respects a custom rate', () => {
    const r = estimateProvidentFund(50000, 0.08);
    expect(r.monthlyEmployer).toBe(4000);
  });

  it('uses the default PF rate of 10%', () => {
    expect(PF_RATE).toBe(0.1);
  });
});

describe('estimateGratuity', () => {
  it('returns 0 below the 5-year eligibility threshold', () => {
    expect(estimateGratuity(50000, 3)).toBe(0);
    expect(GRATUITY_MIN_YEARS).toBe(5);
  });

  it('computes (15/26) * basic * years after 5 years', () => {
    // (15/26) * 50000 * 6 = 173076.92...
    const g = estimateGratuity(50000, 6);
    expect(g).toBe(Math.round((15 / 26) * 50000 * 6 * 100) / 100);
    expect(g).toBeGreaterThan(170000);
  });

  it('floors partial years', () => {
    const full = estimateGratuity(50000, 6);
    const partial = estimateGratuity(50000, 6.9);
    expect(partial).toBe(full); // Math.floor(6.9) === 6
  });
});

describe('estimateFestivalBonus', () => {
  it('defaults to two occasions (two months basic)', () => {
    expect(estimateFestivalBonus(50000)).toBe(100000);
    expect(FESTIVAL_BONUS_OCCASIONS).toBe(2);
  });

  it('scales with number of occasions', () => {
    expect(estimateFestivalBonus(50000, 1)).toBe(50000);
    expect(festivalBonusPerOccasion(50000)).toBe(50000);
  });
});
