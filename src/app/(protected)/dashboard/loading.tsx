import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard-specific loading skeleton — renders instantly while the server
 * fetches stats, giving the impression of a blazing-fast page load.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="page-header">
        <div>
          <Skeleton className="h-9 w-56 bg-[var(--bg-hover)]" />
          <Skeleton className="h-4 w-80 mt-2 bg-[var(--bg-hover)]" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl bg-[var(--bg-hover)]" />
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-4 space-y-3">
            <Skeleton className="h-3 w-20 bg-[var(--bg-hover)]" />
            <Skeleton className="h-8 w-16 bg-[var(--bg-hover)]" />
            <Skeleton className="h-3 w-24 bg-[var(--bg-hover)]" />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 space-y-3">
          <Skeleton className="h-5 w-32 bg-[var(--bg-hover)]" />
          <Skeleton className="h-48 w-full rounded-xl bg-[var(--bg-hover)]" />
        </div>
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 space-y-3">
          <Skeleton className="h-5 w-32 bg-[var(--bg-hover)]" />
          <Skeleton className="h-48 w-full rounded-xl bg-[var(--bg-hover)]" />
        </div>
      </div>

      {/* Bottom 3-col */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-panel)] p-5 space-y-3">
            <Skeleton className="h-5 w-28 bg-[var(--bg-hover)]" />
            <Skeleton className="h-10 w-full rounded-lg bg-[var(--bg-hover)]" />
            <Skeleton className="h-10 w-full rounded-lg bg-[var(--bg-hover)]" />
            <Skeleton className="h-10 w-full rounded-lg bg-[var(--bg-hover)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
