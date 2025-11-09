const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Copied fixed function
function calculateYearsOfExperience(experiences) {
  if (experiences.length === 0) return 0;

  const now = new Date();

  // Find earliest start date and latest end date (or present)
  const startDates = experiences.map(e => new Date(e.startDate));
  const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));

  // Latest end is either the most recent endDate, or now if any job is current
  const hasCurrentJob = experiences.some(e => !e.endDate);
  const latestEnd = hasCurrentJob ? now :
    new Date(Math.max(...experiences
      .filter(e => e.endDate)
      .map(e => new Date(e.endDate).getTime())
    ));

  // Calculate total months from earliest to latest
  const totalMonths = (latestEnd.getFullYear() - earliestStart.getFullYear()) * 12 +
                     (latestEnd.getMonth() - earliestStart.getMonth());

  return Math.round(totalMonths / 12 * 10) / 10;
}

async function main() {
  try {
    const userId = 'cmhi6nmxk0000oaap9cge82q7';

    const experiences = await prisma.experience.findMany({
      where: { userId },
      select: { startDate: true, endDate: true }
    });

    const years = calculateYearsOfExperience(experiences);

    console.log('✅ FIXED CALCULATION TEST\n');
    console.log(`Total experiences: ${experiences.length}`);
    console.log(`Years of experience: ${years} years`);
    console.log(`\nGraduated: 2008`);
    console.log(`Years since graduation: ${new Date().getFullYear() - 2008}`);
    console.log(`\n${years <= 17 ? '✅ Looks correct!' : '⚠️ Still seems high'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
