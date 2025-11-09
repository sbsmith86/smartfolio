const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 CHECKING IHG EXPERIENCE EMBEDDING\n');

    // Get IHG experience
    const exp = await prisma.experience.findFirst({
      where: {
        userId: 'cmhi6nmxk0000oaap9cge82q7',
        company: { contains: 'IHG' }
      }
    });

    if (!exp) {
      console.log('❌ No IHG experience found');
      return;
    }

    console.log('📊 IHG Experience:');
    console.log(`   Position: "${exp.position}"`);
    console.log(`   Company: ${exp.company}`);
    console.log(`   ID: ${exp.id}\n`);

    // Check for embedding
    const embeddings = await prisma.knowledgeEmbedding.findMany({
      where: {
        contentType: 'experience',
        contentId: exp.id
      }
    });

    console.log(`📍 Embeddings found: ${embeddings.length}\n`);

    if (embeddings.length === 0) {
      console.log('⚠️  NO EMBEDDING EXISTS!');
      console.log('   This explains why semantic deduplication failed.');
      console.log('   Need to generate embedding for this experience.\n');
    } else {
      embeddings.forEach((emb, idx) => {
        console.log(`   Embedding ${idx + 1}:`);
        console.log(`   - ID: ${emb.id}`);
        console.log(`   - Created: ${emb.createdAt}`);
        console.log(`   - Has vector: ${emb.embedding ? 'Yes' : 'No'}\n`);
      });
    }

    // Check all experiences without embeddings
    console.log('======================================================================\n');
    console.log('🔍 Checking ALL experiences for missing embeddings...\n');

    const allExps = await prisma.experience.findMany({
      where: { userId: 'cmhi6nmxk0000oaap9cge82q7' },
      select: { id: true, position: true, company: true }
    });

    console.log(`Total experiences: ${allExps.length}\n`);

    let missingCount = 0;
    for (const e of allExps) {
      const hasEmbedding = await prisma.knowledgeEmbedding.count({
        where: {
          contentType: 'experience',
          contentId: e.id
        }
      });

      if (hasEmbedding === 0) {
        missingCount++;
        console.log(`❌ Missing: "${e.position}" at ${e.company} (ID: ${e.id})`);
      }
    }

    if (missingCount === 0) {
      console.log('✅ All experiences have embeddings!');
    } else {
      console.log(`\n⚠️  Total missing: ${missingCount}/${allExps.length} experiences`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
