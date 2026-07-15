"use client";

import React, { useState } from 'react';
import { Network, Building2, Users, DollarSign, Plus, UserCircle, Briefcase, Hash, ShieldAlert } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function HierarchyPage() {
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === 'Admin';
  
  const utils = trpc.useUtils();
  const { data: departments, isLoading: deptsLoading } = trpc.departments.getDepartments.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.registry.searchEmployees.useQuery({ query: '' });

  const [showCreate, setShowCreate] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', budget: 100000, headId: '' });

  const createDept = trpc.departments.createDepartment.useMutation({
    onSuccess: () => {
      utils.departments.getDepartments.invalidate();
      setShowCreate(false);
      setNewDept({ name: '', budget: 100000, headId: '' });
    }
  });

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <ShieldAlert size={64} className="mx-auto text-[var(--alert-red)]/50" />
          <h2 className="text-xl font-mono text-white uppercase tracking-widest">Restricted Zone</h2>
          <p className="text-[var(--text-muted)] text-sm font-mono">Restructure operations require Level 5 (Admin) Clearance.</p>
        </div>
      </div>
    );
  }

  if (deptsLoading || usersLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Initializing Restructure Sandbox...</div>;
  }

  const deptList = departments || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Building2 className="text-indigo-400" size={36} />
            Restructure Sandbox
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Configure operational units, budgets, and leadership.
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="mt-6 md:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2"
        >
          {showCreate ? 'Cancel Unit' : <><Plus size={16} /> New Operational Unit</>}
        </button>
      </div>

      {showCreate && (
        <div className="bg-[#0a0a0a] border border-indigo-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(79,70,229,0.15)] animate-in slide-in-from-top-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <h3 className="font-mono text-xl font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4 mb-6 relative z-10">
            <Hash className="text-indigo-400" size={24} /> Unit Configuration
          </h3>

          <form 
            className="space-y-6 relative z-10" 
            onSubmit={e => { e.preventDefault(); createDept.mutate(newDept); }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Unit Designation</label>
                <input 
                  type="text" required placeholder="e.g. Cyber Security"
                  value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-indigo-500 outline-none transition-colors shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Allocated Budget ($)</label>
                <input 
                  type="number" required min="0" step="10000"
                  value={newDept.budget} onChange={e => setNewDept({...newDept, budget: parseInt(e.target.value)})}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-indigo-500 outline-none transition-colors shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Unit Commander (Head)</label>
                <select 
                  value={newDept.headId} onChange={e => setNewDept({...newDept, headId: e.target.value})}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-indigo-500 outline-none appearance-none transition-colors shadow-inner"
                >
                  <option value="">Leave Unassigned...</option>
                  {users?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button 
              disabled={createDept.isPending || !newDept.name} type="submit" 
              className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-black font-mono text-sm uppercase tracking-widest hover:brightness-110 shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <Plus size={18} /> Establish Unit
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {deptList.length === 0 ? (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
            <Building2 size={64} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
            <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No Operational Units Defined.</h3>
          </div>
        ) : (
          deptList.map((dept: any) => (
            <div key={dept.id} className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-indigo-500/50 transition-colors rounded-3xl p-6 relative overflow-hidden group shadow-lg flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10 border-b border-white/10 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shrink-0">
                  <Hash size={24} />
                </div>
                <div>
                  <h3 className="font-black text-white text-xl font-mono truncate">{dept.name}</h3>
                  <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mt-0.5">UUID: {dept.id.slice(0, 8)}</p>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 relative z-10">
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <DollarSign size={16} className="text-emerald-400" />
                    <span className="text-xs font-mono uppercase tracking-widest">Operating Budget</span>
                  </div>
                  <span className="font-mono font-bold text-white">${dept.budget.toLocaleString()}</span>
                </div>
                
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <UserCircle size={16} className="text-purple-400" />
                    <span className="text-xs font-mono uppercase tracking-widest">Unit Commander</span>
                  </div>
                  <span className={`font-mono font-bold text-xs ${dept.head ? 'text-white' : 'text-[var(--alert-red)] animate-pulse'}`}>
                    {dept.head?.name || 'UNASSIGNED'}
                  </span>
                </div>
              </div>
              
            </div>
          ))
        )}
      </div>

    </div>
  );
}
