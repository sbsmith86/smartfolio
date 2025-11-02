#!/usr/bin/env tsx
/**
 * Trigger parsing for existing documents to create embeddings
 */

import { prisma } from '../src/lib/prisma';
import { handleParseResume } from '../src/lib/mcp/handlers/ingestion';

async function main() {
  console.log('🔄 Re-parsing existing documents to create embeddings\n');

  const documents = await prisma.userDocument.findMany({
    where: {
      extractedText: { not: null },
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  if (documents.length === 0) {
    console.log('❌ No documents with extracted text found.');
    return;
  }

  console.log(`Found ${documents.length} documents to parse:\n`);

  for (const doc of documents) {
    console.log(`📄 Processing: ${doc.fileName} (${doc.user.email})`);
    console.log(`   Document ID: ${doc.id}`);
    console.log(`   Text length: ${doc.extractedText?.length} chars`);

    try {
      const result = await handleParseResume(
        {
          userId: doc.userId,
          documentId: doc.id,
        },
        {
          id: `reparse-${doc.id}`,
          userId: doc.userId,
          createdAt: new Date(),
          lastActivity: new Date(),
          context: new Map(),
        }
      );

      if (result.success) {
        console.log(`   ✅ Parsed successfully!`);
        console.log(`      Experiences: ${result.summary.experiencesCreated}`);
        console.log(`      Education: ${result.summary.educationCreated}`);
        console.log(`      Skills: ${result.summary.skillsCreated}`);
        console.log(`      Embeddings: ${result.summary.embeddingsCreated}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed:`, error instanceof Error ? error.message : error);
    }

    console.log('');
  }

  // Check final embedding count
  const finalCount = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int as count FROM knowledge_embeddings
  `;

  console.log(`\n✅ Done! Total embeddings now: ${finalCount[0].count}`);
  console.log('\nYou can now test search:');
  console.log('  npx tsx scripts/test-mcp-search.ts\n');

  await prisma.$disconnect();
}

main().catch(console.error);
