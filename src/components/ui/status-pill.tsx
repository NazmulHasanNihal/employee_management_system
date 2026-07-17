import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertCircle, Info } from 'lucide-react';

export type StatusType = 'success' | 'error' | 'pending' | 'warning' | 'info';

interface StatusPillProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  label: string;
}

export function StatusPill({ status, label, className, ...props }: StatusPillProps) {
  const styles: Record<StatusType, string> = {
    success: 'bg-[var(--emerald-soft)] text-[var(--emerald)]',
    error: 'bg-[var(--rose-soft)] text-[var(--rose)]',
    pending: 'bg-[var(--amber-soft)] text-[var(--amber)]',
    warning: 'bg-[var(--amber-soft)] text-[var(--amber)]',
    info: 'bg-[var(--sky-soft)] text-[var(--sky)]',
  };

  const icons: Record<StatusType, React.ReactNode> = {
    success: <CheckCircle2 size={13} />,
    error: <XCircle size={13} />,
    pending: <Clock size={13} />,
    warning: <AlertCircle size={13} />,
    info: <Info size={13} />,
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        styles[status],
        className
      )}
      {...props}
    >
      {icons[status]}
      {label}
    </div>
  );
}
