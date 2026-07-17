'use client';

import React, { useState } from 'react';
import { Users, Search, Download, ShieldAlert, Key, UserCircle, Briefcase, Mail, Phone, Settings, UserPlus, Check, X, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { provisionEmployeeAccount } from '@/app/actions/admin';
import { canModifyUser } from '@/lib/hierarchy';
import { toast } from '@/lib/toast';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';

const PERMISSIONS_LIST = [
  { id: 'MANAGE_ASSETS', label: 'Manage IT Assets', desc: 'Hardware inventory & software licenses' },
  { id: 'MANAGE_TRAINING', label: 'Manage Training', desc: 'Training modules & compliance tracking' },
  { id: 'VIEW_ALL_TIMESHEETS', label: 'View All Timesheets', desc: 'Full visibility over payroll hours' },
  { id: 'MANAGE_PROJECTS', label: 'Manage Projects', desc: 'Client billables & strategic initiatives' },
];

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  designation?: string | null;
  phone?: string | null;
  permissions?: string | null;
  isOwner?: boolean;
}

interface Branch {
  id: string;
  name: string;
  city: string;
}

export default function RegistryExplorer({ employees, branches = [] }: { employees: Employee[]; branches?: Branch[] }) {
  const { user, isAdmin, isOwner } = useUser();
  const [filter, setFilter] = useState('');
  const [editingPermsFor, setEditingPermsFor] = useState<Employee | null>(null);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    email: '', password: '', name: '', department: '', role: 'Employee', designation: '',
    managerId: '', branchId: '', employmentType: 'Full-Time', joinDate: '', baseSalary: '', nid: '', invite: true,
  });
  const [provisionStatus, setProvisionStatus] = useState({ loading: false, error: null as string | null, success: false, inviteToken: null as string | null });
  const [deleteStatus, setDeleteStatus] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });

  // Manager options for the richer provision form.
  const managerOptions = employees.filter((e) => e.role === 'Manager' || e.role === 'Admin' || e.role === 'HR Manager');

  const utils = trpc.useUtils();
  const updatePermsMutation = trpc.registry.updatePermissions.useMutation({
    onSuccess: () => utils.invalidate('registry'),
  });
  const deleteMutation = trpc.registry.deleteEmployee.useMutation({
    onSuccess: () => {
      utils.invalidate('registry');
      setDeleteStatus({ loading: false, error: null });
    },
  });

  const list = employees;

  const handleDelete = async (targetId: string) => {
    if (!confirm('Are you sure you want to completely terminate this personnel record?')) return;
    setDeleteStatus({ loading: true, error: null });
    try {
      await deleteMutation.mutateAsync({ id: targetId });
    } catch (err: any) {
      setDeleteStatus({ loading: false, error: err.message });
      toast.error('Deletion Failed', err.message);
    }
  };

  const handleExportCsv = () => {
    if (list.length === 0) return;
    const headers = ['Name', 'Email', 'Role', 'Department', 'Designation', 'Phone'];
    const csvContent = [
      headers.join(','),
      ...list.map((emp) =>
        [emp.name, emp.email, emp.role, emp.department || '', emp.designation || '', emp.phone || '']
          .map((v) => `"${v}"`)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registry_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleTogglePerm = (permId: string) => {
    if (!editingPermsFor) return;
    let currentPerms = [];
    try {
      if (editingPermsFor.permissions) currentPerms = JSON.parse(editingPermsFor.permissions);
    } catch (e) {}
    const newPerms = currentPerms.includes(permId)
      ? currentPerms.filter((p: string) => p !== permId)
      : [...currentPerms, permId];
    setEditingPermsFor({ ...editingPermsFor, permissions: JSON.stringify(newPerms) });
  };

  const savePermissions = async () => {
    let perms = [];
    try { perms = JSON.parse(editingPermsFor?.permissions || '[]'); } catch (e) {}
    if (!editingPermsFor) return;
    await updatePermsMutation.mutateAsync({ userId: editingPermsFor.id, permissions: perms });
    setEditingPermsFor(null);
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionStatus({ loading: true, error: null, success: false, inviteToken: null });
    try {
      const res = await provisionEmployeeAccount({
        ...provisionForm,
        baseSalary: provisionForm.baseSalary ? Number(provisionForm.baseSalary) : null,
        joinDate: provisionForm.joinDate || null,
        managerId: provisionForm.managerId || null,
        branchId: provisionForm.branchId || null,
      });
      if (res.success) {
        setProvisionStatus({
          loading: false,
          error: null,
          success: true,
          inviteToken: res.inviteMode ? res.inviteToken : null,
        });
        utils.invalidate('registry');
        if (!res.inviteMode) {
          setTimeout(() => {
            setIsProvisionModalOpen(false);
            setProvisionStatus({ loading: false, error: null, success: false, inviteToken: null });
            setProvisionForm({ email: '', password: '', name: '', department: '', role: 'Employee', designation: '', managerId: '', branchId: '', employmentType: 'Full-Time', joinDate: '', baseSalary: '', nid: '', invite: true });
          }, 1500);
        }
      } else {
        setProvisionStatus({ loading: false, error: res.error, success: false, inviteToken: null });
      }
    } catch (err: any) {
      setProvisionStatus({ loading: false, error: err.message, success: false, inviteToken: null });
    }
  };

  const filteredList = filter.trim()
    ? list.filter((emp) =>
        [emp.name, emp.email, emp.department, emp.role]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(filter.toLowerCase()))
      )
    : list;

  const roleVariant = (role: string): any =>
    role === 'Admin' ? 'rose' : role === 'HR Manager' ? 'brand' : 'secondary';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text" placeholder="Search Personnel..."
            value={filter} onChange={(e) => setFilter(e.target.value)}
            className="ledger-input w-full rounded-xl py-3 pl-10 pr-4 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md" onClick={handleExportCsv}>
            <Download className="h-4 w-4" /> Export
          </Button>
          {isAdmin && (
            <Button variant="primary" size="md" onClick={() => setIsProvisionModalOpen(true)}>
              <UserPlus className="h-4 w-4" /> Provision
            </Button>
          )}
        </div>
      </div>

      {filteredList.length === 0 ? (
        <EmptyState
          title="No personnel found"
          description={filter ? 'Try adjusting your search.' : 'The registry is empty.'}
          icon={<Users className="h-6 w-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((emp) => (
            <div key={emp.id} className="flex flex-col rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                    <UserCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="max-w-[150px] truncate text-lg font-semibold text-[var(--text-main)]">{emp.name}</h4>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--brand)]">{emp.designation || 'Staff'}</p>
                  </div>
                </div>
                <Badge variant={roleVariant(emp.role)}>{emp.role}</Badge>
              </div>

              <div className="mb-6 flex-1 space-y-3">
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>{emp.department || 'No Department Assigned'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate font-mono text-xs">{emp.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs">{emp.phone || '+1 (555) 000-0000'}</span>
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2 border-t border-[var(--border-hairline)] pt-4">
                  <button
                    onClick={() => setEditingPermsFor(emp)}
                    className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
                  >
                    <Settings className="mr-1 inline h-3 w-3" /> Access
                  </button>
                  {canModifyUser({ role: user.role, designation: user.designation, isOwner }, emp) && (
                    <button
                      onClick={() => handleDelete(emp.id)}
                      disabled={deleteStatus.loading}
                      className="flex-1 rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--rose)] transition-colors hover:bg-[var(--rose)]/20 disabled:opacity-50"
                    >
                      <Trash2 className="mr-1 inline h-3 w-3" /> Terminate
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Permissions Modal */}
      {editingPermsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] shadow-xl">
            <div className="border-b border-[var(--brand)]/20 bg-[var(--brand-soft)] p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-main)]">
                <ShieldAlert className="h-4 w-4 text-[var(--brand)]" /> Access Control Configuration
              </h3>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Target: <span className="text-[var(--brand-strong)]">{editingPermsFor.name}</span>
              </p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <p className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <Key className="h-3.5 w-3.5" /> Security Clearances
              </p>
              {PERMISSIONS_LIST.map((perm) => {
                let currentPerms = [];
                try { if (editingPermsFor.permissions) currentPerms = JSON.parse(editingPermsFor.permissions); } catch (e) {}
                const isGranted = currentPerms.includes(perm.id);
                return (
                  <div key={perm.id} className="flex items-start gap-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-4">
                    <input
                      type="checkbox" id={`perm-${perm.id}`} checked={isGranted}
                      onChange={() => handleTogglePerm(perm.id)}
                      className="mt-1 h-5 w-5 rounded border-[var(--border-hairline)] bg-[var(--bg-panel)] accent-[var(--brand)]"
                    />
                    <div>
                      <label htmlFor={`perm-${perm.id}`} className="cursor-pointer text-sm font-semibold text-[var(--text-main)]">{perm.label}</label>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{perm.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 border-t border-[var(--border-hairline)] bg-[var(--bg-hover)] p-6">
              <Button variant="ghost" size="md" onClick={() => setEditingPermsFor(null)}>Cancel</Button>
              <Button variant="primary" size="md" disabled={updatePermsMutation.isPending} onClick={savePermissions}>
                {updatePermsMutation.isPending ? 'Committing...' : 'Commit Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Provision Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--brand)]/20 bg-[var(--brand-soft)] p-6">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold uppercase tracking-wide text-[var(--text-main)]">
                  <UserPlus className="h-5 w-5 text-[var(--brand)]" /> Provision New User
                </h3>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Secure Identity Creation</p>
              </div>
              <button onClick={() => setIsProvisionModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleProvisionSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
              {provisionStatus.error && (
                <div className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] p-3 text-xs text-[var(--rose)]">
                  ERROR: {provisionStatus.error}
                </div>
              )}
              {provisionStatus.success && !provisionStatus.inviteToken && (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald-soft)] p-3 text-xs text-[var(--emerald)]">
                  <Check className="h-3.5 w-3.5" /> Identity provisioned — account is active.
                </div>
              )}
              {provisionStatus.success && provisionStatus.inviteToken && (
                <div className="rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-soft)] p-3 text-xs text-[var(--text-main)] space-y-2">
                  <p className="flex items-center gap-2 font-semibold text-[var(--brand-strong)]">
                    <Check className="h-3.5 w-3.5" /> Invite created. Share this secure link with the employee:
                  </p>
                  <code className="block break-all rounded bg-[var(--bg-app)] p-2 text-[10px] font-mono">
                    {typeof window !== 'undefined' ? `${window.location.origin}/invite/${provisionStatus.inviteToken}` : provisionStatus.inviteToken}
                  </code>
                  <Button variant="outline" size="sm" type="button" onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(`${window.location.origin}/invite/${provisionStatus.inviteToken}`);
                    }
                  }}>Copy Link</Button>
                </div>
              )}
              <div className="space-y-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-3">
                <label className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                  <input
                    type="checkbox"
                    checked={provisionForm.invite}
                    onChange={(e) => setProvisionForm({ ...provisionForm, invite: e.target.checked })}
                    className="h-4 w-4 rounded accent-[var(--brand)]"
                  />
                  Send invite link (employee sets own password) — recommended
                </label>
                {!provisionForm.invite && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Initial Password (min 8 chars)</label>
                    <input type="password" required value={provisionForm.password} onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="(min 8 chars)" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Full Name</label>
                  <input required type="text" value={provisionForm.name} onChange={(e) => setProvisionForm({ ...provisionForm, name: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Email Address</label>
                  <input required type="email" value={provisionForm.email} onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="john@company.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Department</label>
                  <input required type="text" value={provisionForm.department} onChange={(e) => setProvisionForm({ ...provisionForm, department: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="Engineering" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Designation</label>
                  <input required type="text" value={provisionForm.designation} onChange={(e) => setProvisionForm({ ...provisionForm, designation: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="Software Engineer" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">System Role</label>
                  <select value={provisionForm.role} onChange={(e) => setProvisionForm({ ...provisionForm, role: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm">
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Manager</label>
                  <select value={provisionForm.managerId} onChange={(e) => setProvisionForm({ ...provisionForm, managerId: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm">
                    <option value="">None</option>
                    {managerOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Branch</label>
                  <select value={provisionForm.branchId} onChange={(e) => setProvisionForm({ ...provisionForm, branchId: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm">
                    <option value="">None</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Employment Type</label>
                  <select value={provisionForm.employmentType} onChange={(e) => setProvisionForm({ ...provisionForm, employmentType: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm">
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Join Date</label>
                  <input type="date" value={provisionForm.joinDate} onChange={(e) => setProvisionForm({ ...provisionForm, joinDate: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Base Salary (BDT)</label>
                  <input type="number" min="0" value={provisionForm.baseSalary} onChange={(e) => setProvisionForm({ ...provisionForm, baseSalary: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="e.g. 50000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">National ID (NID)</label>
                  <input type="text" value={provisionForm.nid} onChange={(e) => setProvisionForm({ ...provisionForm, nid: e.target.value })} className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm" placeholder="10 / 13 / 17 digits" />
                </div>
              </div>
              <div className="flex gap-4 border-t border-[var(--border-hairline)] pt-4">
                <Button variant="ghost" size="md" type="button" onClick={() => setIsProvisionModalOpen(false)}>Cancel</Button>
                <Button variant="primary" size="md" type="submit" disabled={provisionStatus.loading || (provisionStatus.success && !provisionStatus.inviteToken)}>
                  {provisionStatus.loading ? 'Provisioning...' : provisionForm.invite ? 'Send Invite' : 'Provision Identity'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
