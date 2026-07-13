import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const email = 'admin@system.com';
  const password = 'AdminPassword123!';

  console.log('Provisioning Admin User...');

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'System Admin',
      role: 'Admin'
    }
  });

  if (authError) {
    console.error('Supabase Auth Error:', authError);
    if (authError.message.includes('already exists')) {
       console.log('User already exists in Supabase Auth, continuing to Prisma sync...');
    } else {
       return;
    }
  }

  // 2. Fetch or sync to Prisma DB
  const userId = authData?.user?.id;
  
  if (userId) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: userId,
        email,
        name: 'System Admin',
        role: 'Admin',
        department: 'Executive',
        designation: 'System Administrator',
        status: 'active'
      }
    });
    console.log('Admin user successfully provisioned in live database!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
