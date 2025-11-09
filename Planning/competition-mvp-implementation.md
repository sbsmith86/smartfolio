# SmartFolio Competition MVP - Implementation Plan

**Status:** One profile exists with resume data (8 experiences, 2 education, 31 skills, 10 embeddings)
**User:** shae@hostechnology.com (ID: cmhi6nmxk0000oaap9cge82q7)
**Deadline:** November 9, 2025 @ 23:59 PT

---

## Task 1: ~~Seed single candidate profile data~~ ✅ COMPLETE

**Status:** ✅ Already complete - profile exists with structured resume data

**What's Done:**
- User profile exists with 11 documents
- AI-structured: 8 experiences, 2 education records, 31 skills
- Embeddings generated: 10 knowledge embeddings

**Test:**
```bash
node scripts/check-profile-data.js
```

**Expected Output:**
- User email, experiences, education, skills, embeddings counts
- "✅ Profile has resume data with AI structuring and embeddings"

---

## Task 2: ~~Build GitHub username import~~ ✅ COMPLETE

**Goal:** Fetch public repos by username (no OAuth), parse READMEs, structure Projects + Skills, generate embeddings.

**What's Done:**
- ✅ Created `/src/app/api/github/import/route.ts` with GPT-4o README parsing
- ✅ Fetches top 5 repos, parses with temperature=0 for deterministic output
- ✅ Creates Experience records (company="GitHub") with project details
- ✅ Extracts skills using global Skill table + UserSkill junction pattern
- ✅ Generates embeddings using raw SQL for pgvector compatibility
- ✅ Test result: 5 projects added (chopchop, modal, rogue, neue, dosomething), 12 skills added, 5 embeddings created
- ✅ Profile now has 23 experiences (up from 8), 50 skills (up from 31), 20 embeddings (up from 10)

**Implementation Steps:**
1. ✅ Create `/src/app/api/github/import/route.ts`
2. ✅ Accept `POST { username: string, userId: string }`
3. ✅ Fetch repos: `https://api.github.com/users/{username}/repos?sort=updated&per_page=5`
4. ✅ For each repo, fetch README via GitHub API
5. ✅ Use GPT-4o to parse README → extract: project name, description, tech stack
6. ✅ Create `Project` records (new table or use Experience with type='project')
7. ✅ Extract skills, link to UserSkill (dedupe by canonical name)
8. ✅ Generate embeddings for each project description
9. ✅ Return summary: projects added, skills added

**Files Created:**
- `/src/app/api/github/import/route.ts` (303 lines)
- `/scripts/test-github-import.sh` (bash test script)
- Updated `/src/middleware.ts` to allow public access to `/api/github/*`
- Updated `/src/lib/openai-utils.ts` to export openai client

**Test:**
```bash
# Via API
curl -X POST http://localhost:3000/api/github/import \
  -H "Content-Type: application/json" \
  -d '{"username":"sbsmith86","userId":"cmhi6nmxk0000oaap9cge82q7"}'

# Result: {"success":true,"projectsAdded":5,"skillsAdded":12,"embeddingsCreated":5,"errors":0}
# Projects: chopchop, modal, rogue, neue, dosomething
```

**Acceptance Criteria:**
- [x] API endpoint responds with 200
- [x] At least 3 repos processed (5 processed: chopchop, modal, rogue, neue, dosomething)
- [x] Skills extracted and linked (12 new skills)
- [x] Embeddings created for project descriptions (5 embeddings)
- [x] Projects queryable via hybrid search (integrated with existing search infrastructure)

---

## Task 2.5: ~~Build GitHub import UI in dashboard~~ ✅ COMPLETE

**Goal:** Create dashboard UI for users to input their GitHub username and trigger import, similar to resume upload flow.

**What's Done:**
- ✅ Created `/src/app/dashboard/import/github/page.tsx` with form UI
- ✅ Input field for GitHub username with validation
- ✅ Import button calls API with session user ID automatically
- ✅ Loading state with spinner during import
- ✅ Success message displays counts (projects, skills, embeddings)
- ✅ Error handling for failures (username not found, rate limits, API errors)
- ✅ Updated dashboard to link to GitHub import page
- ✅ Styled consistent with dashboard theme (gradient cards, Tailwind)

