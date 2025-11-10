---
title: SmartFolio - AI-Powered Career Portfolios with Agentic Postgres
published: false
tags: devchallenge, agenticpostgreschallenge, ai, postgres
---

*This is a submission for the [Agentic Postgres Challenge with Tiger Data](https://dev.to/challenges/agentic-postgres-2025-10-22)*

## What I Built

**SmartFolio** is an intelligent career portfolio platform that transforms static resumes into dynamic, searchable knowledge bases. Instead of just displaying your resume, SmartFolio enables natural language conversations about your experience - imagine a hiring manager asking "What PHP projects has this candidate worked on?" and getting precise answers with citations.

### The Problem
Traditional portfolios are passive documents. Recruiters spend hours scanning resumes, and candidates struggle to make their diverse experiences discoverable. What if your portfolio could intelligently answer questions about your background?

### The Solution
SmartFolio uses **Agentic Postgres** with TimescaleDB to:
- Parse resumes (PDF/DOCX) and extract structured data using GPT-4
- Store experiences, education, skills as vector embeddings using pgvector
- Enable hybrid search (semantic + full-text) for intelligent Q&A
- Provide AI-powered chat that cites specific resume sections

**Live Demo:** https://smartfolio.vercel.app

## Demo

**Repository:** https://github.com/sbsmith86/smartfolio

### Key Features Demo

**1. Resume Upload & AI Parsing**
Upload a PDF/DOCX resume and watch SmartFolio extract:
- Work experiences with skills used at each company
- Education history
- Skills categorized (technical, soft, language, certification)
- Contact information

**2. Conversational Search**
Ask natural questions like:
- "What experience does this candidate have with Python?"
- "Has this person worked in healthcare?"
- "What leadership roles have they held?"

The AI responds with specific answers and cites the exact resume sections.

**3. Hybrid Search Scoring**
SmartFolio combines:
- **Semantic search** (pgvector) - understands meaning and context
- **Full-text search** (pg_trgm) - catches exact keywords and acronyms
- **Weighted scoring** - 70% semantic, 30% keyword for best results

**Example Query Flow:**
```
User: "What PHP experience does this candidate have?"
↓
Hybrid Search in TimescaleDB:
├─ Vector Similarity: Finds experiences semantically related to "PHP development"
└─ Full-Text Search: Catches exact "PHP" mentions
↓
AI Response: "The candidate has 3+ years of PHP experience:
  • At HBR Consulting: Built healthcare applications using PHP/Laravel
  • Skills: PHP, Laravel, MySQL, REST APIs
  [Citations to specific resume sections]"
```

### Screenshots

**Profile View:**
![Profile showing experiences, skills, and AI chat interface]

**Chat Interface:**
![Natural language Q&A with citations]

**Resume Upload:**
![PDF/DOCX upload with AI extraction progress]

## How I Used Agentic Postgres

### 1. **pgvector for Semantic Search**

Every resume section (experiences, education, skills) is embedded using OpenAI's `text-embedding-3-small` model and stored in TimescaleDB with pgvector:

```sql
CREATE TABLE knowledge_embeddings (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "textContent" TEXT NOT NULL,
  embedding vector(1536),  -- pgvector extension
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX embedding_vector_idx ON knowledge_embeddings
  USING ivfflat (embedding vector_cosine_ops);
```

**Semantic Search Query:**
```sql
SELECT id, "contentType", "textContent",
       1 - (embedding <=> $1::vector) as similarity
FROM knowledge_embeddings
WHERE "userId" = $2
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

This enables understanding **intent** - searching for "team leadership" finds experiences mentioning "managed cross-functional teams" even without exact keyword matches.

### 2. **pg_trgm for Full-Text Search**

For precise keyword matching (crucial for technical skills and acronyms):

```sql
CREATE EXTENSION pg_trgm;

CREATE INDEX knowledge_trgm_idx ON knowledge_embeddings
  USING gin ("textContent" gin_trgm_ops);

SELECT id, "contentType", "textContent",
       similarity("textContent", $1) as similarity
FROM knowledge_embeddings
WHERE "userId" = $2
  AND similarity("textContent", $1) > 0.1
ORDER BY similarity DESC
LIMIT 10;
```

This catches exact matches like "PHP", "AWS", "JIRA" that might be missed by semantic search alone.

### 3. **Hybrid Scoring Algorithm**

The magic happens by combining both approaches:

```javascript
async function hybridSearch(userId, query, limit = 10) {
  // Run both searches in parallel
  const [semanticResults, fulltextResults] = await Promise.all([
    semanticSearch(userId, query, limit * 2),
    fulltextSearch(userId, query, limit * 2)
  ]);

  // Merge and score: 70% semantic, 30% keyword
  const scoredResults = mergeResults(semanticResults, fulltextResults);

  scoredResults.forEach(result => {
    const semanticScore = result.semanticSimilarity || 0;
    const fulltextScore = result.fulltextSimilarity || 0;
    result.hybridScore = (semanticScore * 0.7) + (fulltextScore * 0.3);
  });

  return scoredResults.sort((a, b) => b.hybridScore - a.hybridScore).slice(0, limit);
}
```

**Why This Works:**
- Technical terms like "PostgreSQL" or "React" get boosted by full-text
- Conceptual queries like "database experience" find semantic matches
- Combined scoring gives best of both worlds

### 4. **Fluid Storage with JSONB**

Resume metadata is stored flexibly in JSONB columns, allowing schema evolution without migrations:

```sql
CREATE TABLE "Experience" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  "startDate" TEXT NOT NULL,
  "endDate" TEXT,
  description TEXT,
  achievements JSONB,  -- Flexible array storage
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Query achievements dynamically
SELECT * FROM "Experience"
WHERE achievements @> '[{"type": "leadership"}]';
```

This "fluid storage" pattern lets us:
- Store variable-length arrays (achievements, skills per job)
- Add new fields without schema changes
- Query nested data efficiently with GIN indexes

### 5. **MCP (Model Context Protocol) Pattern**

SmartFolio implements an **Agentic MCP Server** that exposes Postgres operations as AI-callable tools:

```typescript
// MCP Tool: Semantic Search
{
  name: 'semantic_search',
  description: 'Search user knowledge using vector similarity',
  inputSchema: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
      query: { type: 'string' },
      limit: { type: 'number' },
      entityTypes: { type: 'array' }
    }
  },
  handler: async (input, session) => {
    // Generate embedding
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: input.query
    });

    // Query pgvector
    const results = await prisma.$queryRaw`
      SELECT * FROM knowledge_embeddings
      WHERE "userId" = ${input.userId}
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT ${input.limit}
    `;

    return { success: true, results };
  }
}
```

The AI agent can now:
1. Parse user questions
2. Choose the right search strategy (semantic, fulltext, or hybrid)
3. Execute Postgres queries through MCP tools
4. Format results with citations

### 6. **TimescaleDB Cloud Integration**

Using TimescaleDB Cloud provided:
- **Automatic pgvector extension** - no manual setup needed
- **Fast vector queries** - optimized for similarity search
- **Scalable storage** - handles thousands of embeddings efficiently
- **Built-in monitoring** - query performance insights

**Connection was seamless:**
```typescript
// .env
DATABASE_URL="postgres://user:pass@xxx.tsdb.cloud.timescale.com:36139/tsdb?sslmode=require"

// Prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Extensions enabled automatically
model KnowledgeEmbedding {
  embedding Unsupported("vector(1536)")?
}
```

## Overall Experience

### What Worked Well

**1. TimescaleDB Cloud Setup**
The developer experience was excellent - no complex configuration needed. pgvector and pg_trgm extensions worked out of the box. Coming from managing Postgres myself, the managed service saved hours.

**2. pgvector Performance**
Vector similarity search was surprisingly fast, even with 1000+ embeddings. The IVFFlat index kept queries under 50ms. The `<=>` operator syntax is elegant and intuitive.

**3. Hybrid Search Quality**
Combining semantic + full-text search produced noticeably better results than either alone. For a query like "PHP experience":
- Pure semantic: Found Laravel projects but missed exact "PHP" mentions
- Pure full-text: Found "PHP" keyword but missed related frameworks
- Hybrid: Caught both, ranked perfectly

**4. JSONB Flexibility**
Storing achievements as JSONB arrays was brilliant - different jobs have different numbers of achievements, and JSONB handled this gracefully. The `@>` operator for JSON queries is powerful.

### What Surprised Me

**1. Embedding Quality**
OpenAI's `text-embedding-3-small` captured nuance incredibly well. "Managed a team" and "led cross-functional initiatives" scored high similarity even with zero keyword overlap.

**2. pg_trgm Trigram Magic**
I expected basic LIKE matching, but pg_trgm's similarity scores are sophisticated. It handles typos, abbreviations, and partial matches intelligently.

**3. MCP Pattern Power**
Structuring Postgres queries as MCP tools made the AI agent architecture clean. The AI can now "choose" which search strategy to use based on the question - this felt like true agentic behavior.

### Challenges & Learnings

**Challenge 1: Deduplication**
GPT-4 sometimes extracted duplicate skills like "JavaScript" and "JS".

**Solution:** Application-level deduplication + prompt engineering:
```typescript
const uniqueSkills = new Map();
for (const skill of rawSkills) {
  const normalized = skill.name.toLowerCase().trim();
  if (!uniqueSkills.has(normalized)) {
    uniqueSkills.set(normalized, skill);
  }
}
```

Plus explicit GPT instructions: "Use canonical names: 'React' not 'ReactJS', 'PostgreSQL' not 'Postgres'"

**Challenge 2: Hybrid Scoring Weights**
What's the right balance between semantic (70%) and full-text (30%)?

**Solution:** Experimentation with real queries. Technical queries (e.g., "Python experience") need higher keyword weight, conceptual queries (e.g., "leadership roles") need higher semantic weight. 70/30 split worked best overall, but this could be dynamic per query type.

**Challenge 3: Vercel Deployment**
Prisma client generation failed on Vercel's serverless environment.

**Solution:** Added `postinstall` script to package.json:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

This ensures the correct platform-specific query engine is generated for Vercel's runtime.

**Challenge 4: Vector Index Size**
With 1536-dimension embeddings, the IVFFlat index size grew quickly.

**Learning:** For production, I'd:
- Use OpenAI's smaller `text-embedding-3-small` (already doing this)
- Consider dimension reduction to 768 or 512
- Monitor index size vs query performance tradeoff

### Key Takeaways

1. **Postgres is an AI database** - pgvector + pg_trgm + JSONB make Postgres competitive with specialized vector DBs
2. **Hybrid > Pure** - Combining multiple search strategies beats any single approach
3. **Agentic pattern scales** - MCP tools let AI choose the right Postgres query for each task
4. **TimescaleDB removes friction** - Managed service let me focus on building features, not infrastructure

### What's Next

If I continue this project:
- **Multi-document support** - upload multiple resumes, contracts, references
- **Relationship mapping** - graph queries showing connections between companies/skills/people
- **Time-series analysis** - track skill evolution over career timeline (perfect for TimescaleDB!)
- **Collaborative filtering** - "candidates similar to this one" using vector similarity
- **Dynamic weighting** - adjust semantic/fulltext ratio based on query type

---

## Tech Stack

- **Frontend:** Next.js 16, React, TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes, NextAuth.js
- **Database:** TimescaleDB Cloud (Postgres + pgvector + pg_trgm)
- **AI:** OpenAI GPT-4o (parsing), text-embedding-3-small (vectors)
- **ORM:** Prisma
- **Deployment:** Vercel
- **File Processing:** mammoth (DOCX), pdf-parse (PDF)

## Conclusion

Building SmartFolio taught me that **Postgres is underrated as an AI database**. With pgvector, pg_trgm, and JSONB, it handles vector search, full-text search, and flexible schemas - all in one system. No need for separate vector DBs, search engines, or document stores.

The Agentic Postgres pattern (MCP + hybrid search) creates AI agents that intelligently query structured data. This isn't just a better resume platform - it's a blueprint for making any structured data conversational.

**Try it yourself:** https://smartfolio.vercel.app
**Source code:** https://github.com/sbsmith86/smartfolio

Thanks to Tiger Data and TimescaleDB for the challenge! This pushed me to explore Postgres capabilities I didn't know existed.

---

*Built by Shae Smith for the Agentic Postgres Challenge, November 2024*
