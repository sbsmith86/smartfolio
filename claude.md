# SmartFolio - Project Context for Claude

**Last Updated:** November 2, 2025
**Project Status:** 38% Complete (5 of 13 tasks)
**Hackathon Deadline:** November 9, 2025 at 11:59 PM PT (7 DAYS)

---

## Project Overview

**SmartFolio** is an AI-powered professional platform that transforms static resumes into intelligent, conversational profiles. Built for the TigerData Agentic Postgres Challenge (DEV.to hackathon).

### Core Value Proposition
Instead of static profiles, visitors can have natural conversations with your professional history. An AI agent uses Tiger MCP to autonomously query your profile database and answer questions like:
- "What experience does this person have with distributed systems?"
- "Tell me about their leadership experience"
- "What projects have they worked on with React?"

---

## Critical Context

### The Problem We Discovered
The implementation plan was created with a 10-month timeline in mind, but work didn't start until 7 days before the deadline. This means:
- ✅ Foundation is solid (auth, database, upload working)
- ❌ Tiger MCP integration (the key differentiator) is completely missing
- ⚠️ We have 7 DAYS to integrate Tiger MCP or submit without it

### Why Tiger MCP Matters
**TigerData Agentic Postgres Challenge** requires:
1. Tiger MCP - AI agents query database directly
2. Hybrid Search - pg_text (BM25) + pgvectorscale (vectors)
3. Fast Forks - Zero-copy database clones for sessions
4. Demonstration of agentic capabilities

**Without Tiger MCP, this project doesn't qualify for the hackathon.**

---

## Technology Stack

### Frontend
- Next.js 16.0.0 with App Router
- TypeScript 5.9.3
- Tailwind CSS v4
- Shadcn/ui components
- React 19.2.0

### Backend
- Next.js API routes
- Prisma ORM (currently used)
- PostgreSQL (TimescaleDB) at https://console.cloud.timescale.com/dashboard/services/d21tuhnc1z/overview
- NextAuth.js for authentication

### AI/ML
- OpenAI GPT-4o (for document processing)
- text-embedding-3-small (for vector embeddings)
- **NEEDS:** Tiger MCP for agentic database queries
- **NEEDS:** Anthropic Claude for MCP integration

### Testing
- Vitest for unit/integration tests
- Test coverage for document processing

---

## Current Architecture (Traditional - NOT Agentic)

```
User → Next.js → OpenAI API (standard SDK calls)
              → Prisma ORM → PostgreSQL (data storage)
```

**What's working:**
- Users can upload PDF/DOCX resumes
- AI extracts structured data (skills, experience, education)
- Data stored in PostgreSQL
- Vector embeddings created (but not used yet)
- Authentication with email/password + Google OAuth

**What's missing:**
- Tiger MCP integration
- AI agent autonomously querying database
- Hybrid search (pg_text + pgvectorscale)
- Fast Forks for session isolation
- Conversational chat interface

---

## Target Architecture (Tiger MCP - What We Need)

```
User Question
    ↓
Next.js API
    ↓
Tiger MCP Client
    ↓
    ┌─────────────────────────┐
    │  AI Agent (Claude)      │
    │  - Analyzes question    │
    │  - Inspects schema      │
    │  - Generates SQL        │
    │  - Executes query       │
    │  - Returns answer       │
    └─────────────────────────┘
    ↓
Tiger MCP Server
    ↓
PostgreSQL (Agentic Postgres)
```

---

## Database Schema (11 Tables)

### Core Tables
1. **User** - User accounts, profile info
2. **Account** - OAuth accounts
3. **Session** - Auth sessions
4. **VerificationToken** - Email verification

### Profile Data
5. **UserDocument** - Uploaded resumes/documents
6. **UserLink** - LinkedIn/GitHub URLs
7. **Testimonial** - Recommendations

### Structured Profile Data
8. **Skill** - Master skills list
9. **UserSkill** - User-skill relationships with proficiency
10. **Experience** - Work history
11. **Education** - Educational background

