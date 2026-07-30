import React from 'react';
import { getAttendanceLogs, getAttendanceAdminStats, getEmployeeOptions } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { AttendanceClient } from '@/components/attendance/AttendanceClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;

  const [logs, adminStats, employees] = await Promise.all([
    getAttendanceLogs(caller),
    isAdmin ? getAttendanceAdminStats(caller) : Promise.resolve(null),
    isAdmin ? getEmployeeOptions(caller) : Promise.resolve([]),
  ]);



  return (
    <AttendanceClient
      initialLogs={logs}
      adminStats={adminStats}
      initialEmployees={employees}
      isAdmin={isAdmin}
      userId={caller?.id}
    />
  );
}

