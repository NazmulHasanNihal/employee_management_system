import React from 'react';
import { Activity } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 w-full max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-[var(--border-hairline)]">
        <div>
          <Skeleton className="h-12 w-64 mb-4 bg-[var(--bg-hover)]" />
          <Skeleton className="h-4 w-96 bg-[var(--bg-hover)]" />
        </div>
        <Skeleton className="h-10 w-32 mt-6 md:mt-0 bg-[var(--bg-hover)] rounded-xl" />
      </div>

      {/* Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-48 w-full bg-[var(--bg-hover)] rounded-3xl" />
        <Skeleton className="h-48 w-full bg-[var(--bg-hover)] rounded-3xl" />
        <Skeleton className="h-48 w-full bg-[var(--bg-hover)] rounded-3xl" />
      </div>

      {/* Content Block Skeleton */}
      <div className="space-y-4 pt-6">
        <Skeleton className="h-6 w-48 bg-[var(--bg-hover)]" />
        <Skeleton className="h-16 w-full bg-[var(--bg-hover)] rounded-xl" />
        <Skeleton className="h-16 w-full bg-[var(--bg-hover)] rounded-xl" />
        <Skeleton className="h-16 w-full bg-[var(--bg-hover)] rounded-xl" />
      </div>
    </div>
  );
}
