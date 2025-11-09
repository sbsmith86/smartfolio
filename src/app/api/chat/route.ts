import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/openai-utils';
import { buildContext, extractCitations } from '@/lib/chat-utils';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatRequest {
  userId: string;
  question: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface RetrievedItem {
  id: string;
  type: 'experience' | 'education' | 'skill' | 'testimonial';
  content: string;
  title: string;
  similarity?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { userId, question, conversationHistory = [] } = body;

    if (!userId || !question) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and question' },
        { status: 400 }
      );
    }

    // Step 1: Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);
    const embeddingString = `[${questionEmbedding.join(',')}]`;

    // Step 2: Hybrid search - Semantic (pgvector) + Full-text (pg_trgm)
    // This showcases the core Agentic Postgres capabilities
    const retrievedItems = await hybridSearch(userId, question, embeddingString);

    if (retrievedItems.length === 0) {
      return NextResponse.json({
        answer: "I don't have enough information about this candidate to answer that question. Please ask about their professional experience, education, skills, or testimonials.",
        citations: [],
      });
    }

    // Step 3: Build context from retrieved items
    const context = buildContext(retrievedItems);

    // Step 4: Call GPT-4o with grounded context
    const systemPrompt = `You are an AI assistant answering questions about a candidate's professional profile.

CRITICAL RULES:
1. ONLY use information from the provided context below
2. DO NOT make assumptions or add information not in the context
3. If the context doesn't contain relevant information, say so
4. When referencing specific experiences, projects, or skills, mention them by name
5. Be concise but thorough
6. Cite specific experiences, education, or testimonials when answering

CONTEXT:
${context}

Answer the question based ONLY on the above context. If you reference specific items, use their exact titles/names so they can be cited.`;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-4), // Last 2 exchanges for context
      { role: 'user', content: question },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.3, // Lower temperature for more grounded responses
      max_tokens: 500,
    });

    const answer = completion.choices[0]?.message?.content || 'Unable to generate response';

    // Step 5: Extract citations from the answer and retrieved items
    const citations = extractCitations(answer, retrievedItems);

    return NextResponse.json({
      answer,
      citations,
      retrievedCount: retrievedItems.length,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Hybrid search combining pgvector semantic search and pg_trgm full-text search
 * This is the core Agentic Postgres feature showcase
 */
async function hybridSearch(
  userId: string,
  question: string,
  embeddingString: string
): Promise<RetrievedItem[]> {
  const results: RetrievedItem[] = [];

  // SEMANTIC SEARCH: Use pgvector cosine distance for meaning-based retrieval
  // Weight: 0.7 (prioritize semantic understanding)
  const semanticResults = await prisma.$queryRaw<Array<{
    id: string;
    content_type: string;
    text_content: string;
    content_id: string | null;
    similarity: number;
  }>>`
    SELECT
      id,
      "contentType" as content_type,
      "textContent" as text_content,
      "contentId" as content_id,
      1 - (embedding <=> ${embeddingString}::vector) as similarity
    FROM knowledge_embeddings
    WHERE "userId" = ${userId}
    ORDER BY embedding <=> ${embeddingString}::vector
    LIMIT 10
  `;  // FULL-TEXT SEARCH: Use pg_trgm for exact term matching (e.g., "Python", "AWS")
  // Weight: 0.3 (useful for technical terms and acronyms)
  const fulltextResults = await prisma.$queryRaw<Array<{
    id: string;
    content_type: string;
    text_content: string;
    content_id: string | null;
    similarity: number;
  }>>`
    SELECT
      id,
      "contentType" as content_type,
      "textContent" as text_content,
      "contentId" as content_id,
      similarity("textContent", ${question}) as similarity
    FROM knowledge_embeddings
    WHERE "userId" = ${userId}
      AND similarity("textContent", ${question}) > 0.1
    ORDER BY similarity("textContent", ${question}) DESC
    LIMIT 10
  `;  // Combine and deduplicate results with hybrid scoring
  const combinedMap = new Map<string, RetrievedItem>();

  // Add semantic results with 0.7 weight
  for (const result of semanticResults) {
    const score = result.similarity * 0.7;
    combinedMap.set(result.id, {
      id: result.content_id || result.id,
      type: result.content_type as RetrievedItem['type'],
      content: result.text_content,
      title: '', // Will be populated from database
      similarity: score,
    });
  }

  // Add full-text results with 0.3 weight (or boost existing)
  for (const result of fulltextResults) {
    const score = result.similarity * 0.3;
    const existing = combinedMap.get(result.id);
    if (existing) {
      existing.similarity = (existing.similarity || 0) + score; // Hybrid boost
    } else {
      combinedMap.set(result.id, {
        id: result.content_id || result.id,
        type: result.content_type as RetrievedItem['type'],
        content: result.text_content,
        title: '',
        similarity: score,
      });
    }
  }

  // Sort by hybrid score and take top 15
  const sortedItems = Array.from(combinedMap.values())
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, 15);

  // Enrich with actual database records for proper titles
  for (const item of sortedItems) {
    try {
      let enrichedItem: RetrievedItem | null = null;

      switch (item.type) {
        case 'experience': {
          const exp = await prisma.experience.findUnique({
            where: { id: item.id },
            select: { id: true, company: true, position: true, description: true },
          });
          if (exp) {
            enrichedItem = {
              ...item,
              title: `${exp.position} at ${exp.company}`,
              content: exp.description || item.content,
            };
          }
          break;
        }

        case 'education': {
          const edu = await prisma.education.findUnique({
            where: { id: item.id },
            select: { id: true, institution: true, degree: true, description: true },
          });
          if (edu) {
            enrichedItem = {
              ...item,
              title: `${edu.degree} from ${edu.institution}`,
              content: edu.description || item.content,
            };
          }
          break;
        }

        case 'testimonial': {
          const testimonial = await prisma.testimonial.findUnique({
            where: { id: item.id },
            select: { id: true, recommenderName: true, recommenderTitle: true, content: true },
          });
          if (testimonial) {
            enrichedItem = {
              ...item,
              title: `Recommendation from ${testimonial.recommenderName}${testimonial.recommenderTitle ? `, ${testimonial.recommenderTitle}` : ''}`,
              content: testimonial.content,
            };
          }
          break;
        }

        case 'skill': {
          // Skills are stored differently - get from UserSkill
          const userSkill = await prisma.userSkill.findFirst({
            where: { userId, id: item.id },
            include: { skill: true },
          });
          if (userSkill) {
            enrichedItem = {
              ...item,
              title: userSkill.skill.name,
              content: `${userSkill.skill.name}${userSkill.level ? ` (${userSkill.level})` : ''}${userSkill.yearsUsed ? ` - ${userSkill.yearsUsed} years` : ''}`,
            };
          }
          break;
        }
      }

      if (enrichedItem) {
        results.push(enrichedItem);
      }
    } catch (error) {
      console.error(`Error enriching ${item.type} ${item.id}:`, error);
      // Include original item if enrichment fails
      results.push(item);
    }
  }

  return results;
}
