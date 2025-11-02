# SmartFolio Implementation Plan - Intelligence-First Professional Platform

**Target Completion:** December 15, 2025
**Current Status:** Foundation Mostly Complete, MCP Integration Required (5 of 15 tasks done)
**Last Updated:** November 2, 2025

---

## Overview

This implementation plan builds **SmartFolio: The Intelligence-First Professional Platform** - a conversational career profile system powered by Model Context Protocol (MCP) and Agentic Postgres architecture. The platform consolidates professional data from resumes, GitHub, LinkedIn, project documentation, and testimonials into one intelligent knowledge base that visitors can explore through natural conversation.

**Core Value Proposition:**
SmartFolio transforms scattered professional data into unified, conversational experiences. Instead of static profiles across multiple platforms, professionals get one intelligent hub where visitors can naturally explore their career story through AI-powered conversations grounded in verified documents and achievements.

**Powered by Agentic Postgres (TigerData Architecture):**
- **Model Context Protocol (MCP)**: AI agents both structure incoming data AND query existing data using Anthropic's official SDK
- **pgvector + pg_trgm**: Hybrid search finds the most relevant career experiences for any question
- **Fast Forks**: Isolated conversation sessions ensure personalized, contextual visitor interactions
- **Fluid Storage**: Professional data automatically enhances conversational intelligence as it grows
- **AI Data Structuring**: Unstructured uploads (resumes, GitHub, LinkedIn) → Structured database records via AI agents

**Key Platform Features:**
- **AI-Powered Data Ingestion**: Unstructured uploads (PDFs, GitHub, LinkedIn) → Structured database records via AI agents
- Multi-source data integration (resumes, GitHub, LinkedIn, projects, testimonials, certifications, portfolios)
- AI-powered knowledge graph connecting projects, skills, experiences, and achievements
- Natural conversational interface for visitors to explore professional history
- Adaptive responses based on visitor intent and context
- Privacy controls for public/private/permission-based content
- Verified testimonials with request/approval workflow

**Dual AI Architecture (Agentic Postgres):**

1. **Data Ingestion Flow** - AI agents WRITE to database:
   ```
   Unstructured Upload → MCP AI Agent → Structured Database Records

   Examples:
   - Resume PDF → Extract Experience, Education, Skills tables
   - GitHub Repo → Create Project, Skills, auto-link to Experiences
   - LinkedIn Profile → Standardize titles, detect skill overlaps
   ```

2. **Conversational Flow** - AI agents READ from database:
   ```
   Visitor Question → MCP AI Agent → Query Database → Natural Response

   Examples:
   - "What Python projects?" → Vector search + SQL → "3 projects: ..."
   - "Where did they work?" → Query Experiences → "TechCorp 2020-2023..."
   - "What skills?" → Hybrid search → "Python, React, PostgreSQL..."
   ```

---

# Implementation Status Summary

| Phase | Tasks | Status | MCP Integration |
|-------|-------|--------|-----------------|
| **Phase 1: Foundation** | 5 tasks | ✅ 100% Complete (5/5) | ❌ No AI in Phase 1 |
| **Phase 2: MCP & AI** | 2 tasks | ⏳ 50% Complete (1/2) | 🎯 **CRITICAL - DO THIS NEXT** |
| **Phase 3: Data Integration** | 6 tasks | ❌ 0% Complete (0/6) | ✅ Will be AI-first from day one |
| **Phase 4: Interface & Deploy** | 3 tasks | ❌ 0% Complete (0/3) | ✅ Uses existing infrastructure |
| **TOTAL** | **16 tasks** | **38% Complete (6/16)** | **🎯 Task 7 unlocks everything** |

**Key Status Notes:**
- **Phase 1 is COMPLETE**: All foundation work (auth, database, document upload) done with zero AI
- **Task 6 is PARTIALLY COMPLETE**: PostgreSQL extensions enabled (pgvector v0.8.1, pg_trgm v1.6), MCP server implementation pending
- **Task 7 (Embeddings) is the IMMEDIATE PRIORITY** - enables all subsequent AI features
- Text extraction (pdf-parse, mammoth) is not AI - it's just parsing libraries
- All data integration tasks (8-11) will be AI-enabled from the start because MCP is set up first

---

# Phase 1: Foundation & Authentication ✅ COMPLETE

**Target Completion:** Week 2
**Actual Completion:** October 27, 2025
**Status:** ✅ 5 of 5 tasks complete - No AI/intelligence features in this phase

**Phase 1 Scope:**
This phase establishes the core application infrastructure with **zero AI integration**. All AI/intelligence work happens in Phase 2 after Tiger MCP is set up. Phase 1 is pure CRUD: authentication, database, file uploads, and UI.

---

## Task 1: Initialize Next.js project with TypeScript ✅ COMPLETE

**Status:** ✅ Complete

**Completed:** October 27, 2025

**What was accomplished:**
- ✅ Created Next.js 14+ project with TypeScript, Tailwind CSS, and ESLint
- ✅ Installed core dependencies: Prisma, NextAuth, Zod
- ✅ Set up document processing libraries (pdf-parse, mammoth)
- ✅ Configured Shadcn/ui components (button, input, card, form, etc.)
- ✅ Set up environment variable validation with Zod
- ✅ Configured PostgreSQL (TimescaleDB) connection

