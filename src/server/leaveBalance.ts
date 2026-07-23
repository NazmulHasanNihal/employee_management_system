// Bangladesh Labour Act (2006) leave accrual — illustrative, not legal advice.
// Casual: 10 days/yr (1/day per month, non-cumulative beyond year)
// Earned/Annual: 1 day per 18 worked days (~14-16/yr after 1 yr)
// Sick: 14 days/yr
// Festival: 11 days/yr (national + religious festival block)
// Maternity: 16 weeks / 112 days (female, up to 2 children)
// Paternity: 2 days (common organisational policy)
// Optional Religious: up to 3 days/yr (employee elects from approved list)
//
// Festival work compensation (BLA): if employee is required to work on a
// festival day, they receive 1 substitute holiday + 2 compensatory holidays
// with full pay, logged via FestivalWorkLog.
//
// P1 — Tightened to an APPROVED-POLICY-shaped model (carry-forward + leave-year
// reset). The numbers are config-driven constants grouped in LEAVE_POLICY so
// HR can tune them against the actual approved policy without touching logic.
// `carryForward` and `leaveYearStart` (month/day) control the reset behaviour.
//
// NOTE: still illustrative — verify thresholds against the current Finance Act
// / Labour Rules before relying on them for pay or compliance.

export type LeaveCategory =
  | 'Casual'
  | 'Earned'
  | 'Sick'
  | 'Festival'
  | 'Maternity'
  | 'Paternity'
  | 'Optional';

export interface LeaveBucket {
  total: number;
  used: number;
  remaining: number;
  /** Days carried forward from the previous leave year (if any). */
  carriedForward?: number;
}

/**
 * Approved-policy-shaped constants. Tune these to match your organisation's
 * ratified leave policy. `leaveYearStart` uses a calendar-month/day (Bangladesh
 * commonly follows the Gregorian calendar year, so Jan 1 by default).
 */
export const LEAVE_POLICY = {
  leaveYearStart: { month: 0, day: 1 }, // Jan 1 (month is 0-indexed)
  casual: { perYear: 10, accruesPerMonth: true, carryForward: 0 }, // 10 days, non-cumulative
  earned: { perYear: 14, carryForward: 30 }, // 1 day per 18 worked days, up to 30 carried forward
  sick: { perYear: 14, carryForward: 0 }, // 14 days, non-cumulative
  festival: { perYear: 11, carryForward: 0 }, // 11 festival days (national + religious)
  maternity: { perYear: 112, carryForward: 0, minServiceMonths: 0 }, // 16 weeks / 112 days
  paternity: { perYear: 2, carryForward: 0, minServiceMonths: 0 },
  optional: { perYear: 3, carryForward: 0 }, // up to 3 optional religious holidays per year
} as const;

/** Returns the start (ms) of the current leave year given the policy. */
export function currentLeaveYearStart(
  policy: typeof LEAVE_POLICY = LEAVE_POLICY,
  now: Date = new Date(),
): Date {
  const y = now.getFullYear();
  const start = new Date(y, policy.leaveYearStart.month, policy.leaveYearStart.day, 0, 0, 0, 0);
  // If we're before this year's start date, the leave year began last year.
  return now >= start ? start : new Date(y - 1, policy.leaveYearStart.month, policy.leaveYearStart.day, 0, 0, 0, 0);
}

