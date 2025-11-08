const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyProfileSeparation() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'shae@hostechnology.com' },
      include: {
        experiences: {
          orderBy: { startDate: 'desc' }
        }
      }
    });

    const resumeExperiences = user.experiences.filter(exp => exp.company !== 'GitHub');
    const githubProjects = user.experiences.filter(exp => exp.company === 'GitHub');

    console.log('\n=== PROFILE CONTENT VERIFICATION ===\n');

    console.log('📄 PROFESSIONAL EXPERIENCE (from Resume):');
    console.log(`   Total: ${resumeExperiences.length}\n`);
    resumeExperiences.forEach(exp => {
      console.log(`   • ${exp.position} at ${exp.company}`);
      console.log(`     ${exp.startDate} - ${exp.endDate || 'Present'}`);
    });

    console.log('\n💻 OPEN SOURCE PROJECTS (from GitHub):');
    console.log(`   Total: ${githubProjects.length}\n`);
    githubProjects.forEach(project => {
      console.log(`   • ${project.position}`);
      console.log(`     ${project.startDate}`);
      console.log(`     URL: https://github.com/sbsmith86/${project.position}`);
    });

    console.log('\n✅ Profile will show distinct sections:');
    console.log(`   - Professional Experience: ${resumeExperiences.length} roles`);
    console.log(`   - Open Source Projects: ${githubProjects.length} projects`);
    console.log(`   - Education: (will query separately)`);
    console.log(`   - Skills: (will query separately)`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProfileSeparation();
