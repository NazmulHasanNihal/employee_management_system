import { describe, it, expect } from 'vitest';
import { calculatePayroll, estimateMonthlyTax, estimateBdMonthlyTax, type SalaryHeadEntry } from '@/lib/payroll';

const head = (name: string, amount: number, type: 'EARNING' | 'DEDUCTION'): SalaryHeadEntry => ({ name, amount, type });

describe('calculatePayroll', () => {
  it('treats base salary as earnings', () => {
    const r = calculatePayroll(50000, []);
    expect(r.earnings).toBe(50000);
    // With gross 600k/yr BD, tax applies; deductions = tax > 0.
    expect(r.deductions).toBeGreaterThan(0);
    expect(r.net).toBe(Math.round((r.earnings - r.deductions) * 100) / 100);
  });

  it('has zero deductions for sub-threshold income (tax-free band)', () => {
    // 5,000/mo = 60,000/yr, below the 350k BD tax-free threshold.
    const r = calculatePayroll(5000, []);
    expect(r.earnings).toBe(5000);
    expect(r.deductions).toBe(0);
    expect(r.net).toBe(5000);
  });

  it('subtracts negative heads plus tax as deductions', () => {
    const r = calculatePayroll(5000, [head('Income Tax', -800, 'DEDUCTION'), head('Health Insurance', -200, 'DEDUCTION')]);
    expect(r.earnings).toBe(5000);
    // deductions = 800 + 200 (explicit) + monthly tax
    expect(r.deductions).toBeGreaterThanOrEqual(1000);
    expect(r.net).toBe(Math.round((5000 - r.deductions) * 100) / 100);
  });

  it('adds positive heads to earnings', () => {
    const r = calculatePayroll(5000, [head('House Rent Allowance', 1500, 'EARNING')]);
    expect(r.earnings).toBe(6500);
  });

  it('handles a full structure correctly', () => {
    const r = calculatePayroll(5000, [
      head('House Rent Allowance', 1500, 'EARNING'),
      head('Income Tax', -800, 'DEDUCTION'),
      head('Health Insurance', -200, 'DEDUCTION'),
    ]);
    expect(r.earnings).toBe(6500);
    expect(r.net).toBe(Math.round((6500 - r.deductions) * 100) / 100);
  });

  it('never returns negative earnings', () => {
    const r = calculatePayroll(0, []);
    expect(r.earnings).toBe(0);
    expect(r.net).toBe(0);
  });
});

describe('estimateMonthlyTax (Bangladesh)', () => {
  it('is zero for income within the tax-free band', () => {
    // annual gross 300k -> below 350k tax-free threshold
    expect(estimateMonthlyTax(300000)).toBe(0);
    expect(estimateBdMonthlyTax(300000)).toBe(0);
  });

  it('applies progressive BD slabs', () => {
    // annual gross 1,000,000:
    // 0-350k @0%, 350-500k @5% (7,500), 500-800k @10% (30,000), 800-1000k @15% (30,000)
    // total = 67,500 -> monthly = 5625
    const tax = estimateMonthlyTax(1000000);
    expect(tax).toBe(5625);
  });

  it('estimateMonthlyTax and estimateBdMonthlyTax are equivalent', () => {
    expect(estimateMonthlyTax(2000000)).toBe(estimateBdMonthlyTax(2000000));
  });
});
