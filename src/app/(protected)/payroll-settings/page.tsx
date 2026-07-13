"use client";

import React, { useState } from 'react';
import { Settings, Plus, Save, Bitcoin, AlertTriangle, Layers, Percent, Box, ShieldAlert, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function PayrollSettingsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const utils = trpc.useUtils();
  const { data: heads, isLoading: loadingHeads } = trpc.payroll.getHeads.useQuery(undefined, { enabled: isAdmin });
  const { data: structures, isLoading: loadingStructs } = trpc.payroll.getStructures.useQuery(undefined, { enabled: isAdmin });

  const createHeadMutation = trpc.payroll.createHead.useMutation({
    onSuccess: () => {
      utils.payroll.getHeads.invalidate();
      setNewHeadName('');
    }
  });

  const createStructureMutation = trpc.payroll.createStructure.useMutation({
    onSuccess: () => {
      utils.payroll.getStructures.invalidate();
      setStructureForm(false);
    }
  });

  const [newHeadName, setNewHeadName] = useState('');
  const [newHeadType, setNewHeadType] = useState<'EARNING' | 'DEDUCTION'>('EARNING');

  const [structureForm, setStructureForm] = useState(false);
  const [sName, setSName] = useState('');
  const [sBase, setSBase] = useState(5000);

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <ShieldAlert size={64} className="mx-auto text-[var(--alert-red)]/50" />
          <h2 className="text-xl font-mono text-white uppercase tracking-widest">Access Denied</h2>
          <p className="text-[var(--text-muted)] text-sm font-mono">Compensation Engines require Level 5 (Admin) Clearance.</p>
        </div>
      </div>
    );
  }

  const handleCreateHead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadName) return;
    createHeadMutation.mutate({ name: newHeadName, type: newHeadType });
  };

  const handleCreateStructure = (e: React.FormEvent) => {
    e.preventDefault();
    createStructureMutation.mutate({
      name: sName,
      baseSalary: sBase,
      heads: []
    });
  };

  if (loadingHeads || loadingStructs) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Booting Compensation Engine...</div>;
  }

  const headList = heads || [];
  const structList = structures || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--signal-amber)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Settings className="text-[var(--signal-amber)]" size={36} />
            Compensation Engine
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Configure Global Salary Structures & Variables.
          </p>
        </div>
        <button 
          onClick={() => setStructureForm(!structureForm)}
          className="mt-6 md:mt-0 bg-[var(--signal-amber)] text-black px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(255,170,0,0.3)] transition-all flex items-center gap-2"
        >
          {structureForm ? 'Cancel Creation' : <><Plus size={16} /> New Structure Matrix</>}
        </button>
      </div>

      {structureForm && (
        <div className="bg-[#0a0a0a] border border-[var(--signal-amber)]/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(255,170,0,0.15)] animate-in slide-in-from-top-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--signal-amber)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <h3 className="font-mono text-xl font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4 mb-6 relative z-10">
            <Layers className="text-[var(--signal-amber)]" size={24} /> Salary Structure Matrix
          </h3>

          <form className="space-y-6 relative z-10" onSubmit={handleCreateStructure}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Matrix Designation</label>
                <input 
                  type="text" required placeholder="e.g. Executive Package"
                  value={sName} onChange={e => setSName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-[var(--signal-amber)] outline-none transition-colors shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Baseline Anchor ($)</label>
                <input 
                  type="number" required min="0" step="1000"
                  value={sBase} onChange={e => setSBase(parseInt(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-[var(--signal-amber)] outline-none transition-colors shadow-inner"
                />
              </div>
            </div>
            <button 
              disabled={createStructureMutation.isPending || !sName} type="submit" 
              className="w-full bg-[var(--signal-amber)] text-black px-6 py-4 rounded-xl font-black font-mono text-sm uppercase tracking-widest hover:brightness-110 shadow-[0_0_30px_rgba(255,170,0,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <Save size={18} /> Compile Matrix
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Heads Manager */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#050505] border border-[var(--signal-amber)]/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-full">
            <h3 className="text-sm font-bold font-mono text-white mb-6 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4">
              <Bitcoin size={16} className="text-[var(--signal-amber)]"/> Global Heads
            </h3>
            
            <form onSubmit={handleCreateHead} className="space-y-4 mb-6 relative z-10">
              <input 
                type="text" required placeholder="New Head (e.g. Tax)" 
                value={newHeadName} onChange={e => setNewHeadName(e.target.value)}
                className="w-full bg-black/60 border border-white/10 p-3 text-sm font-mono text-white rounded-xl focus:border-[var(--signal-amber)] outline-none transition-colors"
              />
              <div className="flex gap-4">
                <select 
                  value={newHeadType} onChange={e => setNewHeadType(e.target.value as any)}
                  className="flex-1 bg-black/60 border border-white/10 p-3 text-[10px] uppercase tracking-widest font-mono text-white rounded-xl focus:border-[var(--signal-amber)] outline-none transition-colors appearance-none"
                >
                  <option value="EARNING">Earning</option>
                  <option value="DEDUCTION">Deduction</option>
                </select>
                <button type="submit" disabled={!newHeadName} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-colors border border-white/5">
                  <Plus size={20} />
                </button>
              </div>
            </form>

            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
              {headList.map((h: any) => (
                <div key={h.id} className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between items-center group hover:border-white/20 transition-colors">
                  <span className="font-mono text-xs text-white">{h.name}</span>
                  <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                    h.type === 'EARNING' ? 'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30' : 'bg-[var(--alert-red)]/10 text-[var(--alert-red)] border-[var(--alert-red)]/30'
                  }`}>
                    {h.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Structures Matrix Display */}
        <div className="lg:col-span-2">
          {structList.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-black/20 h-full flex flex-col items-center justify-center">
              <Layers size={64} className="text-[var(--text-muted)] opacity-50 mb-4" />
              <h3 className="font-mono text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">No Active Matrices.</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {structList.map((s: any) => (
                <div key={s.id} className="bg-[#050505] border border-white/10 hover:border-[var(--signal-amber)]/30 transition-colors rounded-3xl p-6 relative overflow-hidden group shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--signal-amber)]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div>
                      <h3 className="text-xl font-black text-white font-mono mb-1">{s.name}</h3>
                      <p className="text-[9px] font-mono text-[var(--signal-amber)] uppercase tracking-widest flex items-center gap-1">
                        <Box size={10} /> Matrix ID: {s.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="bg-black/60 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">Anchor Base</span>
                      <span className="text-sm font-mono font-bold text-white">${s.baseSalary.toLocaleString()}</span>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-3">Linked Variables</p>
                      {s.heads.length === 0 ? (
                        <p className="text-[10px] font-mono text-white/30 italic">No variables attached.</p>
                      ) : (
                        <div className="space-y-2">
                          {s.heads.map((sh: any) => (
                            <div key={sh.id} className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-white/70">{sh.head.name}</span>
                              <span className="text-[var(--text-muted)]">{sh.amountType === 'PERCENTAGE' ? `${sh.value}%` : `$${sh.value}`}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
