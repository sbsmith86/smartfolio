#!/usr/bin/env tsx
/**
 * Test script for MCP server functionality
 *
 * Usage:
 *   npx tsx scripts/test-mcp-search.ts
 *
 * This script will:
 * 1. Check if embeddings exist in the database
 * 2. Test semantic search
 * 3. Test full-text search
 * 4. Test hybrid search
 */

import { prisma } from '../src/lib/prisma';
import { handleSemanticSearch, handleFullTextSearch, handleHybridSearch } from '../src/lib/mcp/handlers/queries';

async function main() {
  console.log('🔍 MCP Search Functionality Test\n');
  console.log('=' .repeat(60));

  // 1. Find a user with embeddings
  console.log('\n📊 Step 1: Checking for users with embeddings...');

  const usersWithEmbeddings = await prisma.$queryRaw<Array<{
    userId: string;
    email: string;
    embeddingCount: number;
  }>>`
    SELECT
      u.id as "userId",
      u.email,
      COUNT(ke.id)::int as "embeddingCount"
    FROM users u
    LEFT JOIN knowledge_embeddings ke ON ke."userId" = u.id
    GROUP BY u.id, u.email
    HAVING COUNT(ke.id) > 0
    ORDER BY COUNT(ke.id) DESC
    LIMIT 5
  `;

  if (usersWithEmbeddings.length === 0) {
    console.log('❌ No users with embeddings found.');
    console.log('\n💡 To test:');
    console.log('   1. Upload a resume at http://localhost:3000/dashboard/documents');
    console.log('   2. Call POST /api/documents/parse with the document ID');
    console.log('   3. Run this script again\n');
    process.exit(0);
  }

  console.log(`✅ Found ${usersWithEmbeddings.length} users with embeddings:`);
  usersWithEmbeddings.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.email} - ${user.embeddingCount} embeddings`);
  });

  const testUser = usersWithEmbeddings[0];
  console.log(`\n🎯 Testing with user: ${testUser.email}`);

  // 2. Show sample embeddings
  console.log('\n📊 Step 2: Sample embeddings in database...');

  const sampleEmbeddings = await prisma.$queryRaw<Array<{
    id: string;
    contentType: string;
    textContent: string;
    embeddingDim: number;
  }>>`
    SELECT
      id,
      "contentType",
      LEFT("textContent", 100) as "textContent",
      array_length(embedding::float[], 1) as "embeddingDim"
    FROM knowledge_embeddings
    WHERE "userId" = ${testUser.userId}
    LIMIT 5
  `;

  console.log(`✅ Found ${sampleEmbeddings.length} sample embeddings:`);
  sampleEmbeddings.forEach((emb, i) => {
    console.log(`   ${i + 1}. [${emb.contentType}] ${emb.textContent}...`);
    console.log(`      Embedding dimension: ${emb.embeddingDim}`);
  });

  // Verify dimension
  if (sampleEmbeddings[0]?.embeddingDim === 1536) {
    console.log('\n✅ Embeddings have correct dimension (1536)');
  } else {
    console.log(`\n⚠️  Warning: Unexpected embedding dimension: ${sampleEmbeddings[0]?.embeddingDim}`);
  }

  // 3. Test semantic search
  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Step 3: Testing Semantic Search...');
  const semanticQuery = 'software engineering experience';
  console.log(`Query: "${semanticQuery}"\n`);

  try {
    const semanticResult = await handleSemanticSearch(
      {
        userId: testUser.userId,
        query: semanticQuery,
        limit: 3,
      },
      {
        id: 'test-session',
        userId: testUser.userId,
        createdAt: new Date(),
        lastActivity: new Date(),
        context: new Map(),
      }
    );

    if (semanticResult.success && Array.isArray(semanticResult.results)) {
      console.log(`✅ Semantic search returned ${semanticResult.results.length} results:`);
      semanticResult.results.forEach((result: any, i: number) => {
        console.log(`\n   ${i + 1}. Relevance: ${(result.relevanceScore * 100).toFixed(1)}%`);
        console.log(`      Type: ${result.contentType}`);
        console.log(`      Text: ${result.textContent.substring(0, 100)}...`);
        if (result.entity) {
          console.log(`      Entity: ${JSON.stringify(result.entity, null, 2).substring(0, 150)}...`);
        }
      });
    } else {
      console.log('⚠️  Semantic search returned no results');
    }
  } catch (error) {
    console.error('❌ Semantic search failed:', error);
  }

  // 4. Test full-text search
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Step 4: Testing Full-Text Search...');
  const fulltextQuery = 'engineer';
  console.log(`Query: "${fulltextQuery}"\n`);

  try {
    const fulltextResult = await handleFullTextSearch(
      {
        userId: testUser.userId,
        query: fulltextQuery,
        limit: 3,
      },
      {
        id: 'test-session',
        userId: testUser.userId,
        createdAt: new Date(),
        lastActivity: new Date(),
        context: new Map(),
      }
    );

    if (fulltextResult.success && Array.isArray(fulltextResult.results)) {
      console.log(`✅ Full-text search returned ${fulltextResult.results.length} results:`);
      fulltextResult.results.forEach((result: any, i: number) => {
        console.log(`\n   ${i + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`      Type: ${result.contentType}`);
        console.log(`      Text: ${result.textContent.substring(0, 100)}...`);
      });
    } else {
      console.log('⚠️  Full-text search returned no results');
    }
  } catch (error) {
    console.error('❌ Full-text search failed:', error);
  }

  // 5. Test hybrid search
  console.log('\n' + '='.repeat(60));
  console.log('\n🔀 Step 5: Testing Hybrid Search...');
  const hybridQuery = 'Python programming';
  console.log(`Query: "${hybridQuery}"`);
  console.log(`Weights: 70% semantic, 30% full-text\n`);

  try {
    const hybridResult = await handleHybridSearch(
      {
        userId: testUser.userId,
        query: hybridQuery,
        limit: 3,
        semanticWeight: 0.7,
      },
      {
        id: 'test-session',
        userId: testUser.userId,
        createdAt: new Date(),
        lastActivity: new Date(),
        context: new Map(),
      }
    );

    if (hybridResult.success && Array.isArray(hybridResult.results)) {
      console.log(`✅ Hybrid search returned ${hybridResult.results.length} results:`);
      hybridResult.results.forEach((result: any, i: number) => {
        console.log(`\n   ${i + 1}. Hybrid Score: ${(result.hybridScore * 100).toFixed(1)}%`);
        console.log(`      Semantic: ${(result.semanticScore * 100).toFixed(1)}% | Full-text: ${(result.fulltextScore * 100).toFixed(1)}%`);
        console.log(`      Type: ${result.contentType}`);
        console.log(`      Text: ${result.textContent.substring(0, 100)}...`);
      });
    } else {
      console.log('⚠️  Hybrid search returned no results');
    }
  } catch (error) {
    console.error('❌ Hybrid search failed:', error);
  }

  // 6. Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Users with embeddings: ${usersWithEmbeddings.length}`);
  console.log(`   Total embeddings for test user: ${testUser.embeddingCount}`);
  console.log(`   Embedding dimension: ${sampleEmbeddings[0]?.embeddingDim || 'N/A'}`);
  console.log('\n✅ All tests complete!\n');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
