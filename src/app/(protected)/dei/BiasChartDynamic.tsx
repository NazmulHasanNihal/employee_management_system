"use client";

import dynamic from "next/dynamic";

const BiasChart = dynamic(() => import("./BiasChart"), {
  ssr: false,
  loading: () => (
    <div className="h-80 animate-pulse rounded-xl bg-[var(--bg-hover)]" />
  ),
});

export default function BiasChartDynamic(props: { analysis: { group: string; avgSalary: number; deviation: number; biasFlag: boolean }[]; globalAvg: number }) {
  return <BiasChart {...props} />;
}