**Success Criteria:**
- ✅ Project runs on localhost:3000
- ✅ Tailwind CSS styling works
- ✅ Environment validation passes
- ✅ Database connection established

**Note:** No AI libraries installed in Phase 1. OpenAI SDK and Model Context Protocol SDK will be added in Phase 2.

---

## Task 2: Set up database schema with Prisma ✅ COMPLETE

**Status:** ✅ Complete

**Completed:** October 27, 2025

**What was accomplished:**
- ✅ All 11 tables created successfully in TimescaleDB
- ✅ User authentication fields (passwordHash, googleId)
- ✅ UserDocument for file uploads (supports multiple types)
- ✅ UserLinks for GitHub/LinkedIn/portfolio connections
- ✅ Testimonials with verification system
- ✅ Experience, Education, Skills tables for profile data
- ✅ KnowledgeEmbeddings table for vector search
- ✅ ChatSessions and ChatMessages for conversation tracking
- ✅ Database migration pushed and verified

**Architecture Notes:**
- ⚠️ Embedding column uses `Float[]` (simple array) - will be migrated to `vector` type in Task 6
- ⚠️ KnowledgeEmbeddings table exists but is unused until Phase 2
- ⚠️ ChatSessions and ChatMessages tables exist but unused until Phase 4

**Success Criteria:**
- ✅ Prisma schema valid and migrated
- ✅ All tables exist in database
- ✅ Prisma client generates successfully
- ✅ Can query database from Next.js

**Note:** Phase 1 uses standard Prisma ORM. MCP integration, pgvector extension, and Fast Forks configuration happen in Phase 2.

---

## Task 3: Implement NextAuth.js with email/password and Google OAuth ✅ COMPLETE

**Status:** ✅ Complete

**Completed:** October 27, 2025

**What was accomplished:**
- ✅ NextAuth.js configured with Prisma adapter
- ✅ Email/password authentication with bcrypt hashing
- ✅ Google OAuth provider configured
- ✅ Signin page created (`/src/app/auth/signin/page.tsx`)
- ✅ Signup page created (`/src/app/auth/signup/page.tsx`)
- ✅ Signup API endpoint (`/src/app/api/auth/signup/route.ts`)
- ✅ Session management with JWT strategy
- ✅ Protected dashboard with session verification
- ✅ SessionProvider in app layout
- ✅ TypeScript definitions for NextAuth
- ✅ Both auth methods tested and working

**File Locations:**
- `/src/lib/auth.ts` - NextAuth configuration
- `/src/app/auth/signin/page.tsx` - Sign in UI
- `/src/app/auth/signup/page.tsx` - Sign up UI
- `/src/app/api/auth/signup/route.ts` - User registration endpoint
- `/src/app/api/auth/[...nextauth]/route.ts` - NextAuth API routes

**Success Criteria:**
- ✅ Users can register with email/password
- ✅ Users can sign in with email/password
- ✅ Users can sign in with Google OAuth
- ✅ Sessions persist correctly
- ✅ Protected routes redirect unauthenticated users
- ✅ Dashboard shows user information

---

## Task 4: Create protected dashboard page ✅ COMPLETE

**Status:** ✅ Complete

**Completed:** October 27, 2025

**What was accomplished:**
- ✅ Protected dashboard route requiring authentication
- ✅ Session-based access control
- ✅ User greeting with personalization
- ✅ Professional UI with Tailwind styling
- ✅ Navigation to sub-pages (documents, links, etc.)
- ✅ Sign out functionality

**UI Components:**
- Welcome section with user's name
- Quick action cards for:
  - Resume/Documents upload
  - GitHub/LinkedIn connections
  - Testimonial management
  - Profile preview placeholder
- Clean, professional design

**Success Criteria:**
- ✅ Dashboard requires authentication
- ✅ Redirects to signin if not authenticated
- ✅ Shows personalized user information
- ✅ Provides navigation to key features
- ✅ Professional, polished UI

**Note:** UI mentions "conversational profile" and "AI features" but these are placeholders - actual AI functionality comes in Phase 2-4.

---

## Task 5: Implement document upload with text extraction ✅ COMPLETE

**Status:** ✅ Complete (for Phase 1 scope - AI processing in Phase 2)

**Completed:** October 27, 2025

**What was accomplished:**
- ✅ File upload API endpoint (`/api/documents/upload`)
- ✅ PDF text extraction using pdf-parse (library-based, no AI)
- ✅ DOCX text extraction using mammoth (library-based, no AI)
- ✅ File type validation (PDF, DOCX only)
- ✅ File size validation (10MB limit)
- ✅ User-specific upload directories (`/uploads/{userId}/`)
- ✅ Database persistence (file metadata + extracted text)
- ✅ Document upload component (`DocumentUpload.tsx`)
- ✅ Documents management page (`/dashboard/documents`)
- ✅ Drag-and-drop file upload UI
- ✅ Upload progress indication
- ✅ Document listing with delete functionality

**File Locations:**
- `/src/lib/documentProcessor.ts` - Text extraction logic (pdf-parse, mammoth)
- `/src/app/api/documents/upload/route.ts` - Upload endpoint
- `/src/components/DocumentUpload.tsx` - Upload UI component
- `/src/app/dashboard/documents/page.tsx` - Document management page
- `/uploads/{userId}/` - User upload directories

