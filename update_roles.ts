import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const musrat = await prisma.user.findFirst({
    where: { name: { contains: 'Musrat Jahan Gungun', mode: 'insensitive' } }
  });
  if (musrat) {
    await prisma.user.update({
      where: { id: musrat.id },
      data: { role: 'CFO', designation: 'CFO' }
    });
    console.log('Updated Musrat to CFO');
  } else {
    console.log('Musrat not found');
  }

  const omar = await prisma.user.findFirst({
    where: { name: { contains: 'Omar Faruk Kafi', mode: 'insensitive' } }
  });
  if (omar) {
    await prisma.user.update({
      where: { id: omar.id },
      data: { role: 'CTO', designation: 'CTO' }
    });
    console.log('Updated Omar to CTO');
  } else {
    console.log('Omar not found');
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
