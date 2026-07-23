'use client';

import React from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[var(--bg-panel)] shadow-[var(--shadow-lg)] animate-slide-up pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-panel)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--text-main)]">Navigation</span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]">
            <X size={18} />
          </button>
        </div>
        <div className="p-2">
          {children}
        </div>
      </div>
    </div>
  );
}
