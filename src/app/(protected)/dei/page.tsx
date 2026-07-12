"use client";

import React from 'react';
import { Scale, AlertCircle, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';
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
          <Scale size={64} className="mx-auto text-[var(--alert-red)]/50" />
          <h2 className="text-xl font-mono text-white">Classified Intel</h2>
          <p className="text-[var(--text-muted)] text-sm">DEI Bias Audits are restricted to Level 4 (HR) Clearance.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-center text-white/50 animate-pulse font-mono">Running Automated Bias Audits...</div>;

  const totalFlags = audit?.analysis.filter(a => a.biasFlag).length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 h-full flex flex-col">
      <div className="flex justify-between items-end pb-4 border-b border-white/10 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#9b59b6]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Scale className="text-[#9b59b6]" size={28} /> DEI Bias Auditor
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2 uppercase tracking-widest">
            Automated Pay & Performance Equity Scanning
          </p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 p-6 rounded-2xl flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Audit Status</p>
          <div className="flex items-center gap-3">
            {totalFlags === 0 ? (
              <>
                <CheckCircle2 className="text-[var(--verify-green)]" size={32} />
                <h3 className="text-2xl font-black text-white">No Systemic Bias Detected</h3>
              </>
            ) : (
              <>
                <AlertCircle className="text-[var(--alert-red)]" size={32} />
                <h3 className="text-2xl font-black text-white">{totalFlags} Potential Bias Flags Found</h3>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Global Avg Base Salary</p>
          <p className="text-2xl font-mono font-bold text-white/80">${audit?.overallAvgSalary.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pr-2 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {audit?.analysis.map((group: any) => (
          <div key={group.group} className={`bg-white/5 border backdrop-blur-md rounded-2xl p-6 relative transition-all shadow-lg ${group.biasFlag ? 'border-[var(--alert-red)]/50' : 'border-white/10'}`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{group.group}</h3>
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                  Headcount: {group.headcount}
                </p>
              </div>
              {group.biasFlag ? (
                <div className="bg-[var(--alert-red)]/20 text-[var(--alert-red)] px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 border border-[var(--alert-red)]/30">
                  <AlertCircle size={12} /> Flagged
                </div>
              ) : (
                <div className="bg-[var(--verify-green)]/10 text-[var(--verify-green)] px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest border border-[var(--verify-green)]/30">
                  Clear
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Avg Salary</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono font-bold text-white">${Math.round(group.avgSalary).toLocaleString()}</p>
                  {group.avgSalary > audit.overallAvgSalary ? (
                    <TrendingUp size={14} className="text-[var(--verify-green)]" />
                  ) : (
                    <TrendingDown size={14} className="text-[var(--alert-red)]" />
                  )}
                </div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Avg OKR Score</p>
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-mono font-bold ${group.avgOkr >= 70 ? 'text-[var(--verify-green)]' : 'text-[var(--alert-red)]'}`}>
                    {Math.round(group.avgOkr)}%
                  </p>
                </div>
              </div>
            </div>

            {group.biasFlag && (
              <div className="bg-[var(--alert-red)]/10 border-l-2 border-[var(--alert-red)] p-4 rounded-r-xl">
                <p className="text-xs font-mono text-[var(--alert-red)]">{group.reason}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
