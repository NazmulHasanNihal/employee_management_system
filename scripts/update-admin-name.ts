import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function main() {
  const email = 'nazmulhas36@gmail.com';

  await prisma.user.update({
    where: { email },
    data: {
      name: 'Md. Nazmul',
    }
  });

  console.log(`Updated Admin Name to Md. Nazmul successfully!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
