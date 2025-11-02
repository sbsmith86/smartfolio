#!/usr/bin/env tsx
/**
 * Quick script to check embeddings in the database
 *
 * Usage: npx tsx scripts/check-embeddings.ts
 */

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔍 Checking Embeddings in Database\n');

  // Count total embeddings
  const totalCount = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int as count FROM knowledge_embeddings
  `;
  console.log(`Total embeddings: ${totalCount[0].count}`);

  if (totalCount[0].count === 0) {
    console.log('\n❌ No embeddings found in database.');
    console.log('\n💡 To create embeddings:');
    console.log('   1. Upload a resume at http://localhost:3000/dashboard/documents');
    console.log('   2. Call: curl -X POST http://localhost:3000/api/documents/parse \\');
    console.log('            -H "Content-Type: application/json" \\');
    console.log('            -d \'{"documentId": "YOUR_DOC_ID"}\'\n');
    await prisma.$disconnect();
    return;
  }

  // Show embeddings by content type
  console.log('\nEmbeddings by type:');
  const byType = await prisma.$queryRaw<Array<{ contentType: string; count: number }>>`
    SELECT "contentType", COUNT(*)::int as count
    FROM knowledge_embeddings
    GROUP BY "contentType"
    ORDER BY count DESC
  `;
  byType.forEach(row => {
    console.log(`  ${row.contentType}: ${row.count}`);
  });

  // Show embeddings by user
  console.log('\nEmbeddings by user:');
  const byUser = await prisma.$queryRaw<Array<{
    userId: string;
    email: string;
    count: number
  }>>`
    SELECT
      u.id as "userId",
      u.email,
      COUNT(ke.id)::int as count
    FROM users u
    LEFT JOIN knowledge_embeddings ke ON ke."userId" = u.id
    GROUP BY u.id, u.email
    HAVING COUNT(ke.id) > 0
    ORDER BY count DESC
  `;
  byUser.forEach(row => {
    console.log(`  ${row.email}: ${row.count} embeddings`);
  });

  // Sample embeddings with dimension check
  console.log('\nSample embeddings (first 5):');
  const samples = await prisma.$queryRaw<Array<{
    id: string;
    contentType: string;
    textContent: string;
    dimension: number;
  }>>`
    SELECT
      id,
      "contentType",
      LEFT("textContent", 80) as "textContent",
      array_length(embedding::float[], 1) as dimension
    FROM knowledge_embeddings
    LIMIT 5
  `;

  samples.forEach((row, i) => {
    console.log(`\n  ${i + 1}. [${row.contentType}] (${row.dimension}D)`);
    console.log(`     ${row.textContent}...`);
  });

  // Verify all embeddings have correct dimension
  const invalidDimensions = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int as count
    FROM knowledge_embeddings
    WHERE array_length(embedding::float[], 1) != 1536
  `;

  if (invalidDimensions[0].count > 0) {
    console.log(`\n⚠️  Warning: ${invalidDimensions[0].count} embeddings have incorrect dimension!`);
  } else {
    console.log('\n✅ All embeddings have correct dimension (1536)');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
