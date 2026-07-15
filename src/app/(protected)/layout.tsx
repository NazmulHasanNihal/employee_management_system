import AppLayout from "@/components/Layout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import OnboardingFlow from "@/components/OnboardingFlow";

const prisma = new PrismaClient();

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    redirect("/login");
  }

  let dbUser = await prisma.user.findUnique({
    where: { id: authUser.id }
  });

  const isSystemOwner = authUser.email === 'nazmulhas36@gmail.com';

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Authorized User',
        role: isSystemOwner ? 'Admin' : (authUser.user_metadata?.role || 'Employee'),
        department: isSystemOwner ? 'Executive' : (authUser.user_metadata?.department || 'Operations'),
        designation: isSystemOwner ? 'CEO' : (authUser.user_metadata?.designation || 'Staff'),
        status: 'active',
        isOnboarded: isSystemOwner ? true : false,
        isOwner: isSystemOwner
      }
    });
  } else if (isSystemOwner && (!dbUser.isOwner || dbUser.role !== 'Admin')) {
    // Ensure the system owner always has their privileges, even if someone tried to change them
    dbUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        role: 'Admin',
        designation: 'CEO',
        department: 'Executive',
        isOwner: true,
        isOnboarded: true
      }
    });
  }

  const layoutUser = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    department: dbUser.department || 'Unassigned',
    designation: dbUser.designation || 'Staff',
    avatarUrl: dbUser.avatarUrl,
    isOnboarded: dbUser.isOnboarded
  };

  if (!dbUser.isOnboarded) {
    return <OnboardingFlow user={layoutUser} />;
  }

  return (
    <AppLayout user={layoutUser}>
      {children}
    </AppLayout>
  );
}
