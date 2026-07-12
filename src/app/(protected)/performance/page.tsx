"use client";

import React, { useState } from 'react';
import { Target, TrendingUp, Star, Plus } from 'lucide-react';
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[var(--ledger-blue)]/10 to-transparent blur-3xl -z-10" />
        <div>
          <h2 className="text-4xl font-mono font-black uppercase tracking-tight bg-gradient-to-r from-[var(--ledger-blue)] to-purple-400 text-transparent bg-clip-text flex items-center gap-3">
            <Target className="text-[var(--ledger-blue)]" size={32} />
            Performance & OKRs
          </h2>
          <p className="font-sans text-sm mt-2 text-[var(--text-muted)] flex items-center gap-2">
            Track your objectives, key results, and managerial feedback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OKRs Section */}
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-[var(--ledger-blue)]/50 transition-colors">
          <div className="absolute -right-10 -top-10 text-[var(--ledger-blue)]/10 group-hover:rotate-12 transition-transform duration-700">
            <TrendingUp size={150} />
          </div>
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-3">
            <TrendingUp className="text-[var(--ledger-blue)]" size={24} /> My Objectives
          </h3>

          <form onSubmit={handleAddObjective} className="flex gap-2 mb-6 relative z-10">
            <input
              type="text"
              placeholder="New Objective..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--ledger-blue)] transition-colors"
            />
            <button
              type="submit"
              disabled={createObj.isPending}
              className="bg-[var(--ledger-blue)] text-black px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={16} /> Add
            </button>
          </form>

          {objLoading ? (
            <div className="text-center text-[var(--text-muted)] py-4 font-mono text-sm animate-pulse">Loading objectives...</div>
          ) : (
            <div className="space-y-4 relative z-10">
              {objectives?.map(obj => (
                <div key={obj.id} className="p-4 bg-black/40 rounded-xl border border-white/10 hover:border-white/30 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white text-sm">{obj.title}</span>
                    <span className="text-xs font-mono text-[var(--ledger-blue)] bg-[var(--ledger-blue)]/10 px-2 py-1 rounded">
                      {obj.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-black h-2 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-[var(--ledger-blue)] to-purple-500 transition-all"
                        style={{ width: `${obj.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white/50 min-w-[40px] text-right">{obj.progress}%</span>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button 
                      onClick={() => updateObj.mutate({ id: obj.id, progress: Math.min(100, obj.progress + 10), status: obj.progress + 10 >= 100 ? 'Completed' : 'In Progress' })}
                      className="text-[10px] uppercase font-bold text-[var(--verify-green)] bg-[var(--verify-green)]/10 px-2 py-1 rounded hover:bg-[var(--verify-green)]/20 transition-colors"
                    >
                      +10%
                    </button>
                  </div>
                </div>
              ))}
              {objectives?.length === 0 && (
                <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm border border-dashed border-white/10 rounded-xl">
                  No objectives set for current period.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="ledger-panel p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden group hover:border-[var(--signal-amber)]/50 transition-colors">
          <div className="absolute -right-10 -top-10 text-[var(--signal-amber)]/10 group-hover:rotate-12 transition-transform duration-700">
            <Star size={150} />
          </div>
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-white mb-6 relative z-10 flex items-center gap-3">
            <Star className="text-[var(--signal-amber)]" size={24} /> Performance Reviews
          </h3>

          {revLoading ? (
            <div className="text-center text-[var(--text-muted)] py-4 font-mono text-sm animate-pulse">Loading reviews...</div>
          ) : (
            <div className="space-y-4 relative z-10">
              {reviews?.map(rev => (
                <div key={rev.id} className="p-4 bg-black/40 rounded-xl border border-white/10 hover:border-[var(--signal-amber)]/30 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">{rev.period}</span>
                    <span className="text-sm font-black font-mono text-[var(--signal-amber)] bg-[var(--signal-amber)]/10 px-2 py-1 rounded border border-[var(--signal-amber)]/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      {rev.score} / 100
                    </span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed italic border-l-2 border-white/10 pl-3">
                    "{rev.feedback}"
                  </p>
                </div>
              ))}
              {reviews?.length === 0 && (
                <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm border border-dashed border-white/10 rounded-xl">
                  No reviews on record.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
