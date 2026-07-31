'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HeartPulse, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { month: 'Jan', happy: 80, stressed: 10, okay: 10 },
  { month: 'Feb', happy: 75, stressed: 15, okay: 10 },
  { month: 'Mar', happy: 70, stressed: 20, okay: 10 },
  { month: 'Apr', happy: 85, stressed: 5, okay: 10 },
  { month: 'May', happy: 65, stressed: 25, okay: 10 },
  { month: 'Jun', happy: 60, stressed: 30, okay: 10 },
];

export function PulseAnalyticsChart() {
  return (
    <Card className="animate-fade-up flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <HeartPulse size={16} className="text-[var(--rose)]" /> Employee Sentiment & Attrition Risk
          </span>
          <span className="flex items-center gap-1 rounded bg-[var(--rose-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--rose)]">
            <TrendingDown size={12} /> High Risk (Jun)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4 flex gap-4 text-xs">
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-[var(--emerald)]" /> Happy/Good</div>
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-[var(--amber)]" /> Okay</div>
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-[var(--rose)]" /> Stressed/Angry</div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHappy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--emerald)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--emerald)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOkay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--amber)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--amber)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorStressed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--rose)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--rose)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-hairline)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-hairline)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
                labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="happy" stackId="1" stroke="var(--emerald)" fill="url(#colorHappy)" strokeWidth={2} />
              <Area type="monotone" dataKey="okay" stackId="1" stroke="var(--amber)" fill="url(#colorOkay)" strokeWidth={2} />
              <Area type="monotone" dataKey="stressed" stackId="1" stroke="var(--rose)" fill="url(#colorStressed)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
