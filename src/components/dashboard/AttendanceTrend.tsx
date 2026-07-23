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

interface TrendPoint {
  day: string;
  present: number;
  rate: number;
}

export default function AttendanceTrend({ data }: { data: TrendPoint[] }) {
  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>Attendance Trend (7 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
        </div>
      </CardContent>
    </Card>
  );
}