**Implementation Steps:**
1. ✅ Create `/src/app/dashboard/import/github/page.tsx`
2. ✅ Add form with:
   - Input field for GitHub username
   - "Import Projects" button
   - Loading state during import
   - Success/error messages
3. ✅ On submit:
   - POST to `/api/github/import` with `{ username, userId: session.user.id }`
   - Display loading spinner
   - Show success message with count of projects/skills/embeddings added
   - Show error if username not found or API fails
4. ✅ Add navigation link in dashboard sidebar/menu
5. ✅ Style consistent with resume upload UI

**Files Created:**
- `/src/app/dashboard/import/github/page.tsx` (289 lines)
- Updated `/src/app/dashboard/page.tsx` (added GitHub import navigation)

**Test:**
```bash
# 1. Login to dashboard
open http://localhost:3000/dashboard

# 2. Navigate to GitHub import page
# Click "Import GitHub" link in sidebar

# 3. Enter GitHub username
# Input: sbsmith86

# 4. Click "Import Projects"

# 5. Verify success message shows
# "✅ Imported 5 projects, 12 skills, 5 embeddings"

# 6. Verify data in database
node scripts/check-profile-data.js
```

**Expected Output:**
- GitHub import page loads in dashboard
- Form accepts GitHub username input
- Import button triggers API call
- Loading state displays during processing
- Success message shows projects/skills/embeddings counts
- Error handling for invalid usernames

**Acceptance Criteria:**
- [ ] Page accessible at `/dashboard/import/github`
- [ ] Form accepts GitHub username input
- [ ] Import button calls API with session user ID
- [ ] Loading state shows during import
- [ ] Success message displays counts
- [ ] Error messages display for failures (user not found, rate limits, etc.)
- [ ] Consistent styling with dashboard theme

---

## Task 3: ~~Build LinkedIn profile paste import~~ ✅ COMPLETE

**Goal:** Accept pasted LinkedIn text, parse with GPT-4o, extract/normalize Experience/Education/Skills, generate embeddings.

**What's Done:**
- ✅ Created `/src/app/api/linkedin/import/route.ts` with GPT-4o parsing (321 lines)
- ✅ Accepts `POST { profileText: string, userId: string }`
- ✅ GPT-4o extracts experiences, education, skills with structured JSON output
- ✅ Skill categorization (technical/soft/language/certification/other)
- ✅ Creates Experience/Education records with embeddings via raw SQL
- ✅ Global Skill table + UserSkill junction for deduplication
- ✅ **Duplicate detection**: Checks existing records before creating new ones
  - Experiences: Matches on company + position + startDate
  - Education: Matches on institution + degree
- ✅ Created `/src/app/dashboard/import/linkedin/page.tsx` UI (277 lines)
- ✅ Large textarea for profile text, character counter, instructions
- ✅ Success display with 4 stat cards (experiences/education/skills/embeddings)
- ✅ Fixed SQL column naming (camelCase "userId" vs snake_case user_id)
- ✅ Enhanced error handling for partial failures
- ✅ Smart UI messaging: Differentiates between duplicates vs errors
- ✅ Blue info box for skipped duplicates, yellow for errors

**Implementation Steps:**
1. ✅ Create `/src/app/api/linkedin/import/route.ts`
2. ✅ Accept `POST { profileText: string, userId: string }`
3. ✅ Use GPT-4o to parse text → extract:
   - Experiences (company, title, dates, description)
   - Education (institution, degree, field, dates)
   - Skills (name, endorsements optional)
4. ✅ Normalize company names, standardize titles
5. ✅ Create/update Experience, Education, UserSkill records (with duplicate checks)
6. ✅ Mark provenance as 'linkedin' (via metadata)
7. ✅ Generate embeddings for each experience/education
8. ✅ Return summary: experiences added, education added, skills added

**Files Created:**
- `/src/app/api/linkedin/import/route.ts` (321 lines)
- `/src/app/dashboard/import/linkedin/page.tsx` (277 lines)
- Updated `/src/app/dashboard/page.tsx` (added LinkedIn import navigation with gradient button)
- `/scripts/test-deduplication.js` (deduplication verification script)
- `/scripts/clean-duplicates.js` (one-time cleanup of existing duplicates)

