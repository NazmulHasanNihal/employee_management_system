'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useAppStore, type ToastVariant } from '@/lib/store';

const VARIANT_STYLES: Record<ToastVariant, { bar: string; icon: React.ReactNode; label: string }> = {
  success: { bar: 'border-l-[var(--verify-green)]', icon: <CheckCircle2 size={16} className="text-[var(--verify-green)]" />, label: 'SUCCESS' },
  error: { bar: 'border-l-[var(--alert-red)]', icon: <XCircle size={16} className="text-[var(--alert-red)]" />, label: 'ERROR' },
  warn: { bar: 'border-l-[var(--signal-amber)]', icon: <AlertTriangle size={16} className="text-[var(--signal-amber)]" />, label: 'WARNING' },
  info: { bar: 'border-l-[var(--ledger-blue)]', icon: <Info size={16} className="text-[var(--ledger-blue)]" />, label: 'INFO' },
};

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);

  React.useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[min(92vw,22rem)] pointer-events-none">
      {toasts.map((t) => {
        const v = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto bg-[var(--bg-panel)] border border-[var(--border-hairline)] border-l-4 ${v.bar} shadow-[0_8px_24px_rgba(0,0,0,0.45)] p-3 flex items-start gap-3 animate-in slide-in-from-right-4 duration-200`}
            role="status"
          >
            <div className="mt-0.5 shrink-0">{v.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">{v.label}</p>
              <p className="text-sm font-semibold text-[var(--text-main)] leading-tight mt-0.5">{t.title}</p>
              {t.description && (
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-snug">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
