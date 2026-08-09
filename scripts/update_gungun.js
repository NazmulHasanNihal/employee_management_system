const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      name: {
        contains: 'Musrat Jahan Gungun',
      }
    }
  });

  if (user) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { designation: 'Manager', role: 'Manager' }
    });
    console.log('Updated user:', updated.name, 'to designation:', updated.designation);
  } else {
    console.log('User not found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
