import AppLayout from "@/components/Layout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OnboardingFlow from "@/components/OnboardingFlow";
import { UserProvider } from "@/components/UserProvider";

export const dynamic = 'force-dynamic';



export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    redirect("/login");
  }

  let dbUser = await prisma.user.findUnique({
    where: { id: authUser.id }
  });

  // If user not found by ID, try to find by email (handles cases where Supabase user was recreated)
  if (!dbUser && authUser.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: authUser.email }
    });

    if (existingUser) {
      // Update the Prisma user's ID to match the new Supabase auth ID
      dbUser = await prisma.user.update({
        where: { email: authUser.email },
        data: { id: authUser.id }
      });
    }
  }

  const isSystemOwner = authUser.email === process.env.OWNER_EMAIL;

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Authorized User',
        role: isSystemOwner ? 'CEO' : (authUser.user_metadata?.role || 'Employee'),
        department: isSystemOwner ? 'Executive' : (authUser.user_metadata?.department || 'Operations'),
        designation: isSystemOwner ? 'CEO' : (authUser.user_metadata?.designation || 'Staff'),
        status: 'active',
        isOnboarded: isSystemOwner ? true : false,
        isOwner: isSystemOwner
      }
    });
  } else if (isSystemOwner && (!dbUser.isOwner || dbUser.role !== 'CEO')) {
    // Ensure the system owner always has their privileges, even if someone tried to change them
    dbUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        role: 'CEO',
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
    isOnboarded: dbUser.isOnboarded,
    branchId: dbUser.branchId
  };

  const isOwner = dbUser.isOwner;
  const isCEO = isOwner || dbUser.role === 'CEO';
  const isAdmin = isCEO || dbUser.role === 'Admin' || dbUser.role === 'HR Manager';
  const isHR = dbUser.role === 'HR Manager';

  const userContext = {
    user: layoutUser,
    isOwner,
    isCEO,
    isAdmin,
    isHR,
  };

  // Prefetch notifications on the server so the header badge has no client round-trip.
  let notifications: { id: string; userId: string; message: string; type: string; read: boolean; link?: string | null; createdAt: Date }[] = [];
  try {
    notifications = await prisma.notification.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch {
    notifications = [];
  }

  if (!dbUser.isOnboarded) {
    return (
      <UserProvider value={userContext}>
        <OnboardingFlow user={layoutUser} requiresPassword={dbUser.status === 'invited'} />
      </UserProvider>
    );
  }

  // Verify-email gate (P0): block access until the auth email is confirmed,
  // unless this is the system owner or the account was provisioned/accepted
  // with email_confirm already true. Invited users who just set a password via
  // /api/invite/accept get email_confirm:true, so they pass straight through.
  const emailVerified = !!authUser.email_confirmed_at;
  if (!emailVerified && !dbUser.isOwner) {
    redirect('/verify-email');
  }

  return (
    <UserProvider value={userContext}>
      <AppLayout user={layoutUser} notifications={notifications}>
        {children}
      </AppLayout>
    </UserProvider>
  );
}
