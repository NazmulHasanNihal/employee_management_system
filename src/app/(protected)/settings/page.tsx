"use client";

import React from 'react';
import { ShieldCheck, ServerCrash, Cpu, Activity, Database, Lock, Key } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { redirect } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const { language } = useAppStore();
  const t = useTranslation(language);

  const [flags, setFlags] = React.useState({
    maintenanceMode: false,
    debugLogging: true,
    strictAuth: true,
    autoProvision: false
  });

  const handleToggle = (key: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!user) return null;

  // Protect route
  if (user.role !== 'Admin') {
    redirect('/');
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Cpu className="text-[var(--ledger-blue)]" size={36} />
            {t('System Configuration')}
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            {t('Global tRPC Policies & System Variables.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Matrix Panel */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#050505] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-[var(--ledger-blue)]/30 transition-colors">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--ledger-blue)]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
            
            <h3 className="text-xl font-black font-mono text-white uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10 border-b border-white/10 pb-4">
              <ShieldCheck className="text-[var(--ledger-blue)]" size={24} /> {t('tRPC Permission Matrix')}
            </h3>
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full min-w-max text-left border-collapse font-mono">
                <thead className="bg-white/5 border border-white/10 text-[9px] text-[var(--text-muted)] uppercase tracking-widest">
                  <tr>
                    <th className="p-4 pl-6 rounded-tl-xl whitespace-nowrap">{t('Resource Endpoint')}</th>
                    <th className="p-4 text-center whitespace-nowrap">{t('L4 Admin')}</th>
                    <th className="p-4 text-center whitespace-nowrap">{t('L3 HR')}</th>
                    <th className="p-4 pr-6 text-center rounded-tr-xl whitespace-nowrap">{t('L1 Employee')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 border-x border-b border-white/10 rounded-b-xl text-sm bg-black/40">
                  {[
                    { m: 'PAYROLL (Read/Write)', a: 'R/W/D', hr: 'R/W', e: 'R (Self)' },
                    { m: 'ATTENDANCE (Clock)', a: 'R/W/D', hr: 'R/W', e: 'R/W (Self)' },
                    { m: 'LEAVE (Approvals)', a: 'R/W', hr: 'R/W', e: 'None' },
                    { m: 'AUDIT (Immutable)', a: 'R (Immutable)', hr: 'None', e: 'None' },
                    { m: 'DEI (Intelligence)', a: 'R', hr: 'R', e: 'None' },
                    { m: 'RECRUITMENT (ATS)', a: 'R/W', hr: 'R/W', e: 'None' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6 font-bold text-white whitespace-nowrap">{row.m}</td>
                      <td className="p-4 text-center text-[var(--alert-red)] whitespace-nowrap">
                        <span className="bg-[var(--alert-red)]/10 px-2 py-1 rounded border border-[var(--alert-red)]/30 text-[10px] tracking-widest">{row.a}</span>
                      </td>
                      <td className="p-4 text-center text-[var(--signal-amber)] whitespace-nowrap">
                        <span className="bg-[var(--signal-amber)]/10 px-2 py-1 rounded border border-[var(--signal-amber)]/30 text-[10px] tracking-widest">{row.hr}</span>
                      </td>
                      <td className="p-4 pr-6 text-center text-[var(--verify-green)] whitespace-nowrap">
                        <span className="bg-[var(--verify-green)]/10 px-2 py-1 rounded border border-[var(--verify-green)]/30 text-[10px] tracking-widest">{row.e}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Metrics Panel */}
        <div className="xl:col-span-1 space-y-6">
          
          <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
              <Activity className="text-purple-400" size={16} /> {t('System Health')}
            </h3>
            <div className="space-y-4">
              <div className="bg-black/60 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Database size={16} className="text-emerald-400" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">{t('Database Status')}</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-2 py-1 bg-emerald-400/10 rounded border border-emerald-400/30">{t('ONLINE')}</span>
              </div>
              <div className="bg-black/60 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ServerCrash size={16} className="text-[var(--ledger-blue)]" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">{t('tRPC Uptime')}</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ledger-blue)] font-bold">99.999%</span>
              </div>
            </div>
          </div>
          <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
              <Activity className="text-[var(--ledger-blue)]" size={16} /> {t('System Flags')}
            </h3>
            <div className="space-y-4">
              {[
                { key: 'maintenanceMode', label: 'Maintenance Mode', color: 'var(--alert-red)' },
                { key: 'debugLogging', label: 'Verbose Debug Logging', color: 'var(--ledger-blue)' },
                { key: 'strictAuth', label: 'Strict 2FA Enforced', color: 'var(--verify-green)' },
                { key: 'autoProvision', label: 'Auto-Provision Accounts', color: 'var(--signal-amber)' }
              ].map(flag => (
                <div key={flag.key} className="bg-black/60 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white">{t(flag.label)}</span>
                  <button 
                    onClick={() => handleToggle(flag.key as any)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${flags[flag.key as keyof typeof flags] ? 'bg-white/20' : 'bg-black'} border border-white/20`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${flags[flag.key as keyof typeof flags] ? 'left-5' : 'left-0.5'} bg-white`} style={{ backgroundColor: flags[flag.key as keyof typeof flags] ? `var(--ledger-blue)` : '#666' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
