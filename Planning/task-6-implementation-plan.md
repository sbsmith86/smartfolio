# Task 6 Implementation Plan: MCP Server Setup

**Version:** 1.0
**Created:** 2024
**Status:** Ready for Implementation
**Prerequisites:** ✅ PostgreSQL extensions enabled (pgvector v0.8.1, pg_trgm v1.6)

---

## Overview

This plan details the step-by-step implementation of SmartFolio's MCP server, which enables **Dual AI Architecture**:

1. **Data Ingestion (AI Writes)**: Unstructured uploads → AI Agent → Structured Database Records
2. **Conversational (AI Reads)**: User Question → AI Agent → Database Query → Natural Language Response

---

## Implementation Phases

### Phase A: Setup & Dependencies (30 min)
### Phase B: MCP Server Infrastructure (1 hour)
### Phase C: Data Ingestion Tools (2 hours)
### Phase D: Query Tools (1.5 hours)
### Phase E: Session Isolation (1 hour)
### Phase F: Testing & Integration (1.5 hours)

**Total Estimated Time:** 7.5 hours

---

## Phase A: Setup & Dependencies

### Step A1: Install Required Packages

```bash
npm install @modelcontextprotocol/sdk openai zod
```

**Package Purposes:**
- `@modelcontextprotocol/sdk` - Official Anthropic MCP protocol implementation
- `openai` - GPT-4 for parsing + embeddings generation
- `zod` - Runtime validation for AI-extracted data

### Step A2: Update Prisma Schema for pgvector

**File:** `prisma/schema.prisma`

**Change:**
```prisma
model KnowledgeEmbedding {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  entityType String   // "experience", "education", "skill", "document", etc.
  entityId   String   // ID of the related entity
  content    String   @db.Text // Original text that was embedded
  embedding  Unsupported("vector(1536)")  // ← Changed from Float[]
  metadata   Json?    // Additional context (e.g., {"source": "resume", "page": 2})
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId, entityType])
  @@index([entityId])
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_pgvector_support
```

**Verification:**
```sql
-- Verify vector type in PostgreSQL
\d "KnowledgeEmbedding"
-- Should show: embedding | vector(1536) |
```

---

## Phase B: MCP Server Infrastructure

### Step B1: Create Directory Structure

```bash
mkdir -p src/lib/mcp/{tools,handlers,types,__tests__}
```

**Resulting structure:**
```
src/lib/mcp/
├── server.ts          # MCP server initialization
├── tools.ts           # Tool registration and schemas
├── handlers/
│   ├── ingestion.ts   # Data ingestion handlers (AI writes)
│   └── queries.ts     # Query handlers (AI reads)
├── types/
│   └── index.ts       # TypeScript interfaces
└── __tests__/
    ├── ingestion.test.ts
    └── queries.test.ts
```

### Step B2: Define TypeScript Types

**File:** `src/lib/mcp/types/index.ts`

```typescript
import { z } from 'zod';

// ===== Data Ingestion Schemas (AI Writes) =====

export const ResumeDataSchema = z.object({
  experiences: z.array(z.object({
    title: z.string(),
    company: z.string(),
    startDate: z.string(), // ISO date
    endDate: z.string().optional(),
    description: z.string(),
    skills: z.array(z.string()).optional(),
  })),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    fieldOfStudy: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    gpa: z.string().optional(),
  })),
  skills: z.array(z.object({
    name: z.string(),
    category: z.enum(['technical', 'soft', 'language', 'certification', 'other']),
    proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  })),
  summary: z.string().optional(),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }).optional(),
});

export type ResumeData = z.infer<typeof ResumeDataSchema>;

// ===== Query Schemas (AI Reads) =====

export const SearchQuerySchema = z.object({
  query: z.string(),
  userId: z.string(),
  searchType: z.enum(['semantic', 'fulltext', 'hybrid']),
  limit: z.number().int().positive().max(50).default(10),
  filters: z.object({
    entityTypes: z.array(z.string()).optional(), // ["experience", "education"]
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
  }).optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// ===== Session Management =====

export interface MCPSession {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  context: Map<string, any>; // Session-specific state
}

// ===== MCP Tool Definitions =====

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (input: any, session: MCPSession) => Promise<any>;
}
```

### Step B3: Create MCP Server Core

