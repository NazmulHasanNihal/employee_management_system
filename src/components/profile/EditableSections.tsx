'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Check, X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/components/UserProvider';
import { updateProfileField, updateProfileBatch, deleteOwnAccount } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { T } from "@/components/Translate";

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
  targetUserId,
  canEdit = true,
}: {
  label: string;
  field: string;
  value: string | null | undefined;
  type?: string;
  placeholder?: string;
  targetUserId?: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileField(field, draft, targetUserId);
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Failed to update profile field.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-w-0 w-full items-center justify-between gap-3 py-2">
      <Label className="shrink-0 text-[var(--text-muted)]">{label}</Label>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
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
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]"
                aria-label={`Edit ${label}`}
              >
                <Pencil size={13} />
              </button>
            )}
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
  targetUserId,
  canEdit = true,
}: {
  label: string;
  field: string;
  value: string | null | undefined;
  options: string[];
  placeholder?: string;
  targetUserId?: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileField(field, draft, targetUserId);
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Failed to update profile field.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-w-0 w-full items-center justify-between gap-3 py-2">
      <Label className="shrink-0 text-[var(--text-muted)]">{label}</Label>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {editing ? (
          <>
            <select
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-8 w-44 rounded-xl px-2 text-right text-sm outline-none"
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
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]"
                aria-label={`Edit ${label}`}
              >
                <Pencil size={13} />
              </button>
            )}
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
  targetUserId,
  canEdit = true,
}: {
  label: string;
  field: string;
  value: string | null | undefined;
  placeholder?: string;
  targetUserId?: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileField(field, draft, targetUserId);
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[var(--text-muted)]">{label}</Label>
        {!editing && canEdit && (
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2 text-sm outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDraft(value ?? ''); setEditing(false); }} disabled={saving}>
              <X size={14} /> {/* @ts-ignore */}<T>Cancel</T></Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Check size={14} /> {/* @ts-ignore */}<T>Save</T></Button>
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
  targetUserId,
  canEdit = true,
}: {
  user: ProfileUser;
  countries?: string[];
  targetUserId?: string;
  canEdit?: boolean;
}) {
  const countryOptions = Array.from(new Set([...(countries ?? []), ...DEFAULT_COUNTRIES]));
  const activeUserId = targetUserId || user.id;
  return (
    <div className="divide-y divide-[var(--border-hairline)]">
      <FieldRow label="Full Name" field="name" value={user.name} placeholder="Your full name" targetUserId={activeUserId} canEdit={canEdit} />
      <FieldRow label="Phone" field="phone" value={user.phone} placeholder="+1…" targetUserId={activeUserId} canEdit={canEdit} />
      <div className="flex items-center justify-between gap-3 py-2">
        <Label className="text-[var(--text-muted)]">{/* @ts-ignore */}<T>Email</T></Label>
        <span className="truncate text-sm font-medium text-[var(--text-main)] opacity-70" title="Email is managed by your account">
          {user.email}
        </span>
      </div>
      <FieldRow label="Address" field="address" value={user.address} placeholder="Street, number" targetUserId={activeUserId} canEdit={canEdit} />
      <FieldRow label="City" field="city" value={user.city} targetUserId={activeUserId} canEdit={canEdit} />
      <SelectRow label="Country" field="country" value={user.country} options={countryOptions} targetUserId={activeUserId} canEdit={canEdit} />
      <SelectRow label="Gender" field="gender" value={user.gender} options={GENDERS} targetUserId={activeUserId} canEdit={canEdit} />
      <FieldRow label="Date of Birth" field="dateOfBirth" type="date" value={user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : ''} targetUserId={activeUserId} canEdit={canEdit} />
    </div>
  );
}

// ── Emergency contact ──
export function EmergencySection({ user, targetUserId, canEdit = true }: { user: ProfileUser; targetUserId?: string; canEdit?: boolean }) {
  const activeUserId = targetUserId || user.id;
  return (
    <div className="divide-y divide-[var(--border-hairline)]">
      <FieldRow label="Name" field="emergencyContactName" value={user.emergencyContactName} targetUserId={activeUserId} canEdit={canEdit} />
      <FieldRow label="Phone" field="emergencyContactPhone" value={user.emergencyContactPhone} placeholder="+1…" targetUserId={activeUserId} canEdit={canEdit} />
    </div>
  );
}

