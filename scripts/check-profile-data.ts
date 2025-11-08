import { prisma } from '../src/lib/prisma';

async function checkProfileData() {
  try {
    console.log('🔍 Checking database for existing profile data...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        publicProfileEnabled: true
      }
    });

    console.log('=== USERS ===');
    console.log(`Found ${users.length} user(s)`);
    users.forEach(u => console.log(`- ${u.email || u.firstName} (${u.id})`));

    if (users.length > 0) {
      const userId = users[0].id;

      const experiences = await prisma.experience.count({ where: { userId } });
      const education = await prisma.education.count({ where: { userId } });
      const skills = await prisma.userSkill.count({ where: { userId } });
      const embeddings = await prisma.knowledgeEmbedding.count({ where: { userId } });
      const documents = await prisma.userDocument.count({ where: { userId } });

      console.log('\n=== PROFILE DATA FOR', users[0].email || users[0].firstName, '===');
      console.log(`- Experiences: ${experiences}`);
      console.log(`- Education: ${education}`);
      console.log(`- Skills: ${skills}`);
      console.log(`- Documents: ${documents}`);
      console.log(`- Embeddings: ${embeddings}`);

      if (experiences > 0 || education > 0 || skills > 0) {
        console.log('\n✅ Profile exists with structured data');
      } else {
        console.log('\n⚠️  User exists but no structured profile data yet');
      }

      if (embeddings > 0) {
        console.log('✅ Embeddings generated');
      } else {
        console.log('⚠️  No embeddings found');
      }
    } else {
      console.log('\n❌ No users found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfileData();
