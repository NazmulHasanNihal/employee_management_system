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
        'flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-panel)]/60 p-10 text-center animate-scale-in',
        className
      )}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-[var(--text-main)]">{title}</h3>
        {description && <p className="max-w-sm text-sm text-[var(--text-muted)] leading-relaxed">{description}</p>}
      </div>
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
