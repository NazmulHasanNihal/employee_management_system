"use client";

import React from 'react';
import { HeartHandshake, Shield, Sparkles, Gem } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function BenefitsPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const { data: benefits, isLoading: benLoading } = trpc.benefits.getEmployeeBenefits.useQuery(undefined, {
    enabled: !!user?.id
  });

  const { data: equity, isLoading: eqLoading } = trpc.benefits.getEquityGrants.useQuery(undefined, {
    enabled: !!user?.id
  });

  const { data: enrollmentPeriod } = trpc.benefits.getActiveEnrollmentPeriod.useQuery();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      {enrollmentPeriod ? (
        <div className="bg-[var(--ledger-blue)]/20 border border-[var(--ledger-blue)] p-4 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-mono font-bold text-[var(--ledger-blue)] uppercase tracking-widest text-sm">Open Enrollment is Active</h3>
            <p className="text-xs font-sans text-white/80 mt-1">
              {enrollmentPeriod.name} ends on {new Date(enrollmentPeriod.endDate).toLocaleDateString()}. Make your selections before the deadline.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--alert-red)]/10 border border-[var(--alert-red)]/50 p-4 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-mono font-bold text-[var(--alert-red)] uppercase tracking-widest text-sm">Enrollment Closed</h3>
            <p className="text-xs font-sans text-white/80 mt-1">
              Benefits enrollment is currently locked. You cannot make changes outside of an active enrollment period.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 text-transparent bg-clip-text flex items-center gap-3">
            <HeartHandshake className="text-emerald-400" size={32} />
            Benefits & Equity
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Manage your company perks, insurance, and stock options.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Benefits */}
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute -right-10 -top-10 text-emerald-500/10 group-hover:rotate-12 transition-transform duration-700">
            <Shield size={150} />
          </div>
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-3">
            <Shield className="text-emerald-400" size={24} /> Active Perks
          </h3>
          
          {benLoading ? (
            <div className="text-center text-[var(--text-muted)] py-4 font-mono text-sm animate-pulse">Loading benefits...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 relative z-10">
              {benefits?.map(eb => (
                <div key={eb.id} className="p-4 bg-black/40 rounded-xl border border-white/10 flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-white text-lg flex items-center gap-2">
                      {eb.benefit.name}
                      <Sparkles size={14} className="text-emerald-400" />
                    </h4>
                    <p className="text-sm text-[var(--text-muted)] mt-1">{eb.benefit.description}</p>
                    <p className="text-xs font-mono text-white/50 mt-2 uppercase tracking-widest">Provider: {eb.benefit.provider || 'Internal'}</p>
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20 uppercase">
                      {eb.status}
                    </span>
                  </div>
                </div>
              ))}
              {benefits?.length === 0 && (
                <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm border border-dashed border-white/10 rounded-xl">
                  No active benefits found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Equity Grants */}
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
          <div className="absolute -right-10 -top-10 text-purple-500/10 group-hover:rotate-12 transition-transform duration-700">
            <Gem size={150} />
          </div>
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-3">
            <Gem className="text-purple-400" size={24} /> Equity Grants
          </h3>
          
          {eqLoading ? (
            <div className="text-center text-[var(--text-muted)] py-4 font-mono text-sm animate-pulse">Loading equity...</div>
          ) : (
            <div className="space-y-4 relative z-10">
              {equity?.map(grant => (
                <div key={grant.id} className="p-5 bg-black/40 rounded-xl border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Total Grant</span>
                      <h4 className="text-3xl font-black text-white">{grant.shares.toLocaleString()} <span className="text-lg text-purple-400 font-bold">Options</span></h4>
                    </div>
                    <span className="text-xs font-mono text-purple-400 border border-purple-400/30 px-2 py-1 rounded bg-purple-400/10">
                      {grant.vestingYears}-Year Vesting
                    </span>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center relative z-10">
                    <span className="text-xs font-mono text-[var(--text-muted)]">Granted: {new Date(grant.grantedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {equity?.length === 0 && (
                <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm border border-dashed border-white/10 rounded-xl">
                  No equity grants on record.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