**Success Criteria:**
- ✅ Users can upload PDF files
- ✅ Users can upload DOCX files
- ✅ Text extracts correctly from both formats (using standard libraries)
- ✅ Files save to user-specific directories
- ✅ Extracted text stores in database (UserDocument.extractedText field)
- ✅ Upload UI provides feedback
- ✅ Documents list displays uploaded files
- ✅ Users can delete uploaded documents

**Phase 1 Scope Complete:**
This task provides full document upload and text extraction using standard document parsing libraries (pdf-parse for PDFs, mammoth for DOCX). No AI is involved in Phase 1.

**What Phase 2 Will Add:**
Task 7 will add AI processing on top of this foundation:
- **AI-Powered Data Structuring**: Parse resume text → Extract structured experience, education, skills
- **Vector Embeddings**: Generate embeddings from extracted text for semantic search
- **Conversational Search**: Enable natural language queries across uploaded documents
- Store embeddings in KnowledgeEmbeddings table

**Key Insight:**
Text extraction ≠ AI. Libraries like pdf-parse and mammoth just parse file formats and return plain text. **AI comes in Phase 2** when we use MCP agents to:
1. **Structure** that text into database records (Experience, Education, Skills)
2. **Search** that text conversationally via embeddings
Update the implementation plan to reflect using @modelcontextprotocol/sdk instead of fictional @tigerdata packages?
# Phase 2: Model Context Protocol & AI Foundation ⏳ IN PROGRESS

**Target Completion:** Week 5
**Current Status:** 50% Complete (1 of 2 tasks done)
**Last Update:** November 2, 2025

This phase establishes the Model Context Protocol (MCP) infrastructure that powers SmartFolio's intelligence-first architecture. By setting up AI-to-database communication early, all subsequent data integration (GitHub, LinkedIn, portfolios) can immediately leverage **dual AI capabilities**:

1. **Data Ingestion**: AI agents transform unstructured uploads into structured database records
2. **Conversational Access**: AI agents query structured data to answer natural language questions

This avoids building "dumb storage" that needs refactoring later - every data source becomes immediately both structured AND conversationally accessible.

**Why MCP First:**
- **Enables AI-first development** from the start for both ingestion and queries
- **Every upload gets structured automatically** - resumes become Experience/Education/Skills records
- **Every data point becomes conversationally accessible** immediately after structuring
- Avoids refactoring traditional data storage to support AI later
- Aligns with TigerData's "Agentic Postgres" architectural vision
- Uses official Anthropic MCP SDK with PostgreSQL optimized for AI agents

---

## Task 6: Set up MCP server with pgvector + pg_trgm extensions ✅ PARTIALLY COMPLETE

**Status:** ✅ Extensions Enabled, ⏳ MCP Server Implementation Pending

**Target Completion:** Week 4

**Overview:**
Set up Model Context Protocol (MCP) server infrastructure and enable PostgreSQL extensions (pgvector, pg_trgm) that power SmartFolio's **dual AI capabilities**:

1. **Data Ingestion**: AI agents transform unstructured data (resumes, GitHub repos, LinkedIn profiles) into structured database records
2. **Conversational Intelligence**: AI agents query structured data to answer visitor questions naturally

This follows TigerData's "Agentic Postgres" architecture where AI agents both **write** (structure incoming data) and **read** (answer queries) from the database.

**Note on "Tiger MCP":** TigerData doesn't provide custom npm packages. Instead, they use the official `@modelcontextprotocol/sdk` from Anthropic with PostgreSQL optimized for AI agents. "Tiger MCP" refers to their architectural pattern, not specific packages.

**Dependencies:**
- Task 2: Database schema
- TimescaleDB PostgreSQL instance

**Implementation Requirements:**

1. **Enable PostgreSQL Extensions** ✅ COMPLETE
```sql
-- Enable pgvector for semantic similarity search
CREATE EXTENSION IF NOT EXISTS vector;  -- ✅ v0.8.1 installed

-- Enable pg_trgm for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- ✅ v1.6 installed
```

2. **Install MCP SDK and Dependencies**
```bash
# Install official Model Context Protocol SDK
npm install @modelcontextprotocol/sdk

# Install OpenAI for embeddings (used in Task 7)
npm install openai

# Install PostgreSQL client for direct vector queries (optional - can use Prisma)
npm install postgres
```

3. **Create MCP Server Implementation**
   - Create `src/lib/mcp/server.ts` - MCP server configuration
   - Create `src/lib/mcp/tools.ts` - Register AI agent tools for both data ingestion and queries
   - Create `src/lib/mcp/handlers.ts` - Handle AI-to-database requests
   - Set up database connection using existing DATABASE_URL

   **Data Ingestion Tools (AI Writes to Database):**
   - Parse resume PDFs → Extract structured experience, education, skills
   - Analyze GitHub repos → Create project, skill, and experience records
   - Process LinkedIn data → Populate experience, education, certification tables
   - Smart entity linking → Connect related data automatically

   **Conversational Query Tools (AI Reads from Database):**
   - Vector similarity search (semantic queries)
   - Full-text search (pg_trgm for fuzzy matching)
   - Hybrid search combining both approaches
   - Relationship traversal (knowledge graph queries)