### AI/ML Data
12. **KnowledgeEmbedding** - Vector embeddings (1536 dimensions)
13. **ChatSession** - Conversation sessions (planned)
14. **ChatMessage** - Chat history (planned)

**Key Detail:** Vector embeddings ARE being created during document upload but NOT being used for search yet.

---

## File Structure

```
smartfolio/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── documents/
│   │   │   │   ├── upload/route.ts ✅ DONE
│   │   │   │   └── [id]/process/route.ts ✅ DONE
│   │   │   └── register/route.ts ✅ DONE
│   │   ├── dashboard/
│   │   │   ├── page.tsx ✅ DONE
│   │   │   └── documents/page.tsx ✅ DONE
│   │   ├── sign-in/page.tsx ✅ DONE
│   │   ├── sign-up/page.tsx ✅ DONE
│   │   └── page.tsx ✅ DONE (Homepage)
│   ├── components/
│   │   ├── DocumentUpload.tsx ✅ DONE
│   │   └── ui/ (Shadcn components)
│   ├── lib/
│   │   ├── auth.ts ✅ DONE
│   │   ├── prisma.ts ✅ DONE
│   │   ├── env.ts ✅ DONE
│   │   └── documentProcessor.ts ✅ DONE
│   └── lib/__tests__/
│       ├── documentProcessor.test.ts ✅ DONE
│       └── documentProcessor.integration.test.ts ✅ DONE
├── prisma/
│   └── schema.prisma ✅ DONE
├── Planning/
│   ├── implementation-plan.md ✅ Updated with accurate status
│   ├── IMPLEMENTATION_AUDIT.md ✅ Gap analysis
│   ├── TIGER_MCP_RESEARCH.md ✅ Research complete
│   ├── TIGER_MCP_ROADMAP.md ✅ 10-week plan
│   └── STATUS_SUMMARY.md ✅ Executive summary
└── TIGER_MCP_NEXT_STEPS.md ✅ Immediate actions

MISSING (Critical for Tiger MCP):
├── src/lib/mcp/
│   ├── server.ts ❌ NOT STARTED
│   ├── client.ts ❌ NOT STARTED
│   └── agent.ts ❌ NOT STARTED
├── src/app/api/chat/
│   └── mcp/route.ts ❌ NOT STARTED
└── src/components/ChatInterface.tsx ❌ NOT STARTED
```

---

## Task Status (13 Tasks Total)

### ✅ Phase 1: Complete (4/4 tasks)
1. ✅ Task 1: Next.js project setup
2. ✅ Task 2: Database schema with Prisma
3. ✅ Task 3: Authentication (email + Google OAuth)
4. ✅ Task 4: UI redesign (homepage, dashboard, auth pages)

### ⚠️ Phase 2: Partially Complete (1/4 tasks)
5. ✅ Task 5: Document upload & AI processing (WITHOUT Tiger MCP)
6. ❌ Task 6: Profile management interface
7. ❌ Task 7: LinkedIn/GitHub links management
8. ❌ Task 8: Testimonial system

### ❌ Phase 3: Not Started (0/2 tasks) - **TIGER MCP REQUIRED**
9. ❌ Task 9: Intent-based vector embeddings & search
10. ❌ Task 10: Chat interface with adaptive responses

### ❌ Phase 4: Not Started (0/3 tasks)
11. ❌ Task 11: Comprehensive testing
12. ❌ Task 12: Production deployment
13. ❌ Task 13: Performance optimization

**Overall: 38% Complete (5/13 tasks done)**

---

## What Works Right Now

### ✅ Authentication System
- Email/password registration and login
- Google OAuth integration
- Protected routes with NextAuth
- Session management

### ✅ Document Upload & Processing
- Drag-and-drop PDF/DOCX upload
- Text extraction (pdf-parse, mammoth)
- AI processing with GPT-4o:
  - Extracts: name, email, phone, location
  - Parses: skills, experience, education
  - Creates: vector embeddings (stored but unused)
