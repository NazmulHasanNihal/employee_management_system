import React from 'react';
import { getAttendanceLogs, getAttendanceAdminStats } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { AttendanceClient } from '@/components/attendance/AttendanceClient';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;

  const [logs, adminStats] = await Promise.all([
    getAttendanceLogs(caller),
    isAdmin ? getAttendanceAdminStats(caller) : Promise.resolve(null),
  ]);

  return <AttendanceClient initialLogs={logs} adminStats={adminStats} isAdmin={isAdmin} userId={caller?.id} />;
}
