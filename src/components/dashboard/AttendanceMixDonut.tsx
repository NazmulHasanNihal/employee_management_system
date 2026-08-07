"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { T } from "@/components/Translate";

const PALETTE = [
  "var(--emerald)",
  "var(--amber)",
  "var(--rose)",
  "var(--sky)",
  "var(--brand)",
  "var(--violet, var(--brand))",
];

const tooltipStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-hairline)",
  borderRadius: 12,
  color: "var(--text-main)",
  fontSize: 12,
} as const;

import React, { useState, useEffect } from "react";

export default function AttendanceMixDonut({ data }: { data: { status: string; count: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data && data.length > 0 ? data : [
    { status: "Present", count: 18 },
    { status: "Late", count: 2 },
    { status: "On Leave", count: 1 },
  ];

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>{/* @ts-ignore */}<T>Attendance Mix (7d)</T></CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 240, minHeight: 240 }}>
          {mounted ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Pie data={chartData} dataKey="count" nameKey="status" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--bg-panel)" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full animate-pulse rounded-xl bg-[var(--bg-hover)]" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