4. **Implement "Fast Forks" Session Isolation**
   - Create isolated database sessions per chat visitor
   - Use PostgreSQL transaction isolation for safety
   - Clean up sessions after conversations end
   - Prevent data leakage between concurrent users

5. **Update Prisma Schema for pgvector**
```prisma
model KnowledgeEmbedding {
  id        String   @id @default(cuid())
  userId    String
  entityType String
  entityId  String
  content   String
  embedding Unsupported("vector(1536)")  // Changed from Float[]
  createdAt DateTime @default(now())
  // ... rest of schema
}
```

**Success Criteria:**
- [x] pgvector extension enabled in PostgreSQL (v0.8.1)
- [x] pg_trgm extension enabled in PostgreSQL (v1.6)
- [ ] @modelcontextprotocol/sdk installed
- [ ] MCP server implemented with dual-purpose tools (ingestion + queries)
- [ ] **Data Ingestion**: AI can parse unstructured data → create structured records
- [ ] **Conversational**: AI can query structured data → answer natural language questions
- [ ] Vector similarity search working (semantic queries)
- [ ] Full-text search (pg_trgm) working (fuzzy matching)
- [ ] Hybrid search combining both methods
- [ ] Fast Forks session isolation implemented
- [ ] Prisma schema updated for vector type
- [ ] Database migration successful

---

## Task 7: Generate embeddings and implement hybrid search ❌ NOT STARTED

**Status:** ❌ Not Started

**Target Completion:** Week 5

**Overview:**
Generate vector embeddings for all professional content AND implement AI-powered data structuring. This task transforms SmartFolio from a "dumb storage" system into an intelligent platform that both:

1. **Structures unstructured data**: AI agents parse resumes, GitHub repos, LinkedIn profiles → create structured database records
2. **Enables conversational queries**: Hybrid search (pgvector + pg_trgm) answers natural language questions about professional data

**Dependencies:**
- Task 6: MCP server infrastructure
- OpenAI API (for embedding generation - already configured)

**Implementation Requirements:**

1. **AI-Powered Data Structuring Service** (NEW - Core Agentic Postgres Feature)
   - **Resume Parsing**: AI extracts structured data from unstructured resume text
     - Parse job experiences → Create Experience records (company, title, dates, description)
     - Extract education → Create Education records (institution, degree, dates)
     - Identify skills → Create UserSkill records with proficiency levels
     - Link experiences to skills automatically
   - **GitHub Analysis** (used in Task 8): AI structures repository data
     - README parsing → Extract project descriptions, tech stack
     - Language statistics → Infer skill proficiency
     - Commit analysis → Identify contribution patterns
   - **LinkedIn Processing** (used in Task 9): AI validates and enhances manually entered data
     - Standardize company names, job titles
     - Detect skill overlaps between experiences
     - Suggest missing connections

2. **Embedding Generation Service**
   - Generate embeddings for all text content
   - Use OpenAI text-embedding-3-small model (or open-source alternative)
   - Batch processing for efficiency

3. **Content Text Preparation**
   - Prepare rich, contextual text for embeddings
   - Include relationships and metadata
   - Example: "Senior Software Engineer at TechCorp (2020-2023): Led team of 5 building Python/React microservices"
   - Store with proper indexing

4. **Automatic Embedding Generation Hooks**
   - Auto-generate embeddings when AI structures new data (completes Task 5)
   - Auto-generate embeddings when GitHub/LinkedIn data syncs
   - Update embeddings when content changes
   - Background jobs for batch processing

5. **Hybrid Search Implementation via MCP**
   - Combine vector similarity + full-text search
   - Rank results by relevance
   - Filter by user permissions

**Success Criteria:**
- [ ] **AI Data Structuring**: Resume text → Structured Experience/Education/Skills records
- [ ] **AI Data Structuring**: GitHub repos → Structured Project/Skill records
- [ ] **AI Data Structuring**: Automatic relationship detection (skills ↔ experiences)
- [ ] Embeddings generated for all user content
- [ ] Task 5 document upload now uses AI to structure AND embed data
- [ ] Hybrid search implemented and tested
- [ ] Search results are relevant and accurate
- [ ] Performance is acceptable (sub-second queries)
- [ ] Background jobs process new content
- [ ] OpenAI API integration working
- [ ] Dashboard shows AI-extracted data (not just raw text)

---

# Phase 3: Data Integration & Knowledge Graph ❌ NOT STARTED

**Target Completion:** Week 8
**Current Status:** 0% Complete (0 of 6 tasks done)
**Last Update:** November 2, 2025

This phase integrates external data sources (GitHub, LinkedIn) and builds the intelligent knowledge graph. **Because MCP is already set up (Tasks 6-7), every piece of data imported becomes immediately conversationally accessible** - no refactoring needed later.

---

## Task 7.5: Create user settings page with profile controls ❌ NOT STARTED

**Status:** ❌ Not Started

**Target Completion:** Week 5

**Overview:**
Build a comprehensive user settings page that allows users to control their profile visibility, manage account settings, and configure experience calculation preferences. This enables users to customize how their professional data is presented and calculated.

**Dependencies:**
- Task 1: Next.js setup
- Task 2: Database schema (User model)
- Task 3: Authentication (session management)
- Profile page implementation (already complete)

**Implementation Requirements:**