**Test:**
```bash
# Via dashboard UI
# 1. Go to http://localhost:3000/dashboard/import/linkedin
# 2. Paste LinkedIn profile text (from PDF export)
# 3. Click "Import LinkedIn Profile"
# 4. Verify success metrics or "skipped duplicate" messages

# Check for duplicates
node scripts/test-deduplication.js

# Clean existing duplicates (one-time)
node scripts/clean-duplicates.js
```

**Expected Output:**
- JSON: `{ success: true, experiencesAdded: N, educationAdded: M, skillsAdded: P, embeddingsCreated: X, errors: [...] }`
- Database: New Experience/Education records with embeddings (no duplicates)
- KnowledgeEmbedding records generated with "userId", "contentType", etc. (camelCase)
- UI shows error if all items fail, success with blue info box for skipped duplicates
- Duplicate message: "Skipped duplicate: Technical Lead at IHG (2024-01)"

**Acceptance Criteria:**
- [x] API endpoint parses LinkedIn text successfully
- [x] Experiences normalized (title, company, dates)
- [x] Skills deduplicated via global Skill table
- [x] Embeddings created with correct column names
- [x] UI shows proper error feedback when import fails
- [x] Partial failures display warning within success message
- [x] Button re-enables after processing completes
- [x] **Duplicates prevented**: Same job not created twice from resume + LinkedIn
- [x] Smart messaging: Blue info for duplicates, yellow for errors

---

## Task 4: ~~Create public profile page route~~ ✅ COMPLETE

**Goal:** Build `/profile/[username]` route that displays structured profile data with provenance badges, publicly accessible (no auth).

**What's Done:**
- ✅ Created `/src/app/profile/[username]/page.tsx` (579 lines) - Full profile page with all sections
- ✅ Created `/src/app/api/profile/[username]/route.ts` (181 lines) - Public API endpoint
- ✅ Public access - No authentication required, works in incognito mode
- ✅ Username OR ID lookup - Flexible user identification
- ✅ Comprehensive sections: Header, Stats, Experiences, GitHub Projects, Education, Skills, Testimonials
- ✅ Provenance badges: 📄 Resume, 💻 GitHub, 💼 LinkedIn
- ✅ Responsive design with Tailwind
- ✅ Privacy check - Returns 403 if profile is private
- ✅ Stats calculation: Experience years, skills count, testimonials count, projects count
- ✅ Middleware configured to allow public profile access

**Implementation Steps:**
1. ✅ Add `username` field to User model (if not exists) and set default
2. ✅ Create `/src/app/profile/[username]/page.tsx`
3. ✅ Fetch user by username (public route, no auth check)
4. ✅ Fetch experiences, education, skills, projects
5. ✅ Render sections:
   - Header: Name, bio, location
   - Experiences (with provenance icons: 📄 Resume / 💻 GitHub / 💼 LinkedIn)
   - Education
   - Skills (grouped by category)
   - Projects (if from GitHub)
6. ✅ Style with Tailwind, responsive design
7. ✅ Add "Coming Soon" badges for missing features

**Files Created:**
- `/src/app/profile/[username]/page.tsx` (579 lines)
- `/src/app/api/profile/[username]/route.ts` (181 lines)
- Updated `/src/middleware.ts` to allow public access to profile routes

**Test:**
```bash
# 1. Set username for existing user (if needed)
# Update user: username = 'shae' or 'shaesmith'

# 2. Visit public profile
open http://localhost:3000/profile/shae

# 3. Test in incognito (no login)
# Chrome: Cmd+Shift+N
# Open http://localhost:3000/profile/shae
```

**Expected Output:**
- Profile loads without auth
- Experiences listed with dates, descriptions
- Education section visible
- Skills displayed with categories
- Provenance badges show source (Resume/GitHub/LinkedIn)

**Acceptance Criteria:**
- [x] Page loads without authentication
- [x] All experiences, education, skills visible
- [x] Provenance badges display correctly (📄 Resume, 💻 GitHub)
- [x] Responsive design works on mobile
- [x] URL is shareable (works in incognito)

