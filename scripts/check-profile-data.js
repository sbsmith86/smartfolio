const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProfileData() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log('=== DATABASE CHECK ===\n');
    console.log(`Total users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    for (const user of users) {
      console.log(`User: ${user.email || `${user.firstName} ${user.lastName}`}`);
      console.log(`ID: ${user.id}\n`);

      const [experiences, education, skills, embeddings, documents] = await Promise.all([
        prisma.experience.count({ where: { userId: user.id } }),
        prisma.education.count({ where: { userId: user.id } }),
        prisma.userSkill.count({ where: { userId: user.id } }),
        prisma.knowledgeEmbedding.count({ where: { userId: user.id } }),
        prisma.userDocument.count({ where: { userId: user.id } })
      ]);

      console.log('Profile Data:');
      console.log(`  📄 Documents: ${documents}`);
      console.log(`  💼 Experiences: ${experiences}`);
      console.log(`  🎓 Education: ${education}`);
      console.log(`  🔧 Skills: ${skills}`);
      console.log(`  🧠 Embeddings: ${embeddings}\n`);

      if (experiences > 0 && skills > 0 && embeddings > 0) {
        console.log('✅ Profile has resume data with AI structuring and embeddings');
      } else {
        console.log('⚠️  Profile incomplete - missing some structured data');
      }
      console.log('---\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfileData();