- Automatic profile population
- Document management page
- Error handling and validation

### ✅ Database
- All 11 tables created
- pgvector extension enabled
- Prisma ORM working
- TimescaleDB hosted on Tiger Cloud

### ✅ UI/UX
- Modern, professional design
- Mobile responsive
- Homepage with value proposition
- Dashboard with navigation
- Auth pages (sign-in/sign-up)

---

## What's Missing (Critical for Hackathon)

### ❌ Tiger MCP Integration (CRITICAL)
**Status:** Not started, needs 2-3 days minimum

**Required:**
1. Install `@modelcontextprotocol/server-postgres`
2. Install `@anthropic-ai/sdk`
3. Set up MCP server configuration
4. Create MCP client in Next.js
5. Build AI agent that queries database autonomously

### ❌ Hybrid Search (CRITICAL)
**Status:** Not started, needs 1-2 days

**Required:**
1. Enable pg_text extension for BM25 search
2. Verify pgvectorscale working (should be available)
3. Create hybrid search queries
4. Train agent on search strategies

### ❌ Fast Forks (HIGHLY UNIQUE)
**Status:** Not started, needs 1 day

**Required:**
1. Test Fast Fork capability with Tiger CLI
2. Create fork management service
3. Integrate with chat sessions
4. Implement cleanup

### ❌ Chat Interface (CRITICAL)
**Status:** Not started, needs 2-3 days

**Required:**
1. Public profile pages
2. Chat component
3. MCP agent integration
4. Streaming responses
5. Session management

### ❌ Profile Viewing
**Status:** Not started, would be nice to have

Users can upload documents but can't see their extracted profile data anywhere. Would need:
1. Profile display page
2. Skills list
3. Experience timeline
4. Education display

---

## Environment Variables Required

### Current (.env.local)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=sk-...
```

### Still Needed
```
ANTHROPIC_API_KEY=sk-ant-... (for Claude MCP)
TIGER_DATABASE_URL=postgresql://... (may be same as DATABASE_URL)
```

---

## Hackathon Requirements

### TigerData Agentic Postgres Challenge
**Deadline:** November 9, 2025 at 11:59 PM PT (7 days from now)
**URL:** https://dev.to/challenges/tigerdata-2025-10-15

### Judging Criteria (25% each)
1. **Use of underlying technology** - Must use Tiger MCP, pg_text, Fast Forks
2. **Usability and User Experience** - Intuitive, polished interface
3. **Accessibility** - WCAG compliance, keyboard nav, screen readers
4. **Creativity** - Novel application of agentic capabilities

### Required Features to Showcase
- ✅ Tiger CLI (can demonstrate)
- ❌ Tiger MCP (NOT IMPLEMENTED)
- ❌ pg_text search (NOT IMPLEMENTED)
- ❌ Fast Forks (NOT IMPLEMENTED)
- ✅ Fluid Storage (using TimescaleDB)

### Prize
- $1,000 USD + Exclusive DEV Badge + DEV++ Membership (3 winners)

---

## 7-Day Emergency Plan (If Attempting Hackathon)

### Day 1-2 (Nov 2-3): MCP Foundation
- [ ] Verify Tiger Cloud database access
- [ ] Install Tiger MCP dependencies
- [ ] Get "Hello World" MCP agent working
- [ ] Agent answers: "How many users are in the database?"

### Day 3-4 (Nov 4-5): Hybrid Search + Basic Chat
- [ ] Enable pg_text extension
- [ ] Test hybrid search queries manually
- [ ] Build basic chat interface component
- [ ] MCP agent queries profiles with hybrid search

### Day 5-6 (Nov 6-7): Fast Forks OR Polish (Pick ONE)
- [ ] Option A: Implement Fast Forks for sessions
- [ ] Option B: Polish existing features thoroughly
- [ ] Add accessibility features
- [ ] Improve error handling

### Day 7 (Nov 8): Demo & Submit
- [ ] Record 3-minute demo video
- [ ] Write DEV.to submission post
- [ ] Deploy to production
- [ ] Submit before 11:59 PM PT

---

## Alternative: Skip Hackathon, Build Properly

If 7 days isn't enough, we can:
1. Skip this hackathon submission
2. Continue with original 10-week plan
3. Build Tiger MCP integration properly
4. Create a genuinely unique product
5. Find other opportunities to showcase it

**This might be the smarter move** - rushed work won't win anyway.

---

## Key Files to Reference

When working on this project, always check:

1. **Planning/implementation-plan.md** - Full task list with code examples
2. **Planning/TIGER_MCP_RESEARCH.md** - How Tiger MCP works
3. **Planning/TIGER_MCP_ROADMAP.md** - Week-by-week implementation plan
4. **TIGER_MCP_NEXT_STEPS.md** - Immediate action items
5. **prisma/schema.prisma** - Database structure
6. **src/lib/documentProcessor.ts** - AI processing logic

---

## Common Commands

```bash
# Development
npm run dev                # Start dev server
npm run build             # Build for production
npm test                  # Run tests
npm run test:watch        # Run tests in watch mode

