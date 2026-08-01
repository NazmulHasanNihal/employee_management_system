'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getOfflineQueueCount, processOfflineQueue } from '@/lib/offline-sync';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const offlineQueue = useAppStore((state) => state.offlineQueue);
  const setOffline = useAppStore((state) => state.setOffline);

  // Initialize queue count on mount
  useEffect(() => {
    getOfflineQueueCount().then((count) => {
      useAppStore.setState({ offlineQueue: count });
    });
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      setOffline(false);
      
      const count = await getOfflineQueueCount();
      if (count > 0) {
        setIsSyncing(true);
        await processOfflineQueue();
        setIsSyncing(false);
        
        // Show success briefly
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOffline(true);
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      setOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  if (!isOffline && !isSyncing && !showSuccess) return null;

  if (showSuccess) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-5 py-2.5 shadow-lg animate-in fade-in slide-in-from-bottom-8">
        <CheckCircle2 size={16} className="text-emerald-500" />
        <span className="text-sm font-medium text-emerald-500">All offline actions synced</span>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border px-5 py-2.5 shadow-lg animate-in fade-in slide-in-from-bottom-8 ${
      isSyncing ? 'border-[var(--brand)] bg-[var(--brand-soft)]' : 'border-[var(--rose)] bg-[var(--rose-soft)]'
    }`}>
      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
        isSyncing ? 'bg-[var(--brand)]/20 text-[var(--brand)]' : 'bg-[var(--rose)]/20 text-[var(--rose)]'
      }`}>
        {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <WifiOff size={14} />}
      </div>
      <div>
        <p className="text-sm font-bold text-[var(--text-main)]">
          {isSyncing ? 'Syncing...' : 'You are offline'}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          {offlineQueue > 0 
            ? `${offlineQueue} action${offlineQueue > 1 ? 's' : ''} pending sync` 
            : 'Actions will sync when reconnected'}
        </p>
      </div>
    </div>
  );
}
