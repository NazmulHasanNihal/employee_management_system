'use client';

import React from 'react';
import { TrendingUp, Award, Clock, CheckCircle2, Target, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Metric { label: string; value: number; icon: React.ReactNode; }
interface Props { data: any; }

const TIER_TONE: Record<string, string> = {
  'Promotion Ready': 'text-[var(--emerald)] bg-[var(--emerald-soft)]',
  'Strong': 'text-[var(--brand-strong)] bg-[var(--brand-soft)]',
  'On Track': 'text-[var(--amber)] bg-[var(--amber-soft)]',
  'Developing': 'text-[var(--text-muted)] bg-[var(--bg-hover)]',
};

export function PromotionReadiness({ data }: Props) {
  if (!data) return null;
  const metrics: Metric[] = [
    { label: 'Attendance', value: data.metrics.attendanceRate, icon: <Clock className="h-4 w-4" /> },
    { label: 'Punctuality', value: data.metrics.punctualityRate, icon: <Clock className="h-4 w-4" /> },
    { label: 'Task Completion', value: data.metrics.taskCompletionRate, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: 'On-Time Delivery', value: data.metrics.onTimeRate, icon: <Target className="h-4 w-4" /> },
    { label: 'Objective Progress', value: data.metrics.avgObjective, icon: <TrendingUp className="h-4 w-4" /> },
    { label: 'Review Score', value: Math.round((data.metrics.avgReview / 5) * 100), icon: <Star className="h-4 w-4" /> },
  ];

  const ringColor = data.tier === 'Promotion Ready' ? 'var(--emerald)' : data.tier === 'Strong' ? 'var(--brand)' : data.tier === 'On Track' ? 'var(--amber)' : 'var(--text-muted)';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-4 w-4 text-[var(--amber)]" /> Promotion Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-5">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-hairline)" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke={ringColor} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${(data.score / 100) * 264} 264`}
              />
            </svg>
            <div className="absolute text-center">
               <p className="text-fluid-2xl font-bold text-[var(--text-main)]">{data.score}</p>
              <p className="text-[9px] uppercase text-[var(--text-muted)]">Score</p>
            </div>
          </div>
          <div>
            <Badge className={`${TIER_TONE[data.tier] || TIER_TONE['Developing']} border-current`}>{data.tier}</Badge>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Computed from your attendance, punctuality, on-time task delivery, objective progress and review scores over the last 3 months.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[var(--text-muted)]">
                {m.icon} <span className="text-[10px] uppercase tracking-wide">{m.label}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-panel)]">
                <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${m.value}%` }} />
              </div>
              <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">{m.value}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
