"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

export default function AttendanceMixDonut({ data }: { data: { status: string; count: number }[] }) {
  if (!data.length) return null;
  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>Attendance Mix (7d)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Pie data={data} dataKey="count" nameKey="status" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--bg-panel)" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
