"use client";
import dynamic from "next/dynamic";
const TeamCompletionChart = dynamic(() => import("@/components/team/TeamCompletionChart"), { ssr: false });
export default function TeamCompletionChartDynamic({ data }: { data: { name: string; completionRate: number }[] }) {
  return <TeamCompletionChart data={data} />;
}
