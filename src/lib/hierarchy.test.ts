import { describe, it, expect } from 'vitest';
import {
  getUserRank,
  canModifyUser,
  isSalaryExempt,
  getReportingChainSubordinates,
  isSubordinate,
} from '@/lib/hierarchy';

describe('getUserRank', () => {
  it('ranks CEO highest (rank 1)', () => {
    expect(getUserRank('CEO', 'Anything')).toBe(1);
  });

  it('does NOT grant CEO rank from a self-set designation', () => {
    // This is the historical privilege-escalation bug: designation 'CEO' used to grant power.
    expect(getUserRank('Employee', 'CEO and Founder')).toBe(6);
  });

  it('ranks Admin above Manager', () => {
    expect(getUserRank('Admin')).toBeLessThan(getUserRank('Manager'));
  });

  it('defaults unknown roles to lowest rank', () => {
    expect(getUserRank('Intern')).toBe(6);
  });
});

describe('canModifyUser', () => {
  it('prevents modifying the system owner', () => {
    expect(canModifyUser({ role: 'CEO', isOwner: true }, { role: 'Employee', isOwner: true })).toBe(false);
  });

  it('allows a manager to modify their report', () => {
    expect(canModifyUser({ role: 'Manager' }, { role: 'Employee' })).toBe(true);
  });

  it('blocks an employee modifying a manager', () => {
    expect(canModifyUser({ role: 'Employee' }, { role: 'Manager' })).toBe(false);
  });
});

describe('isSalaryExempt', () => {
  it('identifies CEO role as salary-exempt', () => {
    expect(isSalaryExempt('CEO')).toBe(true);
  });

  it('identifies non-CEO roles as not salary-exempt', () => {
    expect(isSalaryExempt('Manager')).toBe(false);
    expect(isSalaryExempt('Director')).toBe(false);
    expect(isSalaryExempt('Employee')).toBe(false);
  });
});

describe('getReportingChainSubordinates & isSubordinate', () => {
  const users = [
    { id: 'ceo', managerId: null },
    { id: 'cto', managerId: 'ceo' },
    { id: 'coo', managerId: 'ceo' },
    { id: 'dev-lead', managerId: 'cto' },
    { id: 'senior-dev', managerId: 'dev-lead' },
  ];

  it('returns all direct and indirect reports for CEO', () => {
    const subs = getReportingChainSubordinates('ceo', users);
    expect(subs.has('cto')).toBe(true);
    expect(subs.has('coo')).toBe(true);
    expect(subs.has('dev-lead')).toBe(true);
    expect(subs.has('senior-dev')).toBe(true);
    expect(subs.size).toBe(4);
  });

  it('returns direct and indirect reports for CTO', () => {
    const subs = getReportingChainSubordinates('cto', users);
    expect(subs.has('dev-lead')).toBe(true);
    expect(subs.has('senior-dev')).toBe(true);
    expect(subs.has('coo')).toBe(false);
    expect(subs.size).toBe(2);
  });

  it('correctly tests isSubordinate', () => {
    expect(isSubordinate('ceo', 'cto', users)).toBe(true);
    expect(isSubordinate('cto', 'senior-dev', users)).toBe(true);
    expect(isSubordinate('coo', 'cto', users)).toBe(false);
    expect(isSubordinate('dev-lead', 'ceo', users)).toBe(false);
  });
});

