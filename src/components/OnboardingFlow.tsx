'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Rocket, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/lib/translations';
import { useAppStore } from '@/lib/store';
import { validateNid } from '@/lib/nid';

export default function OnboardingFlow({ user, requiresPassword }: { user: any, requiresPassword?: boolean }) {
  const router = useRouter();
  const { language } = useAppStore();
  const t = useTranslation(language);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
    nid: '',
    bloodGroup: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.phone && !/^[0-9+()\-\s]{6,}$/.test(form.phone)) e.phone = 'Invalid phone number';
    if (form.nid && !validateNid(form.nid)) e.nid = 'NID must be 10, 13, or 17 digits';
    if (requiresPassword) {
      if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (form.emergencyContactPhone && !/^[0-9+()\-\s]{6,}$/.test(form.emergencyContactPhone))
      e.emergencyContactPhone = 'Invalid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const completeOnboarding = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || null,
          nid: form.nid || null,
          bloodGroup: form.bloodGroup || null,
          gender: form.gender || null,
          address: form.address || null,
          emergencyContactName: form.emergencyContactName || null,
          emergencyContactPhone: form.emergencyContactPhone || null,
          ...(requiresPassword && form.password ? { password: form.password } : {}),
        }),
      });
      if (res.ok) {
        // Soft client navigation + server refresh (no full page reload) so the
        // protected layout re-reads isOnboarded and lands the user in the app.
        router.refresh();
        router.push('/');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to complete onboarding. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-app)] p-4">
      <div className="ledger-accent" />
      <div className="ledger-card relative z-10 w-full max-w-lg animate-fade-up rounded-2xl p-8 shadow-[var(--shadow-lg)]">
        <div className="absolute left-0 top-0 h-1 w-full overflow-hidden rounded-t-2xl bg-[var(--bg-hover)]">
          <div className="h-full bg-[var(--brand)] transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <Rocket className="text-[var(--brand)]" size={32} />
          </div>
          <h1 className="mb-1 text-fluid-2xl font-extrabold tracking-tight text-[var(--text-main)]">
            {t('Welcome to the Platform')}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {t('Your identity has been authenticated as')} <strong className="text-[var(--brand)]">{user?.name}</strong>.
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Step {step} of 3 — Complete your profile
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--rose)]/40 bg-[var(--rose-soft)] p-3 text-xs font-medium text-[var(--rose)]">
            <ShieldAlert size={14} /> {error}
          </div>
        )}

        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="onboarding-name" className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Full Name</label>
              <input id="onboarding-name" value={form.name} onChange={(e) => update('name', e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="Your full name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'onboarding-name-error' : undefined} />
              {errors.name && <p id="onboarding-name-error" className="text-[10px] text-[var(--rose)]">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="onboarding-phone" className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Phone Number</label>
              <input id="onboarding-phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="+880 1XXX-XXXXXX" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'onboarding-phone-error' : undefined} />
              {errors.phone && <p id="onboarding-phone-error" className="text-[10px] text-[var(--rose)]">{errors.phone}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="onboarding-nid" className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">National ID (NID)</label>
              <input id="onboarding-nid" value={form.nid} onChange={(e) => update('nid', e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="10 / 13 / 17 digits" aria-invalid={Boolean(errors.nid)} aria-describedby={errors.nid ? 'onboarding-nid-error' : undefined} />
              {errors.nid && <p id="onboarding-nid-error" className="text-[10px] text-[var(--rose)]">{errors.nid}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="onboarding-blood" className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Blood Group</label>
                <select id="onboarding-blood" value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="onboarding-gender" className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Gender</label>
                <select id="onboarding-gender" value={form.gender} onChange={(e) => update('gender', e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Select</option>
                  {['Male', 'Female', 'Non-Binary', 'Prefer Not to Say'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            {requiresPassword && (
              <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-hairline)] pt-4 mt-2">
                <div className="space-y-1">
                  <label htmlFor="onboarding-password" className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Set Password</label>
                  <input id="onboarding-password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="••••••••" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'onboarding-password-error' : undefined} />
                  {errors.password && <p id="onboarding-password-error" className="text-[10px] text-[var(--rose)]">{errors.password}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="onboarding-confirm-password" className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Confirm Password</label>
                  <input id="onboarding-confirm-password" type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="••••••••" aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'onboarding-confirm-password-error' : undefined} />
                  {errors.confirmPassword && <p id="onboarding-confirm-password-error" className="text-[10px] text-[var(--rose)]">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}
            <ButtonRow onBack={back} onNext={next} step={step} loading={loading} />
          </div>
        )}

        {/* Step 2: Contact & Emergency */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="onboarding-address" className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Address</label>
              <input id="onboarding-address" value={form.address} onChange={(e) => update('address', e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="Street, City" aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'onboarding-address-error' : undefined} />
              {errors.address && <p id="onboarding-address-error" className="text-[10px] text-[var(--rose)]">{errors.address}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="onboarding-emergency-name" className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Emergency Contact Name</label>
              <input id="onboarding-emergency-name" value={form.emergencyContactName} onChange={(e) => update('emergencyContactName', e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="Next of kin" />
            </div>
            <div className="space-y-1">
              <label htmlFor="onboarding-emergency-phone" className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Emergency Contact Phone</label>
              <input id="onboarding-emergency-phone" value={form.emergencyContactPhone} onChange={(e) => update('emergencyContactPhone', e.target.value)} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="+880 1XXX-XXXXXX" aria-invalid={Boolean(errors.emergencyContactPhone)} aria-describedby={errors.emergencyContactPhone ? 'onboarding-emergency-phone-error' : undefined} />
              {errors.emergencyContactPhone && <p id="onboarding-emergency-phone-error" className="text-[10px] text-[var(--rose)]">{errors.emergencyContactPhone}</p>}
            </div>
            <ButtonRow onBack={back} onNext={next} step={step} loading={loading} />
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-4 text-sm space-y-1">
              <Row label="Name" value={form.name} />
              <Row label="Phone" value={form.phone || '—'} />
              <Row label="NID" value={form.nid ? `${'•'.repeat(Math.max(0, form.nid.replace(/\D/g, '').length - 4))}${form.nid.replace(/\D/g, '').slice(-4)}` : '—'} />
              <Row label="Blood" value={form.bloodGroup || '—'} />
              <Row label="Gender" value={form.gender || '—'} />
              <Row label="Emergency" value={form.emergencyContactName ? `${form.emergencyContactName} (${form.emergencyContactPhone || 'no phone'})` : '—'} />
            </div>
            <div className="flex gap-4">
              <button onClick={back} disabled={loading} className="flex-1 rounded-xl border border-[var(--border-hairline)] py-3 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] disabled:opacity-50">
                Back
              </button>
              <button
                onClick={completeOnboarding}
                disabled={loading}
                className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm disabled:opacity-50"
              >
                {loading ? t('Initializing Workspace...') : <><CheckCircle2 size={18} /> {t('Initialize Workspace')}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-semibold text-[var(--text-main)] truncate max-w-[60%]">{value}</span>
    </div>
  );
}

function ButtonRow({ onBack, onNext, step, loading }: { onBack: () => void; onNext: () => void; step: number; loading: boolean }) {
  return (
    <div className="flex gap-4">
      <button onClick={onBack} disabled={loading} className="flex-1 rounded-xl border border-[var(--border-hairline)] py-3 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] disabled:opacity-50">
        Back
      </button>
      <button onClick={onNext} disabled={loading} className="btn-primary flex flex-1 items-center justify-center rounded-xl py-3 text-sm disabled:opacity-50">
        Next
      </button>
    </div>
  );
}
