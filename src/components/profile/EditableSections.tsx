'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/components/UserProvider';
import { updateProfileField, updateProfileBatch } from '@/app/actions/profile';

export type ProfileUser = {
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
  branchId?: string | null;
  joinDate?: Date | string | null;
};

const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern'];
const GENDERS = ['Male', 'Female', 'Non-Binary', 'Prefer Not to Say'];
const STATUSES = ['active', 'On Leave', 'Suspended', 'Terminated'];
// Curated country list. The live list from the DB (Country table) is merged in
// by the parent if available.
const DEFAULT_COUNTRIES = [
  'Bangladesh', 'India', 'Pakistan', 'United States', 'United Kingdom',
  'United Arab Emirates', 'Saudi Arabia', 'Canada', 'Australia', 'Singapore',
];

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

function SelectRow({
  label,
  field,
  value,
  options,
  placeholder = 'Select',
}: {
  label: string;
  field: string;
  value: string | null | undefined;
  options: string[];
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
            <select
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="ledger-input h-8 w-44 rounded-xl px-2 text-right text-sm outline-none"
              autoFocus
            >
              <option value="">{placeholder}</option>
              {options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
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
export function ContactSection({
  user,
  countries,
}: {
  user: ProfileUser;
  countries?: string[];
}) {
  const countryOptions = Array.from(new Set([...(countries ?? []), ...DEFAULT_COUNTRIES]));
  return (
    <div className="divide-y divide-[var(--border-hairline)]">
      <FieldRow label="Full Name" field="name" value={user.name} placeholder="Your full name" />
      <FieldRow label="Phone" field="phone" value={user.phone} placeholder="+1…" />
      <div className="flex items-center justify-between gap-3 py-2">
        <Label className="text-[var(--text-muted)]">Email</Label>
        <span className="truncate text-sm font-medium text-[var(--text-main)] opacity-70" title="Email is managed by your account">
          {user.email}
        </span>
      </div>
      <FieldRow label="Address" field="address" value={user.address} placeholder="Street, number" />
      <FieldRow label="City" field="city" value={user.city} />
      <SelectRow label="Country" field="country" value={user.country} options={countryOptions} />
      <SelectRow label="Gender" field="gender" value={user.gender} options={GENDERS} />
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

// ── Employment details (editable by the user; admins get extra fields) ──
export function EmploymentSection({
  user,
  managerName,
  branchName,
  branches = [],
  managers = [],
}: {
  user: ProfileUser;
  managerName?: string | null;
  branchName?: string | null;
  branches?: { id: string; name: string }[];
  managers?: { id: string; name: string }[];
}) {
  const { isAdmin, isHR } = useUser();
  // HR managers may edit employment details (incl. Designation/Position) but
  // not the escalation-sensitive Status / Manager fields, which stay admin-only.
  const canEditEmployment = isAdmin || isHR;

  // Everyone (incl. HR) can edit these safe employment fields.
  const base = (
    <>
      <SelectRow label="Employment Type" field="employmentType" value={user.employmentType ?? 'Full-Time'} options={EMPLOYMENT_TYPES} />
      <FieldRow label="Department" field="department" value={user.department} />
      <FieldRow label="Designation" field="designation" value={user.designation} />
      <FieldRow label="Base Salary" field="baseSalary" type="number" value={user.baseSalary != null ? String(user.baseSalary) : ''} placeholder="0" />
      <FieldRow label="Join Date" field="joinDate" type="date" value={user.joinDate ? String(user.joinDate).slice(0, 10) : ''} />
    </>
  );

  // Branch dropdown stores the branch id; Manager dropdown (admin) stores the id too.

  if (!canEditEmployment) {
    return (
      <div className="divide-y divide-[var(--border-hairline)]">
        {base}
        <BranchSelectRow
          field="branchId"
          value={user.branchId ?? ''}
          options={branches}
          currentName={branchName}
        />
        <Row label="Manager" value={managerName ?? '—'} />
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--border-hairline)]">
      {base}
      <BranchSelectRow
        field="branchId"
        value={user.branchId ?? ''}
        options={branches}
        currentName={branchName}
      />
      {isAdmin && <SelectRow label="Status" field="status" value={user.status ?? 'active'} options={STATUSES} />}
      {isAdmin && <ManagerSelectRow field="managerId" value={user.managerId ?? ''} options={managers} currentName={managerName} />}
      {!isAdmin && <Row label="Manager" value={managerName ?? '—'} />}
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

// Manager is stored as an id but displayed as a name; the select carries the id
// in its option values while showing names.
// Branch is stored by id but displayed by name; option values carry the id.
function BranchSelectRow({
  field,
  value,
  options,
  currentName,
}: {
  field: string;
  value: string;
  options: { id: string; name: string }[];
  currentName?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(value), [value]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileField(field, draft || null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label className="text-[var(--text-muted)]">Branch</Label>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <select
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="ledger-input h-8 w-44 rounded-xl px-2 text-right text-sm outline-none"
              autoFocus
            >
              <option value="">None</option>
              {options.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <Button size="icon-sm" variant="ghost" onClick={save} disabled={saving} aria-label="Save"><Check size={14} /></Button>
            <Button size="icon-sm" variant="ghost" onClick={() => { setDraft(value); setEditing(false); }} aria-label="Cancel"><X size={14} /></Button>
          </>
        ) : (
          <>
            <span className="truncate text-sm font-medium text-[var(--text-main)]">{currentName ?? '—'}</span>
            <button type="button" onClick={() => setEditing(true)} className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]" aria-label="Edit Branch">
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ManagerSelectRow({
  field,
  value,
  options,
  currentName,
}: {
  field: string;
  value: string;
  options: { id: string; name: string }[];
  currentName?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(value), [value]);

  const save = async () => {
    setSaving(true);
    try {
      // Empty selection clears the manager.
      await updateProfileField(field, draft || null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label className="text-[var(--text-muted)]">Manager</Label>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <select
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="ledger-input h-8 w-44 rounded-xl px-2 text-right text-sm outline-none"
              autoFocus
            >
              <option value="">None</option>
              {options.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <Button size="icon-sm" variant="ghost" onClick={save} disabled={saving} aria-label="Save"><Check size={14} /></Button>
            <Button size="icon-sm" variant="ghost" onClick={() => { setDraft(value); setEditing(false); }} aria-label="Cancel"><X size={14} /></Button>
          </>
        ) : (
          <>
            <span className="truncate text-sm font-medium text-[var(--text-main)]">{currentName ?? '—'}</span>
            <button type="button" onClick={() => setEditing(true)} className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]" aria-label="Edit Manager">
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
