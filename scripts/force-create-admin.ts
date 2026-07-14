import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'nazmulhas36@gmail.com';
  const pass = 'nazmul1220';
  const role = 'Admin';

  console.log(`Force creating ${email}...`);

  try {
    // 1. Delete if exists
    await prisma.$executeRaw`DELETE FROM public."User" WHERE email = ${email};`;
    await prisma.$executeRaw`DELETE FROM auth.users WHERE email = ${email};`;

    // 2. Insert into auth.users and auth.identities
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE
        new_user_id uuid := gen_random_uuid();
        user_email text := '${email}';
        user_pass text := '${pass}';
        user_role text := '${role}';
      BEGIN
        -- Insert into auth.users
        INSERT INTO auth.users (
          id, instance_id, aud, role, email, encrypted_password, 
          email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
          created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        )
        VALUES (
          new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', user_email,
          crypt(user_pass, gen_salt('bf')), 
          now(), 
          jsonb_build_object('name', 'Md. Nazmul', 'role', user_role),
          '{"provider":"email","providers":["email"]}',
          now(), now(), '', '', '', ''
        );

        -- Insert into auth.identities
        INSERT INTO auth.identities (
          id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), new_user_id, new_user_id::text, jsonb_build_object('sub', new_user_id, 'email', user_email), 'email', now(), now(), now()
        );

        -- Insert into public.User
        INSERT INTO public."User" (
          id, email, name, role, department, designation, status, "createdAt", "updatedAt"
        )
        VALUES (
          new_user_id, user_email, 'Md. Nazmul', user_role, 'Executive', 'System Admin', 'active', now(), now()
        );

      END $$;
    `);

    console.log('✅ Admin successfully created! You can now log in.');

  } catch (error) {
    console.error('Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
