'use client';

import React, { useState } from 'react';
import { Building2, Hash, Plus, X, DollarSign, UserCircle, Users } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';

interface Department {
  id: string;
  name: string;
  budget?: number | null;
  head?: { name: string } | null;
}

interface Employee {
  id: string;
  name: string;
}

export default function HierarchyManager({
  departments,
  employees,
}: {
  departments: Department[];
  employees: Employee[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', budget: 100000, headId: '' });

  const utils = trpc.useUtils();
  // Live data (seeded with server props) so create/delete refresh in place.
  const { data: departmentsData } = trpc.departments.getDepartments.useQuery(undefined, { initialData: departments as any });
  const liveDepartments = (departmentsData as Department[] | undefined) ?? departments ?? [];
  const { data: employeesData } = trpc.registry.getAll.useQuery(undefined, { initialData: employees as any });
  const liveEmployees = (employeesData as Employee[] | undefined) ?? employees ?? [];

  const createDept = trpc.departments.createDepartment.useMutation({
    onSuccess: () => {
      utils.departments.getDepartments.invalidate();
      setShowCreate(false);
      setNewDept({ name: '', budget: 100000, headId: '' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">
          Configure operational units, budgets, and leadership.
        </p>
        <Button variant="primary" size="md" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? 'Cancel Unit' : 'New Operational Unit'}
        </Button>
      </div>

      {showCreate && (
        <div className="animate-scale-in rounded-3xl border border-[var(--brand)]/30 bg-[var(--bg-panel)] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-main)]">
            <Hash className="h-4 w-4 text-[var(--brand)]" /> Unit Configuration
          </h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createDept.mutate(newDept);
            }}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Unit Designation</label>
                <input
                  type="text" required placeholder="e.g. Cyber Security"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Allocated Budget ($)</label>
                <input
                  type="number" required min="0" step="10000"
                  value={newDept.budget}
                  onChange={(e) => setNewDept({ ...newDept, budget: parseInt(e.target.value) })}
                  className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Unit Commander (Head)</label>
                <select
                  value={newDept.headId}
                  onChange={(e) => setNewDept({ ...newDept, headId: e.target.value })}
                  className="ledger-input w-full rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="">Leave Unassigned...</option>
                  {liveEmployees.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={createDept.isPending || !newDept.name}>
              <Plus className="h-4 w-4" /> Establish Unit
            </Button>
          </form>
        </div>
      )}

      {liveDepartments.length === 0 ? (
        <EmptyState
          title="No operational units defined"
          description="Create your first department to organize the org structure."
          icon={<Building2 className="h-6 w-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {liveDepartments.map((dept) => (
            <div key={dept.id} className="flex flex-col rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3 border-b border-[var(--border-hairline)] pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                  <Hash className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="truncate text-xl font-semibold text-[var(--text-main)]">{dept.name}</h3>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--brand)]">UUID: {dept.id.slice(0, 8)}</p>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-4">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <DollarSign className="h-4 w-4 text-[var(--emerald)]" />
                    <span className="text-xs uppercase tracking-wide">Operating Budget</span>
                  </div>
                  <span className="font-semibold text-[var(--text-main)]">${(dept.budget || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)]/40 p-4">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <UserCircle className="h-4 w-4 text-[var(--brand)]" />
                    <span className="text-xs uppercase tracking-wide">Unit Commander</span>
                  </div>
                  <span className={`text-xs font-semibold ${dept.head ? 'text-[var(--text-main)]' : 'text-[var(--rose)] animate-pulse'}`}>
                    {dept.head?.name || 'UNASSIGNED'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Users className="h-4 w-4" />
        {liveEmployees.length} employees in directory
      </div>
    </div>
  );
}
