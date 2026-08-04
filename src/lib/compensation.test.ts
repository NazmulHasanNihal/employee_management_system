import { describe, it, expect } from 'vitest';
import {
  calculateNewSalaryFromPercentage,
  calculateNewSalaryFromAmount,
  calculateNewSalaryFromTarget,
  inferAdjustmentType,
  validateSalaryAdjustment,
  computeAnnualCostImpact,
} from '@/lib/compensation';

describe('calculateNewSalaryFromPercentage', () => {
  it('computes a positive increment correctly', () => {
    const r = calculateNewSalaryFromPercentage(50000, 10);
    expect(r.oldSalary).toBe(50000);
    expect(r.newSalary).toBe(55000);
    expect(r.delta).toBe(5000);
    expect(r.percentage).toBe(10);
  });

  it('computes a negative decrement correctly', () => {
    const r = calculateNewSalaryFromPercentage(60000, -5);
    expect(r.newSalary).toBe(57000);
    expect(r.delta).toBe(-3000);
    expect(r.percentage).toBe(-5);
  });

  it('handles zero percentage', () => {
    const r = calculateNewSalaryFromPercentage(50000, 0);
    expect(r.newSalary).toBe(50000);
    expect(r.delta).toBe(0);
    expect(r.percentage).toBe(0);
  });

  it('handles fractional percentages with rounding', () => {
    const r = calculateNewSalaryFromPercentage(50000, 3.333);
    expect(r.delta).toBe(1666.5);
    expect(r.newSalary).toBe(51666.5);
  });

  it('throws on negative oldSalary', () => {
    expect(() => calculateNewSalaryFromPercentage(-100, 10)).toThrow();
  });
});

describe('calculateNewSalaryFromAmount', () => {
  it('computes increment from absolute amount', () => {
    const r = calculateNewSalaryFromAmount(50000, 5000);
    expect(r.newSalary).toBe(55000);
    expect(r.delta).toBe(5000);
    expect(r.percentage).toBe(10);
  });

  it('computes decrement from absolute amount', () => {
    const r = calculateNewSalaryFromAmount(50000, -7500);
    expect(r.newSalary).toBe(42500);
    expect(r.delta).toBe(-7500);
    expect(r.percentage).toBe(-15);
  });

  it('percentage is 0 when oldSalary is 0', () => {
    const r = calculateNewSalaryFromAmount(0, 5000);
    expect(r.percentage).toBe(0);
    expect(r.newSalary).toBe(5000);
  });
});

describe('calculateNewSalaryFromTarget', () => {
  it('derives delta and percentage from target', () => {
    const r = calculateNewSalaryFromTarget(40000, 48000);
    expect(r.delta).toBe(8000);
    expect(r.percentage).toBe(20);
  });

  it('handles target lower than old', () => {
    const r = calculateNewSalaryFromTarget(50000, 45000);
    expect(r.delta).toBe(-5000);
    expect(r.percentage).toBe(-10);
  });
});

describe('inferAdjustmentType', () => {
  it('returns INCREMENT for positive delta', () => {
    expect(inferAdjustmentType(5000)).toBe('INCREMENT');
  });

  it('returns DECREMENT for negative delta', () => {
    expect(inferAdjustmentType(-5000)).toBe('DECREMENT');
  });

  it('returns ADJUSTMENT for zero delta', () => {
    expect(inferAdjustmentType(0)).toBe('ADJUSTMENT');
  });
});

describe('validateSalaryAdjustment', () => {
  it('returns null for valid adjustment', () => {
    expect(validateSalaryAdjustment(50000, 55000)).toBeNull();
  });

  it('returns error for negative old salary', () => {
    const err = validateSalaryAdjustment(-1, 50000);
    expect(err).toContain('non-negative');
  });

  it('returns error for negative new salary', () => {
    const err = validateSalaryAdjustment(50000, -1);
    expect(err).toContain('non-negative');
  });

  it('returns error when old and new are equal', () => {
    const err = validateSalaryAdjustment(50000, 50000);
    expect(err).toContain('differ');
  });
});

describe('computeAnnualCostImpact', () => {
  it('multiplies delta by 12', () => {
    expect(computeAnnualCostImpact(5000)).toBe(60000);
  });

  it('handles negative delta', () => {
    expect(computeAnnualCostImpact(-3000)).toBe(-36000);
  });
});
