import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

export function RecognitionFeed({ kudos, isLoading }: { kudos: any[], isLoading: boolean }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow duration-500">
      <div className="p-5 border-b border-white/10 bg-black/20 flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <CheckCircle size={16} className="text-[var(--verify-green)]" /> Recognition Network
        </h3>
      </div>
      <div className="p-5 space-y-4 max-h-[400px] overflow-auto custom-scrollbar">
        {isLoading && (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-[var(--verify-green)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {kudos?.map((kudo) => (
          <div key={kudo.id} className="relative bg-gradient-to-r from-black/60 to-black/30 p-4 rounded-xl border border-white/5 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--verify-green)]/5 rounded-full blur-2xl group-hover:bg-[var(--verify-green)]/10 transition-colors duration-500" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span>{(kudo as any).from.name}</span>
                  <ArrowRight size={12} className="text-[var(--signal-amber)]" />
                  <span>{(kudo as any).to.name}</span>
                </div>
                <span className="text-[10px] font-mono bg-[var(--verify-green)]/10 text-[var(--verify-green)] px-2 py-1 rounded-full border border-[var(--verify-green)]/30 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
                  +{kudo.points} PTS
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">
                &quot;{kudo.message}&quot;
              </p>
            </div>
          </div>
        ))}
        {(!kudos || kudos.length === 0) && !isLoading && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm italic">
            No recent recognition logs.
          </div>
        )}
      </div>
    </div>
  );
}
