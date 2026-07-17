import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'brand' | 'emerald' | 'amber' | 'rose' | 'sky' | 'outline' | 'ghost';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-hover)] text-[var(--text-main)]',
  secondary: 'bg-[var(--bg-hover)] text-[var(--text-muted)]',
  brand: 'bg-[var(--brand-soft)] text-[var(--brand-strong)]',
  emerald: 'bg-[var(--emerald-soft)] text-[var(--emerald)]',
  amber: 'bg-[var(--amber-soft)] text-[var(--amber)]',
  rose: 'bg-[var(--rose-soft)] text-[var(--rose)]',
  sky: 'bg-[var(--sky-soft)] text-[var(--sky)]',
  outline: 'border border-[var(--border-hairline)] text-[var(--text-muted)]',
  ghost: 'text-[var(--text-muted)]',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
