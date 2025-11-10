import { prisma } from '../src/lib/prisma';
import {
  handleSemanticSearch,
  handleFullTextSearch,
  handleHybridSearch,
} from '../src/lib/mcp/handlers/queries';

async function testSearch() {
  console.log('🔍 Testing Search Functionality\n');

  try {
    // Find a user with embeddings
    const embedding = await prisma.knowledgeEmbedding.findFirst({
      include: { user: true },
    });

    if (!embedding) {
      console.log('❌ No embeddings found in database. Upload a resume first!');
      return;
    }

    const userId = embedding.userId;
    const userName = `${embedding.user.firstName} ${embedding.user.lastName}` || embedding.user.email;
    console.log(`Testing with user: ${userName} (${userId})\n`);

    // Mock MCP session
    const mockSession = {
      id: userId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      context: new Map(),
    };

    // Test queries
    const testQueries = [
      'Python experience',
      'software engineer',
      'education',
      'skills',
    ];

    for (const query of testQueries) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Query: "${query}"`);
      console.log('='.repeat(60));

      // Test 1: Semantic Search
      console.log('\n1️⃣ SEMANTIC SEARCH (pgvector)');
      try {
        const semanticResult = await handleSemanticSearch(
          { userId, query, limit: 3 },
          mockSession
        );
        console.log(`Found ${semanticResult.results.length} results`);
        semanticResult.results.forEach((r, i) => {
          console.log(`  ${i + 1}. [${r.contentType}] Score: ${r.relevanceScore.toFixed(3)}`);
          console.log(`     ${r.textContent.substring(0, 80)}...`);
        });
      } catch (error) {
        console.error('   ❌ Error:', error instanceof Error ? error.message : error);
      }

      // Test 2: Full-Text Search
      console.log('\n2️⃣ FULL-TEXT SEARCH (pg_trgm)');
      try {
        const fulltextResult = await handleFullTextSearch(
          { userId, query, limit: 3 },
          mockSession
        );
        console.log(`Found ${fulltextResult.results.length} results`);
        fulltextResult.results.forEach((r, i) => {
          console.log(`  ${i + 1}. [${r.contentType}] Score: ${r.relevanceScore.toFixed(3)}`);
          console.log(`     ${r.textContent.substring(0, 80)}...`);
        });
      } catch (error) {
        console.error('   ❌ Error:', error instanceof Error ? error.message : error);
      }

      // Test 3: Hybrid Search
      console.log('\n3️⃣ HYBRID SEARCH (combined)');
      try {
        const hybridResult = await handleHybridSearch(
          { userId, query, limit: 3, semanticWeight: 0.7 },
          mockSession
        );
        console.log(`Found ${hybridResult.results.length} results`);
        hybridResult.results.forEach((r, i) => {
          console.log(
            `  ${i + 1}. [${r.contentType}] Hybrid: ${r.hybridScore.toFixed(3)} ` +
            `(Semantic: ${r.semanticScore.toFixed(3)}, Fulltext: ${r.fulltextScore.toFixed(3)})`
          );
          console.log(`     ${r.textContent.substring(0, 80)}...`);
        });
      } catch (error) {
        console.error('   ❌ Error:', error instanceof Error ? error.message : error);
      }
    }

    console.log('\n\n✅ Search testing complete!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testSearch();