1. **Settings Page Route**
   - Create `/dashboard/settings/page.tsx`
   - Protected route requiring authentication
   - Tab-based navigation for different setting categories

2. **Profile Settings Tab**
   - **Public Profile Toggle**: Enable/disable public profile visibility
   - **Username**: Set custom username for shareable URL (e.g., `/profile/sarah-martinez`)
   - **Career Start Date**: Optional field to define when professional career began
     - Helps calculate accurate "years in industry" vs "years of documented experience"
     - Useful for addressing resume gaps (e.g., graduated 2008 but first listed job is 2015)
   - **Profile Picture**: Upload custom image or use OAuth provider image
   - **Bio**: Multi-line text area for professional summary
   - **Location**: Current location/city

3. **Experience Calculation Settings**
   - **Metric Display Preference**:
     - "Sum of positions" (default): Shows total time across listed jobs
     - "Career span": Shows time since career start date
     - "Both": Shows both metrics with labels
   - **Career Start Date**: Calendar picker (YYYY-MM format)
   - **Auto-detect from GitHub**: Checkbox to use earliest commit date as career start
   - **Info tooltip**: Explains difference between metrics with example

4. **Privacy Settings Tab**
   - Profile visibility (public/private/authenticated users only)
   - Document visibility controls (which document types to show on public profile)
   - Testimonial visibility (require approval before showing)
   - Skills visibility (show/hide specific skill categories)

5. **Account Settings Tab**
   - Email (display only, managed by OAuth provider)
   - Connected accounts (GitHub, LinkedIn) with disconnect option
   - Export data (download all profile data as JSON)
   - Delete account (with confirmation modal)

6. **Database Updates**
   - Add fields to User model:
     ```prisma
     model User {
       // ... existing fields
       username              String?   @unique
       careerStartDate       DateTime?
       experienceMetricPreference String? @default("sum_of_positions") // "sum_of_positions" | "career_span" | "both"
       autoDetectCareerStart Boolean?  @default(false)
       publicProfileEnabled  Boolean   @default(true)
     }
     ```

7. **API Endpoints**
   - `PATCH /api/settings/profile` - Update profile settings
   - `PATCH /api/settings/privacy` - Update privacy settings
   - `GET /api/settings` - Fetch current settings
   - `POST /api/settings/username/check` - Check username availability

8. **Experience Calculation Updates**
   - Update `/api/profile/[username]/route.ts` to use user's metric preference
   - If `careerStartDate` is set and preference is "career_span" or "both":
     ```typescript
     const careerSpanYears = calculateCareerSpan(user.careerStartDate, new Date());
     const sumOfExperienceYears = calculateYearsOfExperience(experiences);

     stats: {
       experienceYears: user.experienceMetricPreference === 'career_span'
         ? careerSpanYears
         : sumOfExperienceYears,
       careerSpanYears: user.experienceMetricPreference === 'both' ? careerSpanYears : undefined,
       sumOfExperienceYears: user.experienceMetricPreference === 'both' ? sumOfExperienceYears : undefined,
     }
     ```

9. **Conversational AI Enhancement**
   - When visitor asks "How many years of experience?", AI provides context-aware response:
   - Example (with career start date):
     ```
     "Shae has 8.5 years of documented professional experience across 3 roles,
      with a career spanning 17 years since 2008. GitHub contributions date back to 2010."
     ```
   - Example (without career start date):
     ```
     "Shae has 8.5 years of documented experience across 3 positions in the resume."
     ```

**Success Criteria:**
- [ ] Settings page accessible from dashboard with clean UI
- [ ] Users can set custom username for shareable profile URLs
- [ ] Users can define career start date to address resume gaps
- [ ] Experience metric preference persists and displays correctly on profile
- [ ] Profile visibility toggle works (public/private)
- [ ] Username availability check prevents duplicates
- [ ] Form validation ensures data integrity (valid dates, unique usernames)
- [ ] Changes save successfully with success/error notifications
- [ ] Profile page respects user's metric preference
- [ ] Conversational AI uses enhanced experience data for complete responses

**UI Components:**
- Tabs for different settings categories
- Form inputs with validation
- Toggle switches for boolean settings
- Calendar picker for dates
- Save/Cancel buttons with loading states
- Success/error toast notifications

---

## Task 8: Implement GitHub integration with repository analysis ❌ NOT STARTED

**Status:** ❌ Not Started

**Target Completion:** Week 6

**Overview:**
Enable users to connect their GitHub accounts and automatically import repository data, README content, commit history, and project documentation. **Because MCP is already configured (Tasks 6-7), all GitHub data immediately becomes conversationally accessible with embeddings generated automatically.**

**Dependencies:**
- Task 5: Document upload system (for storing README content)
- Task 6-7: MCP infrastructure (for automatic embedding generation)
- GitHub OAuth app registration
- GitHub API client setup

**Implementation Requirements:**

1. **GitHub OAuth Setup**
   - Register OAuth app in GitHub Developer Settings
   - Add environment variables: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
   - Update `src/lib/env.ts` to include GitHub credentials

2. **API Endpoints**
   - `POST /api/github/connect` - Initiate OAuth flow
   - `GET /api/github/callback` - Handle OAuth callback
   - `POST /api/github/sync` - Sync repository data
   - `DELETE /api/github/disconnect` - Remove GitHub connection

