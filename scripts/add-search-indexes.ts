import { prisma } from '../src/lib/prisma';

async function addSearchIndexes() {
  console.log('Adding search performance indexes...');

  try {
    // Add pgvector IVFFlat index
    console.log('Creating pgvector IVFFlat index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector
      ON "knowledge_embeddings"
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✅ pgvector index created');

    // Add pg_trgm GIN index
    console.log('Creating pg_trgm GIN index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_content_trgm
      ON "knowledge_embeddings"
      USING gin ("textContent" gin_trgm_ops);
    `);
    console.log('✅ pg_trgm index created');

    // Add composite index
    console.log('Creating composite index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_user_type
      ON "knowledge_embeddings" ("userId", "contentType");
    `);
    console.log('✅ Composite index created');

    // Analyze table
    console.log('Analyzing table...');
    await prisma.$executeRawUnsafe(`ANALYZE "knowledge_embeddings";`);
    console.log('✅ Table analyzed');

    console.log('\n🎉 All indexes created successfully!');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addSearchIndexes();
