import { prisma } from '@/lib/prisma';
import { MCPSession } from '../types';
import { generateEmbedding } from '@/lib/openai-utils';
import { Prisma } from '@prisma/client';

interface SearchInput {
  userId: string;
  query: string;
  limit?: number;
  entityTypes?: string[];
  semanticWeight?: number;
  sessionId?: string;
}

/**
 * Semantic search using pgvector similarity
 */
export async function handleSemanticSearch(
  input: {
    userId: string;
    query: string;
    limit?: number;
    entityTypes?: string[];
    sessionId?: string;
  },
  _session: MCPSession
) {
  const { userId, query, limit = 10, entityTypes } = input;
  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // 2. Build filter conditions
  const where: Prisma.KnowledgeEmbeddingWhereInput = {
    userId: userId,
  };

  if (entityTypes && entityTypes.length > 0) {
    where.contentType = { in: entityTypes };
  }

  // 3. Execute vector similarity search
  // Note: Raw SQL needed for pgvector operators (<->, <#>, <=>)
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      contentType: string;
      contentId: string | null;
      textContent: string;
      metadata: unknown;
      distance: number;
    }>
  >`
    SELECT
      id,
      "userId",
      "contentType",
      "contentId",
      "textContent",
      metadata,
      embedding <-> ${`[${queryEmbedding.join(',')}]`}::vector AS distance
    FROM "knowledge_embeddings"
    WHERE "userId" = ${userId}
      ${entityTypes && entityTypes.length > 0 ? Prisma.sql`AND "contentType" = ANY(${entityTypes})` : Prisma.empty}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  // 4. Enrich results with related entities
  const enrichedResults = await Promise.all(
    results.map(async (result) => {
      let entity = null;

      // Fetch related entity based on type
      if (result.contentId) {
        switch (result.contentType) {
          case 'experience':
            entity = await prisma.experience.findUnique({
              where: { id: result.contentId },
            });
            break;
          case 'education':
            entity = await prisma.education.findUnique({
              where: { id: result.contentId },
            });
            break;
          case 'skill':
            entity = await prisma.userSkill.findUnique({
              where: { id: result.contentId },
            });
            break;
        }
      }

      return {
        ...result,
        entity,
        relevanceScore: 1 - result.distance, // Convert distance to similarity
      };
    })
  );

  return {
    success: true,
    results: enrichedResults,
    searchType: 'semantic',
    query: query,
  };
}

/**
 * Full-text search using pg_trgm
 */
export async function handleFullTextSearch(
  input: {
    userId: string;
    query: string;
    limit?: number;
    entityTypes?: string[];
    sessionId?: string;
  },
  _session: MCPSession
) {
  const { userId, query, limit = 10, entityTypes } = input;

  // Use pg_trgm similarity operator for fuzzy text matching
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      contentType: string;
      contentId: string | null;
      textContent: string;
      metadata: unknown;
      similarity: number;
    }>
  >`
    SELECT
      id,
      "userId",
      "contentType",
      "contentId",
      "textContent",
      metadata,
      similarity("textContent", ${query}) AS similarity
    FROM "knowledge_embeddings"
    WHERE "userId" = ${userId}
      AND similarity("textContent", ${query}) > 0.1
      ${entityTypes && entityTypes.length > 0 ? Prisma.sql`AND "contentType" = ANY(${entityTypes})` : Prisma.empty}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;

  // Enrich results with related entities
  const enrichedResults = await Promise.all(
    results.map(async (result) => {
      let entity = null;

      if (result.contentId) {
        switch (result.contentType) {
          case 'experience':
            entity = await prisma.experience.findUnique({
              where: { id: result.contentId },
            });
            break;
          case 'education':
            entity = await prisma.education.findUnique({
              where: { id: result.contentId },
            });
            break;
          case 'skill':
            entity = await prisma.userSkill.findUnique({
              where: { id: result.contentId },
            });
            break;
        }
      }

      return {
        ...result,
        entity,
        relevanceScore: result.similarity,
      };
    })
  );

  return {
    success: true,
    results: enrichedResults,
    searchType: 'fulltext',
    query,
  };
}

/**
 * Hybrid search combining semantic + full-text
 */
export async function handleHybridSearch(
  input: unknown,
  _session: MCPSession
) {
  const { userId, query, limit = 10, semanticWeight = 0.7 } = input as SearchInput;

  const fulltextWeight = 1 - semanticWeight;

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // 2. Execute hybrid search with weighted scoring
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      contentType: string;
      contentId: string | null;
      textContent: string;
      metadata: unknown;
      semanticScore: number;
      fulltextScore: number;
      hybridScore: number;
    }>
  >`
    SELECT
      id,
      "userId",
      "contentType",
      "contentId",
      "textContent",
      metadata,
      (1 - (embedding <-> ${`[${queryEmbedding.join(',')}]`}::vector)) AS "semanticScore",
      similarity("textContent", ${query}) AS "fulltextScore",
      (
        ${semanticWeight} * (1 - (embedding <-> ${`[${queryEmbedding.join(',')}]`}::vector)) +
        ${fulltextWeight} * similarity("textContent", ${query})
      ) AS "hybridScore"
    FROM "knowledge_embeddings"
    WHERE "userId" = ${userId}
    ORDER BY "hybridScore" DESC
    LIMIT ${limit}
  `;

  return {
    success: true,
    results,
    searchType: 'hybrid',
    query,
    weights: {
      semantic: semanticWeight,
      fulltext: fulltextWeight,
    },
  };
}
