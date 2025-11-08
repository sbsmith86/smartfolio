const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupGitHubDuplicates() {
  try {
    console.log('🔍 Checking GitHub projects for user shae@hostechnology.com...\n');

    const user = await prisma.user.findUnique({
      where: { email: 'shae@hostechnology.com' },
      include: {
        experiences: {
          where: { company: 'GitHub' },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`📊 Total GitHub experiences: ${user.experiences.length}\n`);

    // Group by position to find duplicates
    const projectsByName = {};
    user.experiences.forEach(exp => {
      if (!projectsByName[exp.position]) {
        projectsByName[exp.position] = [];
      }
      projectsByName[exp.position].push(exp);
    });

    // Display all projects
    console.log('📋 All GitHub projects:');
    Object.entries(projectsByName).forEach(([name, projects]) => {
      console.log(`\n  ${name}:`);
      projects.forEach(p => {
        console.log(`    - ID: ${p.id}`);
        console.log(`      Created: ${p.createdAt}`);
        console.log(`      Description: ${p.description?.substring(0, 100)}...`);
      });
    });

    // Find duplicates
    const duplicates = Object.entries(projectsByName)
      .filter(([name, projects]) => projects.length > 1);

    if (duplicates.length === 0) {
      console.log('\n✅ No duplicates found');
      return;
    }

    console.log(`\n⚠️  Found ${duplicates.length} duplicate project names\n`);

    // For each duplicate, keep the LATEST one (most recent createdAt)
    for (const [name, projects] of duplicates) {
      // Sort by createdAt descending (newest first)
      const sorted = projects.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      const keep = sorted[0]; // Keep the newest
      const toDelete = sorted.slice(1); // Delete the rest

      console.log(`📦 ${name}:`);
      console.log(`  ✅ KEEPING: ${keep.id} (created ${keep.createdAt})`);

      for (const exp of toDelete) {
        console.log(`  🗑️  DELETING: ${exp.id} (created ${exp.createdAt})`);

        // Delete related embeddings first
        const embeddings = await prisma.knowledgeEmbedding.findMany({
          where: {
            userId: user.id,
            contentType: 'experience',
            contentId: exp.id
          }
        });

        if (embeddings.length > 0) {
          console.log(`     - Deleting ${embeddings.length} related embeddings`);
          await prisma.knowledgeEmbedding.deleteMany({
            where: {
              userId: user.id,
              contentType: 'experience',
              contentId: exp.id
            }
          });
        }

        // Delete the experience
        await prisma.experience.delete({
          where: { id: exp.id }
        });
      }
    }

    // Final count
    const finalCount = await prisma.experience.count({
      where: {
        userId: user.id,
        company: 'GitHub'
      }
    });

    const totalExperiences = await prisma.experience.count({
      where: { userId: user.id }
    });

    const totalEmbeddings = await prisma.knowledgeEmbedding.count({
      where: { userId: user.id }
    });

    console.log('\n✨ Cleanup complete!');
    console.log(`📊 Final counts:`);
    console.log(`   - GitHub projects: ${finalCount}`);
    console.log(`   - Total experiences: ${totalExperiences}`);
    console.log(`   - Total embeddings: ${totalEmbeddings}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupGitHubDuplicates();
