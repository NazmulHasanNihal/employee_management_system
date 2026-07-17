'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BiasChartProps {
  analysis: any[];
  globalAvg: number;
}

export default function BiasChart({ analysis, globalAvg }: BiasChartProps) {
  const data = (analysis || []).map((g) => ({
    group: g.group,
    avgSalary: Math.round(g.avgSalary),
    deviation: g.deviation,
    biasFlag: g.biasFlag,
  }));

  const GRID = 'var(--border-hairline)';
  const TICK = 'var(--text-muted)';
  const BRAND = 'var(--brand)';
  const ROSE = 'var(--rose)';

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="group" tick={{ fill: TICK, fontSize: 11 }} />
          <YAxis tick={{ fill: TICK, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 12,
              color: 'var(--text-main)',
            }}
            formatter={(value: any, name: string) => {
              if (name === 'avgSalary') return [`৳${value.toLocaleString()}`, 'Avg Salary'];
              return [`${value}%`, 'Deviation'];
            }}
          />
          <Bar dataKey="avgSalary" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.biasFlag ? ROSE : BRAND} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
