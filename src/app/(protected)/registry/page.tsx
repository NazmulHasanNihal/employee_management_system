"use client";

import React, { useState } from 'react';
import { Users, Search, Download, Trash2, Mail, ShieldAlert, X, Activity } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

const PERMISSIONS_LIST = [
  { id: 'MANAGE_ASSETS', label: 'Manage IT Assets', desc: 'Can add, assign, and update hardware inventory' },
  { id: 'MANAGE_TRAINING', label: 'Manage LMS', desc: 'Can create training modules and track compliance' },
  { id: 'VIEW_ALL_TIMESHEETS', label: 'View All Timesheets', desc: 'Can view and delete any employee timesheet' },
  { id: 'MANAGE_PROJECTS', label: 'Manage Projects', desc: 'Can create and manage client billable projects' }
];

export default function RegistryPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin';
  
  const [filter, setFilter] = useState('');
  const [editingPermsFor, setEditingPermsFor] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: employees, isLoading } = trpc.registry.searchEmployees.useQuery({
    query: filter || undefined
  }, { enabled: !!user });

  const updatePermsMutation = trpc.registry.updatePermissions.useMutation({
    onSuccess: () => {
      utils.registry.searchEmployees.invalidate();
    }
  });

  const updateCurrencyMutation = trpc.registry.updateCurrency.useMutation({
    onSuccess: () => {
      utils.registry.searchEmployees.invalidate();
    }
  });

  const updateStructureMutation = trpc.registry.updatePayrollStructure.useMutation({
    onSuccess: () => {
      utils.registry.searchEmployees.invalidate();
    }
  });

  const { data: structures } = trpc.payroll.getStructures.useQuery(undefined, { enabled: isAdmin });

  if (isLoading || !user) {
    return <div className="p-8 text-center text-white/50 animate-pulse font-mono">Loading Registry...</div>;
  }

  const list = employees || [];

  const handleTogglePerm = (permId: string) => {
    if (!editingPermsFor) return;
    
    let currentPerms = [];
    try {
      if (editingPermsFor.permissions) {
        currentPerms = JSON.parse(editingPermsFor.permissions);
      }
    } catch(e) {}

    const newPerms = currentPerms.includes(permId)
      ? currentPerms.filter((p: string) => p !== permId)
      : [...currentPerms, permId];

    setEditingPermsFor({ ...editingPermsFor, permissions: JSON.stringify(newPerms) });
  };

  const savePermissions = async () => {
    let perms = [];
    try { perms = JSON.parse(editingPermsFor.permissions || '[]'); } catch(e) {}
    
    await updatePermsMutation.mutateAsync({ userId: editingPermsFor.id, permissions: perms });
    await updateCurrencyMutation.mutateAsync({ userId: editingPermsFor.id, currency: editingPermsFor.currency || 'USD' });
    if (editingPermsFor.payrollStructureId !== undefined) {
      await updateStructureMutation.mutateAsync({ userId: editingPermsFor.id, structureId: editingPermsFor.payrollStructureId });
    }
    setEditingPermsFor(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0 relative h-full flex flex-col">
      <div className="flex justify-between items-end pb-4 border-b border-white/10 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Users className="text-[var(--ledger-blue)]" size={28} /> Organization Registry
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 uppercase tracking-widest">Master Record</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white/5 border border-white/10 text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2 rounded-lg">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex gap-4 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input 
              type="text" 
              value={filter} 
              onChange={e => setFilter(e.target.value)} 
              placeholder="Search directory..." 
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-sans text-white focus:border-[var(--ledger-blue)]" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-black/60 border-b border-white/10">
                <th className="py-3 px-4 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">Entity</th>
                <th className="py-3 px-4 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">Contact</th>
                <th className="py-3 px-4 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest">Dept & Role</th>
                {isAdmin && <th className="py-3 px-4 font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest text-right">Access</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {list.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--ledger-blue)]/20 to-transparent border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-white">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-white block group-hover:text-[var(--ledger-blue)] transition-colors">{emp.name}</span>
                      <span className="text-[10px] font-mono text-white/50">{emp.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-2 text-white/80 font-sans"><Mail size={12} className="text-white/30" /> {emp.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="block text-white font-bold">{emp.designation || 'Employee'}</span>
                    <span className="text-[10px] font-mono text-white/50 uppercase">{emp.department || 'Unassigned'} • {emp.role}</span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => setEditingPermsFor(emp)}
                        className="bg-[var(--ledger-blue)]/10 text-[var(--ledger-blue)] border border-[var(--ledger-blue)]/30 px-3 py-1 rounded text-[10px] font-mono uppercase tracking-widest hover:bg-[var(--ledger-blue)] hover:text-black transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="p-16 text-center">
              <Users size={48} className="text-white/10 mx-auto mb-4" />
              <p className="font-mono text-sm text-[var(--text-muted)] uppercase tracking-widest">No matching employees.</p>
            </div>
          )}
        </div>
      </div>

      {/* RBAC Modal */}
      {editingPermsFor && isAdmin && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert size={16} className="text-[var(--alert-red)]" /> Employee Settings
              </h3>
              <button onClick={() => setEditingPermsFor(null)} className="text-white/50 hover:text-white p-1 rounded hover:bg-white/10"><X size={16}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-lg text-white">
                  {editingPermsFor.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white leading-tight">{editingPermsFor.name}</h4>
                  <p className="text-xs font-mono text-[var(--text-muted)]">Base Role: {editingPermsFor.role}</p>
                </div>
              </div>

              <div className="space-y-3">
                {PERMISSIONS_LIST.map(perm => {
                  let currentPerms = [];
                  try { currentPerms = JSON.parse(editingPermsFor.permissions || '[]'); } catch(e) {}
                  const hasPerm = currentPerms.includes(perm.id);

                  return (
                    <label key={perm.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${hasPerm ? 'bg-[var(--ledger-blue)]/10 border-[var(--ledger-blue)]/50' : 'bg-black/40 border-white/10 hover:border-white/30'}`}>
                      <input 
                        type="checkbox" className="mt-1"
                        checked={hasPerm}
                        onChange={() => handleTogglePerm(perm.id)}
                      />
                      <div>
                        <p className={`font-mono text-xs font-bold uppercase tracking-widest ${hasPerm ? 'text-[var(--ledger-blue)]' : 'text-white'}`}>{perm.label}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{perm.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Base Currency</label>
                  <select 
                    value={editingPermsFor.currency || 'USD'} 
                    onChange={(e) => setEditingPermsFor({ ...editingPermsFor, currency: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm font-mono text-white focus:border-[var(--ledger-blue)] appearance-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Payroll Structure</label>
                  <select 
                    value={editingPermsFor.payrollStructureId || ''} 
                    onChange={(e) => setEditingPermsFor({ ...editingPermsFor, payrollStructureId: e.target.value || null })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm font-mono text-white focus:border-[var(--ledger-blue)] appearance-none"
                  >
                    <option value="">-- No Structure --</option>
                    {structures?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-3">
              <button onClick={() => setEditingPermsFor(null)} className="px-4 py-2 text-xs font-mono font-bold text-white hover:bg-white/5 rounded-lg uppercase tracking-widest transition-colors">
                Cancel
              </button>
              <button 
                disabled={updatePermsMutation.isPending || updateCurrencyMutation.isPending}
                onClick={savePermissions}
                className="bg-[var(--alert-red)] text-white px-6 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-widest hover:shadow-[0_0_15px_var(--alert-red)] transition-all flex items-center gap-2"
              >
                {(updatePermsMutation.isPending || updateCurrencyMutation.isPending) ? <Activity size={14} className="animate-spin" /> : 'Apply Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
