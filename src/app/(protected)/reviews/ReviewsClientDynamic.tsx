"use client";

import dynamic from "next/dynamic";

const ReviewsClient = dynamic(() => import("./ReviewsClient"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] animate-pulse rounded-xl bg-[var(--bg-hover)]" />
  ),
});

export default function ReviewsClientDynamic(props: any) {
  return <ReviewsClient {...props} />;
}
