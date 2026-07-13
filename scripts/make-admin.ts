import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.upsert({
    where: { email: 'nazmulhas36@gmail.com' },
    update: { role: 'Admin' },
    create: {
      id: 'will-be-updated',
      email: 'nazmulhas36@gmail.com',
      name: 'Md. Nazmul',
      role: 'Admin',
      status: 'active'
    }
  });
  console.log('User role updated to Admin in database!');
}
main().finally(() => prisma.$disconnect());
