"use client";

import React, { useState } from 'react';
import { Settings, Plus, Save, ServerCrash, Bitcoin, AlertTriangle, Layers, Percent } from 'lucide-react';
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

  // New Head State
  const [newHeadName, setNewHeadName] = useState('');
  const [newHeadType, setNewHeadType] = useState<'EARNING' | 'DEDUCTION'>('EARNING');

  // New Structure State
  const [structureForm, setStructureForm] = useState(false);
  const [sName, setSName] = useState('');
  const [sBase, setSBase] = useState(5000);
  const [sHeads, setSHeads] = useState<{headId: string, amountType: 'FIXED' | 'PERCENTAGE' | 'FORMULA', value: string}[]>([]);

  if (!isAdmin) return <div className="p-8 text-center text-[var(--alert-red)] font-mono uppercase tracking-widest animate-pulse">Unauthorized Access. Security Breach Logged.</div>;

  const handleCreateHead = () => {
    if (!newHeadName) return;
    createHeadMutation.mutate({ name: newHeadName, type: newHeadType });
  };

  const handleCreateStructure = () => {
    createStructureMutation.mutate({
      name: sName,
      baseSalary: sBase,
      heads: sHeads
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0 relative h-full flex flex-col">
      <div className="flex justify-between items-end pb-4 border-b border-white/10 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--signal-amber)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Settings className="text-[var(--signal-amber)]" size={28} /> Payroll Engine
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 uppercase tracking-widest">Global Compensation Architecture</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: Heads */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-lg font-bold font-mono text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <Bitcoin size={16} className="text-[var(--signal-amber)]"/> Payroll Heads
            </h3>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Name (e.g. Tax)" 
                value={newHeadName} 
                onChange={e => setNewHeadName(e.target.value)}
                className="flex-1 bg-black/60 border border-white/10 p-2 text-xs font-mono text-white rounded"
              />
              <select 
                value={newHeadType} 
                onChange={e => setNewHeadType(e.target.value as any)}
                className="bg-black/60 border border-white/10 p-2 text-xs font-mono text-white rounded"
              >
                <option value="EARNING">Earning</option>
                <option value="DEDUCTION">Deduction</option>
              </select>
              <button onClick={handleCreateHead} className="bg-[var(--signal-amber)]/20 text-[var(--signal-amber)] px-3 rounded hover:bg-[var(--signal-amber)] hover:text-black transition-colors"><Plus size={16}/></button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {loadingHeads ? <p className="text-white/50 text-xs">Loading...</p> : heads?.map(h => (
                <div key={h.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded">
                  <span className="font-mono text-xs text-white">{h.name}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${h.type === 'EARNING' ? 'bg-[var(--verify-green)]/20 text-[var(--verify-green)]' : 'bg-[var(--alert-red)]/20 text-[var(--alert-red)]'}`}>
                    {h.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Structures */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-xl min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
                <Layers size={16} className="text-[var(--ledger-blue)]"/> Compensation Structures
              </h3>
              {!structureForm && (
                <button 
                  onClick={() => setStructureForm(true)}
                  className="bg-[var(--ledger-blue)]/20 text-[var(--ledger-blue)] border border-[var(--ledger-blue)]/50 px-4 py-2 rounded text-xs font-mono font-bold hover:bg-[var(--ledger-blue)] hover:text-black transition-colors"
                >
                  New Structure
                </button>
              )}
            </div>

            {structureForm ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Structure Name</label>
                    <input type="text" value={sName} onChange={e => setSName(e.target.value)} className="w-full bg-black border border-white/10 p-2 text-sm text-white rounded font-mono" placeholder="e.g. Executive Plan" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Default Base Salary</label>
                    <input type="number" value={sBase} onChange={e => setSBase(Number(e.target.value))} className="w-full bg-black border border-white/10 p-2 text-sm text-white rounded font-mono" />
                  </div>
                </div>

                <div className="border border-white/10 rounded-xl p-4 bg-white/5 space-y-4">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Configured Heads</h4>
                  
                  {sHeads.map((sh, idx) => {
                    const headObj = heads?.find(h => h.id === sh.headId);
                    return (
                      <div key={idx} className="flex gap-2 items-center bg-black/40 p-2 rounded border border-white/5">
                        <span className="text-xs text-white font-mono flex-1">{headObj?.name}</span>
                        <select 
                          value={sh.amountType} 
                          onChange={(e) => {
                            const newHeads = [...sHeads];
                            newHeads[idx].amountType = e.target.value as any;
                            setSHeads(newHeads);
                          }}
                          className="bg-black/60 border border-white/10 p-1.5 text-[10px] font-mono text-white rounded w-28"
                        >
                          <option value="FIXED">Fixed</option>
                          <option value="PERCENTAGE">% of Base</option>
                          <option value="FORMULA">Formula</option>
                        </select>
                        <input 
                          type="text" 
                          value={sh.value}
                          onChange={(e) => {
                            const newHeads = [...sHeads];
                            newHeads[idx].value = e.target.value;
                            setSHeads(newHeads);
                          }}
                          placeholder={sh.amountType === 'FORMULA' ? '(OvertimeHours * 10)' : 'Amount'}
                          className="w-48 bg-black/60 border border-white/10 p-1.5 text-xs font-mono text-white rounded"
                        />
                        <button onClick={() => setSHeads(sHeads.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-500/20 p-1 rounded"><ServerCrash size={14}/></button>
                      </div>
                    );
                  })}

                  <div className="flex gap-2 pt-2">
                    <select id="headSelect" className="flex-1 bg-black/60 border border-[var(--ledger-blue)]/50 p-2 text-xs font-mono text-white rounded">
                      <option value="">-- Add Head --</option>
                      {heads?.filter(h => !sHeads.find(sh => sh.headId === h.id)).map(h => (
                        <option key={h.id} value={h.id}>{h.name} ({h.type})</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => {
                        const select = document.getElementById('headSelect') as HTMLSelectElement;
                        if (select.value) {
                          setSHeads([...sHeads, { headId: select.value, amountType: 'FIXED', value: '0' }]);
                          select.value = '';
                        }
                      }}
                      className="bg-white/10 px-4 text-xs font-mono text-white rounded hover:bg-white/20"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="mt-4 p-3 border border-[var(--signal-amber)]/30 bg-[var(--signal-amber)]/5 rounded text-[10px] text-[var(--signal-amber)] font-mono flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <p>Formulas support variables: <code>BaseSalary</code>, <code>TotalHours</code>, <code>OvertimeHours</code>, <code>LateDays</code>, <code>HourlyRate</code>. Example: <code>(OvertimeHours * HourlyRate * 1.5)</code></p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setStructureForm(false)} className="px-4 py-2 text-xs font-mono text-white/50 hover:text-white">Cancel</button>
                  <button onClick={handleCreateStructure} className="bg-[var(--ledger-blue)] text-black px-6 py-2 rounded font-mono text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_var(--ledger-blue)] flex items-center gap-2">
                    <Save size={14} /> Deploy Structure
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {loadingStructs ? <div className="text-white/50">Loading...</div> : structures?.map(s => (
                  <div key={s.id} className="border border-white/10 rounded-xl p-4 bg-white/5 hover:border-white/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-white group-hover:text-[var(--ledger-blue)] transition-colors">{s.name}</h4>
                        <p className="text-xs font-mono text-white/50 mt-1">Base: ${s.baseSalary?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.heads.map(sh => (
                        <div key={sh.id} className="bg-black/60 border border-white/10 px-2 py-1 rounded flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${sh.head.type === 'EARNING' ? 'bg-[var(--verify-green)]' : 'bg-[var(--alert-red)]'}`} />
                          <span className="text-[10px] font-mono text-white/80">{sh.head.name}</span>
                          <span className="text-[10px] font-mono text-white/40">[{sh.amountType}]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