---

## Task 5: ~~Build candidate chat UI component~~ ✅ COMPLETE

**Status:** ✅ Complete - Chat UI components created and integrated into profile page

**What's Done:**
- ✅ Created `/src/components/CandidateChat.tsx` (261 lines) - Main chat interface component
- ✅ Created `/src/components/ChatMessage.tsx` (65 lines) - Individual message display with avatars
- ✅ Created `/src/components/ChatCitation.tsx` (84 lines) - Clickable citations with type-based styling
- ✅ Integrated chat into `/profile/[username]` page in sticky sidebar (600px height)
- ✅ Chat open by default with example prompts
- ✅ Message state management with loading/error handling
- ✅ Auto-scroll to latest messages
- ✅ Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- ✅ Citation click handlers scroll to relevant profile sections
- ✅ Added section IDs: experience-section, education-section, skills-section, testimonials-section
- ✅ Gradient styling matching dashboard theme (amber/orange)
- ✅ Responsive textarea that grows with content

**Implementation Steps:**
1. ✅ Create `/src/components/CandidateChat.tsx`
2. ✅ State: messages array, input text, loading state
3. ✅ Render:
   - Chat header: "Chat about this candidate"
   - Message history (user questions + AI answers)
   - Input box + submit button
   - Example prompts (clickable)
4. ✅ On submit:
   - POST to `/api/chat` with `{ userId, question }`
   - Display loading state
   - Append answer to messages
   - Show citations as clickable links
5. ✅ Auto-scroll to latest message
6. ✅ Add to profile page (open by default)

**Files Created:**
- `/src/components/CandidateChat.tsx` (261 lines)
- `/src/components/ChatMessage.tsx` (65 lines)
- `/src/components/ChatCitation.tsx` (84 lines)

**Files Modified:**
- `/src/app/profile/[username]/page.tsx` (added chat component in sidebar, section IDs)

**Test:**
```bash
# 1. Start dev server
npm run dev

# 2. Open profile
open http://localhost:3000/profile/shae

# 3. Verify chat panel is visible and open by default

# 4. Click example prompt or type question
# Example: "What Python experience does this candidate have?"

# 5. Verify answer appears with citations (once API is implemented)
```

**Expected Output:**
- Chat panel visible on page load in right sidebar
- Example prompts clickable
- Can type and submit questions
- Loading state shows while processing
- Answer appears with citations (links to experiences)
- Citations scroll to relevant sections when clicked

**Acceptance Criteria:**
- [x] Chat panel renders open by default in sticky sidebar
- [x] Can submit questions via input or example prompts
- [x] Loading state displays during processing
- [x] Citations have type-based colors and icons
- [x] Citation clicks scroll to relevant profile sections
- [x] Auto-scrolls to latest message
- [x] Keyboard shortcuts work (Enter/Shift+Enter)
- [x] Responsive on mobile
- [x] Gradient styling matches dashboard theme

---

## Task 6: Build chat API endpoint with retrieval

**Goal:** `/api/chat` endpoint that uses hybrid search to retrieve relevant data, synthesizes answer with GPT-4o, returns grounded response with citations.

**Implementation Steps:**
1. Create `/src/components/CandidateChat.tsx`
2. State: messages array, input text, loading state
3. Render:
   - Chat header: "Chat about this candidate"
   - Message history (user questions + AI answers)
   - Input box + submit button
   - Example prompts (clickable)
4. On submit:
   - POST to `/api/chat` with `{ userId, question }`
   - Display loading state
   - Append answer to messages
   - Show citations as clickable links
5. Auto-scroll to latest message
6. Add to profile page (open by default)

**Files to Create:**
- `/src/components/CandidateChat.tsx`
- `/src/components/ChatMessage.tsx`
- `/src/components/ChatCitation.tsx`

**Test:**
```bash
# 1. Start dev server
npm run dev

# 2. Open profile
open http://localhost:3000/profile/shae

# 3. Verify chat panel is visible and open by default

# 4. Click example prompt or type question
# Example: "What Python experience does this candidate have?"

# 5. Verify answer appears with citations
```

**Expected Output:**
- Chat panel visible on page load
- Example prompts clickable
- Can type and submit questions
- Loading state shows while processing
- Answer appears with citations (links to experiences)