# Database
npx prisma generate       # Generate Prisma client
npx prisma migrate dev    # Run migrations
npx prisma studio         # Open database GUI

# Tiger CLI (once installed)
tiger db connect d21tuhnc1z     # Connect to database
tiger fork create --source db --name test  # Create fork
tiger fork list           # List forks
tiger fork delete --name test   # Delete fork
```

---

## Decision Point: What Should We Do?

### Option 1: 7-Day Sprint (High Risk)
**Attempt Tiger MCP integration in 7 days**
- Pros: Might qualify for hackathon, learn cutting-edge tech
- Cons: Rushed, likely buggy, may not finish
- Verdict: Only if you can dedicate 8+ hours/day

### Option 2: Skip Hackathon (Smart)
**Continue with original plan**
- Pros: Build it right, no pressure, better product
- Cons: Miss $1,000 prize opportunity, no deadline pressure
- Verdict: Probably the better choice given 7 days

### Option 3: Submit What Exists (Low Effort)
**Submit current state with honest positioning**
- Pros: Something submitted, shows progress
- Cons: Won't win (doesn't meet requirements), doesn't showcase Tiger
- Verdict: Only if you want participation badge

---

## Current State Summary

**What we have:**
- Solid foundation (auth, database, UI)
- Working document upload with AI processing
- Vector embeddings created (but not used)
- Clean, professional codebase
- Good documentation

**What we're missing:**
- The entire Tiger MCP integration (the point of the hackathon)
- Chat interface
- Profile viewing
- Hybrid search
- Fast Forks

**Honest assessment:**
- 38% done overall
- 0% done on Tiger MCP requirements
- 7 days to deadline
- Need 2-3 weeks minimum to do it right

**Recommendation:**
Skip this hackathon, build Tiger MCP integration properly over next month, find another opportunity to showcase it.

---

## Important Notes for Claude

1. **Always check this file first** when starting work on SmartFolio
2. **Update task status** as work is completed
3. **The user's timeline was misunderstood** - original plan assumed months, we have days
4. **Tiger MCP is NOT optional** - it's the entire point of the project
5. **Don't promise things will work without testing** - user got frustrated with this
6. **Current architecture is traditional** - OpenAI API + Prisma, NOT agentic
7. **Database has embeddings** - they're created but not being used yet
8. **TimescaleDB = Tiger Cloud** - same company, recently rebranded

---

## Next Session Checklist

When you start a new session:
- [ ] Read this claude.md file
- [ ] Check Planning/STATUS_SUMMARY.md for latest updates
- [ ] Ask user about hackathon decision (submit in 7 days or skip?)
- [ ] If continuing, ask what task to work on
- [ ] Update this file with any new progress or decisions
