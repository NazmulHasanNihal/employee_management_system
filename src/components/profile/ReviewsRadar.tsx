'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export interface RadarScore {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

export function ReviewsRadar({ scores }: { scores: RadarScore[] }) {
  if (!scores || scores.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-[var(--text-muted)]">
        No review scores yet.
      </div>
    );
  }
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={scores} outerRadius="75%">
          <PolarGrid stroke="var(--border-hairline)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="A"
            stroke="var(--brand)"
            fill="var(--brand)"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
