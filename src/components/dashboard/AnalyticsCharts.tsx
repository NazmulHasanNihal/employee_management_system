"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const PALETTE = [
  "var(--brand)",
  "var(--emerald)",
  "var(--amber)",
  "var(--sky)",
  "var(--rose)",
  "var(--violet, var(--brand))",
  "var(--orange, var(--amber))",
];

const axisTick = { fill: "var(--text-muted)", fontSize: 11 } as const;
const tooltipStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-hairline)",
  borderRadius: 12,
  color: "var(--text-main)",
  fontSize: 12,
} as const;

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaveBreakdownDonut({ data }: { data: { type: string; count: number }[] }) {
  if (!data.length) return null;
  return (
    <CardShell title="Leave by Type">
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Pie data={data} dataKey="count" nameKey="type" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--bg-panel)" />
          ))}
        </Pie>
      </PieChart>
    </CardShell>
  );
}

export function ExpenseBreakdownDonut({ data }: { data: { category: string; amount: number }[] }) {
  if (!data.length) return null;
  return (
    <CardShell title="Expenses by Category">
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [`৳${value ?? 0}`, ""] as [string, string]} />
        <Pie data={data} dataKey="amount" nameKey="category" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--bg-panel)" />
          ))}
        </Pie>
      </PieChart>
    </CardShell>
  );
}

export function DepartmentBar({ data }: { data: { name: string; count: number }[] }) {
  if (!data.length) return null;
  return (
    <CardShell title="Headcount by Department">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={axisTick} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          width={92}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--bg-hover)", opacity: 0.4 }} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </CardShell>
  );
}
