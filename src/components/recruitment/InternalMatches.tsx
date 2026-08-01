"use client";

import React from 'react';
import { Target, User } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { T } from "@/components/Translate";

export function InternalMatches({ jobId }: { jobId: string }) {
  const { data: matches, isLoading } = trpc.recruitment.findInternalMatches.useQuery({ jobId });

  if (isLoading) return <div className="text-xs font-mono text-[var(--text-muted)] animate-pulse">{/* @ts-ignore */}<T>Scanning internal talent pool...</T></div>;

  if (!matches || matches.length === 0) {
    return <div className="text-xs font-mono text-[var(--text-muted)] italic">{/* @ts-ignore */}<T>No internal skill matches found.</T></div>;
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-4">
      <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-teal-400 mb-4 flex items-center gap-2">
        <Target size={14} /> {/* @ts-ignore */}<T>Internal Talent Matches</T></h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match: any, idx: number) => (
          <div key={match.id || idx} className="p-3 bg-white/5 border border-teal-500/20 rounded-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-teal-500 to-emerald-500 opacity-50" />
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-bold">
                  <User size={12} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{match.name}</div>
                  <div className="text-[9px] font-mono uppercase text-[var(--text-muted)]">{match.department || 'Unassigned'}</div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                {match.matchedSkills.length} {/* @ts-ignore */}<T>matched</T></div>
            </div>

            <div className="mt-2 text-[10px] font-mono">
              <div className="text-white mb-1"><span className="text-[var(--text-muted)]">{/* @ts-ignore */}<T>Matched:</T></span> {match.matchedSkills.join(', ')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
