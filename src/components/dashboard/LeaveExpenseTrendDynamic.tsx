"use client";
import dynamic from "next/dynamic";
const LeaveExpenseTrend = dynamic(() => import("@/components/dashboard/LeaveExpenseTrend"), { ssr: false });
export default function LeaveExpenseTrendDynamic({
  leave,
  expense,
}: {
  leave: { period: string; value: number }[];
  expense: { period: string; value: number }[];
}) {
  return <LeaveExpenseTrend leave={leave} expense={expense} />;
}
