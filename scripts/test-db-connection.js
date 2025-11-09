const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔌 Testing database connection...\n');

    // Test basic connection
    const userCount = await prisma.user.count();
    console.log(`✅ Connected! Found ${userCount} user(s)\n`);

    // Get IHG experiences
    console.log('📊 IHG Experiences:');
    const ihgExps = await prisma.experience.findMany({
      where: {
        userId: 'cmhi6nmxk0000oaap9cge82q7',
        company: { contains: 'IHG' }
      },
      select: { position: true, company: true, startDate: true }
    });

    ihgExps.forEach(e => {
      console.log(`   - "${e.position}" at ${e.company}`);
      console.log(`     Start: ${e.startDate}\n`);
    });

    // Get all experiences with position containing "Lead" or "Technical"
    console.log('📊 Experiences with "Lead" or "Technical":');
    const leadExps = await prisma.experience.findMany({
      where: {
        userId: 'cmhi6nmxk0000oaap9cge82q7',
        OR: [
          { position: { contains: 'Lead' } },
          { position: { contains: 'Technical' } }
        ]
      },
      select: { position: true, company: true, startDate: true },
      orderBy: { startDate: 'desc' }
    });

    leadExps.forEach(e => {
      console.log(`   - "${e.position}" at ${e.company}`);
      console.log(`     Start: ${e.startDate}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