/** Months of service as of `now` (rounded down). */
export function monthsOfService(createdAt?: Date | null, now: Date = new Date()): number {
  if (!createdAt) return 0;
  return Math.max(0, Math.floor((now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));
}

/** Whole years of service as of `now`. */
export function yearsOfService(createdAt?: Date | null, now: Date = new Date()): number {
  if (!createdAt) return 0;
  return Math.max(0, (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365));
}

export interface LeaveBalancePolicyInput {
  createdAt?: Date | null;
  usedByCategory: Record<string, number>;
  gender?: string | null;
  /** Optional override of carried-forward days per category (from prior year). */
  carriedForward?: Record<string, number>;
  policy?: typeof LEAVE_POLICY;
}

export function computeBdLeaveBalance(opts: LeaveBalancePolicyInput): Record<string, LeaveBucket> {
  const policy = opts.policy ?? LEAVE_POLICY;
  const now = new Date();
  const monthsEmployed = monthsOfService(opts.createdAt, now);
  const carried = opts.carriedForward ?? {};

  // Pro-rata accrual for the current leave year. Employees mid-year get a
  // pro-rated grant (months elapsed in the current leave year / 12).
  const lyStart = currentLeaveYearStart(policy, now);
  const monthsIntoYear = Math.max(
    1,
    Math.floor((now.getTime() - lyStart.getTime()) / (1000 * 60 * 60 * 24 * 30)),
  );
  const prorata = Math.min(1, monthsIntoYear / 12);

  const casualTotal = policy.casual.accruesPerMonth
    ? Math.min(policy.casual.perYear, monthsEmployed) // 1/day per month, capped at yearly max
    : Math.round(policy.casual.perYear * prorata);
  // Employees who joined before this leave year began get the full annual grant;
  // those who joined mid-year get a pro-rated grant by service. Carry-forward
  // (earned only, per policy) is added on top.
  const joinedThisYear = !!opts.createdAt && new Date(opts.createdAt) >= lyStart;
  const earnedTotal = joinedThisYear
    ? Math.floor((policy.earned.perYear / 12) * monthsEmployed) +
      Math.min(policy.earned.carryForward, carried.Earned || 0)
    : policy.earned.perYear + Math.min(policy.earned.carryForward, carried.Earned || 0);
  const sickTotal = (joinedThisYear ? Math.floor(policy.sick.perYear * prorata) : policy.sick.perYear) +
    Math.min(policy.sick.carryForward, carried.Sick || 0);
  const festivalTotal = policy.festival.perYear;
  const maternityTotal =
    opts.gender === 'Female' && monthsEmployed >= policy.maternity.minServiceMonths
      ? policy.maternity.perYear
      : 0;
  const paternityTotal =
    opts.gender === 'Male' && monthsEmployed >= policy.paternity.minServiceMonths
      ? policy.paternity.perYear
      : 0;
  const optionalTotal = policy.optional.perYear;

  const used = (t: string) => opts.usedByCategory[t] || 0;
  const bucket = (total: number, t: string): LeaveBucket => ({
    total: Math.max(0, Math.round(total)),
    used: used(t),
    remaining: Math.max(0, Math.round(total) - used(t)),
    carriedForward: carried[t] || 0,
  });

  return {
    Casual: bucket(casualTotal, 'Casual'),
    Earned: bucket(earnedTotal, 'Earned'),
    Sick: bucket(sickTotal, 'Sick'),
    Festival: bucket(festivalTotal, 'Festival'),
    Optional: bucket(optionalTotal, 'Optional'),
    ...(maternityTotal ? { Maternity: bucket(maternityTotal, 'Maternity') } : {}),
    ...(paternityTotal ? { Paternity: bucket(paternityTotal, 'Paternity') } : {}),
  };
}

/**
 * Computes festival work compensation owed under Bangladesh Labour Act.
 * When an employee is required to work on a festival day, they receive:
 *   1 substitute holiday + 2 compensatory holidays (full pay).
 *
 * @param workLogs Array of FestivalWorkLog entries for the employee in the current leave year.
 * @returns Object with substitute and compensatory days owed/remaining.
 */
export function computeFestivalCompensation(workLogs: { substituteDate: Date | null; compensatoryDays: number; isCompensated: boolean }[]): { substituteOwed: number; substituteTaken: number; compensatoryOwed: number; compensatoryTaken: number } {
  const substituteOwed = workLogs.length;
  const substituteTaken = workLogs.filter((w) => w.substituteDate !== null).length;
  const compensatoryOwed = workLogs.reduce((sum, w) => sum + w.compensatoryDays, 0);
  const compensatoryTaken = workLogs.filter((w) => w.isCompensated).reduce((sum, w) => sum + w.compensatoryDays, 0);

  return {
    substituteOwed,
    substituteTaken,
    compensatoryOwed,
    compensatoryTaken,
  };
}