**Acceptance Criteria:**
- [ ] Chat panel renders open by default
- [ ] Can submit questions via input or example prompts
- [ ] Loading state displays during processing
- [ ] Answers include citations with links
- [ ] Auto-scrolls to latest message
- [ ] Works on mobile

---

## Task 6: Build chat API endpoint with retrieval

**Goal:** `/api/chat` endpoint that uses hybrid search to retrieve relevant data, synthesizes answer with GPT-4o, returns grounded response with citations.

**Implementation Steps:**
1. Create `/src/app/api/chat/route.ts`
2. Accept `POST { userId: string, question: string, conversationHistory?: array }`
3. Generate embedding for question (existing utility)
4. Use hybrid search to retrieve top 5-10 relevant items:
   - Experiences (semantic + fulltext)
   - Education (semantic + fulltext)
   - Skills (fulltext)
   - Projects (semantic + fulltext if available)
5. Build context from retrieved items
6. Call GPT-4o with prompt:
   - System: "You are answering questions about a candidate's profile. Only use provided context."
   - Context: Retrieved experiences, education, skills, projects
   - Question: User's question
7. Parse response, extract citations (reference specific experiences/projects by ID)
8. Return: `{ answer: string, citations: [{ id, type, title, excerpt }] }`

**Files to Create:**
- `/src/app/api/chat/route.ts`
- `/src/lib/chat-utils.ts` (context builder, citation parser)

**Test:**
```bash
# Via curl
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cmhi6nmxk0000oaap9cge82q7",
    "question": "What Python experience does this candidate have?"
  }'

# Expected response:
# {
#   "answer": "The candidate has extensive Python experience...",
#   "citations": [
#     { "id": "exp123", "type": "experience", "title": "Senior Engineer at TechCorp", "excerpt": "..." }
#   ]
# }
```

**Expected Output:**
- JSON with answer and citations array
- Answer grounded in retrieved experiences/skills
- Citations reference actual database records
- No hallucination (only uses provided context)

**Acceptance Criteria:**
- [ ] Endpoint responds with 200
- [ ] Answer is relevant to question
- [ ] Citations include IDs and excerpts
- [ ] Answer constrained to candidate's data (no generic responses)
- [ ] Works with follow-up questions (conversation history)
- [ ] Response time < 5 seconds

---

## Task 7: Add technology explanation panel

**Goal:** Collapsible info panel explaining semantic layer, full-text layer, hybrid scoring, fluid storage, agent pattern.

**Implementation Steps:**
1. Create `/src/components/TechExplanationPanel.tsx`
2. Sections (collapsible accordion or tabs):
   - **Semantic Layer:** "Each experience converted to 1536-dim embedding; questions generate query embeddings; cosine distance ranks meaning"
   - **Full-Text Layer:** "pg_trgm similarity for exact terms and acronyms"
   - **Hybrid Scoring:** "Weighted blend (0.7 semantic + 0.3 textual) balances concept match with keyword anchors"
   - **Fluid Storage:** "New uploads trigger parsing + embeddings → immediately searchable without schema changes"
   - **Agent Pattern:** "Ingestion agent (GPT-4o) normalizes data; query agent retrieves structured entities"
3. Add "Learn More" link to DEV submission
4. Place above or below chat panel on profile page

**Files to Create:**
- `/src/components/TechExplanationPanel.tsx`

**Test:**
```bash
# 1. Open profile page
open http://localhost:3000/profile/shae

# 2. Verify panel is visible (collapsed by default)

# 3. Click to expand each section

# 4. Verify all 5 sections render with explanations
```

**Expected Output:**
- Panel visible on profile page
- Sections expand/collapse smoothly
- Text explains each Agentic Postgres feature
- Link to DEV submission works

**Acceptance Criteria:**
- [ ] Panel renders on profile page
- [ ] All 5 sections present with clear explanations
- [ ] Collapsible/expandable interaction works
- [ ] Responsive on mobile
- [ ] Judge-focused language (educational, not marketing)

---

## Task 8: Add feature status pills/badges

**Goal:** UI components for Active / Ships in Demo / Coming Soon badges on profile page sections.

