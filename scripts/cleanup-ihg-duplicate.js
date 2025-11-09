const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 CLEANING UP IHG DUPLICATE EXPERIENCES\n');

    // Get both IHG experiences
    const ihgExps = await prisma.experience.findMany({
      where: {
        userId: 'cmhi6nmxk0000oaap9cge82q7',
        company: { contains: 'IHG' },
        startDate: '2024-01'
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${ihgExps.length} IHG experiences:\n`);
    ihgExps.forEach((exp, idx) => {
      console.log(`${idx + 1}. "${exp.position}" (ID: ${exp.id})`);
      console.log(`   Created: ${exp.createdAt}`);
    });

    if (ihgExps.length === 2) {
      // Keep the first one (older), delete the second (newer/duplicate)
      const toKeep = ihgExps[0];
      const toDelete = ihgExps[1];

      console.log(`\n✅ Keeping: "${toKeep.position}" (created ${toKeep.createdAt})`);
      console.log(`🗑️  Deleting: "${toDelete.position}" (created ${toDelete.createdAt})\n`);

      // Delete embedding first
      const deletedEmbeddings = await prisma.knowledgeEmbedding.deleteMany({
        where: {
          contentType: 'experience',
          contentId: toDelete.id
        }
      });

      console.log(`   Deleted ${deletedEmbeddings.count} embedding(s)`);

      // Delete experience
      await prisma.experience.delete({
        where: { id: toDelete.id }
      });

      console.log(`   Deleted experience\n`);

      // Verify final state
      const remaining = await prisma.experience.count({
        where: {
          userId: 'cmhi6nmxk0000oaap9cge82q7',
          company: { contains: 'IHG' }
        }
      });

      console.log(`✅ Final state: ${remaining} IHG experience(s) remaining`);

    } else {
      console.log('\n⚠️  Expected 2 experiences, found different number. Skipping cleanup.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
