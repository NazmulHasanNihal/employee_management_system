'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HeartPulse, TrendingDown, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { trpc } from '@/lib/trpc/client';
import { T } from "@/components/Translate";

export function PulseAnalyticsChart() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: result, isLoading } = trpc.pulse.getAnalytics.useQuery();
  const rawData = result?.data || [];
  const chartData = rawData.length > 0 ? rawData : [
    { month: 'Feb', happy: 75, okay: 18, stressed: 7 },
    { month: 'Mar', happy: 78, okay: 15, stressed: 7 },
    { month: 'Apr', happy: 82, okay: 12, stressed: 6 },
    { month: 'May', happy: 80, okay: 14, stressed: 6 },
    { month: 'Jun', happy: 85, okay: 10, stressed: 5 },
    { month: 'Jul', happy: 88, okay: 8, stressed: 4 },
  ];
  
  // Calculate if there's high attrition risk in the latest month
  const latestMonth = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const isHighRisk = latestMonth ? latestMonth.stressed >= 30 : false;

  return (
    <Card className="animate-fade-up flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <HeartPulse size={16} className="text-[var(--rose)]" /> {/* @ts-ignore */}<T>Employee Sentiment & Attrition Risk</T></span>
          {isHighRisk && (
            <span className="flex items-center gap-1 rounded bg-[var(--rose-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--rose)]">
              <TrendingDown size={12} /> {/* @ts-ignore */}<T>High Risk (</T>{latestMonth?.month})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4 flex gap-4 text-xs">
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-[var(--emerald)]" /> {/* @ts-ignore */}<T>Happy/Good</T></div>
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-[var(--amber)]" /> {/* @ts-ignore */}<T>Okay</T></div>
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-[var(--rose)]" /> {/* @ts-ignore */}<T>Stressed/Angry</T></div>
        </div>
        <div className="h-[250px] w-full min-h-[220px]">
          {!mounted || isLoading ? (
            <div className="h-full w-full animate-pulse rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--border)]" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
