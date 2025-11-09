/**
 * Fix education duplicate records with better analysis
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEducationDuplicates() {
  try {
    const userId = 'cmhi6nmxk0000oaap9cge82q7';

    console.log('\n📚 ANALYZING EDUCATION RECORDS');
    console.log('='.repeat(50));

    const education = await prisma.education.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`\nFound ${education.length} education records:\n`);

    education.forEach((edu, idx) => {
      console.log(`${idx + 1}. Institution: "${edu.institution}"`);
      console.log(`   Degree: "${edu.degree}"`);
      console.log(`   Field: "${edu.fieldOfStudy || 'N/A'}"`);
      console.log(`   ID: ${edu.id}`);
      console.log(`   Created: ${edu.createdAt.toISOString()}`);
      console.log();
    });

    // Identify the issues
    console.log('🔍 ISSUES FOUND:');
    console.log('='.repeat(50));

    const issues = [];

    // Find the bad record with swapped fields
    const badRecord = education.find(e =>
      e.institution === 'B.A, Computer Science' && e.degree === 'B.A'
    );

    if (badRecord) {
      issues.push({
        id: badRecord.id,
        issue: 'Institution and degree fields are swapped',
        action: 'DELETE',
        record: `"${badRecord.degree}" from "${badRecord.institution}"`,
      });
    }

    // Find Smith College duplicates
    const smithRecords = education.filter(e =>
      e.institution.includes('Smith College') || e.degree.includes('Smith College')
    );

    if (smithRecords.length > 1) {
      // Keep the first one created
      const toKeep = smithRecords[0];
      const toDelete = smithRecords.slice(1);

      toDelete.forEach(record => {
        issues.push({
          id: record.id,
          issue: `Duplicate of "${toKeep.degree}" from "${toKeep.institution}"`,
          action: 'DELETE',
          record: `"${record.degree}" from "${record.institution}"`,
        });
      });
    }

    if (issues.length === 0) {
      console.log('\n✅ No issues found!\n');
      return;
    }

    console.log(`\nFound ${issues.length} issues:\n`);
    issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.record}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Action: ${issue.action}`);
      console.log(`   ID: ${issue.id}`);
      console.log();
    });

    // Ask for confirmation
    console.log('🗑️  DELETING RECORDS:');
    console.log('='.repeat(50));

    for (const issue of issues) {
      // Delete embeddings first
      const embeddingsDeleted = await prisma.$executeRaw`
        DELETE FROM "knowledge_embeddings"
        WHERE "contentType" = 'education'
        AND "contentId" = ${issue.id}
      `;

      // Delete the education record
      await prisma.education.delete({
        where: { id: issue.id },
      });

      console.log(`✅ Deleted: ${issue.record} (${embeddingsDeleted} embeddings)`);
    }

    // Show final state
    const finalEducation = await prisma.education.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    console.log('\n\n📚 FINAL EDUCATION RECORDS:');
    console.log('='.repeat(50));
    console.log(`\nTotal: ${finalEducation.length} records\n`);

    finalEducation.forEach((edu, idx) => {
      console.log(`${idx + 1}. ${edu.degree} from ${edu.institution}`);
      if (edu.fieldOfStudy) {
        console.log(`   Field: ${edu.fieldOfStudy}`);
      }
      console.log();
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEducationDuplicates();
