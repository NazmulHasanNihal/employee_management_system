import React from 'react';
import { Activity, UserCheck } from 'lucide-react';

export function Broadcasts({ announcements, isLoading }: { announcements: any[], isLoading: boolean }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow duration-500">
      <div className="p-5 border-b border-white/10 bg-black/20 flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Activity size={16} className="text-[var(--ledger-blue)]" /> Global Broadcasts
        </h3>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ledger-blue)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--ledger-blue)]"></span>
        </span>
      </div>
      <div className="p-5 space-y-4 max-h-[400px] overflow-auto custom-scrollbar">
        {isLoading && (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-[var(--ledger-blue)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {announcements?.map((ann) => (
          <div key={ann.id} className="group relative bg-black/40 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
            {ann.priority === 'High' && (
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--alert-red)] rounded-l-xl" />
            )}
            <div className="flex justify-between items-start mb-2 pl-2">
              <span className="font-bold text-white text-sm group-hover:text-[var(--ledger-blue)] transition-colors">{ann.title}</span>
              <span className={`text-[9px] uppercase font-mono px-2 py-1 rounded-full border ${ann.priority === 'High' ? 'border-[var(--alert-red)]/50 text-[var(--alert-red)] bg-[var(--alert-red)]/10' : 'border-[var(--signal-amber)]/50 text-[var(--signal-amber)] bg-[var(--signal-amber)]/10'}`}>
                {ann.priority}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] pl-2 leading-relaxed">{ann.content}</p>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center pl-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                <UserCheck size={10} /> {ann.author}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-50">
                {new Date(ann.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        {(!announcements || announcements.length === 0) && !isLoading && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm italic">
            No active broadcasts.
          </div>
        )}
      </div>
    </div>
  );
}