// ── Social links ──
export function SocialSection({ user, targetUserId, canEdit = true }: { user: ProfileUser; targetUserId?: string; canEdit?: boolean }) {
  const activeUserId = targetUserId || user.id;
  return (
    <div className="divide-y divide-[var(--border-hairline)]">
      <FieldRow label="LinkedIn" field="linkedin" value={user.linkedin} placeholder="https://linkedin.com/in/…" targetUserId={activeUserId} canEdit={canEdit} />
      <FieldRow label="GitHub" field="github" value={user.github} placeholder="https://github.com/…" targetUserId={activeUserId} canEdit={canEdit} />
      <FieldRow label="Twitter" field="twitter" value={user.twitter} placeholder="https://x.com/…" targetUserId={activeUserId} canEdit={canEdit} />
      <FieldRow label="Website" field="website" value={user.website} placeholder="https://…" targetUserId={activeUserId} canEdit={canEdit} />
    </div>
  );
}

// ── Bio ──
export function BioSection({ user, targetUserId, canEdit = true }: { user: ProfileUser; targetUserId?: string; canEdit?: boolean }) {
  const activeUserId = targetUserId || user.id;
  return <TextAreaRow label="Bio" field="bio" value={user.bio} placeholder="Tell the team a bit about yourself…" targetUserId={activeUserId} canEdit={canEdit} />;
}

// ── Bangladesh identity (Phase B5) ──
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELIGIONS = ['Islam', 'Hinduism', 'Buddhism', 'Christianity', 'Other'];
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা (Bangla)' },
];

