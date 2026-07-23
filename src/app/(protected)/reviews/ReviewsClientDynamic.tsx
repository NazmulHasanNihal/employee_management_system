"use client";

import dynamic from "next/dynamic";

const ReviewsClient = dynamic(() => import("./ReviewsClient"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] animate-pulse rounded-xl bg-[var(--bg-hover)]" />
  ),
});

export default function ReviewsClientDynamic(props: { scores: { subject: string; A: number; B: number; fullMark: number }[]; reviews: { id: string; reviewPeriod: string; rating: string; comments: string; reviewerName: string }[]; canReview?: boolean; employees?: { id: string; name: string; designation: string | null }[] }) {
  return <ReviewsClient {...props} />;
}
