/**
 * Clean up duplicate experiences and education records
 * Keeps the oldest record (first created) and deletes newer duplicates
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicates() {
  try {
    const userId = 'cmhi6nmxk0000oaap9cge82q7'; // shae@hostechnology.com

    console.log('\n🧹 CLEANING DUPLICATE RECORDS');
    console.log('='.repeat(50));

    // Get all experiences
    const experiences = await prisma.experience.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }, // Oldest first
    });

    console.log(`\nFound ${experiences.length} total experiences`);

    // Find duplicates (same company, position, startDate)
    const seen = new Map();
    const toDelete = [];

    for (const exp of experiences) {
      const key = `${exp.company}|${exp.position}|${exp.startDate}`;

      if (seen.has(key)) {
        // This is a duplicate - mark for deletion
        toDelete.push({
          id: exp.id,
          label: `${exp.position} at ${exp.company} (${exp.startDate})`,
        });
      } else {
        // First occurrence - keep it
        seen.set(key, exp.id);
      }
    }

    console.log(`\nFound ${toDelete.length} duplicate experiences to delete`);

    if (toDelete.length > 0) {
      console.log('\nDeleting duplicate experiences:');

      for (const dup of toDelete) {
        // Delete associated embeddings first
        const embeddingsDeleted = await prisma.$executeRaw`
          DELETE FROM "knowledge_embeddings"
          WHERE "contentType" = 'experience'
          AND "contentId" = ${dup.id}
        `;

        // Delete the experience
        await prisma.experience.delete({
          where: { id: dup.id },
        });

        console.log(`  ✅ Deleted: ${dup.label} (${embeddingsDeleted} embeddings)`);
      }
    }

    // Clean duplicate education
    const education = await prisma.education.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`\n\nFound ${education.length} total education records`);

    const seenEdu = new Map();
    const toDeleteEdu = [];

    for (const edu of education) {
      const key = `${edu.institution}|${edu.degree}`;

      if (seenEdu.has(key)) {
        toDeleteEdu.push({
          id: edu.id,
          label: `${edu.degree} from ${edu.institution}`,
        });
      } else {
        seenEdu.set(key, edu.id);
      }
    }

    console.log(`\nFound ${toDeleteEdu.length} duplicate education records to delete`);

    if (toDeleteEdu.length > 0) {
      console.log('\nDeleting duplicate education:');

      for (const dup of toDeleteEdu) {
        // Delete associated embeddings first
        const embeddingsDeleted = await prisma.$executeRaw`
          DELETE FROM "knowledge_embeddings"
          WHERE "contentType" = 'education'
          AND "contentId" = ${dup.id}
        `;

        // Delete the education
        await prisma.education.delete({
          where: { id: dup.id },
        });

        console.log(`  ✅ Deleted: ${dup.label} (${embeddingsDeleted} embeddings)`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   - Deleted ${toDelete.length} duplicate experiences`);
    console.log(`   - Deleted ${toDeleteEdu.length} duplicate education records`);
    console.log(`\n💡 Run 'node scripts/test-deduplication.js' to verify\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicates();
