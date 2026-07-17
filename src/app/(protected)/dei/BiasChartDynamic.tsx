"use client";

import dynamic from "next/dynamic";

const BiasChart = dynamic(() => import("./BiasChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] animate-pulse rounded-xl bg-[var(--bg-hover)]" />
  ),
});

export default function BiasChartDynamic(props: any) {
  return <BiasChart {...props} />;
}
