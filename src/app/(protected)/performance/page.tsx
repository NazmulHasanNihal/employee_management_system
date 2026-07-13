"use client";

import React, { useState } from 'react';
import { Target, TrendingUp, Star, Plus, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { authClient } from '@/lib/auth-client';

export default function PerformancePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [newTitle, setNewTitle] = useState("");

  const { data: objectives, isLoading: objLoading } = trpc.performance.getObjectives.useQuery(undefined, {
    enabled: !!user?.id
  });
  const { data: reviews, isLoading: revLoading } = trpc.performance.getReviews.useQuery(undefined, {
    enabled: !!user?.id
  });

  const utils = trpc.useUtils();
  const createObj = trpc.performance.createObjective.useMutation({
    onSuccess: () => utils.performance.getObjectives.invalidate()
  });

  const updateObj = trpc.performance.updateObjectiveProgress.useMutation({
    onSuccess: () => utils.performance.getObjectives.invalidate()
  });

  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    createObj.mutate({ userId: user.id, title: newTitle });
    setNewTitle("");
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Completed') return <CheckCircle2 size={14} className="text-[var(--verify-green)]" />;
    if (status === 'At Risk') return <AlertCircle size={14} className="text-[var(--alert-red)]" />;
    return <Clock size={14} className="text-[var(--signal-amber)]" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'Completed') return 'bg-[var(--verify-green)]/20 text-[var(--verify-green)] border-[var(--verify-green)]/30';
    if (status === 'At Risk') return 'bg-[var(--alert-red)]/20 text-[var(--alert-red)] border-[var(--alert-red)]/30';
    return 'bg-[var(--signal-amber)]/20 text-[var(--signal-amber)] border-[var(--signal-amber)]/30';
  };

  if (objLoading || revLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] animate-pulse font-mono uppercase tracking-widest text-xs">Aggregating Performance Metrics...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Target className="text-[var(--ledger-blue)]" size={36} />
            Performance Hub
          </h2>
          <p className="font-sans text-sm md:text-base mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Objectives, Key Results & Managerial Feedback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* OKRs Section */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-[var(--ledger-blue)]/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--ledger-blue)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-white flex items-center gap-2">
                <TrendingUp className="text-[var(--ledger-blue)]" size={18} /> Objective Tracker (OKRs)
              </h3>
            </div>

            <form onSubmit={handleAddObjective} className="flex gap-4 mb-8 relative z-10">
              <div className="relative flex-1">
                <Target size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Define new objective..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-[var(--ledger-blue)] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={createObj.isPending || !newTitle.trim()}
                className="bg-[var(--ledger-blue)] text-black px-6 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={16} /> Add OKR
              </button>
            </form>

            <div className="space-y-4 relative z-10">
              {objectives?.map((obj: any) => (
                <div key={obj.id} className="p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-[var(--ledger-blue)]/30 transition-all group">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-white text-sm md:text-base font-mono">{obj.title}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-widest ${getStatusColor(obj.status)}`}>
                      {getStatusIcon(obj.status)} {obj.status}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-black h-3 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-[var(--ledger-blue)] to-purple-500 transition-all duration-1000 ease-out"
                        style={{ width: `${obj.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-black text-white w-12 text-right">{obj.progress}%</span>
                  </div>
                </div>
              ))}
              {(!objectives || objectives.length === 0) && (
                <div className="py-12 text-center text-sm font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-2xl bg-black/20 uppercase tracking-widest">
                  No Active Objectives.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manager Reviews */}
        <div className="xl:col-span-1 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
              <Star size={16} className="text-yellow-400" /> Manager Reviews
            </h3>
          </div>

          <div className="space-y-4">
            {reviews?.map((rev: any) => (
              <div key={rev.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-yellow-500/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">{rev.reviewPeriod}</span>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${
                    rev.rating.includes('Exceeds') ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    'bg-[var(--verify-green)]/10 text-[var(--verify-green)] border-[var(--verify-green)]/30'
                  }`}>
                    {rev.rating}
                  </span>
                </div>
                <p className="text-sm text-white/90 font-sans italic leading-relaxed mb-4">"{rev.comments}"</p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold">
                    {rev.reviewerName.charAt(0)}
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)]">Reviewed by {rev.reviewerName}</span>
                </div>
              </div>
            ))}
            {(!reviews || reviews.length === 0) && (
              <div className="py-8 text-center text-[10px] font-mono text-[var(--text-muted)] border border-dashed border-white/10 rounded-2xl bg-black/20 uppercase tracking-widest">
                No formal reviews on record.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
