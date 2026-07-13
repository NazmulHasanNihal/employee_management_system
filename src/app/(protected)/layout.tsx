import AppLayout from "@/components/Layout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getLayoutUser = (dbUser: any) => ({
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  role: dbUser.role,
  department: dbUser.department,
  designation: dbUser.designation,
  avatarUrl: dbUser.avatarUrl
});

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    redirect("/login");
  }

  let dbUser = await prisma.user.findUnique({
    where: { id: authUser.id }
  });

  if (!dbUser) {
    // Auto-provision the user in the database if they exist in Supabase Auth but not Prisma
    dbUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Authorized User',
        role: authUser.user_metadata?.role || 'Employee',
        department: authUser.user_metadata?.department || 'Operations',
        designation: authUser.user_metadata?.designation || 'Staff',
        status: 'active'
      }
    });
  }

  const layoutUser = getLayoutUser(dbUser);

  return (
    <AppLayout user={layoutUser as any}>
      {children}
    </AppLayout>
  );
}
