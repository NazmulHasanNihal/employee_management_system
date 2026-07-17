// ─────────────────────────────────────────────────────────────────────────────
// Bangladesh payroll calculation.
//
// Replaces the previous US-IRS-style tax brackets with Bangladesh income-tax
// slabs (Finance Act, illustrative). All monetary values are BDT.
//
// NOTE: Bangladesh tax slabs are revised annually by the Finance Act. The slabs
// below are a reasonable, conservative default; adjust `BD_TAX_SLABS` per the
// applicable fiscal year before relying on them for real filings.
// ─────────────────────────────────────────────────────────────────────────────

export interface SalaryHeadEntry {
  name: string;
  amount: number; // positive = earning, negative = deduction (already-resolved)
  type: 'EARNING' | 'DEDUCTION';
}

export interface PayrollResult {
  earnings: number;
  deductions: number;
  tax: number;
  net: number;
}

// Annual income-tax slabs for an individual (BD, FY illustration).
// `upTo` is the upper bound of the band (inclusive) in BDT; `rate` is marginal.
export const BD_TAX_SLABS: { upTo: number; rate: number }[] = [
  { upTo: 350_000, rate: 0 }, // 0% up to 3.5 lakh
  { upTo: 500_000, rate: 0.05 }, // 5% next 1.5 lakh
  { upTo: 800_000, rate: 0.1 }, // 10% next 3 lakh
  { upTo: 1_200_000, rate: 0.15 }, // 15% next 4 lakh
  { upTo: 2_000_000, rate: 0.2 }, // 20% next 8 lakh
  { upTo: 30_00_000, rate: 0.25 }, // 25% next 10 lakh
  { upTo: Infinity, rate: 0.3 }, // 30% above 3 crore
];

// Conservative: tax rebate (sec 44) is available up to 10% of taxable income or
// 5,000,000 BDT — left at 0 here to avoid overstating net pay. Flip on when the
// filing context is known.
const TAX_REBATE_PCT = 0;
const TAX_REBATE_CAP = 5_000_000;

/**
 * Compute annual Bangladesh income tax using progressive marginal slabs, then
 * return the monthly portion.
 */
export function estimateBdMonthlyTax(annualGross: number): number {
  let remaining = Math.max(0, annualGross);
  let tax = 0;
  let lower = 0;
  for (const slab of BD_TAX_SLABS) {
    const width = slab.upTo - lower;
    const taxableInBand = Math.min(remaining, width);
    if (taxableInBand <= 0) break;
    tax += taxableInBand * slab.rate;
    remaining -= taxableInBand;
    lower = slab.upTo;
    if (remaining <= 0) break;
  }

  // Optional conservative rebate.
  if (TAX_REBATE_PCT > 0) {
    const rebate = Math.min(tax * TAX_REBATE_PCT, TAX_REBATE_CAP * TAX_REBATE_PCT);
    tax = Math.max(0, tax - rebate);
  }

  return Math.round((tax / 12) * 100) / 100;
}

/**
 * Backwards-compatible alias kept so existing callers/tests that import
 * `estimateMonthlyTax` continue to work. Now resolves to the BD calculation.
 */
export const estimateMonthlyTax = estimateBdMonthlyTax;

/**
 * Pure payroll calculation used by the payroll engine.
 *
 * - `baseSalary` is the monthly base.
 * - `heads` is an array of resolved salary-head entries (earnings positive,
 *   deductions negative). Deductions already include items such as PF; income
 *   tax is computed separately from annualized gross and subtracted on top.
 */
export function calculatePayroll(
  baseSalary: number,
  heads: SalaryHeadEntry[] = [],
): PayrollResult {
  let earnings = baseSalary;
  let deductions = 0;

  for (const head of heads) {
    if (head.amount >= 0) earnings += head.amount;
    else deductions += Math.abs(head.amount);
  }

  const annualGross = earnings * 12;
  const tax = estimateMonthlyTax(annualGross);

  const totalDeductions = Math.round((deductions + tax) * 100) / 100;
  const net = Math.round((earnings - deductions - tax) * 100) / 100;

  return {
    earnings: Math.round(earnings * 100) / 100,
    deductions: totalDeductions,
    tax,
    net,
  };
}
