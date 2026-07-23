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

export function Avatar({
  src,
  name,
  size = 40,
  rounded = 'full',
  className = '',
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  rounded?: 'full' | 'md';
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
  const normalizedSrc = toPublicAvatarUrl(src);
  const fallback = (
    <div
      className={`flex items-center justify-center bg-[var(--brand-soft)] border border-[var(--brand)]/30 text-[var(--brand)] font-mono font-bold ${radius} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );

  if (!normalizedSrc || errored) return fallback;

  return (
    <div className={`relative overflow-hidden ${radius} border border-[var(--border-hairline)] ${className}`} style={{ width: size, height: size }}>
      <Image
        src={normalizedSrc}
        alt={name || 'User'}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
