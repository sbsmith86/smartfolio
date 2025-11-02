#!/usr/bin/env tsx
/**
 * DANGER: This script clears ALL data from the database and deletes uploaded files
 * Use this only for testing/development - NOT for production!
 */

import { prisma } from '../src/lib/prisma';
import { rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

async function main() {
  console.log('🚨 DANGER: About to delete ALL data from database and file system!');
  console.log('\nThis will delete:');
  console.log('  - All users and accounts');
  console.log('  - All uploaded documents (files + database records)');
  console.log('  - All experiences, education, skills');
  console.log('  - All embeddings');
  console.log('  - All chat sessions and messages');
  console.log('  - All testimonials');
  console.log('\n⏰ You have 5 seconds to press Ctrl+C to cancel...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🗑️  Starting cleanup...\n');

  try {
    // Delete in correct order (respecting foreign key constraints)
    console.log('Deleting chat messages...');
    await prisma.chatMessage.deleteMany();

    console.log('Deleting chat sessions...');
    await prisma.chatSession.deleteMany();

    console.log('Deleting knowledge embeddings...');
    await prisma.$executeRaw`TRUNCATE TABLE knowledge_embeddings CASCADE`;

    console.log('Deleting testimonials...');
    await prisma.testimonial.deleteMany();

    console.log('Deleting user skills...');
    await prisma.userSkill.deleteMany();

    console.log('Deleting skills...');
    await prisma.skill.deleteMany();

    console.log('Deleting education...');
    await prisma.education.deleteMany();

    console.log('Deleting experiences...');
    await prisma.experience.deleteMany();

    console.log('Deleting user links...');
    await prisma.userLink.deleteMany();

    console.log('Deleting user documents...');
    await prisma.userDocument.deleteMany();

    console.log('Deleting NextAuth sessions...');
    await prisma.session.deleteMany();

    console.log('Deleting NextAuth accounts...');
    await prisma.account.deleteMany();

    console.log('Deleting verification tokens...');
    await prisma.verificationToken.deleteMany();

    console.log('Deleting users...');
    await prisma.user.deleteMany();

    console.log('\n✅ Database cleared!');

    // Delete uploaded files
    const uploadsDir = join(process.cwd(), 'uploads');
    if (existsSync(uploadsDir)) {
      console.log('\n🗑️  Deleting uploaded files...');
      await rm(uploadsDir, { recursive: true, force: true });
      console.log('✅ Uploaded files deleted!');
    }

    console.log('\n✨ Database and files completely cleared!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Create a new account: http://localhost:3000/auth/signup');
    console.log('   3. Upload a resume: http://localhost:3000/dashboard/documents');
    console.log('   4. Wait 10-30 seconds for auto-parsing');
    console.log('   5. Check embeddings: npx tsx scripts/check-embeddings.ts');
    console.log('   6. Test search: npx tsx scripts/test-mcp-search.ts\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