**Implementation Steps:**
1. Create `/src/components/StatusBadge.tsx`
2. Props: `status: 'active' | 'demo' | 'soon'`
3. Styling:
   - Active: Green background, "✅ Active"
   - Demo: Blue background, "🚀 Ships in Demo"
   - Soon: Gray background, "⏳ Coming Soon"
4. Add badges to profile sections:
   - Resume parsing: Active
   - GitHub import: Ships in Demo
   - LinkedIn import: Ships in Demo
   - Chat: Active
   - Testimonials: Coming Soon
   - Knowledge graph: Coming Soon

**Files to Create:**
- `/src/components/StatusBadge.tsx`

**Test:**
```bash
# 1. Open profile page
open http://localhost:3000/profile/shae

# 2. Verify badges appear on each section

# 3. Verify colors/labels match status
```

**Expected Output:**
- Badges render next to section headers
- Colors differentiate status levels
- Hover tooltips explain what each status means

**Acceptance Criteria:**
- [ ] StatusBadge component renders with correct colors
- [ ] All profile sections have appropriate badges
- [ ] Tooltips provide context for each status
- [ ] Visually consistent with design system

---

## Task 9: Deploy to Vercel production

**Goal:** Push to main, trigger Vercel deployment, verify public accessibility.

**Implementation Steps:**
1. Ensure all code committed to git
2. Verify environment variables in Vercel dashboard:
   - `DATABASE_URL` (TimescaleDB Cloud)
   - `OPENAI_API_KEY`
   - `NEXTAUTH_URL` (production URL)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
3. Push to main branch: `git push origin main`
4. Monitor Vercel deployment dashboard
5. Wait for build to complete
6. Test production URL

**Test:**
```bash
# 1. Commit and push
git add .
git commit -m "Competition MVP: Public profile + chat"
git push origin main

# 2. Monitor Vercel (or wait for webhook notification)

# 3. Once deployed, test production URL
open https://smartfolio.vercel.app/profile/shae

# 4. Verify no errors in Vercel logs
```

**Expected Output:**
- Vercel build succeeds (green checkmark)
- Production site loads at public URL
- No 500 errors in Vercel function logs
- Database connection works in production

**Acceptance Criteria:**
- [ ] Build completes successfully
- [ ] Production URL loads without errors
- [ ] Profile page accessible publicly
- [ ] Chat works in production
- [ ] No CORS or env var issues
- [ ] Response times acceptable (< 3s for profile load)

---

## Task 10: Test public profile accessibility

**Goal:** Verify profile loads without auth, chat works, answers appear with citations.

**Implementation Steps:**
1. Open production URL in incognito/private window
2. Test profile page load
3. Test chat interaction
4. Test on mobile device (optional)
5. Document any issues

**Test:**
```bash
# Desktop (incognito)
# Chrome: Cmd+Shift+N (Mac) or Ctrl+Shift+N (Windows)
# Open: https://smartfolio.vercel.app/profile/shae

# Verify:
# - Page loads without login prompt
# - Experiences, education, skills visible
# - Chat panel open by default
# - Can submit questions
# - Answers appear with citations

# Mobile (optional)
# Open same URL on phone
# Test chat interaction on small screen
```

**Expected Output:**
- Profile loads in < 3 seconds
- All sections render correctly
- Chat panel visible and functional
- No authentication prompts
- Citations link to correct experiences

**Acceptance Criteria:**
- [ ] Profile accessible without login
- [ ] All data renders correctly
- [ ] Chat accepts questions
- [ ] Answers appear with citations
- [ ] Citations link to correct sections
- [ ] Mobile responsive (if tested)
- [ ] No console errors

---

## Task 11: Draft DEV.to submission post

**Goal:** Write DEV post covering what you built, Agentic Postgres features, demo link, GitHub repo.

**Implementation Steps:**
1. Use DEV challenge template
2. Sections:
   - **What I Built:** Multi-source candidate portfolio (Resume + GitHub + LinkedIn) with conversational fit assistant
   - **Agentic Postgres Features Used:**
     - pgvector for semantic search
     - pg_trgm for full-text matching
     - Hybrid retrieval for grounded chat answers
     - Fluid storage (instant enrichment)
     - MCP pattern (agent writes + agent reads)
   - **Demo:** Link to public profile + chat
   - **GitHub:** Repository link
   - **How to Test:** Instructions for judges
   - **Why It Matters:** Portfolio careers narrative (HBR reference)
