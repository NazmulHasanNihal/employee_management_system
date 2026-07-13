import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const prisma = new PrismaClient();

async function main() {
  const email = 'nazmulhas36@gmail.com';
  const password = '@nazmul@1220@';
  const name = 'Md. Nazmul';

  console.log(`Checking if user ${email} already exists in Auth...`);

  // Try to create the user in Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: name,
      role: 'Admin'
    }
  });

  let authUserId;

  if (authError) {
    if (authError.message.includes('already been registered') || (authError as any).code === 'email_exists' || authError.message.includes('already exists')) {
      console.log('User already exists in auth, finding ID...');
      // If they exist, let's just get their ID from the DB or try to update their password
      const users = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.data.users.find((u: any) => u.email === email);
      
      if (existingUser) {
        authUserId = existingUser.id;
        console.log('Found existing auth user. Updating password...');
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: password,
          email_confirm: true,
          user_metadata: { name: name, role: 'Admin' }
        });
      } else {
        throw new Error('User exists but could not find ID.');
      }
    } else {
      throw authError;
    }
  } else {
    authUserId = authData.user.id;
    console.log('Created new auth user successfully.');
  }

  // Upsert user in Prisma
  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: 'Admin'
    },
    create: {
      id: authUserId,
      email,
      name,
      role: 'Admin',
      department: 'Executive',
      designation: 'CEO / Admin',
      status: 'active'
    }
  });

  console.log(`\n✅ Admin account fully provisioned!`);
  console.log(`Username: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
