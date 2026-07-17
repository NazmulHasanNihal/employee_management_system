import { describe, it, expect } from 'vitest';
import { getUserRank, canModifyUser } from '@/lib/hierarchy';

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
