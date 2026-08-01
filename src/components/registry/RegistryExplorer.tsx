'use client';

import React, { useState } from 'react';
import { Users, Search, Download, ShieldAlert, Key, UserCircle, Briefcase, Mail, Phone, Settings, UserPlus, Check, X, Trash2, MapPin, Calendar, Globe, Heart, Link2, Activity, Shield, Fingerprint, Monitor } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useUser } from '@/components/UserProvider';
import { provisionEmployeeAccount } from '@/app/actions/admin';
import { canModifyUser } from '@/lib/hierarchy';
import { toast } from '@/lib/toast';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/ui/status-pill';
import { formatDate, formatCurrency } from '@/lib/format';
import { T } from "@/components/Translate";

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
  avatarUrl?: string | null;
  status?: string;
  isOnboarded?: boolean;
  employmentType?: string;
  joinDate?: Date | null;
  baseSalary?: number | null;
  bloodGroup?: string | null;
  religion?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bio?: string | null;
  linkedin?: string | null;
  github?: string | null;
  twitter?: string | null;
  website?: string | null;
  nidMasked?: string | null;
  lastSeen?: Date | null;
  isOnline?: boolean;
  twoFactorEnabled?: boolean;
  managerId?: string | null;
  branchId?: string | null;
  manager?: {
    id: string;
    name: string;
    role: string;
    designation?: string | null;
  } | null;
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    email: '', password: '', name: '', department: '', role: 'Employee', designation: '',
    managerId: '', branchId: '', employmentType: 'Full-Time', joinDate: '', baseSalary: '', nid: '', invite: true, provisionAssetId: '',
  });
  const [provisionStatus, setProvisionStatus] = useState({ loading: false, error: null as string | null, success: false, inviteToken: null as string | null });
  const [deleteStatus, setDeleteStatus] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });

  const utils = trpc.useUtils();
  const { data: employeesData } = trpc.registry.getAll.useQuery(undefined, { initialData: employees as any });
  const liveEmployees = (employeesData as Employee[] | undefined) ?? employees ?? [];
  const { data: assetsData } = trpc.assets.getAssets.useQuery(undefined, { enabled: isProvisionModalOpen });
  const unassignedAssets = assetsData?.filter((a: any) => !a.userId) || [];

  const managerOptions = liveEmployees.filter((e) => e.role === 'Manager' || e.role === 'Admin' || e.role === 'HR Manager');

  const updatePermsMutation = trpc.registry.updatePermissions.useMutation({
    onSuccess: () => utils.registry.getAll.invalidate(),
  });
  const deleteMutation = trpc.registry.deleteEmployee.useMutation({
    onSuccess: () => {
      utils.registry.getAll.invalidate();
      setDeleteStatus({ loading: false, error: null });
    },
  });

  const list = liveEmployees;

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
        provisionAssetId: provisionForm.provisionAssetId || null,
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
            setProvisionForm({ email: '', password: '', name: '', department: '', role: 'Employee', designation: '', managerId: '', branchId: '', employmentType: 'Full-Time', joinDate: '', baseSalary: '', nid: '', invite: true, provisionAssetId: '' });
          }, 1500);
        }
      } else {
        setProvisionStatus({ loading: false, error: res.error ?? null, success: false, inviteToken: null });
      }
    } catch (err: any) {
      setProvisionStatus({ loading: false, error: err.message, success: false, inviteToken: null });
    }
  };

  const filteredList = filter.trim()
    ? list.filter((emp) =>
        [emp.name, emp.email, emp.department, emp.role, emp.designation]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(filter.toLowerCase()))
      )
    : list;

  const roleVariant = (role: string): any =>
    role === 'Admin' ? 'rose' : role === 'HR Manager' ? 'brand' : 'secondary';

  const openProfile = (emp: Employee) => {
    setSelectedEmployee(emp);
    utils.registry.getAll.invalidate();
  };

  const roleLabel = (status?: string) => {
    if (!status) return 'Unknown';
    if (status === 'active' || status === 'Active') return 'Active';
    if (status === 'Terminated') return 'Terminated';
    return status;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text" placeholder="Search Personnel..."
            value={filter} onChange={(e) => setFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl py-3 pl-10 pr-4 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md" onClick={handleExportCsv}>
            <Download className="h-4 w-4" /> {/* @ts-ignore */}<T>Export</T></Button>
          {isAdmin && (
            <Button variant="primary" size="md" onClick={() => setIsProvisionModalOpen(true)} className="rounded-xl flex items-center gap-2 font-semibold">
              <UserPlus className="h-4 w-4" /> {/* @ts-ignore */}<T>+ Add New Member</T></Button>
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
            <button
              key={emp.id}
              onClick={() => openProfile(emp)}
              className="flex flex-col rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 text-left shadow-sm transition-all hover:border-[var(--brand)]/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/40"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar src={emp.avatarUrl} name={emp.name} size="lg" />
                  <div>
                     <h4 className="max-w-[12rem] truncate text-fluid-lg font-semibold text-[var(--text-main)]">{emp.name}</h4>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--brand)]">{emp.designation || 'Staff'}</p>
                  </div>
                </div>
                <Badge variant={roleVariant(emp.role)}>{emp.role}</Badge>
              </div>

              <div className="mb-4 flex-1 space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="truncate">{emp.department || 'No Department Assigned'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate font-mono text-xs">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="truncate font-mono text-xs">{emp.phone}</span>
                  </div>
                )}
                {emp.isOnline !== undefined && (
                  <div className="flex items-center gap-3 text-sm">
                    <Activity className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span className={emp.isOnline ? 'text-[var(--emerald)]' : 'text-[var(--text-muted)]'}>
                      {emp.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="flex gap-2 border-t border-[var(--border-hairline)] pt-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingPermsFor(emp)}
                    className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] transition-colors hover:border-[var(--brand)]/30 hover:text-[var(--brand)]"
                  >
                    <Settings className="mr-1 inline h-3 w-3" /> {/* @ts-ignore */}<T>Access</T></button>
                  {canModifyUser({ role: user.role, designation: user.designation ?? undefined, isOwner }, { role: emp.role, designation: emp.designation ?? undefined, isOwner: emp.isOwner }) && (
                    <button
                      onClick={() => handleDelete(emp.id)}
                      disabled={deleteStatus.loading}
                      className="flex-1 rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--rose)] transition-colors hover:bg-[var(--rose)]/20 disabled:opacity-50"
                    >
                      <Trash2 className="mr-1 inline h-3 w-3" /> {/* @ts-ignore */}<T>Terminate</T></button>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedEmployee(null)}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-hover)]/60 p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <Avatar src={selectedEmployee.avatarUrl} name={selectedEmployee.name} size="xl" />
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-main)]">{selectedEmployee.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{selectedEmployee.designation || 'Staff'} · {selectedEmployee.department || 'No Department'}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={roleVariant(selectedEmployee.role)}>{selectedEmployee.role}</Badge>
                    {selectedEmployee.status && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${selectedEmployee.status === 'active' || selectedEmployee.status === 'Active' ? 'bg-[var(--emerald-soft)] text-[var(--emerald)]' : selectedEmployee.status === 'Terminated' ? 'bg-[var(--rose-soft)] text-[var(--rose)]' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}>
                        {selectedEmployee.status}
                      </span>
                    )}
                    {selectedEmployee.isOnline !== undefined && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${selectedEmployee.isOnline ? 'bg-[var(--emerald-soft)] text-[var(--emerald)]' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${selectedEmployee.isOnline ? 'bg-[var(--emerald)]' : 'bg-[var(--text-muted)]'}`} />
                        {selectedEmployee.isOnline ? 'Online' : 'Offline'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] touch-target-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Contact</T></p>
                    <div className="mt-2 space-y-2">
                      {selectedEmployee.email && (
                        <div className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                          <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                          <span className="truncate">{selectedEmployee.email}</span>
                        </div>
                      )}
                      {selectedEmployee.phone && (
                        <div className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                          <Phone className="h-4 w-4 text-[var(--text-muted)]" />
                          <span>{selectedEmployee.phone}</span>
                        </div>
                      )}
                      {(selectedEmployee.address || selectedEmployee.city || selectedEmployee.country) && (
                        <div className="flex items-start gap-2 text-sm text-[var(--text-main)]">
                          <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
                          <span className="truncate">{[selectedEmployee.address, selectedEmployee.city, selectedEmployee.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Emergency Contact</T></p>
                    <div className="mt-2 space-y-1 text-sm text-[var(--text-main)]">
                      <p>{selectedEmployee.emergencyContactName || '—'}</p>
                      <p className="font-mono text-xs text-[var(--text-muted)]">{selectedEmployee.emergencyContactPhone || '—'}</p>
                    </div>
                  </div>
                  {selectedEmployee.manager && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Reports To</T></p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-main)]">{selectedEmployee.manager.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{selectedEmployee.manager.designation || selectedEmployee.manager.role}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Employment</T></p>
                    <div className="mt-2 space-y-2 text-sm text-[var(--text-main)]">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[var(--text-muted)]" />
                        <span>{selectedEmployee.employmentType || '—'}</span>
                      </div>
                      {selectedEmployee.joinDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
                          <span>{/* @ts-ignore */}<T>Joined</T>{formatDate(selectedEmployee.joinDate)}</span>
                        </div>
                      )}
                      {selectedEmployee.branchId && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-[var(--text-muted)]" />
                          <span>{branches.find(b => b.id === selectedEmployee.branchId)?.name || 'Branch assigned'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Personal</T></p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-[var(--text-main)]">
                      {selectedEmployee.dateOfBirth && (
                        <div>
                          <span className="text-[var(--text-muted)]">{/* @ts-ignore */}<T>DOB</T></span>
                          <p className="font-medium">{formatDate(selectedEmployee.dateOfBirth)}</p>
                        </div>
                      )}
                      {selectedEmployee.gender && (
                        <div>
                          <span className="text-[var(--text-muted)]">{/* @ts-ignore */}<T>Gender</T></span>
                          <p className="font-medium">{selectedEmployee.gender}</p>
                        </div>
                      )}
                      {selectedEmployee.bloodGroup && (
                        <div>
                          <span className="text-[var(--text-muted)]">{/* @ts-ignore */}<T>Blood</T></span>
                          <p className="font-medium flex items-center gap-1"><Heart className="h-3 w-3 text-[var(--rose)]" />{selectedEmployee.bloodGroup}</p>
                        </div>
                      )}
                      {selectedEmployee.religion && (
                        <div>
                          <span className="text-[var(--text-muted)]">{/* @ts-ignore */}<T>Religion</T></span>
                          <p className="font-medium">{selectedEmployee.religion}</p>
                        </div>
                      )}
                    </div>
                    {selectedEmployee.bio && (
                      <p className="mt-2 text-sm text-[var(--text-muted)] italic line-clamp-3">{selectedEmployee.bio}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Social</T></p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedEmployee.linkedin && (
                        <a href={selectedEmployee.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-2.5 py-1 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-strong)]">
                          {/* @ts-ignore */}<T>LinkedIn</T></a>
                      )}
                      {selectedEmployee.github && (
                        <a href={selectedEmployee.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-2.5 py-1 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-strong)]">
                          {/* @ts-ignore */}<T>GitHub</T></a>
                      )}
                      {selectedEmployee.twitter && (
                        <a href={selectedEmployee.twitter} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-2.5 py-1 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-strong)]">
                          {/* @ts-ignore */}<T>Twitter</T></a>
                      )}
                      {selectedEmployee.website && (
                        <a href={selectedEmployee.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-2.5 py-1 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-strong)]">
                          {/* @ts-ignore */}<T>Website</T></a>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Admin Info</T></p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedEmployee.twoFactorEnabled !== undefined && (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${selectedEmployee.twoFactorEnabled ? 'bg-[var(--emerald-soft)] text-[var(--emerald)]' : 'bg-[var(--rose-soft)] text-[var(--rose)]'}`}>
                            <Shield className="h-3 w-3" /> {/* @ts-ignore */}<T>2FA</T>{selectedEmployee.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        )}
                        {selectedEmployee.nidMasked && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">
                            <Fingerprint className="h-3 w-3" /> {selectedEmployee.nidMasked}
                          </span>
                        )}
                        {selectedEmployee.lastSeen && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-muted)]">
                            {/* @ts-ignore */}<T>Last seen</T>{formatDate(selectedEmployee.lastSeen)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[var(--border-hairline)] bg-[var(--bg-hover)]/60 p-4 sm:p-6">
              <Button variant="ghost" size="md" onClick={() => setSelectedEmployee(null)}>{/* @ts-ignore */}<T>Close</T></Button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {editingPermsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] shadow-xl">
            <div className="border-b border-[var(--brand)]/20 bg-[var(--brand-soft)] p-4 sm:p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-main)]">
                <ShieldAlert className="h-4 w-4 text-[var(--brand)]" /> {/* @ts-ignore */}<T>Access Control Configuration</T></h3>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                {/* @ts-ignore */}<T>Target:</T><span className="text-[var(--brand-strong)]">{editingPermsFor.name}</span>
              </p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              <p className="flex items-center gap-2 border-b border-[var(--border-hairline)] pb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <Key className="h-3.5 w-3.5" /> {/* @ts-ignore */}<T>Security Clearances</T></p>
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
                  <Button variant="ghost" size="md" onClick={() => setEditingPermsFor(null)} className="touch-target-sm">{/* @ts-ignore */}<T>Cancel</T></Button>
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
          <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--brand)]/20 bg-[var(--brand-soft)] p-4 sm:p-6">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold uppercase tracking-wide text-[var(--text-main)]">
                  <UserPlus className="h-5 w-5 text-[var(--brand)]" /> {/* @ts-ignore */}<T>+ Add New Employee Member</T></h3>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Provision Member Credentials & System Profile</T></p>
              </div>
              <button onClick={() => setIsProvisionModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] touch-target-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleProvisionSubmit} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {provisionStatus.error && (
                <div className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] p-3 text-xs text-[var(--rose)]">
                  {/* @ts-ignore */}<T>ERROR:</T>{provisionStatus.error}
                </div>
              )}
              {provisionStatus.success && !provisionStatus.inviteToken && (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald-soft)] p-3 text-xs font-semibold text-[var(--emerald)]">
                  <Check className="h-4 w-4" /> {/* @ts-ignore */}<T>Member account created successfully! They can log in immediately.</T></div>
              )}
              {provisionStatus.success && provisionStatus.inviteToken && (
                <div className="rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-soft)] p-3 text-xs text-[var(--text-main)] space-y-2">
                  <p className="flex items-center gap-2 font-semibold text-[var(--brand-strong)]">
                    <Check className="h-3.5 w-3.5" /> {/* @ts-ignore */}<T>Invite created. Share this secure link with the employee:</T></p>
                  <code className="block break-all rounded bg-[var(--bg-app)] p-2 text-[10px] font-mono">
                    {typeof window !== 'undefined' ? `${window.location.origin}/invite/${provisionStatus.inviteToken}` : provisionStatus.inviteToken}
                  </code>
                  <Button variant="outline" size="sm" type="button" onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(`${window.location.origin}/invite/${provisionStatus.inviteToken}`);
                    }
                  }}>{/* @ts-ignore */}<T>Copy Link</T></Button>
                </div>
              )}

              {/* Mode Selection Tabs */}
              <div className="space-y-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{/* @ts-ignore */}<T>Creation Mode</T></label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProvisionForm({ ...provisionForm, invite: false })}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                      !provisionForm.invite
                        ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)] shadow-sm'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span>{/* @ts-ignore */}<T>Set Login Password</T></span>
                    <span className="text-[10px] font-normal opacity-80 mt-0.5">{/* @ts-ignore */}<T>Immediate Login Access</T></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvisionForm({ ...provisionForm, invite: true })}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                      provisionForm.invite
                        ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)] shadow-sm'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span>{/* @ts-ignore */}<T>Send Invite Link</T></span>
                    <span className="text-[10px] font-normal opacity-80 mt-0.5">{/* @ts-ignore */}<T>Self-Registration</T></span>
                  </button>
                </div>

                {!provisionForm.invite && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-strong)]">{/* @ts-ignore */}<T>Member Login Password (min 8 chars)</T></label>
                    <input
                      type="password"
                      required
                      value={provisionForm.password}
                      onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-mono border-[var(--brand)]/40"
                      placeholder="Enter password for initial login..."
                    />
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {/* @ts-ignore */}<T>The employee will use their email and this password to log in right away.</T></p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Full Name</T></label>
                  <input required type="text" value={provisionForm.name} onChange={(e) => setProvisionForm({ ...provisionForm, name: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Email Address</T></label>
                  <input required type="email" value={provisionForm.email} onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm" placeholder="john@company.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Department</T></label>
                  <input
                    required
                    list="department-suggestions"
                    value={provisionForm.department}
                    onChange={(e) => setProvisionForm({ ...provisionForm, department: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                    placeholder="E.g., Engineering, Marketing..."
                  />
                  <datalist id="department-suggestions">
                    <option value="Engineering" />
                    <option value="Human Resources" />
                    <option value="Finance & Accounting" />
                    <option value="Marketing" />
                    <option value="Sales & Business Dev" />
                    <option value="Operations" />
                    <option value="IT & Infrastructure" />
                    <option value="Legal & Compliance" />
                    <option value="Executive Management" />
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Designation</T></label>
                  <input
                    required
                    list="designation-suggestions"
                    value={provisionForm.designation}
                    onChange={(e) => setProvisionForm({ ...provisionForm, designation: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                    placeholder="E.g., COO, Senior Developer..."
                  />
                  <datalist id="designation-suggestions">
                    <option value="Chief Executive Officer (CEO)" />
                    <option value="Chief Operating Officer (COO)" />
                    <option value="Chief Technology Officer (CTO)" />
                    <option value="Software Engineer" />
                    <option value="Senior Developer" />
                    <option value="HR Executive" />
                    <option value="HR Manager" />
                    <option value="Financial Analyst" />
                    <option value="Marketing Specialist" />
                    <option value="Operations Lead" />
                    <option value="Accountant" />
                    <option value="Executive Staff" />
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>System Role</T></label>
                  <select value={provisionForm.role} onChange={(e) => setProvisionForm({ ...provisionForm, role: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm">
                    <option value="Employee">{/* @ts-ignore */}<T>Employee</T></option>
                    <option value="Manager">{/* @ts-ignore */}<T>Manager</T></option>
                    <option value="HR Manager">{/* @ts-ignore */}<T>HR Manager</T></option>
                    <option value="Admin">{/* @ts-ignore */}<T>Admin</T></option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Manager</T></label>
                  <select value={provisionForm.managerId} onChange={(e) => setProvisionForm({ ...provisionForm, managerId: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm">
                    <option value="">{/* @ts-ignore */}<T>None</T></option>
                    {managerOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Branch</T></label>
                  <select value={provisionForm.branchId} onChange={(e) => setProvisionForm({ ...provisionForm, branchId: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm">
                    <option value="">{/* @ts-ignore */}<T>None</T></option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Employment Type</T></label>
                  <select value={provisionForm.employmentType} onChange={(e) => setProvisionForm({ ...provisionForm, employmentType: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm">
                    <option value="Full-Time">{/* @ts-ignore */}<T>Full-Time</T></option>
                    <option value="Part-Time">{/* @ts-ignore */}<T>Part-Time</T></option>
                    <option value="Contract">{/* @ts-ignore */}<T>Contract</T></option>
                    <option value="Intern">{/* @ts-ignore */}<T>Intern</T></option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Join Date</T></label>
                  <input type="date" value={provisionForm.joinDate} onChange={(e) => setProvisionForm({ ...provisionForm, joinDate: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Base Salary (BDT)</T></label>
                  <input type="number" min="0" value={provisionForm.baseSalary} onChange={(e) => setProvisionForm({ ...provisionForm, baseSalary: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm" placeholder="e.g. 50000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>National ID (NID)</T></label>
                  <input type="text" value={provisionForm.nid} onChange={(e) => setProvisionForm({ ...provisionForm, nid: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm" placeholder="10 / 13 / 17 digits" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] flex items-center gap-1"><Monitor className="h-3 w-3" /> {/* @ts-ignore */}<T>Assign Hardware (Optional)</T></label>
                  <select value={provisionForm.provisionAssetId} onChange={(e) => setProvisionForm({ ...provisionForm, provisionAssetId: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-xl px-3 py-2.5 text-sm">
                    <option value="">{/* @ts-ignore */}<T>None (Unassigned)</T></option>
                    {unassignedAssets.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 border-t border-[var(--border-hairline)] pt-4">
                <Button variant="ghost" size="md" type="button" onClick={() => setIsProvisionModalOpen(false)}>{/* @ts-ignore */}<T>Cancel</T></Button>
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
