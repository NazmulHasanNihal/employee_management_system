import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanUser() {
  const email = 'nazmulhas36@gmail.com';
  console.log(`Attempting to forcefully delete ${email}...`);

  try {
    // 1. Delete from Prisma's public.User table
    await prisma.$executeRaw`DELETE FROM "User" WHERE email = ${email};`;
    console.log('✅ Deleted from public.User');

    // 2. Delete from Supabase Auth auth.users table
    await prisma.$executeRaw`DELETE FROM auth.users WHERE email = ${email};`;
    console.log('✅ Deleted from auth.users');
    
    console.log('\nSUCCESS! The corrupted user has been completely wiped from the database.');
  } catch (error) {
    console.error('Failed to delete:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanUser();
