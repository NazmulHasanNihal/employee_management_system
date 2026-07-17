'use client';

import React from 'react';

/**
 * Animated live clock for the OpsHub dashboard.
 * - Smooth per-second tick
 * - Theme-aware (uses CSS variables)
 * - Subtle pulsing dot + animated separator
 */
export default function LiveClock({ officeHours }: { officeHours?: { start?: string; end?: string } | null }) {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : '--:--:--';
  const date = now
    ? now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const [hhmm, ampm] = time.split(' ');

  return (
    <div className="ledger-card relative overflow-hidden rounded-2xl p-5 sm:p-6">
      <div className="ledger-accent" />
      <div className="relative flex flex-col gap-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--emerald)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--emerald)]" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {now ? 'Local Time' : 'Loading'}
          </span>
        </div>

        <div className="flex items-baseline gap-2 font-mono tabular-nums">
          <span className="text-4xl font-bold tracking-tight text-[var(--text-main)] sm:text-5xl">{hhmm}</span>
          <span className="flex flex-col items-start">
            <span className="text-sm font-semibold text-[var(--brand-strong)]">{ampm}</span>
            <span className="flex gap-0.5" aria-hidden>
              <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:-0.2s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:-0.1s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--text-muted)]" />
            </span>
          </span>
        </div>

        <p className="mt-1 text-sm font-medium text-[var(--text-muted)]">{date}</p>

        {officeHours?.start && officeHours?.end && (
          <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-app)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
            Office hours: {officeHours.start} – {officeHours.end}
          </div>
        )}
      </div>
    </div>
  );
}
