const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGitHubExperiences() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'shae@hostechnology.com' },
      include: {
        experiences: {
          where: { company: 'GitHub' },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('\n=== GITHUB EXPERIENCES IN DATABASE ===\n');
    console.log(`Total GitHub experiences: ${user.experiences.length}\n`);

    user.experiences.forEach((exp, idx) => {
      console.log(`${idx + 1}. ${exp.position}`);
      console.log(`   ID: ${exp.id}`);
      console.log(`   Created: ${exp.createdAt.toISOString()}`);
      console.log(`   Start Date: ${exp.startDate}`);
      console.log(`   Description: ${exp.description?.substring(0, 80)}...`);
      console.log('');
    });

    // Check which repos these are
    console.log('\n=== CHECKING AGAINST KNOWN REPOS ===\n');

    const sbsmith86Repos = ['chopchop', 'modal', 'rogue', 'neue', 'dosomething'];
    const shaedrichRepos = ['Piped', 'framework', 'docs', 'BrowserGame-sample', 'mint-website'];

    user.experiences.forEach(exp => {
      const repoName = exp.position;
      if (sbsmith86Repos.includes(repoName)) {
        console.log(`✅ ${repoName} - FROM sbsmith86 (CORRECT)`);
      } else if (shaedrichRepos.includes(repoName)) {
        console.log(`❌ ${repoName} - FROM shaedrich (WRONG - SHOULD BE DELETED)`);
      } else {
        console.log(`❓ ${repoName} - UNKNOWN`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGitHubExperiences();
