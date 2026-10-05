import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hidden test account
  const testEmail = 'abacus-4581d11d@example.com';
  const testPassword = 'x30R2g3#lb';
  const hashedTest = await bcrypt.hash(testPassword, 12);

  await prisma.user.upsert({
    where: { email: testEmail },
    update: { hashedPassword: hashedTest },
    create: {
      email: testEmail,
      hashedPassword: hashedTest,
      name: 'Test Admin',
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
