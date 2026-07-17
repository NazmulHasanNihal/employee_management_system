'use client';

import Image from 'next/image';
import React from 'react';

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
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
  const fallback = (
    <div
      className={`flex items-center justify-center bg-[var(--ledger-blue)]/20 border border-[var(--ledger-blue)]/30 text-[var(--ledger-blue)] font-mono font-bold ${radius} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );

  if (!src) return fallback;

  return (
    <div className={`relative overflow-hidden ${radius} border border-[var(--border-hairline)] ${className}`} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={name || 'User'}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={(e) => {
          // Hide broken image so the fallback initials show through.
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}
