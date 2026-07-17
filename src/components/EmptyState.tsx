'use client';

import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, actionText, onAction, icon, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)]/50 p-12 text-center animate-scale-in',
        className
      )}
    >
      {icon && <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-hover)] text-[var(--text-muted)]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--text-main)]">{title}</h3>
      {description && <p className="max-w-md text-sm text-[var(--text-muted)]">{description}</p>}
      {actionText && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          <PlusCircle className="h-4 w-4" />
          {actionText}
        </button>
      )}
    </div>
  );
}
