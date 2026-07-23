import { describe, it, expect } from 'vitest';
import {
  computeBdLeaveBalance,
  currentLeaveYearStart,
  LEAVE_POLICY,
  monthsOfService,
} from './leaveBalance';

describe('leave year', () => {
  it('starts Jan 1 of the current year (default policy)', () => {
    const start = currentLeaveYearStart(LEAVE_POLICY, new Date('2026-07-17'));
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(start.getFullYear()).toBe(2026);
  });
});

describe('BD leave balance (approved-policy model)', () => {
  const createdAt = new Date('2025-01-01'); // >1 yr employed

  it('grants statutory maxima for tenured employees', () => {
    const bal = computeBdLeaveBalance({
      createdAt,
      usedByCategory: {},
      gender: 'Female',
    });
    expect(bal.Casual.total).toBe(10);
    expect(bal.Earned.total).toBe(14);
    expect(bal.Sick.total).toBe(14);
    expect(bal.Festival.total).toBe(11);
    expect(bal.Optional.total).toBe(3);
    expect(bal.Maternity.total).toBe(112);
  });

  it('caps remaining at 0 and reflects usage', () => {
    const bal = computeBdLeaveBalance({
      createdAt,
      usedByCategory: { Casual: 10, Earned: 4, Festival: 1 },
      gender: 'Male',
    });
    expect(bal.Casual.remaining).toBe(0);
    expect(bal.Earned.remaining).toBe(10);
    expect(bal.Festival.remaining).toBe(10);
    expect(bal.Optional.total).toBe(3);
    expect(bal.Paternity.total).toBe(2);
    expect(bal.Maternity).toBeUndefined();
  });

  it('applies carry-forward for earned leave when provided', () => {
    const bal = computeBdLeaveBalance({
      createdAt,
      usedByCategory: {},
      gender: 'Male',
      carriedForward: { Earned: 5 },
    });
    expect(bal.Earned.total).toBe(14 + 5);
    expect(bal.Earned.carriedForward).toBe(5);
  });

  it('does not over-grant to brand-new hires', () => {
    const bal = computeBdLeaveBalance({
      createdAt: new Date(), // just hired
      usedByCategory: {},
      gender: 'Male',
    });
    expect(bal.Earned.total).toBeLessThan(14); // pro-rated, < 1 yr
  });

  it('monthsOfService is non-negative', () => {
    expect(monthsOfService(null)).toBe(0);
    expect(monthsOfService(new Date('2025-01-01'), new Date('2026-07-17'))).toBe(18);
  });
});
