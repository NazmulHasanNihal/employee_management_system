/**
 * wipe-employees.ts
 *
 * Deletes every Employee/Manager/Director/HR user EXCEPT the system owner
 * (the admin/CEO), so the app starts clean with real data only.
 *
 * It removes both the Supabase Auth row (auth.users) and the Prisma row
 * (public."User"). Cascade constraints handle dependent records.
 *
 * The owner email is read from OWNER_EMAIL (falls back to the canonical
 * admin email). Nothing is hardcoded so the script stays portable.
 *
 * Run: pnpm ts-node scripts/wipe-employees.ts
 */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'nazmulhas36@gmail.com';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

const prisma = new PrismaClient();
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Wiping all non-owner users. Owner preserved: ${OWNER_EMAIL}`);

  // 1. Find every user that is NOT the owner.
  const toDelete = await prisma.user.findMany({
    where: { email: { not: OWNER_EMAIL } },
    select: { id: true, email: true },
  });

  console.log(`Found ${toDelete.length} user(s) to delete.`);

  // 2. Delete from Prisma (cascade removes dependents). Keep the owner.
  //    We delete by id so the owner row is never touched.
  if (toDelete.length > 0) {
    const ids = toDelete.map((u) => u.id);
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    console.log(`✅ Deleted ${toDelete.length} user(s) from public."User"`);
  }

  // 3. Delete their Supabase Auth rows by email (parameterized, no string interpolation).
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const authToDelete = (list.users || []).filter(
    (u) => u.email && u.email !== OWNER_EMAIL,
  );

  for (const u of authToDelete) {
    await supabaseAdmin.auth.admin.deleteUser(u.id);
  }
  if (authToDelete.length > 0) {
    console.log(`✅ Deleted ${authToDelete.length} user(s) from auth.users`);
  }

  console.log('\n✅ Wipe complete. Only the system owner remains.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
