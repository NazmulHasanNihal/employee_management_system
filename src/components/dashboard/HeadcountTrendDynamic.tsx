"use client";
import dynamic from "next/dynamic";
const HeadcountTrend = dynamic(() => import("@/components/dashboard/HeadcountTrend"), { ssr: false });
export default function HeadcountTrendDynamic({ data }: { data: { month: string; headcount: number }[] }) {
  return <HeadcountTrend data={data} />;
}
