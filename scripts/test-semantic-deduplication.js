/**
 * Test semantic deduplication using pgvector
 * Shows how similar experiences/education are detected even with text variations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSemanticDeduplication() {
  try {
    const userId = 'cmhi6nmxk0000oaap9cge82q7';

    console.log('\n🧠 SEMANTIC DEDUPLICATION TEST');
    console.log('='.repeat(70));
    console.log('\nUsing pgvector cosine similarity to detect duplicates');
    console.log('even when text varies (e.g., "Tech Lead" vs "Technical Lead")');
    console.log('='.repeat(70));

    // Get all experiences with embeddings
    const experiences = await prisma.experience.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      take: 10,
    });

    console.log(`\n📊 Analyzing ${experiences.length} experiences...\n`);

    // For each experience, find potential duplicates using semantic similarity
    for (const exp of experiences) {
      const text = `${exp.position} at ${exp.company}`;

      // Get embedding for this experience
      const embedding = await prisma.$queryRaw`
        SELECT embedding::text as embedding_text
        FROM knowledge_embeddings
        WHERE "contentType" = 'experience'
          AND "contentId" = ${exp.id}
        LIMIT 1
      `;

      if (embedding.length === 0) continue;

      // Find similar experiences (same start date, high semantic similarity)
      const similar = await prisma.$queryRaw`
        SELECT
          e.id,
          e.company,
          e.position,
          e."startDate",
          1 - (ke.embedding <=> ${embedding[0].embedding_text}::vector) as similarity
        FROM experiences e
        JOIN knowledge_embeddings ke
          ON ke."contentType" = 'experience'
          AND ke."contentId" = e.id
        WHERE e."userId" = ${userId}
          AND e.id != ${exp.id}
          AND e."startDate" = ${exp.startDate}
          AND 1 - (ke.embedding <=> ${embedding[0].embedding_text}::vector) > 0.85
        ORDER BY similarity DESC
        LIMIT 3
      `;

      if (similar.length > 0) {
        console.log(`🔍 ${text} (${exp.startDate})`);
        console.log(`   ID: ${exp.id}`);
        console.log(`   Similar records found:`);

        similar.forEach((sim, idx) => {
          const simText = `${sim.position} at ${sim.company}`;
          const percentage = (sim.similarity * 100).toFixed(1);
          const emoji = sim.similarity > 0.95 ? '🚨' : sim.similarity > 0.90 ? '⚠️' : '💡';

          console.log(`   ${emoji} ${idx + 1}. ${simText}`);
          console.log(`      Similarity: ${percentage}% | ID: ${sim.id}`);
        });
        console.log();
      }
    }

    // Test with hypothetical new experiences
    console.log('\n' + '='.repeat(70));
    console.log('🧪 TESTING WITH HYPOTHETICAL NEW EXPERIENCES');
    console.log('='.repeat(70));

    const testCases = [
      {
        position: 'Tech Lead',
        company: 'IHG',
        startDate: '2024-01',
        note: 'Should match "Technical Lead at IHG"',
      },
      {
        position: 'Sr. Software Engineer',
        company: 'DoSomething',
        startDate: '2015-10',
        note: 'Should match "Senior Software Engineer at Do Something"',
      },
      {
        position: 'Software Dev',
        company: 'Teachers Pay Teachers',
        startDate: '2018-07',
        note: 'Should match "Software Engineer at Teachers Pay Teachers"',
      },
    ];

    for (const test of testCases) {
      const text = `${test.position} at ${test.company}`;

      // Generate embedding for test case
      const OpenAI = require('openai').default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      const testEmbedding = embeddingResponse.data[0].embedding;

      // Find similar experiences
      const matches = await prisma.$queryRaw`
        SELECT
          e.company,
          e.position,
          e."startDate",
          1 - (ke.embedding <=> ${`[${testEmbedding.join(',')}]`}::vector) as similarity
        FROM experiences e
        JOIN knowledge_embeddings ke
          ON ke."contentType" = 'experience'
          AND ke."contentId" = e.id
        WHERE e."userId" = ${userId}
          AND e."startDate" = ${test.startDate}
        ORDER BY similarity DESC
        LIMIT 1
      `;

      console.log(`\n📝 Testing: "${text}"`);
      console.log(`   Note: ${test.note}`);

      if (matches.length > 0) {
        const match = matches[0];
        const matchText = `${match.position} at ${match.company}`;
        const percentage = (match.similarity * 100).toFixed(1);
        const wouldSkip = match.similarity > 0.9;

        console.log(`   ✅ Match found: "${matchText}"`);
        console.log(`   📊 Similarity: ${percentage}%`);
        console.log(`   ${wouldSkip ? '🚫 Would SKIP (duplicate)' : '✓ Would CREATE (not similar enough)'}`);
      } else {
        console.log(`   ❌ No match found`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n💡 KEY INSIGHTS:');
    console.log('   • Similarity > 90%: Strong duplicate (auto-skip)');
    console.log('   • Similarity 85-90%: Potential duplicate (investigate)');
    console.log('   • Similarity < 85%: Different experience (create)');
    console.log('\n   🎯 Agentic Postgres Feature: pgvector cosine similarity');
    console.log('   🎯 Benefit: Catches duplicates even with text variations');
    console.log('   🎯 Example: "Tech Lead" matches "Technical Lead" at 95%+\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSemanticDeduplication();
