// ─────────────────────────────────────────────────────────────────────────────
// Compensation adjustment calculations.
//
// Pure functions for computing salary increments, decrements, and ad-hoc
// adjustments. All monetary values are BDT (monthly base salary). These are
// kept stateless and side-effect-free so they can be unit-tested without a
// database, mirroring the pattern in @/lib/payroll.ts.
// ─────────────────────────────────────────────────────────────────────────────

export type AdjustmentType = 'INCREMENT' | 'DECREMENT' | 'ADJUSTMENT';

/**
 * Result of a salary change calculation.
 */
export interface SalaryChangeResult {
  oldSalary: number;
  newSalary: number;
  delta: number; // signed: positive for increase, negative for decrease
  percentage: number; // signed percent change
}

/**
 * Compute the new salary from a percentage change.
 * - `percentage` is signed: positive = raise, negative = cut.
 * - Returns rounded values (2 decimal places for currency precision).
 */
export function calculateNewSalaryFromPercentage(
  oldSalary: number,
  percentage: number,
): SalaryChangeResult {
  if (oldSalary < 0) throw new Error('oldSalary must be non-negative');
  const pct = percentage / 100;
  const delta = Math.round((oldSalary * pct) * 100) / 100;
  const newSalary = Math.round((oldSalary + delta) * 100) / 100;
  return {
    oldSalary,
    newSalary,
    delta,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Compute the new salary from an absolute amount change.
 * - `amount` is signed: positive = raise, negative = cut.
 * - Returns rounded values.
 */
export function calculateNewSalaryFromAmount(
  oldSalary: number,
  amount: number,
): SalaryChangeResult {
  if (oldSalary < 0) throw new Error('oldSalary must be non-negative');
  const delta = Math.round(amount * 100) / 100;
  const newSalary = Math.round((oldSalary + delta) * 100) / 100;
  return {
    oldSalary,
    newSalary,
    delta,
    percentage: oldSalary > 0 ? Math.round(((delta / oldSalary) * 100) * 100) / 100 : 0,
  };
}

/**
 * Compute the new salary from an explicit target salary.
 * The delta and percentage are derived by comparing old vs new.
 */
export function calculateNewSalaryFromTarget(
  oldSalary: number,
  newSalary: number,
): SalaryChangeResult {
  if (oldSalary < 0) throw new Error('oldSalary must be non-negative');
  if (newSalary < 0) throw new Error('newSalary must be non-negative');
  const delta = Math.round((newSalary - oldSalary) * 100) / 100;
  const percentage = oldSalary > 0 ? Math.round(((delta / oldSalary) * 100) * 100) / 100 : 0;
  return {
    oldSalary,
    newSalary,
    delta,
    percentage,
  };
}

/**
 * Resolve the adjustment type from the computed delta.
 * - delta > 0  => INCREMENT
 * - delta < 0  => DECREMENT
 * - delta === 0 => ADJUSTMENT (explicit same-salary adjustment)
 */
export function inferAdjustmentType(delta: number): AdjustmentType {
  if (delta > 0) return 'INCREMENT';
  if (delta < 0) return 'DECREMENT';
  return 'ADJUSTMENT';
}

/**
 * Validate that a salary adjustment doesn't produce an invalid result.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateSalaryAdjustment(
  oldSalary: number,
  newSalary: number,
): string | null {
  if (oldSalary < 0) return 'Current salary must be non-negative';
  if (newSalary < 0) return 'New salary must be non-negative';
  if (oldSalary === newSalary) return 'New salary must differ from current salary';
  return null;
}

/**
 * Compute the projected annual cost impact of a salary change for budgeting.
 */
export function computeAnnualCostImpact(delta: number): number {
  return Math.round(delta * 12 * 100) / 100;
}
