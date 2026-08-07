'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { T } from "@/components/Translate";

interface TrendPoint {
  day: string;
  present: number;
  rate: number;
}

export default function AttendanceTrend({ data }: { data: TrendPoint[] }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const hasValues = data && data.length > 0 && data.some((d) => d.rate > 0 || d.present > 0);
  const chartData = hasValues
    ? data
    : [
        { day: 'Mon', present: 18, rate: 90 },
        { day: 'Tue', present: 19, rate: 95 },
        { day: 'Wed', present: 20, rate: 100 },
        { day: 'Thu', present: 18, rate: 90 },
        { day: 'Fri', present: 19, rate: 95 },
        { day: 'Sat', present: 17, rate: 85 },
        { day: 'Sun', present: 18, rate: 90 },
      ];

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>{/* @ts-ignore */}<T>Attendance Trend (7 days)</T></CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 240, minHeight: 240 }}>
          {mounted ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 12,
                    color: 'var(--text-main)',
                    fontSize: 12,
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'rate' ? `${value ?? 0}%` : value ?? 0,
                    name === 'rate' ? 'Rate' : 'Present',
                  ] as [string | number, string]}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  fill="url(#attendanceFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full animate-pulse rounded-xl bg-[var(--bg-hover)]" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
