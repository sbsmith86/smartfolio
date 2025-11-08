const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteWrongGitHubProjects() {
  try {
    console.log('\n🗑️  DELETING WRONG GITHUB PROJECTS (from shaedrich)\n');

    const user = await prisma.user.findUnique({
      where: { email: 'shae@hostechnology.com' }
    });

    // IDs of the shaedrich projects that need to be deleted
    const shaedrichProjectIds = [
      'cmhqoin1j0025oahht7kz8ho6', // mint-website
      'cmhqoikp70020oahhiixcxrqy', // BrowserGame-sample
      'cmhqoijjs001yoahh5r3nccxs', // docs
      'cmhqoihcv001woahhkipvnjpe', // framework
      'cmhqoieq6001foahhjf98jjtl'  // Piped
    ];

    const projectNames = [
      'mint-website',
      'BrowserGame-sample',
      'docs',
      'framework',
      'Piped'
    ];

    for (let i = 0; i < shaedrichProjectIds.length; i++) {
      const id = shaedrichProjectIds[i];
      const name = projectNames[i];

      console.log(`Deleting: ${name} (${id})`);

      // Delete related embeddings first
      const embeddings = await prisma.knowledgeEmbedding.deleteMany({
        where: {
          userId: user.id,
          contentType: 'experience',
          contentId: id
        }
      });

      if (embeddings.count > 0) {
        console.log(`  - Deleted ${embeddings.count} embeddings`);
      }

      // Delete the experience
      await prisma.experience.delete({
        where: { id }
      });

      console.log(`  ✅ Deleted\n`);
    }

    // Final count
    const remainingGitHub = await prisma.experience.count({
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

    console.log('✨ Cleanup complete!\n');
    console.log('📊 Final counts:');
    console.log(`   - GitHub projects: ${remainingGitHub} (should be 5)`);
    console.log(`   - Total experiences: ${totalExperiences}`);
    console.log(`   - Total embeddings: ${totalEmbeddings}\n`);

    // Show remaining GitHub projects
    const remaining = await prisma.experience.findMany({
      where: {
        userId: user.id,
        company: 'GitHub'
      },
      select: {
        position: true
      },
      orderBy: { position: 'asc' }
    });

    console.log('✅ Remaining GitHub projects (from sbsmith86):');
    remaining.forEach(exp => {
      console.log(`   - ${exp.position}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteWrongGitHubProjects();