3. **Data Extraction**
   - Fetch user's repositories (public + private if authorized)
   - **AI Agent**: Extract README content → Parse project descriptions, tech stack, purpose
   - **AI Agent**: Analyze language statistics → Infer skill proficiency levels
   - **AI Agent**: Parse commit messages → Identify contribution patterns and role
   - **AI Agent**: Create structured Project records with auto-detected skills
   - Store as UserLink + UserDocument + auto-generated Experience/Skill entries

4. **Knowledge Graph Integration**
   - **AI Agent**: Create project nodes linking to repositories
   - **AI Agent**: Extract skills from repository languages/topics
   - **AI Agent**: Connect projects to experiences (if dates overlap with employment)
   - **Embeddings generate automatically via Task 7 hooks**

**Success Criteria:**
- [ ] Users can connect GitHub via OAuth
- [ ] Repositories fetch and display in dashboard
- [ ] **AI Agent**: README content → Structured project descriptions
- [ ] **AI Agent**: Language stats → Skill proficiency records
- [ ] **AI Agent**: Repository metadata → Auto-categorized projects
- [ ] UserLink record created with verification status
- [ ] Project-skill relationships auto-detected by AI
- [ ] **Embeddings generated automatically for all GitHub content**
- [ ] **Repository data immediately conversationally accessible via MCP**
- [ ] Dashboard shows AI-structured data (not just raw README text)

---

## Task 9: Implement LinkedIn profile synchronization ❌ NOT STARTED

**Status:** ❌ Not Started

**Target Completion:** Week 7

**Overview:**
Allow users to import their LinkedIn profile data including experience, education, skills, and certifications. Since LinkedIn's API is restrictive, implement manual profile URL entry with manual data entry with verification. **With MCP already configured, all LinkedIn data becomes immediately searchable and conversationally accessible.**

**Dependencies:**
- Task 2: Database schema (UserLink, Experience, Education, Skills)
- Task 6-7: MCP infrastructure (for automatic embedding generation)

**Implementation Approach:**

**Manual Profile Import (Recommended)**
- User provides LinkedIn profile URL
- User manually enters or confirms data
- SmartFolio stores and structures the information
- UserLink records verification that data came from LinkedIn

**Data to Import:**
1. **Experiences** - Company name, position, dates, description
2. **Education** - Institution, degree, field of study, dates
3. **Skills** - Skill name and proficiency level
4. **Certifications** - Name, issuing organization, dates, credential ID

**Success Criteria:**
- [ ] Users can provide LinkedIn profile URL
- [ ] Manual import interface for experiences, education, skills
- [ ] **AI Agent**: Validate and enhance manually entered data (standardize titles, detect skill overlaps)
- [ ] Data validates and stores in appropriate tables
- [ ] Certification table created and functional
- [ ] UserLink created with LinkedIn URL
- [ ] **Embeddings automatically generated for all imported data**
- [ ] **Data immediately conversationally accessible via MCP**
- [ ] AI suggests missing connections between experiences and skills

---

## Task 10: Build intelligent knowledge graph and relationships ❌ NOT STARTED

**Status:** ❌ Not Started

**Target Completion:** Week 8

**Overview:**
Create an intelligent knowledge graph that connects all professional data points: projects ↔ skills ↔ experiences ↔ testimonials ↔ certifications. **With MCP already operational, the knowledge graph can be queried conversationally from day one** - no separate integration step needed.

**Dependencies:**
- Task 8: GitHub integration
- Task 9: LinkedIn synchronization
- Task 5: Document upload
- Task 6-7: MCP infrastructure (already complete)

**Knowledge Graph Architecture:**

The knowledge graph represents relationships between:
- **Projects** (GitHub repos, portfolio pieces) ↔ **Skills** (languages, frameworks)
- **Experiences** (jobs) ↔ **Skills** (what you used where)
- **Projects** ↔ **Experiences** (projects during specific jobs)
- **Testimonials** ↔ **Experiences** (recommendations from colleagues)
- **Certifications** ↔ **Skills** (validated expertise)
- **Documents** (resumes, project docs) ↔ **All entities**

**Implementation Requirements:**

1. **Automatic Relationship Discovery**
   - Parse GitHub repository languages → Create skill connections
   - Match project dates with employment dates → Link projects to experiences
   - Extract skills from testimonial content → Validate skill endorsements
   - Link certifications to related skills → Strengthen expertise claims

2. **AI-Powered Analysis**
   - Use MCP to analyze text content and infer relationships
   - Generate confidence scores for each connection
   - Identify missing connections and suggest to user

3. **Conversational Query Preparation**
   - Generate text descriptions of relationships for embeddings
   - Example: "Used Python and TensorFlow in Machine Learning Engineer role at TechCorp (2020-2023) for recommendation system project"
   - **Embeddings automatically generated via Task 7 hooks**
   - **Immediately queryable via MCP conversational interface**

**Success Criteria:**
- [ ] Knowledge graph builds from all user data sources
- [ ] Automatic skill-experience connections created
- [ ] Project-skill relationships established
- [ ] Testimonial-experience links validated
- [ ] Certification-skill connections made
- [ ] Relationship strengths calculated with confidence scores
- [ ] Graph data stored efficiently in database
- [ ] Rich text descriptions generated for each connection
- [ ] **Embeddings created automatically for conversational search**
- [ ] **Knowledge graph immediately queryable via MCP**
- [ ] Dashboard shows knowledge graph visualization

