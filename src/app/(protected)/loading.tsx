import React from 'react';
import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-[80vh] items-center justify-center animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--ledger-blue)] border-t-transparent animate-spin shadow-[0_0_20px_var(--ledger-blue)]" />
          <Activity className="text-[var(--ledger-blue)] animate-pulse" size={24} />
        </div>
        <p className="font-mono text-sm uppercase tracking-widest text-[var(--ledger-blue)] animate-pulse">
          Establishing Connection...
        </p>
      </div>
    </div>
  );
}
