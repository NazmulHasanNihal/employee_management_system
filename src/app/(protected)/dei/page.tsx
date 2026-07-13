"use client";

import React from 'react';
import { Scale, AlertCircle, CheckCircle2, TrendingDown, TrendingUp, ShieldAlert, BarChart3, Users, DollarSign } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function DEIAuditorPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR Manager';

  const { data: audit, isLoading } = trpc.dei.getBiasAudit.useQuery(undefined, { enabled: isAdmin });

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <ShieldAlert size={64} className="mx-auto text-[var(--alert-red)]/50" />
          <h2 className="text-xl font-mono text-white uppercase tracking-widest">Classified Intel</h2>
          <p className="text-[var(--text-muted)] text-sm font-mono">DEI Equity Scans are restricted to Level 4 (HR) Clearance.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Running Automated Bias Audits...</div>;
  }

  const totalFlags = audit?.analysis?.filter((a: any) => a.biasFlag).length || 0;
  const analysisData = audit?.analysis || [];
  const globalAvg = audit?.overallAvgSalary || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Scale className="text-pink-500" size={36} />
            Equity & Bias Scanner
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Automated intelligence identifying systemic pay discrepancies.
          </p>
        </div>
      </div>

      {/* Hero Status Bar */}
      <div className={`border rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden ${
        totalFlags === 0 ? 'bg-[var(--verify-green)]/10 border-[var(--verify-green)]/30 shadow-[0_0_50px_rgba(0,255,100,0.1)]' : 'bg-[var(--alert-red)]/10 border-[var(--alert-red)]/30 shadow-[0_0_50px_rgba(255,0,0,0.15)]'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none opacity-50" 
             style={{ backgroundColor: totalFlags === 0 ? 'var(--verify-green)' : 'var(--alert-red)' }} />
        
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {totalFlags === 0 ? (
              <div className="w-20 h-20 bg-[var(--verify-green)]/20 rounded-2xl flex items-center justify-center border border-[var(--verify-green)]/50">
                <CheckCircle2 className="text-[var(--verify-green)]" size={40} />
              </div>
            ) : (
              <div className="w-20 h-20 bg-[var(--alert-red)]/20 rounded-2xl flex items-center justify-center border border-[var(--alert-red)]/50">
                <AlertCircle className="text-[var(--alert-red)] animate-pulse" size={40} />
              </div>
            )}
            
            <div>
              <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest mb-1">Global Audit Status</p>
              {totalFlags === 0 ? (
                <h3 className="text-3xl font-black text-white font-mono">No Systemic Bias Detected</h3>
              ) : (
                <h3 className="text-3xl font-black text-white font-mono">{totalFlags} Discrepancy Flags Found</h3>
              )}
            </div>
          </div>

          <div className="text-center md:text-right bg-black/50 border border-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1 flex items-center justify-center md:justify-end gap-2">
              <DollarSign size={12} /> Global Base Salary Average
            </p>
            <p className="text-3xl font-mono font-bold text-white tracking-tight">
              ${globalAvg.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <BarChart3 size={16} className="text-pink-400" />
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest">Demographic Breakdown</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {analysisData.map((group: any) => (
          <div key={group.group} className={`bg-[#0a0a0a] border rounded-3xl p-6 relative transition-all shadow-lg overflow-hidden group ${
            group.biasFlag ? 'border-[var(--alert-red)]/50 shadow-[0_0_20px_rgba(255,0,0,0.1)]' : 'border-white/10 hover:border-pink-500/30'
          }`}>
            
            {group.biasFlag && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--alert-red)]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            )}

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-white mb-2 font-mono">{group.group}</h3>
                <div className="flex items-center gap-2 bg-black border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest w-fit">
                  <Users size={12} /> Headcount: {group.headcount}
                </div>
              </div>
              
              {group.biasFlag ? (
                <div className="bg-[var(--alert-red)]/20 text-[var(--alert-red)] px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 border border-[var(--alert-red)]/50 animate-pulse">
                  <AlertCircle size={14} /> Flagged
                </div>
              ) : (
                <div className="bg-[var(--verify-green)]/10 text-[var(--verify-green)] px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest border border-[var(--verify-green)]/30 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Clear
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-black/60 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Group Average</p>
                <div className="flex items-center justify-between">
                  <p className={`text-xl font-mono font-bold ${group.biasFlag ? 'text-[var(--alert-red)]' : 'text-white'}`}>
                    ${Math.round(group.avgSalary).toLocaleString()}
                  </p>
                  {group.avgSalary > globalAvg ? (
                    <div className="w-6 h-6 rounded-full bg-[var(--verify-green)]/20 flex items-center justify-center text-[var(--verify-green)]">
                      <TrendingUp size={12} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--alert-red)]/20 flex items-center justify-center text-[var(--alert-red)]">
                      <TrendingDown size={12} />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-black/60 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Deviation</p>
                <p className="text-xl font-mono font-bold text-white">
                  {((group.avgSalary / globalAvg - 1) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