---

## Task 11: Implement portfolio pieces and certifications upload ❌ NOT STARTED

**Status:** ❌ Not Started

**Target Completion:** Week 8

**Overview:**
Expand document upload capabilities to support portfolio pieces (case studies, design work, articles) and professional certifications. **With MCP configured, all portfolio and certification content becomes immediately conversationally searchable.**

**Dependencies:**
- Task 5: Document upload system
- Task 6-7: MCP infrastructure (for automatic embedding generation)

**Implementation Requirements:**

1. **Extend Document Types**
   - 'resume'
   - 'project_documentation' - GitHub README, tech specs
   - 'portfolio_piece' - Case studies, design work, articles
   - 'certification' - Credential PDFs, badges
   - 'other'

2. **Portfolio Piece Upload**
   - Support additional file types: images (JPG, PNG), presentations (PPTX), links
   - Extract metadata: title, description, technologies used, date completed
   - Link to related projects or experiences
   - Make shareable in public profile

3. **Certification Management**
   - Upload certification documents
   - Link to credential verification URL
   - Badge display for public profile
   - Verification workflow

**Success Criteria:**
- [ ] Certification table created in database
- [ ] Portfolio piece upload interface implemented
- [ ] Certification upload and management system built
- [ ] Document type categorization expanded
- [ ] Metadata extraction for both content types
- [ ] Knowledge graph integration (certs → skills)
- [ ] Public profile displays portfolio and certifications
- [ ] Verification workflow for certifications
- [ ] **Embeddings automatically generated for all content**
- [ ] **Portfolio and certifications immediately conversationally searchable via MCP**

---

# Phase 4: Conversational Interface & Deployment ❌ NOT STARTED

**Target Completion:** Week 10
**Current Status:** 0% Complete (0 of 3 tasks done)
**Last Update:** November 2, 2025

This phase builds the visitor-facing conversational AI interface and deploys to production. **Because MCP was set up early (Tasks 6-7), this phase focuses purely on UI/UX and deployment, not infrastructure setup.**

---

## Task 12: Implement conversational AI interface with session isolation ❌ NOT STARTED

**Status:** ❌ Not Started

**Target Completion:** Week 9

**Overview:**
Build the conversational AI interface that allows visitors to explore professional profiles through natural language. **MCP infrastructure is already operational (Tasks 6-7), so this is purely about building the chat UI and connecting to existing services.**

**Dependencies:**
- Task 6-7: MCP infrastructure (already complete at this stage)
- Task 10: Knowledge graph (provides rich contextual data for queries)

**Implementation Requirements:**

1. **Chat Interface Component**
   - Build chat UI for visitor questions
   - Real-time streaming responses
   - Message history display
   - Loading states and error handling

2. **MCP Integration**
   - Connect to MCP server
   - Send natural language queries
   - Receive structured responses
   - Handle session management

3. **Fast Forks Session Isolation**
   - Create isolated database sessions per visitor
   - Prevent data leakage between sessions
   - Clean up sessions after chat ends

4. **Intent Recognition**
   - Detect visitor intent (technical skills, experience, projects, etc.)
   - Route queries to appropriate data sources
   - Adapt responses based on context

**Success Criteria:**
- [ ] Chat interface functional and responsive
- [ ] MCP queries return relevant results
- [ ] Fast Forks isolation working correctly
- [ ] Session management implemented
- [ ] Intent recognition accurate
- [ ] Response quality meets standards
- [ ] Error handling graceful

---

## Task 13: Build testimonial request and verification workflow ❌ NOT STARTED

**Status:** ❌ Not Started

**Target Completion:** Week 9

**Overview:**
Implement the complete workflow for requesting, receiving, and verifying professional testimonials. This includes email notifications, approval process, and display on public profiles.

**Dependencies:**
- Task 3: Authentication system
- Email service setup (e.g., SendGrid, Resend)

**Implementation Requirements:**

1. **Request Testimonial Interface**
   - Form to request testimonial from colleague
   - Email template for request
   - Tracking status of requests

2. **Testimonial Submission**
   - Public form for recommenders
   - No account required to submit
   - Validation and spam prevention

3. **Approval Workflow**
   - User reviews submitted testimonials
   - Approve/reject/edit functionality
   - Email notifications

4. **Public Display**
   - Show verified testimonials on profile
   - Privacy controls (public/private)
   - Badge for verified testimonials

**Success Criteria:**
- [ ] Users can request testimonials via email
- [ ] Recommenders can submit without account
- [ ] Approval workflow functional
- [ ] Email notifications working
- [ ] Public display respects privacy settings
- [ ] Spam prevention implemented

---

## Task 14: Comprehensive testing and hackathon demo preparation ❌ NOT STARTED

**Status:** ❌ Not Started

**Target Completion:** Week 9-10

**Overview:**
Write comprehensive tests for all features, prepare demo data, and create hackathon presentation materials.

**Dependencies:**
- All previous tasks

**Implementation Requirements:**

1. **Unit Tests**
   - Test utility functions
   - Test data processing logic
   - Test API endpoints

