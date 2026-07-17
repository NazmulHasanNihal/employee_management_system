'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/components/UserProvider';
import { updateProfileField, updateProfileBatch } from '@/app/actions/profile';

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  employmentType?: string | null;
  linkedin?: string | null;
  github?: string | null;
  twitter?: string | null;
  website?: string | null;
  managerId?: string | null;
  department?: string | null;
  designation?: string | null;
  status?: string | null;
  baseSalary?: number | null;
  nid?: string | null;
  nidMasked?: string | null;
  bloodGroup?: string | null;
  religion?: string | null;
  preferredLanguage?: string | null;
};

const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern'];

function FieldRow({
  label,
  field,
  value,
  type = 'text',
  placeholder,
}: {
  label: string;
  field: string;
  value: string | null | undefined;
  type?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileField(field, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label className="text-[var(--text-muted)]">{label}</Label>
      <div className="flex min-w-0 items-center gap-2">
        {editing ? (
          <>
            <Input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-8 w-44 text-right text-sm"
              placeholder={placeholder}
              autoFocus
            />
            <Button size="icon-sm" variant="ghost" onClick={save} disabled={saving} aria-label="Save">
              <Check size={14} />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => { setDraft(value ?? ''); setEditing(false); }} aria-label="Cancel">
              <X size={14} />
            </Button>
          </>
        ) : (
          <>
            <span className="truncate text-sm font-medium text-[var(--text-main)]">
              {value ? value : <span className="text-[var(--text-muted)]">—</span>}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]"
              aria-label={`Edit ${label}`}
            >
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TextAreaRow({
  label,
  field,
  value,
  placeholder,
}: {
  label: string;
  field: string;
  value: string | null | undefined;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileField(field, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[var(--text-muted)]">{label}</Label>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]"
            aria-label={`Edit ${label}`}
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="ledger-input w-full rounded-xl px-3 py-2 text-sm outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDraft(value ?? ''); setEditing(false); }} disabled={saving}>
              <X size={14} /> Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Check size={14} /> Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-[var(--text-main)]">
          {value || <span className="text-[var(--text-muted)]">—</span>}
        </p>
      )}
    </div>
  );
}

// ── Contact info ──
export function ContactSection({ user }: { user: ProfileUser }) {
  return (
    <div className="divide-y divide-[var(--border-hairline)]">
      <FieldRow label="Phone" field="phone" value={user.phone} placeholder="+1…" />
      <div className="flex items-center justify-between gap-3 py-2">
        <Label className="text-[var(--text-muted)]">Email</Label>
        <span className="truncate text-sm font-medium text-[var(--text-main)] opacity-70" title="Email is managed by your account">
          {user.email}
        </span>
      </div>
      <FieldRow label="Address" field="address" value={user.address} placeholder="Street, number" />
      <FieldRow label="City" field="city" value={user.city} />
      <FieldRow label="Country" field="country" value={user.country} />
      <FieldRow label="Gender" field="gender" value={user.gender} />
      <FieldRow label="Date of Birth" field="dateOfBirth" type="date" value={user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : ''} />
    </div>
  );
}

// ── Emergency contact ──
export function EmergencySection({ user }: { user: ProfileUser }) {
  return (
    <div className="divide-y divide-[var(--border-hairline)]">
      <FieldRow label="Name" field="emergencyContactName" value={user.emergencyContactName} />
      <FieldRow label="Phone" field="emergencyContactPhone" value={user.emergencyContactPhone} placeholder="+1…" />
    </div>
  );
}

// ── Social links ──
export function SocialSection({ user }: { user: ProfileUser }) {
  return (
    <div className="divide-y divide-[var(--border-hairline)]">
      <FieldRow label="LinkedIn" field="linkedin" value={user.linkedin} placeholder="https://linkedin.com/in/…" />
      <FieldRow label="GitHub" field="github" value={user.github} placeholder="https://github.com/…" />
      <FieldRow label="Twitter" field="twitter" value={user.twitter} placeholder="https://x.com/…" />
      <FieldRow label="Website" field="website" value={user.website} placeholder="https://…" />
    </div>
  );
}

// ── Bio ──
export function BioSection({ user }: { user: ProfileUser }) {
  return <TextAreaRow label="Bio" field="bio" value={user.bio} placeholder="Tell the team a bit about yourself…" />;
}

// ── Bangladesh identity (Phase B5) ──
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELIGIONS = ['Islam', 'Hinduism', 'Buddhism', 'Christianity', 'Other'];
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা (Bangla)' },
];

export function IdentitySection({ user }: { user: ProfileUser }) {
  // `user.nid` is encrypted at rest (ciphertext). We never prefill the raw
  // input with it; instead the user re-enters a full NID only when changing it.
  const [nid, setNid] = useState('');
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup ?? '');
  const [religion, setReligion] = useState(user.religion ?? '');
  const [language, setLanguage] = useState(user.preferredLanguage ?? 'en');

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileBatch({
        // nid is empty when the user didn't change it; send null to keep the
        // existing encrypted value. Non-empty input is re-validated + encrypted
        // server-side.
        nid: nid || null,
        bloodGroup: bloodGroup || null,
        religion: religion || null,
        preferredLanguage: language,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[var(--text-muted)]">Bangladesh Identity</Label>
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]" aria-label="Edit identity">
            <Pencil size={13} />
          </button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}><X size={14} /> Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}><Check size={14} /> Save</Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-3">
          <div>
            <Label className="mb-1 block text-[10px] uppercase text-[var(--text-muted)]">National ID (NID)</Label>
            <Input value={nid} onChange={(e) => setNid(e.target.value)} placeholder={user.nidMasked ? `Current: ${user.nidMasked} (re-enter to change)` : 'e.g. 1234567890'} className="text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-[10px] uppercase text-[var(--text-muted)]">Blood Group</Label>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="ledger-input w-full rounded-xl px-2 py-2 text-sm outline-none">
                <option value="">Select</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-[10px] uppercase text-[var(--text-muted)]">Religion</Label>
              <select value={religion} onChange={(e) => setReligion(e.target.value)} className="ledger-input w-full rounded-xl px-2 py-2 text-sm outline-none">
                <option value="">Select</option>
                {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-1 block text-[10px] uppercase text-[var(--text-muted)]">Preferred Language</Label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="ledger-input w-full rounded-xl px-2 py-2 text-sm outline-none">
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-hairline)]">
          <Row label="National ID" value={user.nidMasked || '—'} />
          <Row label="Blood Group" value={user.bloodGroup || '—'} />
          <Row label="Religion" value={user.religion || '—'} />
          <Row label="Preferred Language" value={user.preferredLanguage === 'bn' ? 'বাংলা (Bangla)' : 'English'} />
        </div>
      )}
    </div>
  );
}

