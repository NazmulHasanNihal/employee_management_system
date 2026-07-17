// ─────────────────────────────────────────────────────────────────────────────
// Bangladesh statutory calculators (B2 / C4).
//
// Implementations follow the Bangladesh Labour Act (2006) and common
// organisational practice. Illustrative, not legal advice — verify thresholds
// against the current Finance Act / Labour Rules before real use.
// ─────────────────────────────────────────────────────────────────────────────

// Provident Fund (PF): employer typically contributes 10% of basic; employee
// contributes a matching 10%. We surface the employer portion here.
export const PF_RATE = 0.1; // 10% of basic salary

// Gratuity eligibility: payable after 5 years of continuous service.
export const GRATUITY_MIN_YEARS = 5;
// Gratuity formula: (15/26) * last drawn basic * completed years of service.
export const GRATUITY_FACTOR = 15 / 26;

// Bangladesh commonly grants two festival bonuses per year.
export const FESTIVAL_BONUS_OCCASIONS = 2;

export interface ProvidentFundResult {
  monthlyEmployer: number;
  monthlyEmployee: number;
  annualEmployer: number;
  annualEmployee: number;
}

/** Estimate Provident Fund contributions from monthly basic salary. */
export function estimateProvidentFund(
  monthlyBasic: number,
  rate: number = PF_RATE,
): ProvidentFundResult {
  const monthlyEmployer = Math.round(monthlyBasic * rate * 100) / 100;
  return {
    monthlyEmployer,
    monthlyEmployee: monthlyEmployer, // employee matches employer
    annualEmployer: Math.round(monthlyEmployer * 12 * 100) / 100,
    annualEmployee: Math.round(monthlyEmployer * 12 * 100) / 100,
  };
}

/**
 * Estimate gratuity payable on separation.
 * Returns 0 if service is below the 5-year eligibility threshold.
 */
export function estimateGratuity(
  lastDrawnBasicMonthly: number,
  yearsOfService: number,
): number {
  if (yearsOfService < GRATUITY_MIN_YEARS) return 0;
  const completedYears = Math.floor(yearsOfService);
  const gratuity =
    GRATUITY_FACTOR * lastDrawnBasicMonthly * completedYears;
  return Math.round(gratuity * 100) / 100;
}

/**
 * Estimate total festival bonus for a year. Bangladesh commonly grants two
 * festival bonuses, each up to one month's basic salary.
 */
export function estimateFestivalBonus(
  monthlyBasic: number,
  occasions: number = FESTIVAL_BONUS_OCCASIONS,
): number {
  return Math.round(monthlyBasic * occasions * 100) / 100;
}

/** Per-occasion festival bonus amount (one month's basic). */
export function festivalBonusPerOccasion(monthlyBasic: number): number {
  return Math.round(monthlyBasic * 100) / 100;
}
