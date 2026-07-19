'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-xl',
};

function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  // If the image fails to load (e.g. a blocked/403 storage URL), fall back to
  // initials instead of showing a broken-image icon.
  const [errored, setErrored] = React.useState(false);
  const showImage = src && !errored;

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-soft)] font-semibold text-[var(--brand-strong)] ring-1 ring-[var(--border-hairline)]',
        sizeMap[size],
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || 'avatar'}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
