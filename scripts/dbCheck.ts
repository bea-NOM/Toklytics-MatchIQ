import { getPrismaClient } from '../src/lib/prisma';

const prisma = getPrismaClient();

(async () => {
  try {
    const r = await prisma.$queryRawUnsafe('SELECT 1 AS one');
    console.log('✅ Connection works:', r);

    const events = await prisma.powerupEvent.findMany({ take: 5 });
    console.log('✅ PowerupEvent rows:', events);
  } catch (e) {
    console.error('❌ Database check failed:', e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
