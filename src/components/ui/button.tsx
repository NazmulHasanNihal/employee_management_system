import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const variants: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-secondary',
  ghost: 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors',
  danger: 'bg-[var(--rose)]/12 text-[var(--rose)] border border-[var(--rose)]/40 hover:bg-[var(--rose)]/20 transition-colors',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 min-w-9 px-3 py-1.5 text-xs',
  md: 'h-10 min-w-10 px-4 py-2 text-sm',
  lg: 'h-11 min-w-11 px-6 py-3 text-base',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold disabled:opacity-50 disabled:pointer-events-none transition-[transform,box-shadow,filter,outline] outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-app)] active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
