#!/usr/bin/env tsx
/**
 * Check what data exists in all tables
 */

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('📊 Database Table Counts\n');

  const users = await prisma.user.count();
  const documents = await prisma.userDocument.count();
  const experiences = await prisma.experience.count();
  const education = await prisma.education.count();
  const skills = await prisma.skill.count();
  const userSkills = await prisma.userSkill.count();

  const embeddings = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int as count FROM knowledge_embeddings
  `;

  console.log('Table Counts:');
  console.log(`  users: ${users}`);
  console.log(`  user_documents: ${documents}`);
  console.log(`  experiences: ${experiences}`);
  console.log(`  education: ${education}`);
  console.log(`  skills: ${skills}`);
  console.log(`  user_skills: ${userSkills}`);
  console.log(`  knowledge_embeddings: ${embeddings[0].count}`);

  if (documents > 0) {
    console.log('\n📄 Documents:');
    const docs = await prisma.userDocument.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    docs.forEach((doc, i) => {
      console.log(`  ${i + 1}. ${doc.fileName} (${doc.user.email})`);
      console.log(`     Uploaded: ${doc.createdAt.toLocaleString()}`);
      console.log(`     Has extracted text: ${doc.extractedText ? 'Yes' : 'No'}`);
      console.log(`     Text length: ${doc.extractedText?.length || 0} chars`);
    });
  }

  if (experiences > 0) {
    console.log('\n💼 Sample Experiences:');
    const exps = await prisma.experience.findMany({
      include: { user: true },
      take: 3,
    });
    exps.forEach((exp, i) => {
      console.log(`  ${i + 1}. ${exp.position} at ${exp.company} (${exp.user.email})`);
    });
  }

  if (education > 0) {
    console.log('\n🎓 Sample Education:');
    const edus = await prisma.education.findMany({
      include: { user: true },
      take: 3,
    });
    edus.forEach((edu, i) => {
      console.log(`  ${i + 1}. ${edu.degree} - ${edu.institution} (${edu.user.email})`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
