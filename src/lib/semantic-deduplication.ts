/**
 * Semantic deduplication using pgvector
 * Uses cosine similarity to detect duplicates even with slight text variations
 */

import { prisma } from './prisma';
import { generateEmbedding } from './openai-utils';

interface ExperienceCandidate {
  company: string;
  position: string;
  startDate: string;
  endDate?: string | null;
  description: string;
}

interface EducationCandidate {
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
}

/**
 * Check if an experience already exists using semantic similarity
 * Returns the existing experience ID if found, null otherwise
 *
 * Uses hybrid approach:
 * 1. Exact match on startDate (must match)
 * 2. Semantic similarity on "position at company" text (>0.9 cosine similarity)
 *
 * This catches duplicates like:
 * - "Technical Lead" vs "Tech Lead"
 * - "GoTo Foods" vs "Goto Foods"
 * - "Software Engineer" vs "Sr. Software Engineer"
 */
export async function findDuplicateExperience(
  userId: string,
  candidate: ExperienceCandidate
): Promise<string | null> {
  try {
    // Generate embedding for the candidate experience
    const candidateText = `${candidate.position} at ${candidate.company}`;
    const candidateEmbedding = await generateEmbedding(candidateText);

    // Use pgvector to find similar experiences with same start date
    // Cosine similarity > 0.9 means very similar (likely duplicate)
    const result = await prisma.$queryRaw<Array<{ id: string; similarity: number }>>`
      SELECT
        e.id,
        1 - (ke.embedding <=> ${`[${candidateEmbedding.join(',')}]`}::vector) as similarity
      FROM experiences e
      JOIN knowledge_embeddings ke
        ON ke."contentType" = 'experience'
        AND ke."contentId" = e.id
      WHERE e."userId" = ${userId}
        AND e."startDate" = ${candidate.startDate}
        AND 1 - (ke.embedding <=> ${`[${candidateEmbedding.join(',')}]`}::vector) > 0.9
      ORDER BY similarity DESC
      LIMIT 1
    `;

    if (result.length > 0) {
      console.log(`🔍 Found semantic duplicate: ${candidateText} (similarity: ${result[0].similarity.toFixed(3)})`);
      return result[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error in semantic duplicate detection:', error);
    // Fallback to no duplicate found on error
    return null;
  }
}

/**
 * Check if education already exists using semantic similarity
 * Returns the existing education ID if found, null otherwise
 *
 * Uses semantic similarity on "degree from institution" text (>0.85 cosine similarity)
 *
 * This catches duplicates like:
 * - "B.A, Computer Science from Smith College" vs "B.A from Smith College"
 * - "Bachelor of Arts" vs "B.A"
 * - "Smith College" vs "Smith"
 */
export async function findDuplicateEducation(
  userId: string,
  candidate: EducationCandidate
): Promise<string | null> {
  try {
    // Generate embedding for the candidate education
    const candidateText = `${candidate.degree} in ${candidate.fieldOfStudy || 'general studies'} from ${candidate.institution}`;
    const candidateEmbedding = await generateEmbedding(candidateText);

    // Use pgvector to find similar education records
    // Cosine similarity > 0.85 (slightly lower threshold for education since it's shorter text)
    const result = await prisma.$queryRaw<Array<{ id: string; similarity: number }>>`
      SELECT
        e.id,
        1 - (ke.embedding <=> ${`[${candidateEmbedding.join(',')}]`}::vector) as similarity
      FROM education e
      JOIN knowledge_embeddings ke
        ON ke."contentType" = 'education'
        AND ke."contentId" = e.id
      WHERE e."userId" = ${userId}
        AND 1 - (ke.embedding <=> ${`[${candidateEmbedding.join(',')}]`}::vector) > 0.85
      ORDER BY similarity DESC
      LIMIT 1
    `;

    if (result.length > 0) {
      console.log(`🔍 Found semantic duplicate: ${candidateText} (similarity: ${result[0].similarity.toFixed(3)})`);
      return result[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error in semantic duplicate detection:', error);
    return null;
  }
}

/**
 * Find all potential duplicates in the database using semantic similarity
 * This is for analysis/cleanup purposes
 */
export async function findAllDuplicates(userId: string) {
  const experiences = await prisma.experience.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  const duplicatePairs: Array<{
    id1: string;
    id2: string;
    text1: string;
    text2: string;
    similarity: number;
  }> = [];

  // Compare each experience with all others
  for (let i = 0; i < experiences.length; i++) {
    for (let j = i + 1; j < experiences.length; j++) {
      const exp1 = experiences[i];
      const exp2 = experiences[j];

      // Skip if different start dates
      if (exp1.startDate !== exp2.startDate) continue;

      const text1 = `${exp1.position} at ${exp1.company}`;
      const text2 = `${exp2.position} at ${exp2.company}`;

      // Get embeddings from database
      const embeddings = await prisma.$queryRaw<Array<{ contentId: string; embedding: unknown }>>`
        SELECT "contentId", embedding
        FROM knowledge_embeddings
        WHERE "contentType" = 'experience'
          AND "contentId" IN (${exp1.id}, ${exp2.id})
      `;

      if (embeddings.length === 2) {
        const emb1 = embeddings.find(e => e.contentId === exp1.id);
        const emb2 = embeddings.find(e => e.contentId === exp2.id);

        if (emb1 && emb2) {
          // Calculate cosine similarity
          const similarity = await prisma.$queryRaw<Array<{ similarity: number }>>`
            SELECT 1 - (${emb1.embedding}::vector <=> ${emb2.embedding}::vector) as similarity
          `;

          if (similarity[0].similarity > 0.9) {
            duplicatePairs.push({
              id1: exp1.id,
              id2: exp2.id,
              text1,
              text2,
              similarity: similarity[0].similarity,
            });
          }
        }
      }
    }
  }

  return duplicatePairs;
}
