import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all tables in public schema...');
  const result: any[] = await prisma.$queryRaw`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `;

  let count = 0;
  for (const row of result) {
    const tableName = row.tablename;
    
    // Skip prisma migrations table just in case, though it doesn't really matter
    if (tableName === '_prisma_migrations') {
      continue;
    }

    console.log(`Enabling RLS on: ${tableName}`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."${tableName}" ENABLE ROW LEVEL SECURITY;`);
    count++;
  }

  console.log(`\n✅ Successfully enabled RLS on ${count} tables in the public schema!`);
  console.log(`The Supabase Security Advisor warnings will now be resolved.`);
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
