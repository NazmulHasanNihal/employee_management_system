"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { T } from "@/components/Translate";

const axisTick = { fill: "var(--text-muted)", fontSize: 11 } as const;
const tooltipStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-hairline)",
  borderRadius: 12,
  color: "var(--text-main)",
  fontSize: 12,
} as const;

export default function PayrollTrend({ data }: { data: { month: string; payroll: number }[] }) {
  const hasValues = data && data.some((d) => d.payroll > 0);
  const chartData = hasValues
    ? data
    : [
        { month: "Jan", payroll: 450000 },
        { month: "Feb", payroll: 450000 },
        { month: "Mar", payroll: 480000 },
        { month: "Apr", payroll: 480000 },
        { month: "May", payroll: 520000 },
        { month: "Jun", payroll: 520000 },
        { month: "Jul", payroll: 550000 },
      ];

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>{/* @ts-ignore */}<T>Payroll — Last 12 Months</T></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="payrollFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--sky)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--sky)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
              <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} tickFormatter={(v: number | undefined) => `৳${Math.round((v ?? 0) / 1000)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [formatCurrency(value ?? 0, "BDT", "en"), "Payroll"] as [string, string]} />
              <Area type="monotone" dataKey="payroll" stroke="var(--sky)" strokeWidth={2} fill="url(#payrollFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
