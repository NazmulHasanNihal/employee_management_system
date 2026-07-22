import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { getCaller } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Resolve the caller via getCaller() which matches the rest of the app:
    // it authenticates by Supabase session and looks the DB user up by email
    // first, then id. This avoids 403/404 for accounts whose Prisma `id`
    // differs from the Supabase auth `id`.
    const caller = await getCaller();
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const impersonateId = searchParams.get('impersonateId');
    const _viewMode = searchParams.get('viewMode') || 'department'; // 'department' or 'squad'

    // Only HR / Admin / CEO may impersonate another user's hierarchy.
    const canImpersonate = caller.isHR || caller.isAdmin || caller.isCEO;
    const targetId = impersonateId && canImpersonate ? impersonateId : caller.id;

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) return NextResponse.json({ error: 'Target not found' }, { status: 404 });

    let users: { id: string; name: string; role: string; department: string | null; designation: string | null; avatarUrl: string | null; managerId: string | null }[] = [];

    // HR / Admin / CEO see the entire org.
    if (canImpersonate) {
      users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    } else if (targetUser.role === 'Employee') {
      // A standard employee sees their direct manager and their peers.
      if (targetUser.managerId) {
        users = await prisma.user.findMany({
          where: {
            OR: [
              { id: targetUser.managerId },
              { managerId: targetUser.managerId },
            ],
          },
        });
      } else {
        users = [targetUser];
      }
    } else {
      // Managers and above: recursive downline CTE rooted at the target.
      const result = await prisma.$queryRawUnsafe(
        `
          WITH RECURSIVE employee_tree AS (
            SELECT id, name, role, department, designation, "avatarUrl", "managerId"
            FROM "User"
            WHERE id = $1

            UNION ALL

            SELECT u.id, u.name, u.role, u.department, u.designation, u."avatarUrl", u."managerId"
            FROM "User" u
            INNER JOIN employee_tree et ON u."managerId" = et.id
          )
          SELECT * FROM employee_tree;
        `,
        targetId,
      );

      users = result as { id: string; name: string; role: string; department: string | null; designation: string | null; avatarUrl: string | null; managerId: string | null }[];
    }

    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logError('Hierarchy Fetch Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