**File:** `src/lib/mcp/server.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { MCPSession } from './types';
import { registerTools, getToolHandler } from './tools';

// Session storage (in production, use Redis or database)
const sessions = new Map<string, MCPSession>();

export class SmartFolioMCPServer {
  private server: Server;
  private sessions: Map<string, MCPSession>;

  constructor() {
    this.server = new Server(
      {
        name: 'smartfolio-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.sessions = new Map();
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: registerTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Get or create session
      const sessionId = (args as any).sessionId || 'default';
      const userId = (args as any).userId;

      if (!userId) {
        throw new Error('userId is required for all tool calls');
      }

      let session = this.sessions.get(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          userId,
          createdAt: new Date(),
          lastActivity: new Date(),
          context: new Map(),
        };
        this.sessions.set(sessionId, session);
      }

      // Update last activity
      session.lastActivity = new Date();

      // Execute tool handler
      const handler = getToolHandler(name);
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        const result = await handler(args, session);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`Tool execution error (${name}):`, error);
        throw error;
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('SmartFolio MCP Server running');
  }

  // Clean up stale sessions (call periodically)
  cleanupSessions(maxAgeMinutes: number = 30) {
    const now = new Date();
    for (const [sessionId, session] of this.sessions) {
      const ageMinutes =
        (now.getTime() - session.lastActivity.getTime()) / 1000 / 60;
      if (ageMinutes > maxAgeMinutes) {
        this.sessions.delete(sessionId);
        console.log(`Cleaned up session: ${sessionId}`);
      }
    }
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new SmartFolioMCPServer();
  server.start().catch(console.error);

  // Cleanup stale sessions every 10 minutes
  setInterval(() => {
    server.cleanupSessions(30);
  }, 10 * 60 * 1000);
}
```

---

## Phase C: Data Ingestion Tools (AI Writes)

### Step C1: Register Ingestion Tools

**File:** `src/lib/mcp/tools.ts`

```typescript
import { MCPTool } from './types';
import {
  handleParseResume,
  handleAnalyzeGitHub,
  handleProcessLinkedIn,
} from './handlers/ingestion';
import {
  handleSemanticSearch,
  handleFullTextSearch,
  handleHybridSearch,
} from './handlers/queries';

export function registerTools() {
  return [
    // ===== Data Ingestion Tools (AI Writes) =====
    {
      name: 'parse_resume',
      description:
        'Parse a resume PDF/DOCX and extract structured data (experiences, education, skills). Creates database records automatically.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'User ID who owns the resume',
          },
          documentId: {
            type: 'string',
            description: 'UserDocument ID (already uploaded and text-extracted)',
          },
          sessionId: {
            type: 'string',
            description: 'Session identifier for isolation',
          },
        },
        required: ['userId', 'documentId'],
      },
    },
    {
      name: 'analyze_github',
      description:
        'Analyze GitHub profile and repositories. Extracts projects, skills, and creates structured database records.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          githubUsername: { type: 'string' },
          sessionId: { type: 'string' },
        },
        required: ['userId', 'githubUsername'],
      },
    },
    {
      name: 'process_linkedin',
      description:
        'Process LinkedIn profile data. Extracts experiences, education, certifications, and creates database records.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          linkedinUrl: { type: 'string' },
          sessionId: { type: 'string' },
        },
        required: ['userId', 'linkedinUrl'],
      },
    },

    // ===== Query Tools (AI Reads) =====
    {
      name: 'semantic_search',
      description:
        'Search user data using vector similarity (semantic meaning). Best for conceptual queries like "What Python projects has this user worked on?"',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          query: { type: 'string' },
          limit: { type: 'number', default: 10 },
          entityTypes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by entity types: experience, education, skill, etc.',
          },
          sessionId: { type: 'string' },
        },
        required: ['userId', 'query'],
      },
    },
    {
      name: 'fulltext_search',
      description:
        'Search user data using PostgreSQL full-text search with fuzzy matching. Best for keyword searches and typo tolerance.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          query: { type: 'string' },
          limit: { type: 'number', default: 10 },
          sessionId: { type: 'string' },
        },
        required: ['userId', 'query'],
      },
    },
    {
      name: 'hybrid_search',
      description:
        'Combine semantic (vector) and full-text search for best results. Recommended for most queries.',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          query: { type: 'string' },
          limit: { type: 'number', default: 10 },
          semanticWeight: {
            type: 'number',
            default: 0.7,
            description: 'Weight for semantic results (0-1)',
          },
          sessionId: { type: 'string' },
        },
        required: ['userId', 'query'],
      },
    },
  ];
}

// Tool handler registry
const toolHandlers = new Map<string, MCPTool['handler']>();

export function initializeToolHandlers() {
  // Ingestion handlers
  toolHandlers.set('parse_resume', handleParseResume);
  toolHandlers.set('analyze_github', handleAnalyzeGitHub);
  toolHandlers.set('process_linkedin', handleProcessLinkedIn);

  // Query handlers
  toolHandlers.set('semantic_search', handleSemanticSearch);
  toolHandlers.set('fulltext_search', handleFullTextSearch);
  toolHandlers.set('hybrid_search', handleHybridSearch);
}

export function getToolHandler(name: string): MCPTool['handler'] | undefined {
  if (toolHandlers.size === 0) {
    initializeToolHandlers();
  }
  return toolHandlers.get(name);
}
```

