import React from 'react';
import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { executeServerQuery } from "@/app/actions/db";
import AuditClientPage from "@/components/audit/AuditClientPage";

const prisma = new PrismaClient();

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id }
  });

  if (!dbUser || (dbUser.role !== 'Admin' && dbUser.role !== 'HR Manager')) {
    redirect("/");
  }

  const events = await executeServerQuery('audit.getLogs', {});

  return <AuditClientPage initialEvents={events} />;
}
