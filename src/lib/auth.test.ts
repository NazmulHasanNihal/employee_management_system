import { describe, it, expect } from 'vitest';
import { derivePrivileges } from '@/lib/auth';

describe('derivePrivileges (CEO-spoof prevention)', () => {
  it('grants CEO privilege to the system owner regardless of role', () => {
    const p = derivePrivileges({ role: 'Employee', isOwner: true });
    expect(p.isCEO).toBe(true);
    expect(p.isAdmin).toBe(false);
  });

  it('grants CEO privilege when role is CEO', () => {
    const p = derivePrivileges({ role: 'CEO', isOwner: false });
    expect(p.isCEO).toBe(true);
  });

  it('does NOT grant CEO from a self-editable designation (designation is not an input here)', () => {
    // The legacy bug derived CEO from designation.includes('ceo'). `derivePrivileges`
    // only sees `role` + `isOwner`, so a user who sets their own designation to
    // "CEO" while role stays "Employee" gets no CEO power.
    const p = derivePrivileges({ role: 'Employee', isOwner: false });
    expect(p.isCEO).toBe(false);
    expect(p.isAdmin).toBe(false);
  });

  it('treats HR Manager as admin but not CEO', () => {
    const p = derivePrivileges({ role: 'HR Manager', isOwner: false });
    expect(p.isAdmin).toBe(true);
    expect(p.isHR).toBe(true);
    expect(p.isCEO).toBe(false);
  });

  it('plain Employee has no special privileges', () => {
    const p = derivePrivileges({ role: 'Employee', isOwner: false });
    expect(p).toEqual({ isAdmin: false, isHR: false, isCEO: false });
  });
});
