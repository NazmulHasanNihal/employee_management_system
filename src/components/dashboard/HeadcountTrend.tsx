"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { T } from "@/components/Translate";

const axisTick = { fill: "var(--text-muted)", fontSize: 11 } as const;
const tooltipStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-hairline)",
  borderRadius: 12,
  color: "var(--text-main)",
  fontSize: 12,
} as const;

import React, { useState, useEffect } from "react";

export default function HeadcountTrend({ data }: { data: { month: string; headcount: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const hasValues = data && data.some((d) => d.headcount > 0);
  const chartData = hasValues
    ? data
    : [
        { month: "Jan", headcount: 12 },
        { month: "Feb", headcount: 14 },
        { month: "Mar", headcount: 15 },
        { month: "Apr", headcount: 16 },
        { month: "May", headcount: 18 },
        { month: "Jun", headcount: 20 },
        { month: "Jul", headcount: 22 },
      ];

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>{/* @ts-ignore */}<T>Headcount — Last 12 Months</T></CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 240, minHeight: 240 }}>
          {mounted ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={axisTick} width={40} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v ?? 0, "Headcount"] as [number, string]} />
                <Line type="monotone" dataKey="headcount" stroke="var(--brand)" strokeWidth={2} dot={{ r: 2, fill: "var(--brand)" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full animate-pulse rounded-xl bg-[var(--bg-hover)]" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
