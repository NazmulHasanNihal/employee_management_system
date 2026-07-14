import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const impersonateId = searchParams.get('impersonateId');
    const viewMode = searchParams.get('viewMode') || 'department'; // 'department' or 'squad'
    
    // Check if user is impersonating someone else
    let targetId = authUser.id;
    if (impersonateId && (dbUser.role === 'Admin' || dbUser.role === 'HR Manager' || dbUser.role === 'Super Admin')) {
      targetId = impersonateId;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) return NextResponse.json({ error: 'Target not found' }, { status: 404 });

    let users: any[] = [];

    // The HR Admin / Super Admin sees everyone
    if (!impersonateId && (targetUser.role === 'HR' || targetUser.role === 'HR Manager' || targetUser.role === 'Super Admin')) {
      users = await prisma.user.findMany();
    } else {
      // Recursive CTE to get the downline tree
      // Standard employee sees their peers (same managerId) and direct manager
      // Manager/CTO sees downline
      if (targetUser.role === 'Employee') {
         if (targetUser.managerId) {
             users = await prisma.user.findMany({
                 where: {
                     OR: [
                         { id: targetUser.managerId },
                         { managerId: targetUser.managerId }
                     ]
                 }
             });
         } else {
             users = [targetUser];
         }
      } else {
        // Use raw query for Recursive CTE for downline
        // CEO has no managerId, so they get the whole tree
        const result = await prisma.$queryRawUnsafe(`
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
        `, targetId);
        
        users = result as any[];
      }
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Hierarchy Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
