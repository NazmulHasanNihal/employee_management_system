'use client';

import dynamic from 'next/dynamic';
import { ReviewsRadar as ReviewsRadarImpl, type RadarScore } from './ReviewsRadar';
import { CombatStats as CombatStatsImpl } from './CombatStats';

// Client-only wrappers so the charts never render on the server (recharts
// is not SSR-safe). The parent Server Component imports these directly.

const ReviewsRadar = dynamic(() => Promise.resolve({ default: ReviewsRadarImpl }), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded-xl bg-[var(--bg-hover)]" />,
});

const CombatStats = dynamic(() => Promise.resolve({ default: CombatStatsImpl }), {
  ssr: false,
  loading: () => <div className="h-[220px] animate-pulse rounded-xl bg-[var(--bg-hover)]" />,
});

export function ReviewsRadarIsland({ scores }: { scores: RadarScore[] }) {
  return <ReviewsRadar scores={scores} />;
}

export function CombatStatsIsland({ user }: { user: any }) {
  return <CombatStats user={user} />;
}
