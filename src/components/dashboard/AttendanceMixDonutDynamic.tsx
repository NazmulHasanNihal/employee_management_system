"use client";
import dynamic from "next/dynamic";
const AttendanceMixDonut = dynamic(() => import("@/components/dashboard/AttendanceMixDonut"), { ssr: false });
export default function AttendanceMixDonutDynamic({ data }: { data: { status: string; count: number }[] }) {
  return <AttendanceMixDonut data={data} />;
}
