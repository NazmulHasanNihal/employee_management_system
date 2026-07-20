"use client";

import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

const tooltipStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-hairline)",
  borderRadius: 12,
  color: "var(--text-main)",
  fontSize: 12,
} as const;

export default function AttendanceSparkline({ data }: { data: { day: string; rate: number }[] }) {
  if (!data || !data.length) return null;
  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="attendSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--emerald)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--emerald)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Present"]} />
          <Area type="monotone" dataKey="rate" stroke="var(--emerald)" strokeWidth={2} fill="url(#attendSpark)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
