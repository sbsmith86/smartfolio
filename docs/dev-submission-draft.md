---
title: SmartFolio - AI-Powered Career Portfolios on Agentic Postgres
published: false
tags: devchallenge, agenticpostgreschallenge, ai, postgres
---

# SmartFolio: Multi-Source Career Portfolios with Conversational AI

## What I Built

SmartFolio is an AI-powered portfolio platform that aggregates career data from multiple sources (resumes, GitHub, LinkedIn) and makes it conversationally searchable using **TimescaleDB Cloud (Tiger Data)** with **pgvector** and **pg_trgm** extensions.

**Key Features:**
- 📄 **Resume parsing** with GPT-4o → structured experiences/education/skills
- 💻 **GitHub project import** - auto-parses READMEs for project descriptions and tech stacks
- 💼 **LinkedIn profile import** - paste raw text, AI extracts normalized data
- 💬 **Conversational chat** - ask natural language questions about candidates
- 🔍 **Hybrid search** - combines semantic (pgvector) + full-text (pg_trgm) retrieval
- 🎯 **Grounded answers** - GPT-4o synthesizes responses using only retrieved context
- 📊 **Provenance tracking** - every data point tagged with its source

**Demo:** [https://smartfolio.vercel.app/profile/shae](https://smartfolio.vercel.app/profile/shae)

**GitHub:** [https://github.com/sbsmith86/smartfolio](https://github.com/sbsmith86/smartfolio)

## Why This Matters

The modern career isn't linear—it's a portfolio of experiences across companies, open source contributions, side projects, and continuous learning. Yet traditional resumes flatten this richness into a chronological list.

SmartFolio embraces the **"portfolio career" paradigm** (HBR) where professionals curate diverse experiences rather than climbing a single ladder. By aggregating data from multiple sources and making it conversationally queryable, hiring managers can ask nuanced questions like:

- "What PHP experience does this candidate have?" (retrieves jobs + GitHub projects)
- "Tell me about their leadership experience" (synthesizes across multiple roles)
- "What projects demonstrate full-stack skills?" (combines work history + open source)

## Agentic Postgres Features Used

### 1. **Semantic Search with pgvector**

Every experience, education record, and skill is converted to a **1536-dimensional embedding** using OpenAI's `text-embedding-3-small` model. When you ask a question, it's also embedded, and we use pgvector's cosine distance operator (`<=>`) to find semantically similar content:

```sql
SELECT id, "contentType", "textContent",
       1 - (embedding <=> $1::vector) as similarity
FROM knowledge_embeddings
WHERE "userId" = $2
ORDER BY embedding <=> $1::vector
LIMIT 10
```

This captures **meaning and context**, not just keyword matches. For example, "What Python experience" matches jobs mentioning Django, Flask, data science libraries—even if the job title doesn't include "Python Developer."

### 2. **Full-Text Search with pg_trgm**

PostgreSQL's `pg_trgm` extension provides trigram similarity matching for **exact terms and acronyms**:

```sql
SELECT id, "contentType", "textContent",
       similarity("textContent", $1) as similarity
FROM knowledge_embeddings
WHERE "userId" = $2
  AND similarity("textContent", $1) > 0.1
ORDER BY similarity DESC
LIMIT 10
```

This complements semantic search by ensuring specific technologies (PHP, AWS, React), company names, and industry terms are matched precisely—even with typos or variations.

### 3. **Hybrid Scoring**

We combine both approaches with a **weighted blend**:

```javascript
const hybridScore = (semanticScore * 0.7) + (fulltextScore * 0.3);
```

- **70% semantic similarity** - captures conceptual understanding
- **30% full-text similarity** - ensures keyword precision

The system retrieves top candidates from each layer, merges them, and re-ranks by hybrid score to deliver the **most relevant results**.

### 4. **Fluid Storage**

When you upload a resume, import GitHub projects, or paste LinkedIn data, GPT-4o parses the content and **immediately generates embeddings**. There's no schema migration or manual indexing—new data becomes searchable instantly:

```typescript
// After creating an Experience record
const embeddingText = `${position} at ${company}. ${description}`;
const embedding = await generateEmbedding(embeddingText);

await prisma.$executeRaw`
  INSERT INTO knowledge_embeddings
    ("userId", "contentType", "contentId", "textContent", "embedding")
  VALUES
    (${userId}, 'experience', ${experienceId}, ${embeddingText}, ${embedding}::vector)
`;
```

The `knowledge_embeddings` table grows dynamically as users add more information.

### 5. **Agent Pattern (MCP)**

SmartFolio follows the **Model Context Protocol** pattern with specialized agents:

- **Ingestion Agent (GPT-4o)** - normalizes and structures incoming data
  - Parses resumes → extracts experiences, education, skills
  - Parses GitHub READMEs → extracts project descriptions, tech stacks
  - Parses LinkedIn text → normalizes job titles, dates, companies

- **Query Agent (GPT-4o)** - retrieves relevant context and synthesizes grounded answers
  - Embeds the question
  - Runs hybrid search to retrieve top 15 relevant items
  - Builds context from retrieved experiences/education/skills
  - Synthesizes answer using **only** provided context (temp 0.3)

This separation ensures **data quality on write** and **intelligent responses on read**.

## How to Test

1. **Visit the demo profile:** [https://smartfolio.vercel.app/profile/shae](https://smartfolio.vercel.app/profile/shae)
2. **No login required** - the profile is publicly accessible
3. **Chat is open by default** - try asking:
   - "What PHP experience does this candidate have?"
   - "Tell me about their leadership experience"
   - "What projects have they built?"
4. **Click citations** - each answer includes clickable source citations that scroll to the relevant section
5. **Expand tech panel** - see how hybrid search, pgvector, and pg_trgm work together

## Technical Architecture

**Stack:**
- **Next.js 16.0.0** with App Router and Turbopack
- **TimescaleDB Cloud (Tiger Data)** - PostgreSQL with pgvector and pg_trgm extensions
- **Prisma 6.18.0** - ORM with raw SQL for vector operations
- **OpenAI** - GPT-4o for parsing/synthesis, text-embedding-3-small for embeddings
- **Vercel** - deployment and hosting

**Key Implementation Details:**

1. **Hybrid Search Optimization**
   - Increased result limit from 8 to 15 after diagnostic analysis
   - Created `debug-chat-search.js` tool to analyze search quality
   - Discovered fulltext threshold (0.1) was filtering out relevant results
   - Now retrieves 10+ items and generates 3+ citations for tech-specific queries

2. **Citation System**
   - Compact inline pills instead of large boxes
   - Shows company name + position: "Technical Lead at Lantern"
   - Tooltips reveal full excerpts on hover
   - Clicking scrolls to specific experience/education/skill (not just section)

3. **UX Refinements**
   - Auto-scroll only scrolls chat container (not entire page)
   - Citations scroll to specific items with 100px offset
   - Technology explanation panel educates judges on Agentic Postgres features
   - Status badges clarify Active vs Demo features

## Challenges & Solutions

### Challenge 1: Semantic vs Keyword Mismatch

**Problem:** GitHub projects with explicit PHP/Laravel tech stacks weren't ranking high semantically for "What PHP experience does the candidate have?"

**Root Cause:** Question uses "experience" (career language) while projects use "service", "platform" (product language). Semantic search prioritizes jobs over projects.

**Solution:** Hybrid search with 30% fulltext weight ensures exact keyword matches get boosted. Also increased result limit to 15 to capture more diverse sources.

### Challenge 2: Table Name vs Model Name

**Problem:** Raw SQL queries using Prisma model name (`KnowledgeEmbedding`) failed with "relation does not exist" error.

**Root Cause:** Prisma schema uses `@@map("knowledge_embeddings")` but model is `KnowledgeEmbedding`.

**Solution:** Changed all raw SQL queries to use actual table name `knowledge_embeddings` instead of model name.

### Challenge 3: Shallow Results

**Problem:** Chat only returned 1-2 relevant experiences for technology-specific questions.

**Root Cause:** Result limit (8) was too restrictive. Fulltext similarity threshold (0.1) filtered out many PHP mentions.

**Solution:**
- Increased hybrid search limit from 8 to 15 results
- Created diagnostic tool (`debug-chat-search.js`) to analyze search quality
- Validated improvement: 3 citations vs 1 originally

## What's Next

**For Full Production:**
- 📸 Screenshot integration - extract skills from portfolio screenshots
- 🔗 Knowledge graph visualization - show relationships between skills/companies/projects
- 📊 Analytics dashboard - track which skills/experiences get cited most
- 🤝 Team collaboration - share candidate profiles with hiring teams
- 🔒 Privacy controls - candidate decides what's public vs private

**Lessons Learned:**
- Hybrid search quality depends on: embedding coverage, similarity thresholds, scoring weights, result limits, and LLM synthesis behavior
- Diagnostic tooling is essential for optimizing search relevance
- UI should be information-dense for secondary information (citations)
- Semantic search captures meaning but can miss keyword-specific relevance when context differs

## Conclusion

SmartFolio demonstrates how **TimescaleDB Cloud's Tiger Data** (pgvector + pg_trgm) enables sophisticated AI applications with:

✅ **Semantic understanding** - finds conceptually similar content
✅ **Keyword precision** - ensures exact terms match
✅ **Hybrid scoring** - balances both approaches
✅ **Fluid storage** - instant searchability without schema changes
✅ **Agent patterns** - specialized ingestion and query agents

The result is a conversational interface that makes career portfolios **queryable**, **verifiable**, and **grounded in actual data**—not hallucinated summaries.

---

**Try it yourself:** [https://smartfolio.vercel.app/profile/shae](https://smartfolio.vercel.app/profile/shae)

**Source code:** [https://github.com/sbsmith86/smartfolio](https://github.com/sbsmith86/smartfolio)

Built for the [Agentic Postgres Challenge](https://dev.to/challenges/timescale) using TimescaleDB Cloud.