// ── Employment details (admin editable) ──
export function EmploymentSection({ user, managerName }: { user: ProfileUser; managerName?: string | null }) {
  const { isAdmin } = useUser();

  if (!isAdmin) {
    return (
      <div className="divide-y divide-[var(--border-hairline)]">
        <Row label="Employment Type" value={user.employmentType ?? 'Full-Time'} />
        <Row label="Department" value={user.department ?? 'Unassigned'} />
        <Row label="Designation" value={user.designation ?? 'Employee'} />
        <Row label="Manager" value={managerName ?? '—'} />
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--border-hairline)]">
      <AdminSelect label="Employment Type" field="employmentType" value={user.employmentType ?? 'Full-Time'} options={EMPLOYMENT_TYPES} />
      <AdminField label="Department" field="department" value={user.department} />
      <AdminField label="Designation" field="designation" value={user.designation} />
      <Row label="Manager" value={managerName ?? '—'} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label className="text-[var(--text-muted)]">{label}</Label>
      <span className="truncate text-sm font-medium text-[var(--text-main)]">{value}</span>
    </div>
  );
}

function AdminField({ label, field, value }: { label: string; field: string; value?: string | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(value ?? ''), [value]);
  const save = async () => {
    setSaving(true);
    try {
      await updateProfileField(field, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label className="text-[var(--text-muted)]">{label}</Label>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8 w-44 text-right text-sm" autoFocus />
            <Button size="icon-sm" variant="ghost" onClick={save} disabled={saving} aria-label="Save"><Check size={14} /></Button>
            <Button size="icon-sm" variant="ghost" onClick={() => { setDraft(value ?? ''); setEditing(false); }} aria-label="Cancel"><X size={14} /></Button>
          </>
        ) : (
          <>
            <span className="truncate text-sm font-medium text-[var(--text-main)]">{value ?? '—'}</span>
            <button type="button" onClick={() => setEditing(true)} className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]" aria-label={`Edit ${label}`}>
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AdminSelect({ label, field, value, options }: { label: string; field: string; value: string; options: string[] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(value), [value]);
  const save = async () => {
    setSaving(true);
    try {
      await updateProfileField(field, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label className="text-[var(--text-muted)]">{label}</Label>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <select value={draft} onChange={(e) => setDraft(e.target.value)} className="ledger-input h-8 w-44 rounded-xl px-2 text-right text-sm outline-none">
              {options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <Button size="icon-sm" variant="ghost" onClick={save} disabled={saving} aria-label="Save"><Check size={14} /></Button>
            <Button size="icon-sm" variant="ghost" onClick={() => { setDraft(value); setEditing(false); }} aria-label="Cancel"><X size={14} /></Button>
          </>
        ) : (
          <>
            <span className="truncate text-sm font-medium text-[var(--text-main)]">{value}</span>
            <button type="button" onClick={() => setEditing(true)} className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]" aria-label={`Edit ${label}`}>
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
