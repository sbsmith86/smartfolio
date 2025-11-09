/**
 * Test script to verify LinkedIn import deduplication
 * This checks that duplicate experiences/education are not created
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDeduplication() {
  try {
    const userId = 'cmhi6nmxk0000oaap9cge82q7'; // shae@hostechnology.com

    console.log('\n📊 CURRENT PROFILE DATA');
    console.log('='.repeat(50));

    // Get current experiences
    const experiences = await prisma.experience.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        company: true,
        position: true,
        startDate: true,
        endDate: true,
      },
    });

    console.log(`\n✅ Total Experiences: ${experiences.length}`);
    console.log('\nExperiences breakdown:');

    // Group by company
    const byCompany = experiences.reduce((acc, exp) => {
      if (!acc[exp.company]) acc[exp.company] = [];
      acc[exp.company].push(exp);
      return acc;
    }, {});

    Object.entries(byCompany).forEach(([company, exps]) => {
      console.log(`\n  ${company} (${exps.length} roles):`);
      exps.forEach(exp => {
        console.log(`    - ${exp.position} (${exp.startDate}${exp.endDate ? ` - ${exp.endDate}` : ' - Present'})`);
      });
    });

    // Check for potential duplicates
    console.log('\n\n🔍 DUPLICATE DETECTION');
    console.log('='.repeat(50));

    const duplicates = [];
    for (let i = 0; i < experiences.length; i++) {
      for (let j = i + 1; j < experiences.length; j++) {
        const exp1 = experiences[i];
        const exp2 = experiences[j];

        if (
          exp1.company === exp2.company &&
          exp1.position === exp2.position &&
          exp1.startDate === exp2.startDate
        ) {
          duplicates.push({
            exp1: `${exp1.position} at ${exp1.company} (${exp1.startDate})`,
            exp2: `${exp2.position} at ${exp2.company} (${exp2.startDate})`,
            ids: [exp1.id, exp2.id],
          });
        }
      }
    }

    if (duplicates.length > 0) {
      console.log(`\n❌ Found ${duplicates.length} potential duplicates:`);
      duplicates.forEach((dup, idx) => {
        console.log(`\n  ${idx + 1}. ${dup.exp1}`);
        console.log(`     IDs: ${dup.ids.join(', ')}`);
      });
    } else {
      console.log('\n✅ No duplicates found!');
    }

    // Get education
    const education = await prisma.education.findMany({
      where: { userId },
      select: {
        id: true,
        institution: true,
        degree: true,
        startDate: true,
        endDate: true,
      },
    });

    console.log(`\n\n📚 Education Records: ${education.length}`);
    education.forEach(edu => {
      console.log(`  - ${edu.degree} from ${edu.institution}`);
    });

    // Check for duplicate education
    const eduDuplicates = [];
    for (let i = 0; i < education.length; i++) {
      for (let j = i + 1; j < education.length; j++) {
        const edu1 = education[i];
        const edu2 = education[j];

        if (
          edu1.institution === edu2.institution &&
          edu1.degree === edu2.degree
        ) {
          eduDuplicates.push({
            edu1: `${edu1.degree} from ${edu1.institution}`,
            edu2: `${edu2.degree} from ${edu2.institution}`,
            ids: [edu1.id, edu2.id],
          });
        }
      }
    }

    if (eduDuplicates.length > 0) {
      console.log(`\n❌ Found ${eduDuplicates.length} duplicate education records:`);
      eduDuplicates.forEach((dup, idx) => {
        console.log(`\n  ${idx + 1}. ${dup.edu1}`);
        console.log(`     IDs: ${dup.ids.join(', ')}`);
      });
    } else {
      console.log('\n✅ No duplicate education records!');
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n💡 To test deduplication:');
    console.log('1. Go to http://localhost:3000/dashboard/import/linkedin');
    console.log('2. Paste your LinkedIn profile text (which has same jobs as resume)');
    console.log('3. Import should skip duplicates and show message');
    console.log('4. Run this script again to verify no new duplicates created\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeduplication();
