# MCP Testing Guide

This guide explains how to test the Model Context Protocol (MCP) server implementation for SmartFolio.

## Quick Start

### 1. Check if Embeddings Exist

```bash
npx tsx scripts/check-embeddings.ts
```

**What it does:**
- Shows total number of embeddings in database
- Breaks down embeddings by type (experience, education, etc.)
- Shows which users have embeddings
- Verifies all embeddings have the correct dimension (1536)

**Sample output:**
```
🔍 Checking Embeddings in Database

Total embeddings: 12

Embeddings by type:
  experience: 5
  education: 3
  skill: 4

Embeddings by user:
  john@example.com: 12 embeddings

✅ All embeddings have correct dimension (1536)
```

---

### 2. Test Resume Parsing

```bash
npx tsx scripts/test-resume-parsing.ts
```

**What it does:**
- Finds a user with uploaded documents
- Shows preview of extracted text
- Calls the MCP resume parser (GPT-4)
- Creates Experience, Education, and Skill records
- Generates embeddings for all content

**Prerequisites:**
1. User account created
2. Resume uploaded at `/dashboard/documents`
3. Text extraction completed (automatic after upload)

**Sample output:**
```
📄 Testing Resume Parsing

✅ Found user: john@example.com
✅ Found document: resume.pdf

🤖 Parsing resume with GPT-4...

✅ Resume parsed successfully!

📊 Created records:
   Experiences: 3
   Education: 2
   Skills: 15
   Embeddings: 5

💼 Experiences created:
   1. Senior Developer at TechCorp
      2020-01 - 2023-12
   2. Junior Developer at StartupCo
      2018-06 - 2020-01
```

---

### 3. Test Search Functionality

```bash
npx tsx scripts/test-mcp-search.ts
```

**What it does:**
- Tests semantic search (vector similarity)
- Tests full-text search (pg_trgm fuzzy matching)
- Tests hybrid search (weighted combination)
- Shows relevance scores for each result

**Prerequisites:**
- At least one user with embeddings (run step 2 first)

**Sample output:**
```
🔍 MCP Search Functionality Test

✅ Found 1 users with embeddings:
   1. john@example.com - 12 embeddings

🔍 Step 3: Testing Semantic Search...
Query: "software engineering experience"

✅ Semantic search returned 3 results:

   1. Relevance: 87.3%
      Type: experience
      Text: Led team of 5 engineers building scalable microservices...

   2. Relevance: 72.1%
      Type: experience
      Text: Developed REST APIs using Node.js and PostgreSQL...

🔀 Step 5: Testing Hybrid Search...
Query: "Python programming"

✅ Hybrid search returned 2 results:

   1. Hybrid Score: 81.5%
      Semantic: 85.2% | Full-text: 74.1%
      Type: experience
      Text: Built Python data pipelines for analytics...
```

---

## Testing via API

### Parse a Document

```bash
# Get your document ID from the database or upload response
curl -X POST http://localhost:3000/api/documents/parse \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"documentId": "YOUR_DOCUMENT_ID"}'
```

### Search (Coming Soon - Need API Endpoints)

You can also test search by adding API endpoints:

**Create `/api/search/semantic/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleSemanticSearch } from '@/lib/mcp/handlers/queries';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query, limit = 10 } = await request.json();

  const result = await handleSemanticSearch(
    { userId: session.user.id, query, limit },
    {
      id: `web-${Date.now()}`,
      userId: session.user.id,
      createdAt: new Date(),
      lastActivity: new Date(),
      context: new Map(),
    }
  );

  return NextResponse.json(result);
}
```

---

## Checking Database Directly

### Via psql

```bash
# Connect to database
psql "$DATABASE_URL"

# Count embeddings
SELECT COUNT(*) FROM knowledge_embeddings;

# Show embeddings by user
SELECT u.email, COUNT(ke.id) as embedding_count
FROM users u
LEFT JOIN knowledge_embeddings ke ON ke."userId" = u.id
GROUP BY u.email;

# Check embedding dimensions
SELECT
  id,
  "contentType",
  array_length(embedding::float[], 1) as dimension
FROM knowledge_embeddings
LIMIT 5;

# Test vector similarity
SELECT
  "textContent",
  embedding <-> '[0.1,0.2,0.3,...]'::vector as distance
FROM knowledge_embeddings
WHERE "userId" = 'YOUR_USER_ID'
ORDER BY distance
LIMIT 5;
```

### Via Prisma Studio

```bash
npx prisma studio
```

Then navigate to `knowledge_embeddings` table to see:
- ID, userId, contentType, contentId
- textContent (the actual text that was embedded)
- metadata (source information)
- **Note:** The `embedding` field won't display nicely (it's binary pgvector data)

---

## Troubleshooting

### No embeddings found

**Cause:** Resume hasn't been parsed yet

**Solution:**
1. Upload a resume at `/dashboard/documents`
2. Run `npx tsx scripts/test-resume-parsing.ts`

### "OpenAI API key not found"

**Cause:** Missing or invalid API key

**Solution:**
```bash
# Check .env.local
grep OPENAI_API_KEY .env.local

# If missing, add it:
echo 'OPENAI_API_KEY=sk-...' >> .env.local
```

### Search returns no results

**Cause:** Query doesn't match any content

**Solution:**
- Try broader queries like "software", "engineer", "developer"
- Check what content exists: `npx tsx scripts/check-embeddings.ts`

### Wrong embedding dimension

**Cause:** Embeddings created before pgvector migration

**Solution:**
```sql
-- Clear old embeddings
TRUNCATE TABLE knowledge_embeddings;
```

Then re-parse documents.

---

## Understanding Search Types

### Semantic Search (Vector Similarity)
- **Best for:** Conceptual queries, understanding intent
- **Example:** "What machine learning experience does this person have?"
- **How it works:** Converts query to embedding, finds similar embeddings using pgvector

### Full-Text Search (pg_trgm)
- **Best for:** Keyword matching, exact terms, typo tolerance
- **Example:** "PostgreSQL", "JavaScriptt" (with typo)
- **How it works:** Trigram matching with fuzzy similarity

### Hybrid Search
- **Best for:** Most queries - combines both approaches
- **Default weights:** 70% semantic, 30% full-text
- **How it works:** Weighted combination of both scores

---

## Next Steps

After verifying embeddings work:

1. **Build conversational UI** (Task 12)
2. **Add GitHub integration** (Task 8)
3. **Add LinkedIn sync** (Task 9)
4. **Create knowledge graph** (Task 10)

Each of these will create MORE embeddings, making search even more powerful!