export function IdentitySection({ user, targetUserId, canEdit = true }: { user: ProfileUser; targetUserId?: string; canEdit?: boolean }) {
  // `user.nid` is encrypted at rest (ciphertext). We never prefill the raw
  // input with it; instead the user re-enters a full NID only when changing it.
  const [nid, setNid] = useState('');
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup ?? '');
  const [religion, setReligion] = useState(user.religion ?? '');
  const [language, setLanguage] = useState(user.preferredLanguage ?? 'en');
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileBatch({
        nid: nid || null,
        bloodGroup: bloodGroup || null,
        religion: religion || null,
        preferredLanguage: language,
      }, targetUserId);
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[var(--text-muted)]">{/* @ts-ignore */}<T>Bangladesh Identity</T></Label>
        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}><X size={14} /> {/* @ts-ignore */}<T>Cancel</T></Button>
            <Button size="sm" onClick={save} disabled={saving}><Check size={14} /> {/* @ts-ignore */}<T>Save</T></Button>
          </div>
        ) : canEdit ? (
          <button type="button" onClick={() => setEditing(true)} className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-strong)]" aria-label="Edit identity">
            <Pencil size={13} />
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-3">
          <div>
            <Label className="mb-1 block text-[10px] uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>National ID (NID)</T></Label>
            <Input value={nid} onChange={(e) => setNid(e.target.value)} placeholder={user.nidMasked ? `Current: ${user.nidMasked} (re-enter to change)` : 'e.g. 1234567890'} className="text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-[10px] uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Blood Group</T></Label>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-2 py-2 text-sm outline-none">
                <option value="">{/* @ts-ignore */}<T>Select</T></option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-[10px] uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Religion</T></Label>
              <select value={religion} onChange={(e) => setReligion(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-2 py-2 text-sm outline-none">
                <option value="">{/* @ts-ignore */}<T>Select</T></option>
                {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-1 block text-[10px] uppercase text-[var(--text-muted)]">{/* @ts-ignore */}<T>Preferred Language</T></Label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-2 py-2 text-sm outline-none">
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

// ── Employment details (editable by privileged users: CEO, Admin, HR) ──
export function EmploymentSection({
  user,
  managerName,
  branchName,
  branches = [],
  managers = [],
  targetUserId,
  canEdit,
}: {
  user: ProfileUser;
  managerName?: string | null;
  branchName?: string | null;
  branches?: { id: string; name: string }[];
  managers?: { id: string; name: string }[];
  targetUserId?: string;
  canEdit?: boolean;
}) {
  const { isAdmin, isHR, isCEO } = useUser();
  const canEditEmployment = isAdmin || isHR || isCEO || (canEdit ?? false);
  const activeUserId = targetUserId || user.id;

  const base = (
    <>
      <SelectRow label="Employment Type" field="employmentType" value={user.employmentType ?? 'Full-Time'} options={EMPLOYMENT_TYPES} targetUserId={activeUserId} canEdit={canEditEmployment} />
      <FieldRow label="Department" field="department" value={user.department} targetUserId={activeUserId} canEdit={canEditEmployment} />
      <FieldRow label="Designation" field="designation" value={user.designation} targetUserId={activeUserId} canEdit={canEditEmployment} />
      <FieldRow label="Base Salary" field="baseSalary" type="number" value={user.baseSalary != null ? String(user.baseSalary) : ''} placeholder="0" targetUserId={activeUserId} canEdit={canEditEmployment} />
      <FieldRow label="Join Date" field="joinDate" type="date" value={user.joinDate ? String(user.joinDate).slice(0, 10) : ''} targetUserId={activeUserId} canEdit={canEditEmployment} />
    </>
  );

  if (!canEditEmployment) {
    return (
      <div className="divide-y divide-[var(--border-hairline)]">
        {base}
        <BranchSelectRow
          field="branchId"
          value={user.branchId ?? ''}
          options={branches}
          currentName={branchName}
          targetUserId={user.id}
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
        targetUserId={user.id}
      />
      {canEditEmployment && <SelectRow label="Status" field="status" value={user.status ?? 'active'} options={STATUSES} targetUserId={user.id} />}
      {canEditEmployment && <ManagerSelectRow field="managerId" value={user.managerId ?? ''} options={managers} currentName={managerName} targetUserId={user.id} />}
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
  targetUserId,
}: {
  field: string;
  value: string;
  options: { id: string; name: string }[];
  currentName?: string | null;
  targetUserId?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(value), [value]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileField(field, draft || null, targetUserId);
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      toast.error('Save Failed', err?.message || 'Could not update branch.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label className="text-[var(--text-muted)]">{/* @ts-ignore */}<T>Branch</T></Label>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <select
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-8 w-44 rounded-xl px-2 text-right text-sm outline-none"
              autoFocus
            >
              <option value="">{/* @ts-ignore */}<T>None</T></option>
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
  targetUserId,
}: {
  field: string;
  value: string;
  options: { id: string; name: string }[];
  currentName?: string | null;
  targetUserId?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(value), [value]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileField(field, draft || null, targetUserId);
      setEditing(false);
      toast.success('Manager Updated', 'Reporting manager assigned successfully.');
      router.refresh();
    } catch (err: any) {
      toast.error('Assignment Failed', err?.message || 'Could not update manager assignment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label className="text-[var(--text-muted)]">{/* @ts-ignore */}<T>Manager</T></Label>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <select
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-8 w-44 rounded-xl px-2 text-right text-sm outline-none"
              autoFocus
            >
              <option value="">{/* @ts-ignore */}<T>None</T></option>
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

export function DeleteAccountSection({ isOwner }: { isOwner?: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteOwnAccount();
      toast.success('Account Anonymized', res.message || 'Your personal data has been permanently anonymized.');
      router.push('/login');
      router.refresh();
    } catch (err: any) {
      toast.error('Deletion Failed', err?.message || 'Could not anonymize account data.');
      setLoading(false);
    }
  };

  if (isOwner) return null;

  return (
    <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
        <AlertTriangle size={16} />
        <span>Danger Zone: Account & Data Deletion</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
        Permanently anonymize all personal data (name, email, phone, bio, NID, 2FA credentials) in compliance with privacy regulations. This action cannot be undone.
      </p>
      {confirming ? (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="gap-1.5"
          >
            <Trash2 size={13} />
            {loading ? 'Anonymizing...' : 'Confirm Account Anonymization'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirming(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirming(true)}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30 gap-1.5"
        >
          <Trash2 size={13} />
          <span>Delete & Anonymize My Data</span>
        </Button>
      )}
    </div>
  );
}
