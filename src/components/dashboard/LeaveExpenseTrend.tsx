"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

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

export default function LeaveExpenseTrend({ leave, expense }: Props) {
  const empty = !leave.length && !expense.length;
  if (empty) return null;
  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>This Month vs Last Month</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Leave Requests</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leave} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tick={axisTick} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTick} width={32} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v ?? 0, "Requests"] as [number, string]} cursor={{ fill: "var(--bg-hover)", opacity: 0.4 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {leave.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Expenses</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expense} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tick={axisTick} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTick} width={48} tickFormatter={(v: number | undefined) => `৳${Math.round((v ?? 0) / 1000)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatCurrency(v ?? 0, "BDT", "en"), "Expenses"] as [string, string]} cursor={{ fill: "var(--bg-hover)", opacity: 0.4 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {expense.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
