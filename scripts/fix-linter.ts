import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  console.log('Fixing RLS Enabled No Policy...');
  const result: any[] = await prisma.$queryRawUnsafe(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `);

  for (const row of result) {
    const tableName = row.tablename;
    
    if (tableName === '_prisma_migrations') {
      continue;
    }

    try {
      // Create a default deny policy so the linter stops complaining about "No Policy"
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_policies
                WHERE schemaname = 'public'
                  AND tablename = '${tableName}'
                  AND policyname = 'Deny public access'
            ) THEN
                CREATE POLICY "Deny public access" ON "public"."${tableName}" FOR ALL USING (false);
            END IF;
        END
        $$;
      `);
      console.log(`Added deny policy to ${tableName}`);
    } catch (err: any) {
      console.log(`Could not add policy to ${tableName}: ${err.message}`);
    }
  }

  console.log('Fixing function search_path mutable...');
  try {
    // Try to fix the storage_owner function which often lacks a search_path
    // Find the exact signature of the function
    const funcs: any[] = await prisma.$queryRawUnsafe(`
      SELECT oid::regprocedure::text as signature
      FROM pg_proc
      WHERE proname = 'storage_owner'
    `);
    
    for (const func of funcs) {
      console.log(`Fixing search_path for ${func.signature}`);
      await prisma.$executeRawUnsafe(`ALTER FUNCTION ${func.signature} SET search_path = public;`);
    }
  } catch (err: any) {
    console.log(`Could not fix function search_path: ${err.message}`);
  }

  console.log(`\n✅ Done fixing linter warnings!`);
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
