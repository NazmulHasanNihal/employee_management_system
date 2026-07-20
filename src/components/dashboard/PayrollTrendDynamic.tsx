"use client";
import dynamic from "next/dynamic";
const PayrollTrend = dynamic(() => import("@/components/dashboard/PayrollTrend"), { ssr: false });
export default function PayrollTrendDynamic({ data }: { data: { month: string; payroll: number }[] }) {
  return <PayrollTrend data={data} />;
}
