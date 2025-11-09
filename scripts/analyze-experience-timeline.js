const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userId = 'cmhi6nmxk0000oaap9cge82q7';

    console.log('📊 EXPERIENCE TIMELINE ANALYSIS\n');
    console.log('======================================================================\n');

    // Get all experiences
    const experiences = await prisma.experience.findMany({
      where: { userId },
      select: {
        position: true,
        company: true,
        startDate: true,
        endDate: true
      },
      orderBy: { startDate: 'desc' }
    });

    console.log(`Total experiences: ${experiences.length}\n`);

    // Calculate using CURRENT (wrong) method - sum all durations
    let totalMonthsWrong = 0;
    const now = new Date();

    console.log('📅 ALL EXPERIENCES (sorted by start date):\n');

    experiences.forEach((exp, idx) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : now;
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonthsWrong += Math.max(0, months);

      const duration = Math.round(months / 12 * 10) / 10;
      const endDisplay = exp.endDate ? exp.endDate : 'Present';

      console.log(`${idx + 1}. ${exp.position} at ${exp.company}`);
      console.log(`   ${exp.startDate} → ${endDisplay} (${duration} years, ${months} months)`);
    });

    const totalYearsWrong = Math.round(totalMonthsWrong / 12 * 10) / 10;

    console.log('\n======================================================================\n');
    console.log('❌ CURRENT (WRONG) CALCULATION:');
    console.log(`   Total: ${totalYearsWrong} years (${totalMonthsWrong} months)`);
    console.log('   Problem: Sums ALL durations, counting overlaps multiple times\n');

    // Calculate CORRECT method - find earliest start and latest end, accounting for gaps
    const startDates = experiences.map(e => new Date(e.startDate)).sort((a, b) => a.getTime() - b.getTime());
    const earliestStart = startDates[0];
    const latestEnd = experiences.some(e => !e.endDate) ? now :
                      new Date(Math.max(...experiences.map(e => e.endDate ? new Date(e.endDate).getTime() : 0)));

    const totalMonthsCorrect = (latestEnd.getFullYear() - earliestStart.getFullYear()) * 12 +
                               (latestEnd.getMonth() - earliestStart.getMonth());
    const totalYearsCorrect = Math.round(totalMonthsCorrect / 12 * 10) / 10;

    console.log('✅ CORRECTED CALCULATION (earliest to latest):');
    console.log(`   Earliest start: ${earliestStart.toISOString().split('T')[0]}`);
    console.log(`   Latest end: ${latestEnd.toISOString().split('T')[0]}`);
    console.log(`   Total: ${totalYearsCorrect} years (${totalMonthsCorrect} months)`);
    console.log('   Note: This assumes continuous work (no gaps counted)\n');

    // Graduation year check
    const graduationYear = 2008;
    const yearsSinceGrad = now.getFullYear() - graduationYear;
    console.log('📚 GRADUATION CHECK:');
    console.log(`   Graduated: ${graduationYear}`);
    console.log(`   Years since: ${yearsSinceGrad}`);
    console.log(`   Current total (${totalYearsCorrect} years) is ${totalYearsCorrect <= yearsSinceGrad ? '✅ reasonable' : '⚠️ suspicious'}\n`);

    console.log('======================================================================\n');
    console.log('💡 RECOMMENDATION:');
    console.log('   Fix calculateYearsOfExperience() to use date range (earliest → latest)');
    console.log('   instead of summing all durations to avoid double-counting overlaps.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