### Step C2: Implement Resume Parsing Handler

**File:** `src/lib/mcp/handlers/ingestion.ts`

```typescript
import { OpenAI } from 'openai';
import { prisma } from '@/lib/prisma';
import { ResumeDataSchema, MCPSession } from '../types';
import { generateEmbedding } from '@/lib/openai-utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handleParseResume(
  input: { userId: string; documentId: string; sessionId?: string },
  session: MCPSession
) {
  console.log(`[MCP] Parsing resume for user ${input.userId}, doc ${input.documentId}`);

  // 1. Fetch document with extracted text
  const document = await prisma.userDocument.findUnique({
    where: { id: input.documentId },
    include: { user: true },
  });

  if (!document) {
    throw new Error(`Document ${input.documentId} not found`);
  }

  if (document.userId !== input.userId) {
    throw new Error('Unauthorized: Document does not belong to user');
  }

  if (!document.extractedText) {
    throw new Error('Document has no extracted text. Upload may have failed.');
  }

  // 2. Use GPT-4 to extract structured data
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a resume parsing assistant. Extract structured data from resumes.
Return a JSON object with these fields:
- experiences: Array of work experience objects
- education: Array of education objects
- skills: Array of skill objects
- summary: Professional summary (optional)
- contactInfo: Contact information (optional)

Follow this schema exactly:
{
  "experiences": [{"title": "...", "company": "...", "startDate": "YYYY-MM", "endDate": "YYYY-MM" or null, "description": "...", "skills": ["..."]}],
  "education": [{"degree": "...", "institution": "...", "fieldOfStudy": "...", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "gpa": "..."}],
  "skills": [{"name": "...", "category": "technical|soft|language|certification|other", "proficiency": "beginner|intermediate|advanced|expert"}],
  "summary": "...",
  "contactInfo": {"email": "...", "phone": "...", "location": "...", "linkedin": "...", "github": "...", "portfolio": "..."}
}`,
      },
      {
        role: 'user',
        content: `Parse this resume:\n\n${document.extractedText}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const rawData = JSON.parse(completion.choices[0].message.content || '{}');

  // 3. Validate with Zod
  const parsedData = ResumeDataSchema.parse(rawData);

  // 4. Create database records in transaction
  const result = await prisma.$transaction(async (tx) => {
    const createdRecords = {
      experiences: [],
      education: [],
      skills: [],
      embeddings: [],
    };

    // Create Experience records
    for (const exp of parsedData.experiences) {
      const experience = await tx.experience.create({
        data: {
          userId: input.userId,
          title: exp.title,
          company: exp.company,
          startDate: new Date(exp.startDate),
          endDate: exp.endDate ? new Date(exp.endDate) : null,
          description: exp.description,
          current: !exp.endDate,
        },
      });
      createdRecords.experiences.push(experience);

      // Create embedding for experience
      const embeddingVector = await generateEmbedding(
        `${exp.title} at ${exp.company}: ${exp.description}`
      );
      const embedding = await tx.knowledgeEmbedding.create({
        data: {
          userId: input.userId,
          entityType: 'experience',
          entityId: experience.id,
          content: exp.description,
          embedding: `[${embeddingVector.join(',')}]`, // pgvector format
          metadata: {
            source: 'resume',
            documentId: input.documentId,
          },
        },
      });
      createdRecords.embeddings.push(embedding);
    }

    // Create Education records
    for (const edu of parsedData.education) {
      const education = await tx.education.create({
        data: {
          userId: input.userId,
          degree: edu.degree,
          institution: edu.institution,
          fieldOfStudy: edu.fieldOfStudy || '',
          startDate: new Date(edu.startDate),
          endDate: edu.endDate ? new Date(edu.endDate) : null,
          gpa: edu.gpa,
        },
      });
      createdRecords.education.push(education);

      // Create embedding
      const embeddingVector = await generateEmbedding(
        `${edu.degree} in ${edu.fieldOfStudy || 'Unknown'} from ${edu.institution}`
      );
      await tx.knowledgeEmbedding.create({
        data: {
          userId: input.userId,
          entityType: 'education',
          entityId: education.id,
          content: `${edu.degree} - ${edu.institution}`,
          embedding: `[${embeddingVector.join(',')}]`,
          metadata: {
            source: 'resume',
            documentId: input.documentId,
          },
        },
      });
    }

    // Create Skill records
    for (const skill of parsedData.skills) {
      const skillRecord = await tx.skill.create({
        data: {
          userId: input.userId,
          name: skill.name,
          category: skill.category,
          proficiency: skill.proficiency || 'intermediate',
        },
      });
      createdRecords.skills.push(skillRecord);
    }

    // Update document status
    await tx.userDocument.update({
      where: { id: input.documentId },
      data: {
        metadata: {
          ...((document.metadata as any) || {}),
          parsed: true,
          parsedAt: new Date().toISOString(),
          recordsCreated: {
            experiences: createdRecords.experiences.length,
            education: createdRecords.education.length,
            skills: createdRecords.skills.length,
            embeddings: createdRecords.embeddings.length,
          },
        },
      },
    });

    return createdRecords;
  });

  console.log(`[MCP] Resume parsed successfully:`, {
    experiences: result.experiences.length,
    education: result.education.length,
    skills: result.skills.length,
    embeddings: result.embeddings.length,
  });

  return {
    success: true,
    message: 'Resume parsed and structured data created',
    summary: {
      experiencesCreated: result.experiences.length,
      educationCreated: result.education.length,
      skillsCreated: result.skills.length,
      embeddingsCreated: result.embeddings.length,
    },
    data: result,
  };
}

// Placeholder for GitHub analysis
export async function handleAnalyzeGitHub(input: any, session: MCPSession) {
  // TODO: Implement in Task 8
  throw new Error('GitHub analysis not yet implemented (Task 8)');
}

// Placeholder for LinkedIn processing
export async function handleProcessLinkedIn(input: any, session: MCPSession) {
  // TODO: Implement in Task 9
  throw new Error('LinkedIn processing not yet implemented (Task 9)');
}
```

### Step C3: Create OpenAI Utilities

**File:** `src/lib/openai-utils.ts`

```typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embedding vector for text using OpenAI's text-embedding-3-small
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536, // Match pgvector dimension
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    dimensions: 1536,
  });

  return response.data.map((item) => item.embedding);
}
```

---

## Phase D: Query Tools (AI Reads)

### Step D1: Implement Query Handlers

**File:** `src/lib/mcp/handlers/queries.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { MCPSession } from '../types';
import { generateEmbedding } from '@/lib/openai-utils';
import { Prisma } from '@prisma/client';

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
  session: MCPSession
) {
  console.log(`[MCP] Semantic search for user ${input.userId}: "${input.query}"`);

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(input.query);

  // 2. Build filter conditions
  const where: Prisma.KnowledgeEmbeddingWhereInput = {
    userId: input.userId,
  };

  if (input.entityTypes && input.entityTypes.length > 0) {
    where.entityType = { in: input.entityTypes };
  }

  // 3. Execute vector similarity search
  // Note: Raw SQL needed for pgvector operators (<->, <#>, <=>)
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      entityType: string;
      entityId: string;
      content: string;
      metadata: any;
      distance: number;
    }>
  >`
    SELECT
      id,
      "userId",
      "entityType",
      "entityId",
      content,
      metadata,
      embedding <-> ${`[${queryEmbedding.join(',')}]`}::vector AS distance
    FROM "KnowledgeEmbedding"
    WHERE "userId" = ${input.userId}
      ${input.entityTypes && input.entityTypes.length > 0 ? Prisma.sql`AND "entityType" = ANY(${input.entityTypes})` : Prisma.empty}
    ORDER BY distance ASC
    LIMIT ${input.limit || 10}
  `;

  // 4. Enrich results with related entities
  const enrichedResults = await Promise.all(
    results.map(async (result) => {
      let entity = null;

      // Fetch related entity based on type
      switch (result.entityType) {
        case 'experience':
          entity = await prisma.experience.findUnique({
            where: { id: result.entityId },
          });
          break;
        case 'education':
          entity = await prisma.education.findUnique({
            where: { id: result.entityId },
          });
          break;
        case 'skill':
          entity = await prisma.skill.findUnique({
            where: { id: result.entityId },
          });
          break;
        // Add more cases as needed
      }

      return {
        ...result,
        entity,
        relevanceScore: 1 - result.distance, // Convert distance to similarity
      };
    })
  );

  console.log(`[MCP] Found ${enrichedResults.length} semantic matches`);

  return {
    success: true,
    results: enrichedResults,
    searchType: 'semantic',
    query: input.query,
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
    sessionId?: string;
  },
  session: MCPSession
) {
  console.log(`[MCP] Full-text search for user ${input.userId}: "${input.query}"`);

  // Use pg_trgm similarity operator (%>)
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      entityType: string;
      entityId: string;
      content: string;
      metadata: any;
      similarity: number;
    }>
  >`
    SELECT
      id,
      "userId",
      "entityType",
      "entityId",
      content,
      metadata,
      similarity(content, ${input.query}) AS similarity
    FROM "KnowledgeEmbedding"
    WHERE "userId" = ${input.userId}
      AND content % ${input.query}
    ORDER BY similarity DESC
    LIMIT ${input.limit || 10}
  `;

  console.log(`[MCP] Found ${results.length} full-text matches`);

  return {
    success: true,
    results,
    searchType: 'fulltext',
    query: input.query,
  };
}

/**
 * Hybrid search combining semantic + full-text
 */
export async function handleHybridSearch(
  input: {
    userId: string;
    query: string;
    limit?: number;
    semanticWeight?: number; // 0-1, default 0.7
    sessionId?: string;
  },
  session: MCPSession
) {
  console.log(`[MCP] Hybrid search for user ${input.userId}: "${input.query}"`);

  const semanticWeight = input.semanticWeight ?? 0.7;
  const fulltextWeight = 1 - semanticWeight;

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(input.query);

  // 2. Execute hybrid search with weighted scoring
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      entityType: string;
      entityId: string;
      content: string;
      metadata: any;
      semanticScore: number;
      fulltextScore: number;
      hybridScore: number;
    }>
  >`
    SELECT
      id,
      "userId",
      "entityType",
      "entityId",
      content,
      metadata,
      (1 - (embedding <-> ${`[${queryEmbedding.join(',')}]`}::vector)) AS "semanticScore",
      similarity(content, ${input.query}) AS "fulltextScore",
      (
        ${semanticWeight} * (1 - (embedding <-> ${`[${queryEmbedding.join(',')}]`}::vector)) +
        ${fulltextWeight} * similarity(content, ${input.query})
      ) AS "hybridScore"
    FROM "KnowledgeEmbedding"
    WHERE "userId" = ${input.userId}
    ORDER BY "hybridScore" DESC
    LIMIT ${input.limit || 10}
  `;

  console.log(`[MCP] Found ${results.length} hybrid matches`);

  return {
    success: true,
    results,
    searchType: 'hybrid',
    query: input.query,
    weights: {
      semantic: semanticWeight,
      fulltext: fulltextWeight,
    },
  };
}
```

---

## Phase E: Session Isolation (Fast Forks)

### Step E1: Session Management

**Already implemented in Step B3 (`server.ts`):**

```typescript
// Session storage with automatic cleanup
private sessions: Map<string, MCPSession>;

// Create/retrieve session per request
let session = this.sessions.get(sessionId);
if (!session) {
  session = {
    id: sessionId,
    userId,
    createdAt: new Date(),
    lastActivity: new Date(),
    context: new Map(),
  };
  this.sessions.set(sessionId, session);
}

// Cleanup stale sessions
cleanupSessions(maxAgeMinutes: number = 30) {
  const now = new Date();
  for (const [sessionId, session] of this.sessions) {
    const ageMinutes = (now.getTime() - session.lastActivity.getTime()) / 1000 / 60;
    if (ageMinutes > maxAgeMinutes) {
      this.sessions.delete(sessionId);
    }
  }
}
```

### Step E2: Database Transaction Isolation

**Pattern for all handlers:**

```typescript
// Use Prisma transactions for data safety
await prisma.$transaction(async (tx) => {
  // All database operations happen here
  // Automatically rolled back if any operation fails
}, {
  isolationLevel: 'ReadCommitted', // Prevent dirty reads
  maxWait: 5000, // Max 5s wait for lock
  timeout: 10000, // Max 10s transaction time
});
```

---

## Phase F: Testing & Integration

### Step F1: Unit Tests for Resume Parsing

**File:** `src/lib/mcp/__tests__/ingestion.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleParseResume } from '../handlers/ingestion';
import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
    embeddings: {
      create: vi.fn(),
    },
  })),
}));

describe('handleParseResume', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.knowledgeEmbedding.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.education.deleteMany();
    await prisma.experience.deleteMany();
    await prisma.userDocument.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should parse resume and create structured records', async () => {
    // 1. Create test user and document
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    const document = await prisma.userDocument.create({
      data: {
        userId: user.id,
        filename: 'resume.pdf',
        originalFilename: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedAt: new Date(),
        extractedText: `
          John Doe
          Software Engineer

          EXPERIENCE:
          Senior Developer at TechCorp (2020-2023)
          - Led team of 5 engineers
          - Built scalable microservices

          EDUCATION:
          B.S. Computer Science, MIT (2016-2020)

          SKILLS:
          Python, TypeScript, PostgreSQL
        `,
      },
    });

    // 2. Mock OpenAI responses
    const mockOpenAI = new OpenAI();
    vi.mocked(mockOpenAI.chat.completions.create).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              experiences: [
                {
                  title: 'Senior Developer',
                  company: 'TechCorp',
                  startDate: '2020-01',
                  endDate: '2023-12',
                  description: 'Led team of 5 engineers, built scalable microservices',
                  skills: ['Python', 'TypeScript'],
                },
              ],
              education: [
                {
                  degree: 'B.S. Computer Science',
                  institution: 'MIT',
                  startDate: '2016-09',
                  endDate: '2020-05',
                },
              ],
              skills: [
                { name: 'Python', category: 'technical', proficiency: 'expert' },
                { name: 'TypeScript', category: 'technical', proficiency: 'advanced' },
                { name: 'PostgreSQL', category: 'technical', proficiency: 'advanced' },
              ],
            }),
          },
        },
      ],
    } as any);

    vi.mocked(mockOpenAI.embeddings.create).mockResolvedValue({
      data: [
        {
          embedding: new Array(1536).fill(0.1),
        },
      ],
    } as any);

    // 3. Execute handler
    const result = await handleParseResume(
      {
        userId: user.id,
        documentId: document.id,
      },
      {
        id: 'test-session',
        userId: user.id,
        createdAt: new Date(),
        lastActivity: new Date(),
        context: new Map(),
      }
    );

    // 4. Verify results
    expect(result.success).toBe(true);
    expect(result.summary.experiencesCreated).toBe(1);
    expect(result.summary.educationCreated).toBe(1);
    expect(result.summary.skillsCreated).toBe(3);
    expect(result.summary.embeddingsCreated).toBe(2); // 1 experience + 1 education

    // 5. Verify database records
    const experiences = await prisma.experience.findMany({
      where: { userId: user.id },
    });
    expect(experiences).toHaveLength(1);
    expect(experiences[0].title).toBe('Senior Developer');

    const education = await prisma.education.findMany({
      where: { userId: user.id },
    });
    expect(education).toHaveLength(1);
    expect(education[0].institution).toBe('MIT');

    const skills = await prisma.skill.findMany({
      where: { userId: user.id },
    });
    expect(skills).toHaveLength(3);

    const embeddings = await prisma.knowledgeEmbedding.findMany({
      where: { userId: user.id },
    });
    expect(embeddings).toHaveLength(2);
  });
});
```

### Step F2: Integration Test

**File:** `src/lib/mcp/__tests__/end-to-end.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { SmartFolioMCPServer } from '../server';
import { prisma } from '@/lib/prisma';

describe('MCP Server End-to-End', () => {
  let server: SmartFolioMCPServer;
  let testUserId: string;
  let testDocumentId: string;

  beforeAll(async () => {
    server = new SmartFolioMCPServer();

    // Create test user and document
    const user = await prisma.user.create({
      data: {
        email: 'e2e-test@example.com',
        name: 'E2E Test User',
      },
    });
    testUserId = user.id;

    const doc = await prisma.userDocument.create({
      data: {
        userId: user.id,
        filename: 'test-resume.pdf',
        originalFilename: 'test-resume.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        uploadedAt: new Date(),
        extractedText: 'Sample resume content...',
      },
    });
    testDocumentId = doc.id;
  });

  it('should parse resume, create records, and query them', async () => {
    // 1. Parse resume (ingestion)
    const parseResult = await server.handleToolCall('parse_resume', {
      userId: testUserId,
      documentId: testDocumentId,
      sessionId: 'e2e-test-session',
    });

    expect(parseResult.success).toBe(true);

    // 2. Query with semantic search (read)
    const searchResult = await server.handleToolCall('semantic_search', {
      userId: testUserId,
      query: 'What programming languages does this user know?',
      limit: 5,
      sessionId: 'e2e-test-session',
    });

    expect(searchResult.success).toBe(true);
    expect(searchResult.results.length).toBeGreaterThan(0);

    // 3. Query with hybrid search
    const hybridResult = await server.handleToolCall('hybrid_search', {
      userId: testUserId,
      query: 'software engineering experience',
      limit: 10,
      sessionId: 'e2e-test-session',
    });

    expect(hybridResult.success).toBe(true);
    expect(hybridResult.searchType).toBe('hybrid');
  });
});
```

### Step F3: Manual Testing Script

**File:** `scripts/test-mcp.ts`

```typescript
#!/usr/bin/env tsx

import { SmartFolioMCPServer } from '../src/lib/mcp/server';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🚀 Starting MCP Server Test\n');

  // Find a user with documents
  const user = await prisma.user.findFirst({
    include: {
      documents: {
        where: {
          extractedText: { not: null },
        },
        take: 1,
      },
    },
  });

  if (!user || user.documents.length === 0) {
    console.error('❌ No user with uploaded documents found');
    console.log('Please upload a resume first');
    process.exit(1);
  }

  const document = user.documents[0];
  console.log(`✅ Found user: ${user.email}`);
  console.log(`✅ Found document: ${document.filename}\n`);

  const server = new SmartFolioMCPServer();

  // Test 1: Parse resume
  console.log('📝 TEST 1: Parsing resume...');
  try {
    const parseResult = await server.handleToolCall('parse_resume', {
      userId: user.id,
      documentId: document.id,
      sessionId: 'manual-test',
    });
    console.log('✅ Parse result:', JSON.stringify(parseResult.summary, null, 2));
  } catch (error) {
    console.error('❌ Parse failed:', error);
  }

  // Test 2: Semantic search
  console.log('\n🔍 TEST 2: Semantic search...');
  try {
    const searchResult = await server.handleToolCall('semantic_search', {
      userId: user.id,
      query: 'What are the main technical skills?',
      limit: 5,
      sessionId: 'manual-test',
    });
    console.log(`✅ Found ${searchResult.results.length} results`);
    console.log(
      'Top result:',
      JSON.stringify(searchResult.results[0], null, 2)
    );
  } catch (error) {
    console.error('❌ Search failed:', error);
  }

  // Test 3: Hybrid search
  console.log('\n🔍 TEST 3: Hybrid search...');
  try {
    const hybridResult = await server.handleToolCall('hybrid_search', {
      userId: user.id,
      query: 'software engineering experience',
      limit: 5,
      sessionId: 'manual-test',
    });
    console.log(`✅ Found ${hybridResult.results.length} results`);
  } catch (error) {
    console.error('❌ Hybrid search failed:', error);
  }

  console.log('\n✅ All tests complete!');
  process.exit(0);
}

main().catch(console.error);
```

**Run test:**
```bash
npx tsx scripts/test-mcp.ts
```

---

## Integration with Existing Code

### Step G1: Update Document Upload to Trigger AI Parsing

**File:** `src/components/DocumentUpload.tsx`

Add option to auto-parse after upload:

```typescript
const handleUpload = async (file: File) => {
  // ... existing upload logic ...

  // NEW: Option to auto-parse with AI
  if (autoParseEnabled) {
    try {
      const parseResponse = await fetch('/api/documents/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: uploadedDoc.id,
        }),
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse document');
      }

      const parseResult = await parseResponse.json();
      console.log('Document parsed:', parseResult);
    } catch (error) {
      console.error('Auto-parse failed:', error);
      // Don't fail upload if parse fails
    }
  }
};
```

### Step G2: Create Parse API Endpoint

**File:** `src/app/api/documents/parse/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SmartFolioMCPServer } from '@/lib/mcp/server';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { documentId } = await request.json();

  if (!documentId) {
    return NextResponse.json(
      { error: 'documentId is required' },
      { status: 400 }
    );
  }

  try {
    const server = new SmartFolioMCPServer();
    const result = await server.handleToolCall('parse_resume', {
      userId: session.user.id,
      documentId,
      sessionId: `web-${Date.now()}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse document' },
      { status: 500 }
    );
  }
}
```

---

## Success Criteria Checklist

After implementation, verify:

- [ ] `@modelcontextprotocol/sdk` installed
- [ ] `openai` package installed
- [ ] `zod` package installed
- [ ] Prisma schema updated for `vector(1536)`
- [ ] Database migration successful
- [ ] MCP server starts without errors
- [ ] `parse_resume` tool registered
- [ ] `semantic_search` tool registered
- [ ] `fulltext_search` tool registered
- [ ] `hybrid_search` tool registered
- [ ] Resume parsing creates Experience records
- [ ] Resume parsing creates Education records
- [ ] Resume parsing creates Skill records
- [ ] Resume parsing creates embeddings
- [ ] Semantic search returns results
- [ ] Full-text search returns results
- [ ] Hybrid search combines both methods
- [ ] Session isolation working (no data leakage)
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration test passing
- [ ] Manual test script successful

---

## Troubleshooting

### Issue: "Module not found: @modelcontextprotocol/sdk"
**Solution:** Ensure you installed with exact package name:
```bash
npm install @modelcontextprotocol/sdk
```

### Issue: "pgvector operator <-> does not exist"
**Solution:** Verify extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Issue: "Invalid embedding format"
**Solution:** pgvector expects string format:
```typescript
embedding: `[${embeddingVector.join(',')}]`  // ✅ Correct
embedding: embeddingVector  // ❌ Wrong
```

### Issue: "OpenAI rate limit exceeded"
**Solution:** Implement retry with exponential backoff:
```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
    }
  }
}
```

### Issue: "Session context not persisting"
**Solution:** For production, replace in-memory Map with Redis:
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

// Store session
await redis.set(`session:${sessionId}`, JSON.stringify(session), {
  ex: 1800, // 30 minutes
});
```

---

## Next Steps After Task 6

Once MCP server is working:

1. **Task 7**: Implement embedding generation for all content types
2. **Task 8**: Add GitHub integration (uses `analyze_github` tool)
3. **Task 9**: Add LinkedIn integration (uses `process_linkedin` tool)
4. **Task 10**: Build knowledge graph (relationship traversal queries)
5. **Task 12**: Build conversational UI (uses query tools)

---

## Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| A: Setup | 30 min | Packages installed, schema migrated |
| B: Infrastructure | 1 hour | MCP server running, tools registered |
| C: Ingestion | 2 hours | Resume parsing working |
| D: Queries | 1.5 hours | Search tools working |
| E: Sessions | 1 hour | Isolation implemented |
| F: Testing | 1.5 hours | All tests passing |
| **TOTAL** | **7.5 hours** | **Task 6 complete** |

---

## References

- [Model Context Protocol Docs](https://modelcontextprotocol.io/introduction)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Prisma Raw SQL](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)

---

**Ready to implement?** Start with Phase A (Setup) and work sequentially through the phases. Each phase builds on the previous one, so order matters.
