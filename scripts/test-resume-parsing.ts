#!/usr/bin/env tsx
/**
 * Test resume parsing with a sample resume
 *
 * Usage: npx tsx scripts/test-resume-parsing.ts
 */

import { prisma } from '../src/lib/prisma';
import { handleParseResume } from '../src/lib/mcp/handlers/ingestion';

async function main() {
  console.log('📄 Testing Resume Parsing\n');

  // Find a user with documents
  const user = await prisma.user.findFirst({
    include: {
      documents: {
        where: {
          extractedText: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) {
    console.log('❌ No users found in database.');
    console.log('\n💡 Please create an account first at http://localhost:3000/auth/signup\n');
    await prisma.$disconnect();
    return;
  }

  if (user.documents.length === 0) {
    console.log(`❌ User ${user.email} has no documents with extracted text.`);
    console.log('\n💡 To test resume parsing:');
    console.log('   1. Go to http://localhost:3000/dashboard/documents');
    console.log('   2. Upload a resume (PDF or DOCX)');
    console.log('   3. Wait for text extraction to complete');
    console.log('   4. Run this script again\n');
    await prisma.$disconnect();
    return;
  }

  const document = user.documents[0];
  console.log(`✅ Found user: ${user.email}`);
  console.log(`✅ Found document: ${document.fileName}`);
  console.log(`   Uploaded: ${document.createdAt.toLocaleString()}`);
  console.log(`   Extracted text length: ${document.extractedText?.length || 0} characters`);

  // Show a preview of the extracted text
  console.log('\n📝 Preview of extracted text:');
  console.log('─'.repeat(60));
  console.log(document.extractedText?.substring(0, 300) + '...');
  console.log('─'.repeat(60));

  // Check if already parsed
  const existingExperiences = await prisma.experience.count({
    where: { userId: user.id },
  });
  const existingEducation = await prisma.education.count({
    where: { userId: user.id },
  });
  const existingEmbeddings = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int as count
    FROM knowledge_embeddings
    WHERE "userId" = ${user.id}
  `;

  console.log(`\n📊 Current database state for ${user.email}:`);
  console.log(`   Experiences: ${existingExperiences}`);
  console.log(`   Education: ${existingEducation}`);
  console.log(`   Embeddings: ${existingEmbeddings[0].count}`);

  if (existingExperiences > 0 || existingEducation > 0) {
    console.log('\n⚠️  User already has parsed data. Parsing will add MORE records.');
    console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Parse the resume
  console.log('\n🤖 Parsing resume with GPT-4...');
  console.log('   (This may take 10-30 seconds)\n');

  try {
    const result = await handleParseResume(
      {
        userId: user.id,
        documentId: document.id,
      },
      {
        id: 'test-session',
        userId: user.id,
        createdAt: new Date(),
        lastActivity: new Date(),
        context: new Map(),
      }
    );

    if (result.success) {
      console.log('✅ Resume parsed successfully!\n');
      console.log('📊 Created records:');
      console.log(`   Experiences: ${result.summary.experiencesCreated}`);
      console.log(`   Education: ${result.summary.educationCreated}`);
      console.log(`   Skills: ${result.summary.skillsCreated}`);
      console.log(`   Embeddings: ${result.summary.embeddingsCreated}`);

      // Show created experiences
      if (result.data.experiences.length > 0) {
        console.log('\n💼 Experiences created:');
        const experiences = await prisma.experience.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: result.summary.experiencesCreated,
        });
        experiences.forEach((exp, i) => {
          console.log(`   ${i + 1}. ${exp.position} at ${exp.company}`);
          console.log(`      ${exp.startDate} - ${exp.endDate || 'Present'}`);
        });
      }

      // Show created education
      if (result.data.education.length > 0) {
        console.log('\n🎓 Education created:');
        const education = await prisma.education.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: result.summary.educationCreated,
        });
        education.forEach((edu, i) => {
          console.log(`   ${i + 1}. ${edu.degree} - ${edu.institution}`);
          console.log(`      ${edu.startDate || 'N/A'} - ${edu.endDate || 'N/A'}`);
        });
      }

      // Show created skills
      if (result.data.skills.length > 0) {
        console.log('\n🛠️  Skills created:');
        const skills = await prisma.userSkill.findMany({
          where: { userId: user.id },
          include: { skill: true },
          orderBy: { createdAt: 'desc' },
          take: Math.min(10, result.summary.skillsCreated),
        });
        const skillNames = skills.map(us => us.skill.name).join(', ');
        console.log(`   ${skillNames}`);
        if (result.summary.skillsCreated > 10) {
          console.log(`   ... and ${result.summary.skillsCreated - 10} more`);
        }
      }

      console.log('\n✅ Test complete! You can now test search functionality:');
      console.log('   npx tsx scripts/test-mcp-search.ts\n');
    } else {
      console.log('❌ Parsing failed:', result);
    }
  } catch (error) {
    console.error('\n❌ Error during parsing:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
