'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--rose)] bg-[var(--rose-soft)] px-5 py-2.5 shadow-lg animate-in fade-in slide-in-from-bottom-8">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--rose)]/20 text-[var(--rose)]">
        <WifiOff size={14} />
      </div>
      <div>
        <p className="text-sm font-bold text-[var(--text-main)]">You are offline</p>
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Actions will sync when reconnected</p>
      </div>
      <RefreshCw size={14} className="ml-2 animate-spin text-[var(--rose)]" />
    </div>
  );
}
