import React from 'react';
import { getShifts, getShiftAssignments, getBranches } from '@/server/queries';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ShiftsClient } from '@/components/shifts/ShiftsClient';

export const dynamic = 'force-dynamic';

export default async function ShiftsPage() {
  const caller = await getCaller();
  const isAdmin = caller?.isAdmin ?? false;

  const todayStr = new Date().toISOString().split('T')[0];
  const [shifts, assignments, branches, teams] = await Promise.all([
    getShifts(),
    isAdmin ? getShiftAssignments(caller, todayStr) : Promise.resolve([]),
    getBranches(),
    isAdmin ? prisma.team.findMany({ orderBy: { name: 'asc' } }) : Promise.resolve([]),
  ]);

  return (
    <ShiftsClient shifts={shifts} initialAssignments={assignments} branches={branches} teams={teams} isAdmin={isAdmin} />
  );
}
