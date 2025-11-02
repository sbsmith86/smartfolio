#!/usr/bin/env tsx

/**
 * Reset database to clean state while preserving users
 * Deletes: documents, experiences, education, skills, embeddings, testimonials, links
 * Keeps: users, accounts, sessions (auth data)
 */

import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function resetDataKeepUsers() {
  console.log('🧹 Resetting database (keeping users)...\n');

  try {
    // 1. Delete embeddings (no foreign keys, safe to delete first)
    console.log('Deleting knowledge embeddings...');
    const embeddingsDeleted = await prisma.knowledgeEmbedding.deleteMany({});
    console.log(`✅ Deleted ${embeddingsDeleted.count} embeddings`);

    // 2. Delete user skills (junction table)
    console.log('Deleting user-skill associations...');
    const userSkillsDeleted = await prisma.userSkill.deleteMany({});
    console.log(`✅ Deleted ${userSkillsDeleted.count} user-skill associations`);

    // 3. Delete documents
    console.log('Deleting user documents...');
    const documentsDeleted = await prisma.userDocument.deleteMany({});
    console.log(`✅ Deleted ${documentsDeleted.count} documents`);

    // 4. Delete experiences
    console.log('Deleting experiences...');
    const experiencesDeleted = await prisma.experience.deleteMany({});
    console.log(`✅ Deleted ${experiencesDeleted.count} experiences`);

    // 5. Delete education
    console.log('Deleting education records...');
    const educationDeleted = await prisma.education.deleteMany({});
    console.log(`✅ Deleted ${educationDeleted.count} education records`);

    // 6. Delete testimonials
    console.log('Deleting testimonials...');
    const testimonialsDeleted = await prisma.testimonial.deleteMany({});
    console.log(`✅ Deleted ${testimonialsDeleted.count} testimonials`);

    // 7. Delete user links
    console.log('Deleting user links...');
    const linksDeleted = await prisma.userLink.deleteMany({});
    console.log(`✅ Deleted ${linksDeleted.count} links`);

    // 8. Delete orphaned skills (skills not associated with any user)
    console.log('Cleaning up orphaned skills...');
    const orphanedSkills = await prisma.skill.findMany({
      where: {
        userSkills: {
          none: {},
        },
      },
    });

    if (orphanedSkills.length > 0) {
      const orphanedDeleted = await prisma.skill.deleteMany({
        where: {
          id: {
            in: orphanedSkills.map(s => s.id),
          },
        },
      });
      console.log(`✅ Deleted ${orphanedDeleted.count} orphaned skills`);
    } else {
      console.log('✅ No orphaned skills to delete');
    }

    // 9. Clean uploads directory
    console.log('\nCleaning uploads directory...');
    const uploadsDir = path.join(process.cwd(), 'uploads');

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Delete directory and all contents
          fs.rmSync(filePath, { recursive: true, force: true });
          deletedCount++;
        }
      }

      console.log(`✅ Deleted ${deletedCount} upload directories`);
    } else {
      console.log('✅ No uploads directory found');
    }

    // 10. Show remaining data
    console.log('\n📊 Remaining data:');
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();

    console.log(`   Users: ${userCount}`);
    console.log(`   Accounts: ${accountCount}`);
    console.log(`   Sessions: ${sessionCount}`);

    console.log('\n✅ Database reset complete! Users and auth data preserved.');
    console.log('   You can now upload documents and test from a clean state.\n');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDataKeepUsers();
