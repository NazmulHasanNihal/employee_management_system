"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { T } from "@/components/Translate";

const PALETTE = ["var(--brand)", "var(--sky)"] as const;
const axisTick = { fill: "var(--text-muted)", fontSize: 11 } as const;
const tooltipStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-hairline)",
  borderRadius: 12,
  color: "var(--text-main)",
  fontSize: 12,
} as const;

type Props = {
  leave: { period: string; value: number }[];
  expense: { period: string; value: number }[];
};

import React, { useState, useEffect } from "react";

export default function LeaveExpenseTrend({ leave, expense }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const leaveData = leave && leave.length > 0 ? leave : [
    { period: "Last Mo", value: 5 },
    { period: "This Mo", value: 8 },
  ];

  const expenseData = expense && expense.length > 0 ? expense : [
    { period: "Last Mo", value: 35000 },
    { period: "This Mo", value: 48000 },
  ];

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>{/* @ts-ignore */}<T>This Month vs Last Month</T></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Leave Requests</T></p>
            <div className="h-48 w-full min-h-[180px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={160}>
                  <BarChart data={leaveData} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tick={axisTick} />
                    <YAxis tickLine={false} axisLine={false} tick={axisTick} width={32} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v ?? 0, "Requests"] as [number, string]} cursor={{ fill: "var(--bg-hover)", opacity: 0.4 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {leaveData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse rounded-xl bg-[var(--bg-hover)]" />
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{/* @ts-ignore */}<T>Expenses</T></p>
            <div className="h-48 w-full min-h-[180px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={160}>
                  <BarChart data={expenseData} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tick={axisTick} />
                    <YAxis tickLine={false} axisLine={false} tick={axisTick} width={48} tickFormatter={(v: number | undefined) => `৳${Math.round((v ?? 0) / 1000)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatCurrency(v ?? 0, "BDT", "en"), "Expenses"] as [string, string]} cursor={{ fill: "var(--bg-hover)", opacity: 0.4 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {expenseData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse rounded-xl bg-[var(--bg-hover)]" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
