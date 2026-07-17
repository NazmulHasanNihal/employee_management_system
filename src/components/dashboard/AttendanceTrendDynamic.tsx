'use client';

import dynamic from 'next/dynamic';

const AttendanceTrend = dynamic(() => import('@/components/dashboard/AttendanceTrend'), { ssr: false });

export default function AttendanceTrendDynamic({ data }: { data: any[] }) {
  return <AttendanceTrend data={data} />;
}
