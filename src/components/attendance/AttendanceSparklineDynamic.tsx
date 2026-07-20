"use client";
import dynamic from "next/dynamic";
const AttendanceSparkline = dynamic(() => import("@/components/attendance/AttendanceSparkline"), { ssr: false });
export default function AttendanceSparklineDynamic({ data }: { data: { day: string; rate: number }[] }) {
  return <AttendanceSparkline data={data} />;
}
