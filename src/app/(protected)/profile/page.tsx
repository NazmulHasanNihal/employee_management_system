"use client";

import React, { useState } from 'react';
import { User as UserIcon, Eye, CalendarDays, HardDrive, Briefcase, CheckSquare, Activity, CheckCircle, Shield } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc/client';

import { CombatStats } from '@/components/profile/CombatStats';
import { DocumentVault } from '@/components/profile/DocumentVault';
import { SprintHeatmap } from '@/components/profile/SprintHeatmap';
import { DelegationSettings } from '@/components/profile/DelegationSettings';
import { SkillsWallet } from '@/components/profile/SkillsWallet';

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any; 
  const [checklist, setChecklist] = useState({ offer: true, it: true, compliance: false });
  const [toasts, setToasts] = useState<{id: number, message: string, type: string}[]>([]);

  const { data: documents, isLoading } = trpc.profile.getDocuments.useQuery(undefined, { enabled: !!user });

  const addToast = (message: string, type = 'default') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  if (!user || isLoading) return <div className="p-8 text-center ledger-muted animate-pulse">Loading...</div>;

  const isAdmin = user.role === 'Admin' || user.role === 'HR Manager';
  const userDocs = (documents ?? []).filter(d => d.user === user.name || isAdmin);
  
  // Mock extended user data if missing
  const extendedUser = {
    ...user,
    salary: user.salary || 140000,
    leave: { annual: 14, sick: 3 },
    assets: [
      { id: 3, name: 'MacBook Pro 16"', status: 'Good' },
      { id: 4, name: 'YubiKey', status: 'Active' }
    ],
    profileViews: [{ viewer: 'Audit_Bot' }]
  };

  const toggleChecklist = (field: keyof typeof checklist) => {
    if (!isAdmin) return;
    setChecklist(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-0">
      <div className="flex justify-between items-end pb-4 border-b ledger-border">
        <div>
          <h2 className="text-2xl font-mono font-bold uppercase tracking-tight ledger-text">System Profile & Vault</h2>
          <p className="text-[10px] font-mono ledger-muted mt-2 uppercase tracking-widest">Identification & Assets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="ledger-panel p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--verify-green)] to-transparent opacity-50"></div>
            <div className="w-24 h-24 bg-[var(--bg-void)] border-4 ledger-border flex items-center justify-center mb-4 relative z-10">
              <UserIcon size={40} className="ledger-muted" />
              <div className="absolute -bottom-2 -right-2 bg-[var(--verify-green)] text-[var(--bg-panel)] font-bold text-xs px-2 py-0.5 border border-black shadow-[2px_2px_0_0_#000]">
                LVL {user.rpgLevel || 1}
              </div>
            </div>
            <h3 className="text-xl font-bold ledger-text uppercase tracking-tight relative z-10">{extendedUser.name}</h3>
            <span className="badge text-[var(--signal-amber)] border-[var(--signal-amber)] mt-2 px-2 py-0.5 rounded-full border font-mono text-[10px] relative z-10">{extendedUser.id}</span>
            
            <div className="w-full mt-4 flex items-center gap-2">
              <span className="text-[10px] font-mono ledger-text">XP</span>
              <div className="flex-1 bg-[var(--bg-void)] h-1 border ledger-border">
                <div className="bg-[var(--ledger-blue)] h-full" style={{ width: `${((user.xp || 0) % 1000) / 10}%` }}></div>
              </div>
              <span className="text-[10px] font-mono ledger-text">{user.xp || 0}</span>
            </div>

            <div className="mt-4 pt-4 border-t ledger-border w-full text-[10px] font-mono ledger-muted flex flex-col gap-1 items-center relative z-10">
              <span className="flex items-center gap-1">
                <Eye size={12}/> Viewed by: {extendedUser.profileViews?.length ? extendedUser.profileViews[0].viewer : 'None'}
              </span>
            </div>
          </div>

          <CombatStats user={user} />

          <div className="ledger-panel p-6 space-y-4">
            <h4 className="font-mono text-[10px] font-bold ledger-text uppercase tracking-widest mb-2 flex items-center gap-2">
              <CalendarDays size={14}/> Leave Balances
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="ledger-muted">Annual</span>
                  <span className="text-[var(--verify-green)]">{extendedUser.leave.annual} / 20</span>
                </div>
                <div className="w-full bg-[var(--bg-void)] border ledger-border h-2">
                  <div className="bg-[var(--verify-green)] h-full transition-all" style={{width: `${(extendedUser.leave.annual/20)*100}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="ledger-panel p-6 space-y-4">
            <h4 className="font-mono text-[10px] font-bold ledger-text uppercase tracking-widest mb-2 flex items-center gap-2">
              <HardDrive size={14}/> Assets
            </h4>
            <ul className="list-none text-xs font-mono space-y-2">
              {extendedUser.assets.map((asset: any) => (
                <li key={asset.id} className="flex justify-between border-b ledger-border pb-1">
                  <span className="ledger-text truncate">{asset.name}</span>
                  <span className="ledger-muted">{asset.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="ledger-panel p-6">
            <h3 className="font-mono text-xs font-bold text-[var(--signal-amber)] uppercase tracking-widest mb-6 flex items-center gap-2">
              <Briefcase size={16} /> Corporate Structure
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-mono ledger-muted uppercase tracking-widest mb-1">Department</p>
                <p className="text-sm font-bold ledger-text uppercase">{extendedUser.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono ledger-muted uppercase tracking-widest mb-1">Designation</p>
                <p className="text-sm font-bold ledger-text uppercase">{extendedUser.designation || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono ledger-muted uppercase tracking-widest mb-1">Category</p>
                <p className="text-xs font-mono ledger-text uppercase">{extendedUser.employmentType || 'Permanent'}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono ledger-muted uppercase tracking-widest mb-1">Base Pay (Private)</p>
                <p className="text-xs font-mono ledger-text uppercase">৳{extendedUser.salary.toLocaleString()}/yr</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentVault documents={userDocs} addToast={addToast} />

            <div className="ledger-panel p-6">
              <h3 className="font-mono text-xs font-bold text-[var(--verify-green)] uppercase tracking-widest mb-6 flex items-center gap-2">
                <CheckSquare size={16} /> Lifecycle Checklist
              </h3>
              <div className="space-y-3 font-mono text-[10px] ledger-text">
                {(['offer', 'it', 'compliance'] as const).map(f => (
                  <label key={f} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={checklist[f]} 
                      onChange={() => toggleChecklist(f)} 
                      disabled={!isAdmin} 
                      className="accent-[var(--verify-green)] bg-[var(--bg-void)]" 
                    /> 
                    <span className="uppercase">{f} completed</span>
                  </label>
                ))}
              </div>
            </div>

            <SkillsWallet user={user} addToast={addToast} />
            <DelegationSettings user={user} addToast={addToast} />
          </div>
        </div>
      </div>

      <SprintHeatmap />

      {/* Local Toasts */}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`p-4 font-mono text-xs uppercase tracking-widest border shadow-lg flex items-center gap-2 animate-in slide-in-from-right ${t.type === 'error' ? 'bg-[var(--alert-red)]/10 border-[var(--alert-red)] text-[var(--alert-red)]' : t.type === 'success' ? 'bg-[var(--verify-green)]/10 border-[var(--verify-green)] text-[var(--verify-green)]' : 'bg-[var(--bg-panel)] ledger-border ledger-text'}`}>
             {t.type === 'success' ? <CheckCircle size={14}/> : <Activity size={14}/>} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
