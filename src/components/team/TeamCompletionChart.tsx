"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const PALETTE = [
  "var(--emerald)",
  "var(--brand)",
  "var(--sky)",
  "var(--amber)",
  "var(--rose)",
  "var(--violet, var(--brand))",
] as const;

const axisTick = { fill: "var(--text-muted)", fontSize: 11 } as const;
const tooltipStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-hairline)",
  borderRadius: 12,
  color: "var(--text-main)",
  fontSize: 12,
} as const;

export default function TeamCompletionChart({ data }: { data: { name: string; completionRate: number }[] }) {
  if (!data.length) return null;
  const sorted = [...data].sort((a, b) => b.completionRate - a.completionRate);
  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>Task Completion by Member</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={axisTick} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={axisTick} width={92} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v ?? 0}%`, "Completion"] as [string, string]} cursor={{ fill: "var(--bg-hover)", opacity: 0.4 }} />
              <Bar dataKey="completionRate" radius={[0, 6, 6, 0]}>
                {sorted.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
