"use client";

import React from 'react';
import { HeartHandshake, Shield, Sparkles, Gem, Activity, Landmark, TrendingUp, AlertCircle, Clock } from 'lucide-react';
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

  if (benLoading || eqLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Authenticating Benefit Profiles...</div>;
  }

  const equityData = equity?.[0];
  const vestedValue = equityData ? (equityData.vestedShares * equityData.currentStrikePrice) : 0;
  const totalValue = equityData ? (equityData.totalShares * equityData.currentStrikePrice) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-500/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <HeartHandshake className="text-emerald-400" size={36} />
            Benefits & Equity
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Perks, Insurance, and Stock Vesting Dashboard.
          </p>
        </div>
      </div>

      {/* Enrollment Alert */}
      {enrollmentPeriod ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-mono font-bold text-emerald-400 uppercase tracking-widest text-sm">{enrollmentPeriod.name} is Active</h3>
              <p className="text-sm font-sans text-white/80 mt-1">
                Make your selections before the deadline on <span className="text-white font-bold">{new Date(enrollmentPeriod.endDate).toLocaleDateString()}</span>.
              </p>
            </div>
          </div>
          <button className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
            Enter Portal
          </button>
        </div>
      ) : (
        <div className="bg-[var(--alert-red)]/10 border border-[var(--alert-red)]/30 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-[var(--alert-red)]" size={20} />
          <div>
            <h3 className="font-mono font-bold text-[var(--alert-red)] uppercase tracking-widest text-xs">Enrollment Closed</h3>
            <p className="text-xs font-sans text-white/60">Benefits cannot be modified outside of an active enrollment window or qualifying life event.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Equity Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4">
            <TrendingUp size={16} className="text-[var(--ledger-blue)]" /> Vested Equity
          </h3>
          
          <div className="bg-white/5 backdrop-blur-xl border border-[var(--ledger-blue)]/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--ledger-blue)]/5 rounded-full blur-3xl group-hover:bg-[var(--ledger-blue)]/10 transition-colors" />
            
            {equityData ? (
              <>
                <div className="mb-8">
                  <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Estimated Current Value (Vested)</p>
                  <h4 className="text-5xl font-black font-mono text-white tracking-tight flex items-center gap-2">
                    ${vestedValue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </h4>
                  <p className="text-xs font-mono text-[var(--ledger-blue)] mt-2 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Strike Price: ${equityData.currentStrikePrice.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Total Grant Options</p>
                      <p className="text-lg font-bold text-white font-mono">{equityData.totalShares.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Total Potential Value</p>
                      <p className="text-lg font-bold text-white font-mono">${totalValue.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Vested Shares</p>
                      <p className="text-lg font-bold text-[var(--verify-green)] font-mono">{equityData.vestedShares.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Grant Date</p>
                      <p className="text-sm font-bold text-white font-mono">{new Date(equityData.grantDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
               <div className="py-12 text-center text-sm font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-2xl bg-black/20 uppercase tracking-widest">
                No active equity grants on record.
              </div>
            )}
          </div>
        </div>

        {/* Perks Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4">
            <Gem size={16} className="text-emerald-400" /> Active Perks
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {benefits?.map((eb: any) => (
              <div key={eb.id} className="p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-emerald-500/30 transition-all flex flex-col md:flex-row justify-between gap-4 group">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    eb.benefit.name.includes('Health') ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                    eb.benefit.name.includes('401k') ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {eb.benefit.name.includes('Health') ? <HeartHandshake size={24} /> : 
                     eb.benefit.name.includes('401k') ? <Landmark size={24} /> : 
                     <Sparkles size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base md:text-lg font-mono flex items-center gap-2">
                      {eb.benefit.name}
                    </h4>
                    <p className="text-sm text-[var(--text-muted)] mt-1 font-sans">{eb.benefit.description}</p>
                    <p className="text-[10px] font-mono text-[var(--ledger-blue)] mt-3 uppercase tracking-widest font-bold">
                      Provider: {eb.benefit.provider || 'Internal'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end justify-center shrink-0">
                  <span className={`text-[9px] font-mono font-bold px-3 py-1.5 rounded-lg border uppercase tracking-widest ${
                    eb.status === 'ENROLLED' ? 'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30 shadow-[0_0_10px_rgba(0,255,100,0.1)]' : 
                    'bg-[var(--signal-amber)]/10 text-[var(--signal-amber)] border-[var(--signal-amber)]/30 shadow-[0_0_10px_var(--signal-amber)]'
                  }`}>
                    {eb.status}
                  </span>
                </div>
              </div>
            ))}
            {(!benefits || benefits.length === 0) && (
              <div className="py-12 text-center text-sm font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-2xl bg-black/20 uppercase tracking-widest">
                No active benefits found.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
