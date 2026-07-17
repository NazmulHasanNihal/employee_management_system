'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export function CombatStats({ user }: { user: any }) {
  const level = Number(user?.rpgLevel || 1);
  const data = [
    { subject: 'Leadership', A: Math.min(5, 1 + level * 0.5), fullMark: 5 },
    { subject: 'Output', A: Math.min(5, 1.5 + level * 0.3), fullMark: 5 },
    { subject: 'Teamwork', A: Math.min(5, 1.2 + level * 0.4), fullMark: 5 },
    { subject: 'Reliability', A: Math.min(5, 1.7 + level * 0.2), fullMark: 5 },
    { subject: 'Initiative', A: Math.min(5, 0.8 + level * 0.6), fullMark: 5 },
  ];
  return (
    <div className="flex h-full flex-col">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
        <Shield size={15} className="text-[var(--brand-strong)]" /> Combat Stats
      </h4>
      <div className="min-h-[220px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--border-hairline)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
            <Radar name="Stats" dataKey="A" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
