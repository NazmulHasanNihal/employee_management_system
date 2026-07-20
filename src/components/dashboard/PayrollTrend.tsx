"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const axisTick = { fill: "var(--text-muted)", fontSize: 11 } as const;
const tooltipStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-hairline)",
  borderRadius: 12,
  color: "var(--text-main)",
  fontSize: 12,
} as const;

export default function PayrollTrend({ data }: { data: { month: string; payroll: number }[] }) {
  if (!data.length) return null;
  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>Payroll — Last 12 Months</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="payrollFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--sky)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--sky)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
              <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} tickFormatter={(v: number) => `৳${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v, "BDT", "en"), "Payroll"]} />
              <Area type="monotone" dataKey="payroll" stroke="var(--sky)" strokeWidth={2} fill="url(#payrollFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