2. **Integration Tests**
   - Test MCP integration
   - Test authentication flows
   - Test document processing

3. **End-to-End Tests**
   - Test complete user journeys
   - Test conversational interface
   - Test data import workflows

4. **Demo Preparation**
   - Create sample profiles with rich data
   - Prepare demo script
   - Create presentation slides
   - Record demo video

**Success Criteria:**
- [ ] Test coverage >80%
- [ ] All critical paths tested
- [ ] Demo data prepared
- [ ] Presentation materials ready
- [ ] Demo script practiced
- [ ] Known bugs documented

---

## Task 15: Deploy to production and finalize documentation ❌ NOT STARTED

**Status:** ❌ Not Started

**Target Completion:** Week 10

**Overview:**
Deploy SmartFolio to production (Vercel), set up monitoring, and finalize all documentation including README, API docs, and deployment guide.

**Dependencies:**
- Task 14: Testing complete
- All features implemented

**Implementation Requirements:**

1. **Production Deployment**
   - Deploy to Vercel
   - Configure environment variables
   - Set up custom domain
   - Configure database connection

2. **Monitoring & Logging**
   - Set up error tracking (Sentry)
   - Configure analytics
   - Set up uptime monitoring
   - Configure logging

3. **Documentation**
   - Update README with setup instructions
   - Write API documentation
   - Create deployment guide
   - Document MCP configuration

4. **Final Polish**
   - Performance optimization
   - SEO optimization
   - Accessibility audit
   - Security audit

**Success Criteria:**
- [ ] Application deployed to production
- [ ] Monitoring and logging configured
- [ ] Documentation complete and accurate
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] Accessibility standards met
- [ ] Ready for hackathon submission

---

# Task Dependencies Diagram

```
Phase 1 (Foundation) ✅ 100% COMPLETE - NO AI
├── Task 1: Next.js Setup ✅
├── Task 2: Database Schema ✅
│   └── depends on: Task 1
├── Task 3: Authentication ✅
│   └── depends on: Task 2
├── Task 4: Dashboard ✅
│   └── depends on: Task 3
└── Task 5: Document Upload & Text Extraction ✅
    └── depends on: Task 4
    └── Note: Uses pdf-parse/mammoth libraries, not AI

Phase 2 (Model Context Protocol Foundation) ⏳ IN PROGRESS - UNLOCKS ALL AI
├── Task 6: MCP Setup ⏳ 🎯 WEEK 4 PRIORITY (Partially Complete - Extensions Enabled)
│   └── depends on: Task 2
└── Task 7: Embeddings & Search ❌ 🎯 WEEK 5 PRIORITY (IMMEDIATE NEXT)
    └── depends on: Task 6
    └── ✅ Adds AI processing to Task 5's uploaded documents

Phase 3 (Data Integration) ❌ AI-FIRST FROM DAY ONE
├── Task 8: GitHub Integration ❌
│   └── depends on: Tasks 5, 6-7 (MCP)
├── Task 9: LinkedIn Import ❌
│   └── depends on: Tasks 2, 6-7 (MCP)
├── Task 10: Knowledge Graph ❌
│   └── depends on: Tasks 8, 9, 6-7 (MCP)
└── Task 11: Portfolio & Certs ❌
    └── depends on: Tasks 5, 6-7 (MCP)

Phase 4 (Conversational Interface & Deploy) ❌ PURE UI/UX WORK
├── Task 12: Conversational AI Interface ❌
│   └── depends on: Tasks 6-7 (infrastructure ready), Task 10 (data ready)
├── Task 13: Testimonials ❌
│   └── depends on: Task 3
├── Task 14: Testing & Demo ❌
│   └── depends on: All previous tasks
└── Task 15: Production Deploy ❌
    └── depends on: Task 14
```

---

# Next Steps

**🎯 IMMEDIATE PRIORITY (Week 4-5):**
1. **Task 6 (Complete)**: Finish MCP server implementation with @modelcontextprotocol/sdk
2. **Task 7 (Start)**: Implement embedding generation and hybrid search
   - This completes Task 5's document upload feature
   - Unlocks all subsequent data integration

**Week 6-8 (AI-First Data Integration):**
1. Task 8: GitHub integration (embeddings auto-generated)
2. Task 9: LinkedIn synchronization (embeddings auto-generated)
3. Task 10: Knowledge graph (queryable via MCP from day one)
4. Task 11: Portfolio & certifications (embeddings auto-generated)

**Week 9 (Conversational Interface):**
1. Task 12: Build chat UI and connect to existing MCP infrastructure

**Week 10 (Final Sprint):**
1. Task 13: Testimonial workflow
2. Task 14: Comprehensive testing and demo prep
3. Task 15: Production deployment

**Hackathon Submission:** December 15, 2025

**Why This Order Matters:**
- MCP setup (Tasks 6-7) enables AI infrastructure before data integration
- Every piece of data added after Week 5 is AI-enabled from the start
- No refactoring "dumb storage" into "smart storage" later
- Aligns with TigerData's "Agentic Postgres" architectural vision
- Reduces overall development time and complexity

---

**Document Version:** 4.0 (MCP with Actual Packages)
**Last Updated:** November 2, 2025
**Status:** Using @modelcontextprotocol/sdk (official Anthropic SDK) following TigerData's Agentic Postgres architecture
