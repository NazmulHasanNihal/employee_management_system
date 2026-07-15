import React from 'react';
import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { executeServerQuery } from "@/app/actions/db";
import ApplicationsClientPage from "@/components/applications/ApplicationsClientPage";

const prisma = new PrismaClient();

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id }
  });

  if (!dbUser) {
    redirect("/login");
  }

  const isAdmin = dbUser.role === 'Admin' || dbUser.role === 'HR Manager';
  const apps = await executeServerQuery('applications.list', { userId: isAdmin ? undefined : dbUser.id });

  const layoutUser = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    department: dbUser.department || 'Unassigned',
    designation: dbUser.designation || 'Staff',
    avatarUrl: dbUser.avatarUrl,
  };

  return <ApplicationsClientPage initialApps={apps} user={layoutUser} />;
}
