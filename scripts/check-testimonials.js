const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const userId = 'cmhi6nmxk0000oaap9cge82q7';

    console.log('📊 CHECKING TESTIMONIALS/RECOMMENDATIONS\n');
    console.log('======================================================================\n');

    // Check current testimonials
    const testimonials = await prisma.testimonial.findMany({
      where: { userId },
      select: {
        id: true,
        recommenderName: true,
        recommenderTitle: true,
        recommenderCompany: true,
        relationship: true,
        content: true,
        verified: true,
        public: true,
        createdAt: true
      }
    });

    console.log(`Current testimonials: ${testimonials.length}\n`);

    if (testimonials.length > 0) {
      testimonials.forEach((t, idx) => {
        console.log(`${idx + 1}. ${t.recommenderName}`);
        console.log(`   Title: ${t.recommenderTitle || 'N/A'}`);
        console.log(`   Company: ${t.recommenderCompany || 'N/A'}`);
        console.log(`   Relationship: ${t.relationship || 'N/A'}`);
        console.log(`   Content preview: ${t.content.substring(0, 100)}...`);
        console.log(`   Verified: ${t.verified ? '✅' : '❌'}`);
        console.log(`   Public: ${t.public ? '✅' : '❌'}\n`);
      });
    } else {
      console.log('⚠️  No testimonials found\n');
    }

    console.log('======================================================================\n');
    console.log('📋 SCHEMA STRUCTURE:\n');
    console.log('Testimonial model supports:');
    console.log('- recommenderName (required)');
    console.log('- recommenderTitle (optional)');
    console.log('- recommenderCompany (optional)');
    console.log('- recommenderEmail (optional)');
    console.log('- relationship (optional) - e.g., "Colleague", "Manager", "Client"');
    console.log('- content (required) - the recommendation text');
    console.log('- verified (boolean) - if the recommender confirmed it');
    console.log('- public (boolean) - if it should show on profile\n');

    console.log('======================================================================\n');
    console.log('💡 HOW TO IMPORT LINKEDIN RECOMMENDATIONS:\n');
    console.log('Option 1: Extend LinkedIn import API');
    console.log('  - GPT-4o parses recommendations section from LinkedIn text');
    console.log('  - Extracts: name, title, company, relationship, text');
    console.log('  - Creates Testimonial records');
    console.log('  - Generates embeddings for recommendation content\n');

    console.log('Option 2: Manual entry UI');
    console.log('  - Dashboard page to add testimonials one by one');
    console.log('  - Form: name, title, company, relationship, content');
    console.log('  - Mark as verified if you have email confirmation\n');

    console.log('Option 3: LinkedIn profile export');
    console.log('  - LinkedIn provides PDF/CSV export with recommendations');
    console.log('  - Parse exported file for recommendations section');
    console.log('  - Bulk import via API\n');

    console.log('======================================================================\n');
    console.log('🚀 RECOMMENDED APPROACH FOR COMPETITION:\n');
    console.log('Extend /api/linkedin/import to parse recommendations:');
    console.log('1. Add "recommendations" section to GPT-4o parsing prompt');
    console.log('2. Extract array of: { name, title, company, relationship, text }');
    console.log('3. Create Testimonial records');
    console.log('4. Generate embeddings for each recommendation');
    console.log('5. Display on profile page (already has testimonials section)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
