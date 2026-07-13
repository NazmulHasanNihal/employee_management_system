"use client";

import React, { useState } from 'react';
import { Users, Search, Download, ShieldAlert, Key, UserCircle, Briefcase, Mail, Phone, Settings } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

const PERMISSIONS_LIST = [
  { id: 'MANAGE_ASSETS', label: 'Manage IT Assets', desc: 'Hardware inventory & software licenses' },
  { id: 'MANAGE_TRAINING', label: 'Manage LMS', desc: 'Training modules & compliance tracking' },
  { id: 'VIEW_ALL_TIMESHEETS', label: 'View All Timesheets', desc: 'Full visibility over payroll hours' },
  { id: 'MANAGE_PROJECTS', label: 'Manage Projects', desc: 'Client billables & strategic initiatives' }
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

  if (isLoading || !user) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Querying Master Registry...</div>;
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
    setEditingPermsFor(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-teal-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Users className="text-teal-400" size={36} />
            Master Registry
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Centralized employee database and access control.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-6 md:mt-0 items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Search Personnel..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-teal-500 transition-colors shadow-inner"
            />
          </div>
          <button className="w-full md:w-auto bg-black/50 border border-white/10 text-white px-4 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:border-teal-500 transition-all flex items-center justify-center gap-2">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
            <Users size={48} className="mx-auto text-[var(--text-muted)] opacity-50 mb-4" />
            <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No Personnel Found.</h3>
          </div>
        ) : (
          list.map((emp: any) => (
            <div key={emp.id} className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-teal-500/30 transition-colors rounded-3xl p-6 relative overflow-hidden group shadow-lg flex flex-col h-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/30">
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg font-mono truncate max-w-[150px]">{emp.name}</h4>
                    <p className="text-[10px] font-mono text-teal-400 uppercase tracking-widest">{emp.designation || 'Staff'}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${
                  emp.role === 'Admin' ? 'bg-[var(--alert-red)]/10 text-[var(--alert-red)] border-[var(--alert-red)]/30' :
                  emp.role === 'HR Manager' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                  'bg-white/5 text-[var(--text-muted)] border-white/10'
                }`}>
                  {emp.role}
                </span>
              </div>
              
              <div className="space-y-3 mb-6 flex-1 relative z-10">
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <Briefcase size={14} className="text-white/30" />
                  <span className="font-sans truncate">{emp.department || 'No Department Assigned'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <Mail size={14} className="text-white/30" />
                  <span className="font-mono text-xs truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <Phone size={14} className="text-white/30" />
                  <span className="font-mono text-xs">{emp.phone || '+1 (555) 000-0000'}</span>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-white/10 relative z-10">
                  <button 
                    onClick={() => setEditingPermsFor(emp)}
                    className="w-full bg-black/50 text-white/70 py-2.5 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-teal-500/20 hover:text-teal-400 border border-white/10 hover:border-teal-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Settings size={14} /> Configure Access
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Permissions Modal */}
      {showModal(editingPermsFor !== null) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-teal-500/30 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(20,184,166,0.15)] animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-teal-500/10 p-6 border-b border-teal-500/20 flex justify-between items-center relative shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10">
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="text-teal-400" size={18} /> Access Control Configuration
                </h3>
                <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1 uppercase tracking-widest">
                  Target: <span className="text-teal-400">{editingPermsFor.name}</span>
                </p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <p className="text-xs font-mono text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                <Key size={14} /> Security Clearances
              </p>
              
              {PERMISSIONS_LIST.map(perm => {
                let currentPerms = [];
                try { if (editingPermsFor.permissions) currentPerms = JSON.parse(editingPermsFor.permissions); } catch(e) {}
                const isGranted = currentPerms.includes(perm.id);
                
                return (
                  <div key={perm.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-start gap-4">
                    <input 
                      type="checkbox" 
                      id={`perm-${perm.id}`}
                      checked={isGranted}
                      onChange={() => handleTogglePerm(perm.id)}
                      className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 accent-teal-500"
                    />
                    <div>
                      <label htmlFor={`perm-${perm.id}`} className="font-bold text-sm text-white font-mono cursor-pointer">{perm.label}</label>
                      <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">{perm.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-white/10 flex gap-4 shrink-0 bg-black/40">
              <button 
                onClick={() => setEditingPermsFor(null)} 
                className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
              >
                Cancel
              </button>
              <button 
                onClick={savePermissions} 
                disabled={updatePermsMutation.isPending}
                className="flex-1 bg-teal-500 text-black py-3 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest hover:brightness-110 shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all disabled:opacity-50"
              >
                {updatePermsMutation.isPending ? 'Committing...' : 'Commit Changes'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Helper to prevent reference error
function showModal(condition: boolean) {
  return condition;
}
