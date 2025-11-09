const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });
  return response.data[0].embedding;
}

async function main() {
  try {
    console.log('🧪 TESTING SEMANTIC SIMILARITY SCORES\n');
    console.log('======================================================================\n');

    // Test case 1: The actual IHG duplicates
    console.log('📝 Test Case 1: Actual IHG duplicates in database');
    const text1 = 'Technical Lead Consultant at IHG';
    const text2 = 'Technical Lead at IHG';

    console.log(`   Text 1: "${text1}"`);
    console.log(`   Text 2: "${text2}"\n`);

    const emb1 = await generateEmbedding(text1);
    const emb2 = await generateEmbedding(text2);

    // Calculate cosine similarity using SQL
    const result = await prisma.$queryRaw`
      SELECT 1 - (${JSON.stringify(emb1)}::vector <=> ${JSON.stringify(emb2)}::vector) as similarity
    `;

    const similarity = result[0].similarity;
    const percentage = (similarity * 100).toFixed(1);

    console.log(`   🎯 Cosine Similarity: ${percentage}%`);
    console.log(`   📊 Would be caught? ${similarity > 0.9 ? '✅ YES (>90%)' : `❌ NO (threshold is 90%)`}\n`);

    console.log('======================================================================\n');

    // Test case 2: Variations that should match
    console.log('📝 Test Case 2: Common variations');
    const tests = [
      ['Senior Software Engineer', 'Sr. Software Engineer'],
      ['Tech Lead', 'Technical Lead'],
      ['Software Developer', 'Software Engineer'],
      ['Product Manager', 'Technical Product Manager']
    ];

    for (const [t1, t2] of tests) {
      const e1 = await generateEmbedding(t1);
      const e2 = await generateEmbedding(t2);

      const res = await prisma.$queryRaw`
        SELECT 1 - (${JSON.stringify(e1)}::vector <=> ${JSON.stringify(e2)}::vector) as similarity
      `;

      const sim = res[0].similarity;
      const pct = (sim * 100).toFixed(1);
      const status = sim > 0.9 ? '✅' : sim > 0.85 ? '⚠️' : '❌';

      console.log(`   ${status} "${t1}" vs "${t2}": ${pct}%`);
    }

    console.log('\n======================================================================\n');
    console.log('💡 RECOMMENDATION:');
    console.log('   If similarity scores are 85-90%, consider lowering threshold to 0.85');
    console.log('   Current: 0.9 (90%) for experiences, 0.85 (85%) for education\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
