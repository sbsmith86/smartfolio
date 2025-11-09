/**
 * Debug Chat Search Quality
 *
 * Investigates why "what php experience does the candidate have"
 * returns shallow results (only 1 job mentioned).
 *
 * Checks:
 * 1. Total embeddings for user
 * 2. Embeddings that mention "PHP" in textContent
 * 3. Simulates semantic + fulltext search for PHP question
 * 4. Shows hybrid scoring and top 8 results
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userId = 'cmhi6nmxk0000oaap9cge82q7';
const question = 'what php experience does the candidate have';

async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

async function main() {
  console.log('🔍 Debugging Chat Search Quality\n');
  console.log('Question:', question);
  console.log('User ID:', userId);
  console.log('─'.repeat(80));

  // 1. Check total embeddings
  const totalEmbeddings = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM knowledge_embeddings
    WHERE "userId" = ${userId}
  `;
  console.log('\n📊 Total Embeddings:', totalEmbeddings[0].count);

  // 2. Check PHP mentions in textContent
  const phpEmbeddings = await prisma.$queryRaw`
    SELECT id, "contentType", "contentId", "textContent"
    FROM knowledge_embeddings
    WHERE "userId" = ${userId}
      AND ("textContent" ILIKE '%php%' OR "textContent" ILIKE '%PHP%')
  `;
  console.log('\n🔤 Embeddings mentioning PHP:', phpEmbeddings.length);
  if (phpEmbeddings.length > 0) {
    phpEmbeddings.forEach((emb, idx) => {
      console.log(`\n  ${idx + 1}. Type: ${emb.contentType}, ID: ${emb.contentId}`);
      console.log(`     Text: ${emb.textContent.substring(0, 150)}...`);
    });
  }

  // 3. Generate embedding for question
  console.log('\n⚙️  Generating embedding for question...');
  const embedding = await generateEmbedding(question);
  const embeddingString = `[${embedding.join(',')}]`;

  // 4. Run semantic search (pgvector)
  console.log('\n🧠 Running Semantic Search (pgvector, cosine distance)...');
  const semanticResults = await prisma.$queryRaw`
    SELECT
      id,
      "contentType",
      "textContent",
      "contentId",
      1 - (embedding <=> ${embeddingString}::vector) as similarity
    FROM knowledge_embeddings
    WHERE "userId" = ${userId}
    ORDER BY embedding <=> ${embeddingString}::vector
    LIMIT 10
  `;
  console.log(`   Found ${semanticResults.length} results`);
  semanticResults.forEach((result, idx) => {
    console.log(`\n   ${idx + 1}. Similarity: ${result.similarity.toFixed(4)} | Type: ${result.contentType}`);
    console.log(`      Text: ${result.textContent.substring(0, 100)}...`);
  });

  // 5. Run fulltext search (pg_trgm)
  console.log('\n\n📝 Running Full-text Search (pg_trgm, trigram similarity)...');
  const fulltextResults = await prisma.$queryRaw`
    SELECT
      id,
      "contentType",
      "textContent",
      "contentId",
      similarity("textContent", ${question}) as similarity
    FROM knowledge_embeddings
    WHERE "userId" = ${userId}
      AND similarity("textContent", ${question}) > 0.1
    ORDER BY similarity("textContent", ${question}) DESC
    LIMIT 10
  `;
  console.log(`   Found ${fulltextResults.length} results (threshold > 0.1)`);
  fulltextResults.forEach((result, idx) => {
    console.log(`\n   ${idx + 1}. Similarity: ${result.similarity.toFixed(4)} | Type: ${result.contentType}`);
    console.log(`      Text: ${result.textContent.substring(0, 100)}...`);
  });

  // 6. Combine with hybrid scoring
  console.log('\n\n⚖️  Hybrid Scoring (0.7 semantic + 0.3 fulltext)...');
  const combinedMap = new Map();

  // Add semantic results
  semanticResults.forEach((result) => {
    const semanticScore = result.similarity;
    combinedMap.set(result.id, {
      ...result,
      semanticScore,
      fulltextScore: 0,
      similarity: semanticScore * 0.7,
    });
  });

  // Add fulltext results
  fulltextResults.forEach((result) => {
    const fulltextScore = result.similarity;
    if (combinedMap.has(result.id)) {
      const existing = combinedMap.get(result.id);
      existing.fulltextScore = fulltextScore;
      existing.similarity = existing.semanticScore * 0.7 + fulltextScore * 0.3;
    } else {
      combinedMap.set(result.id, {
        ...result,
        semanticScore: 0,
        fulltextScore,
        similarity: fulltextScore * 0.3,
      });
    }
  });

  // Sort and take top 15
  const sortedItems = Array.from(combinedMap.values())
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, 15);

  console.log(`   Combined ${combinedMap.size} unique items, top 8 selected:\n`);
  sortedItems.forEach((item, idx) => {
    console.log(`   ${idx + 1}. Hybrid Score: ${item.similarity.toFixed(4)}`);
    console.log(`      Semantic: ${item.semanticScore.toFixed(4)} (×0.7)`);
    console.log(`      Fulltext: ${item.fulltextScore.toFixed(4)} (×0.3)`);
    console.log(`      Type: ${item.contentType}`);
    console.log(`      Text: ${item.textContent.substring(0, 100)}...`);
    console.log('');
  });

  // 7. Fetch actual database records for context
  console.log('\n📋 Fetching Full Records for Context...\n');
  const experienceIds = sortedItems
    .filter(item => item.contentType === 'experience')
    .map(item => item.contentId);

  if (experienceIds.length > 0) {
    const experiences = await prisma.experience.findMany({
      where: { id: { in: experienceIds } }
    });

    console.log(`   ${experiences.length} Experiences in final context:\n`);
    experiences.forEach((exp, idx) => {
      console.log(`   ${idx + 1}. ${exp.position} at ${exp.company}`);
      console.log(`      ${exp.startDate} - ${exp.endDate || 'Present'}`);
      console.log(`      Description: ${exp.description?.substring(0, 150)}...`);
      console.log('');
    });
  }

  // 8. Summary
  console.log('\n' + '─'.repeat(80));
  console.log('\n📊 SUMMARY:\n');
  console.log(`Total embeddings: ${totalEmbeddings[0].count}`);
  console.log(`Embeddings mentioning PHP: ${phpEmbeddings.length}`);
  console.log(`Semantic results: ${semanticResults.length}`);
  console.log(`Fulltext results: ${fulltextResults.length}`);
  console.log(`Combined unique items: ${combinedMap.size}`);
  console.log(`Final top 8 for GPT-4o: ${sortedItems.length}`);
  console.log(`\nExperiences in final context: ${experienceIds.length}`);

  console.log('\n💡 INSIGHTS:\n');
  if (phpEmbeddings.length === 0) {
    console.log('⚠️  No embeddings explicitly mention "PHP" in textContent');
    console.log('   → Embeddings may use generic descriptions without listing technologies');
    console.log('   → Semantic search relies on conceptual similarity, not keyword matching');
  } else if (phpEmbeddings.length > experienceIds.length) {
    console.log('⚠️  More PHP embeddings exist than made it to final top 8');
    console.log('   → Hybrid scoring may be filtering out relevant items');
    console.log('   → Consider: Increase limit from 8 to 12-15');
    console.log('   → Consider: Lower fulltext threshold from 0.1 to 0.05');
  } else if (experienceIds.length > 1) {
    console.log('✅ Multiple PHP experiences made it to context');
    console.log('   → Issue may be GPT-4o selecting only most prominent/recent');
    console.log('   → Consider: Adjust system prompt to list all relevant items');
  } else {
    console.log('⚠️  Only 1 experience made it to final context');
    console.log('   → Issue is in retrieval, not synthesis');
    console.log('   → Hybrid search parameters need tuning');
  }

  console.log('\n' + '─'.repeat(80));
}

main()
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
