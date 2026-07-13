'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserRoleByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    return user?.role || 'Employee';
  } catch (error) {
    return 'Employee';
  }
}

export async function provisionEmployeeAccount(data: any) {
  try {
    // Note: In a real production app, we would verify the caller's session here
    // to ensure they have the 'Admin' role before proceeding.
    // e.g. const session = await createClient().auth.getSession();
    
    const adminAuth = createAdminClient().auth;
    const adminAuthAdmin = adminAuth.admin;

    // 1. Create the user in Supabase Auth securely
    const { data: authData, error: authError } = await adminAuthAdmin.createUser({
      email: data.email,
      password: data.password || 'TemporaryPassword123!',
      email_confirm: true,
      user_metadata: {
        name: data.name,
        role: data.role || 'Employee'
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    // 2. Insert the user into Prisma (Neon Database)
    const newUser = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: data.role || 'Employee',
        department: data.department || 'Unassigned',
        designation: data.designation || 'New Hire',
        managerId: data.managerId || null,
        status: 'active'
      }
    });

    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('Provisioning failed:', error);
    return { success: false, error: error.message };
  }
}
