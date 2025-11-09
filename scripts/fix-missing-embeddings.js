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
    console.log('🔧 FIXING MISSING EXPERIENCE EMBEDDINGS\n');
    console.log('======================================================================\n');

    const userId = 'cmhi6nmxk0000oaap9cge82q7';

    // Get all experiences
    const experiences = await prisma.experience.findMany({
      where: { userId },
      select: { id: true, position: true, company: true }
    });

    console.log(`Total experiences: ${experiences.length}\n`);

    let fixed = 0;
    let skipped = 0;

    for (const exp of experiences) {
      // Check if embedding exists and has vector data
      const existing = await prisma.knowledgeEmbedding.findFirst({
        where: {
          contentType: 'experience',
          contentId: exp.id
        }
      });

      const needsEmbedding = !existing || !existing.embedding;

      if (needsEmbedding) {
        console.log(`🔨 Generating: "${exp.position}" at ${exp.company}`);

        const text = `${exp.position} at ${exp.company}`;
        const embedding = await generateEmbedding(text);

        if (existing) {
          // Update existing record with null vector using raw SQL
          await prisma.$executeRaw`
            UPDATE knowledge_embeddings
            SET embedding = ${JSON.stringify(embedding)}::vector
            WHERE id = ${existing.id}
          `;
          console.log(`   ✅ Updated embedding (ID: ${existing.id})\n`);
        } else {
          // Create new embedding using raw SQL
          const embId = `cemb_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
          await prisma.$executeRaw`
            INSERT INTO knowledge_embeddings (id, "userId", "contentType", "contentId", "textContent", embedding, "createdAt")
            VALUES (
              ${embId},
              ${userId},
              'experience',
              ${exp.id},
              ${text},
              ${JSON.stringify(embedding)}::vector,
              NOW()
            )
          `;
          console.log(`   ✅ Created new embedding (ID: ${embId})\n`);
        }

        fixed++;

        // Rate limit: 3 requests per second
        await new Promise(resolve => setTimeout(resolve, 350));
      } else {
        skipped++;
      }
    }

    console.log('======================================================================\n');
    console.log(`✅ Complete!`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Skipped (already had embeddings): ${skipped}`);
    console.log(`   Total: ${experiences.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