3. Add screenshots:
   - Profile page with provenance badges
   - Chat interaction with citations
   - Tech explanation panel
4. Proofread for clarity

**Files to Create:**
- `/docs/dev-submission-draft.md` (draft before publishing)

**Test:**
```bash
# 1. Write draft in docs/dev-submission-draft.md

# 2. Review checklist:
# - [ ] What I Built section clear
# - [ ] All Agentic Postgres features mentioned
# - [ ] Demo link works (test in incognito)
# - [ ] GitHub repo link works
# - [ ] Screenshots included
# - [ ] Test instructions clear
# - [ ] Tags correct: devchallenge, agenticpostgreschallenge, ai, postgres

# 3. Get feedback (optional)
```

**Expected Output:**
- Draft post in markdown format
- All required sections present
- Demo link tested and working
- Screenshots embedded
- Narrative compelling and judge-focused

**Acceptance Criteria:**
- [ ] Post follows DEV template
- [ ] All Agentic Postgres features listed
- [ ] Demo link works in incognito
- [ ] GitHub repo public and accessible
- [ ] Test instructions clear for judges
- [ ] Portfolio careers narrative included
- [ ] Screenshots show key features

---

## Task 12: Publish DEV.to submission

**Goal:** Submit post before November 9, 2025 @ 23:59 PT with correct tags and public profile link.

**Implementation Steps:**
1. Go to https://dev.to/new
2. Use prefill template or copy from draft
3. Add front matter:
   ```yaml
   ---
   title: SmartFolio - AI-Powered Career Portfolios on Agentic Postgres
   published: true
   tags: devchallenge, agenticpostgreschallenge, ai, postgres
   ---
   ```
4. Paste markdown content
5. Add cover image (optional)
6. Preview post
7. Verify demo link works
8. Publish before deadline

**Test:**
```bash
# Before publishing:
# 1. Click "Preview" in DEV editor
# 2. Verify formatting looks good
# 3. Test demo link from preview
# 4. Check tags are correct
# 5. Verify submission deadline not passed

# After publishing:
# 1. Open published post URL
# 2. Test demo link again
# 3. Verify tags show correctly
# 4. Share link with team/friends for final check
```

**Expected Output:**
- Post published on DEV.to
- Tags: devchallenge, agenticpostgreschallenge, ai, postgres
- Demo link works
- Post appears in challenge submissions feed

**Acceptance Criteria:**
- [ ] Post published before November 9, 2025 @ 23:59 PT
- [ ] All required tags present
- [ ] Demo link functional
- [ ] GitHub repo link functional
- [ ] Post visible in challenge feed
- [ ] No typos or broken formatting

---

## Quick Reference

**Database User:**
- Email: shae@hostechnology.com
- ID: cmhi6nmxk0000oaap9cge82q7

**Check Profile Data:**
```bash
node scripts/check-profile-data.js
```

**Local Dev:**
```bash
npm run dev
# Profile: http://localhost:3000/profile/shae
```

**Production:**
```bash
# Deploy: git push origin main
# URL: https://smartfolio.vercel.app/profile/shae
```

**Deadline:**
November 9, 2025 @ 23:59 PT

---

## Success Metrics

**MVP Complete When:**
- [ ] Public profile page loads without auth
- [ ] Profile shows resume data + GitHub projects + LinkedIn experiences
- [ ] Chat panel open by default
- [ ] Chat answers grounded in candidate data with citations
- [ ] Tech explanation panel educates judges
- [ ] Status badges clarify what's active vs planned
- [ ] Deployed to production and accessible
- [ ] DEV submission published before deadline

**Competition Criteria Met:**
- ✅ Uses Tiger Data (TimescaleDB Cloud)
- ✅ Showcases pgvector + pg_trgm + MCP + fluid storage
- ✅ Publicly accessible (no login)
- ✅ DEV post submitted

---

**End of Implementation Plan**
