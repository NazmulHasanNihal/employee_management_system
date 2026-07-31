'use client';

import Image from 'next/image';
import React from 'react';
import { toPublicAvatarUrl } from '@/lib/avatar';

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function parseSize(size?: number | string): number {
  if (typeof size === 'number' && !isNaN(size)) return size;
  if (typeof size === 'string') {
    const parsed = parseInt(size, 10);
    if (!isNaN(parsed)) return parsed;
    switch (size) {
      case 'xs': return 24;
      case 'sm': return 32;
      case 'md': return 40;
      case 'lg': return 48;
      case 'xl': return 64;
    }
  }
  return 40;
}

export function Avatar({
  src,
  name,
  size = 40,
  rounded = 'full',
  className = '',
}: {
  src?: string | null;
  name?: string | null;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  rounded?: 'full' | 'md';
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  const numericSize = parseSize(size);
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
  const normalizedSrc = toPublicAvatarUrl(src);
  const fallback = (
    <div
      className={`flex shrink-0 items-center justify-center bg-[var(--brand-soft)] border border-[var(--brand)]/30 text-[var(--brand)] font-mono font-bold ${radius} ${className}`}
      style={{ width: `${numericSize}px`, height: `${numericSize}px`, fontSize: `${Math.max(10, numericSize * 0.4)}px` }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );

  if (!normalizedSrc || errored) return fallback;

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${radius} border border-[var(--border-hairline)] ${className}`}
      style={{ width: `${numericSize}px`, height: `${numericSize}px` }}
    >
      <Image
        src={normalizedSrc}
        alt={name || 'User'}
        fill
        sizes={`${numericSize}px`}
        className="object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
