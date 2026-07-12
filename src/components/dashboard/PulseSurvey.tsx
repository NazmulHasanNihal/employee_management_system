import React from 'react';
import { Activity, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export function PulseSurvey({ userStats, onPulse }: { userStats: any, onPulse: (pulse: string) => void }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-xl flex flex-col justify-between group">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-500/5 group-hover:to-purple-500/10 transition-colors duration-500" />
      <p className="text-xs font-mono text-[var(--text-muted)] mb-6 uppercase tracking-widest relative z-10 flex items-center gap-2">
        <Activity size={14} /> Sentinel Pulse
      </p>
      
      <div className="relative z-10 flex-1 flex flex-col justify-end">
        {userStats?.pulse ? (
          <div className="bg-black/40 rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
            <div className="w-12 h-12 rounded-full bg-[var(--verify-green)]/20 flex items-center justify-center mb-3">
              <CheckCircle size={24} className="text-[var(--verify-green)]" />
            </div>
            <p className="text-sm font-bold text-white mb-1">Feedback Logged</p>
            <p className="text-xs text-[var(--verify-green)] font-mono uppercase tracking-widest bg-[var(--verify-green)]/10 px-3 py-1 rounded-full">
              {userStats.pulse}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button onClick={() => onPulse('Manageable')} className="w-full py-3 px-4 rounded-xl font-mono text-xs uppercase tracking-wider border border-white/10 bg-black/30 hover:bg-[var(--verify-green)]/20 hover:border-[var(--verify-green)]/50 hover:text-[var(--verify-green)] transition-all duration-300 text-[var(--text-muted)]">
              Optimal (Manageable)
            </button>
            <button onClick={() => onPulse('Heavy')} className="w-full py-3 px-4 rounded-xl font-mono text-xs uppercase tracking-wider border border-white/10 bg-black/30 hover:bg-[var(--signal-amber)]/20 hover:border-[var(--signal-amber)]/50 hover:text-[var(--signal-amber)] transition-all duration-300 text-[var(--text-muted)]">
              Elevated (Heavy)
            </button>
            <button onClick={() => onPulse('Overwhelmed')} className="w-full py-3 px-4 rounded-xl font-mono text-xs uppercase tracking-wider border border-white/10 bg-black/30 hover:bg-[var(--alert-red)]/20 hover:border-[var(--alert-red)]/50 hover:text-[var(--alert-red)] transition-all duration-300 text-[var(--text-muted)]">
              Critical (Overwhelmed)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
