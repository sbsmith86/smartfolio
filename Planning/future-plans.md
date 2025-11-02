# SmartFolio Future Plans

**Document Version:** 1.0
**Last Updated:** November 2, 2025
**Status:** Vision & Planning

---

## Product Vision Evolution: Option 3 - Hybrid Candidate Portal + Passive Discovery

### Core Philosophy

SmartFolio solves the fundamental frustration of modern job searching: **repetitive applications, endless screening calls, and scattered professional information**. Instead of forcing candidates to apply to hundreds of jobs, we flip the model:

> **Create your profile once. Let opportunities come to you.**

### The Two-Sided Platform

#### **For Candidates (Primary Focus)**
- Create a comprehensive, conversational profile **one time**
- Upload resume, connect GitHub/LinkedIn, add projects and testimonials
- Get a shareable link to use anywhere (email signatures, applications, networking)
- **Optional:** Toggle "Discoverable" mode to appear in hiring manager searches
- Set preferences: desired roles, locations, salary expectations
- **Never fill out another application form**
- Review and approve interview requests with one click

#### **For Hiring Managers (Secondary, Supporting Role)**
- Discover candidates through natural language search
- Chat with SkillScout AI to understand candidate backgrounds
- SkillScout is explicitly positioned as an **intelligent career agent**, not the candidate
- Send interview requests to interesting candidates
- Candidates must approve before contact is established

---

## Key Differentiators from Traditional Job Boards

### What We're NOT Building
- ❌ Job postings/listings
- ❌ Application forms for candidates
- ❌ Direct messaging without candidate approval
- ❌ Resume databases that favor hiring managers
- ❌ Pay-to-apply or pay-to-contact models

### What Makes Us Different
- ✅ **No Applications:** Candidates just exist, hiring managers request interviews
- ✅ **Candidate Control:** You approve who contacts you, set your terms
- ✅ **Conversational Screening:** AI chat replaces initial phone screens
- ✅ **One Profile, Many Uses:** Share your SmartFolio link anywhere
- ✅ **Passive Job Search:** Set discoverable mode and let opportunities find you
- ✅ **Power Balance:** Platform favors candidates, not companies

---

## SkillScout AI Positioning

### The Problem with Current Design
The current implementation plan positions the chat as if you're talking to the candidate directly, which feels inauthentic and potentially misleading.

### The Solution: SkillScout as Career Agent

```
┌─────────────────────────────────────────────────┐
│  SkillScout AI - Sarah Martinez's Career Agent  │
│  I represent Sarah's professional background.   │
│  Ask me anything about her experience.          │
└─────────────────────────────────────────────────┘

Hiring Manager: "Does Sarah have distributed systems experience?"

SkillScout: "Yes, Sarah has extensive distributed systems experience.
She spent 3 years at TechCorp building a microservices architecture
that handled 10M+ requests/day. She's particularly strong with
Kubernetes and service mesh patterns. Would you like to know more
about specific projects or challenges she's solved?"
```

### Key Messaging
- **Not a chatbot** - It's your AI career agent
- **Not pretending to be you** - It represents your work history
- **Available 24/7** - Like having a personal recruiter who knows your background perfectly
- **Intelligent screening** - Answers questions about your experience contextually

---

## User Flows

### Candidate Journey

**Phase 1: Profile Creation**
1. Sign up and complete onboarding
2. Upload resume (auto-extracts information)
3. Connect GitHub and LinkedIn
4. Add projects, testimonials, and additional context
5. Review AI-generated profile summary
6. Get shareable link: `smartfolio.com/sarah-martinez`

**Phase 2: Active Sharing**
- Add SmartFolio link to email signature
- Include in job applications instead of PDF resume
- Share on LinkedIn profile
- Use in cold outreach to companies

**Phase 3: Passive Discovery (Optional)**
1. Toggle "Open to Opportunities"
2. Set preferences:
   - Desired roles (e.g., "Senior Backend Engineer")
   - Locations (e.g., "San Francisco Bay Area, Remote")
   - Salary expectations (e.g., "$180k - $220k")
   - Work authorization status
3. Appear in hiring manager searches
4. Receive interview requests
5. Review and approve/decline with one click

### Hiring Manager Journey

**Phase 1: Discovery**
1. Sign up as hiring manager (company verification required)
2. Search with natural language:
   - "Find senior backend engineers with Kubernetes experience in SF"
   - "Show me frontend developers who've built design systems"
3. Browse matching candidate profiles
4. Filter by availability, location, experience level

**Phase 2: Evaluation**
1. Click on candidate profile
2. Chat with SkillScout about their background
3. Ask specific questions:
   - "What frameworks has Sarah used?"
   - "Tell me about her experience leading teams"
   - "Has she worked in fintech before?"
4. Review projects, testimonials, and linked profiles

**Phase 3: Outreach**
1. Click "Request Interview"
2. Write brief message about the role
3. System notifies candidate
4. Wait for candidate approval
5. If approved, contact information is shared

---

## Technical Architecture Changes

### New Database Tables Needed

```prisma
model HiringManager {
  id                String   @id @default(cuid())
  userId            String   @unique
  companyName       String
  companyDomain     String   // For email verification
  verified          Boolean  @default(false)
  interviewRequests InterviewRequest[]

  user              User     @relation(fields: [userId], references: [id])

  @@map("hiring_managers")
}

model InterviewRequest {
  id                String   @id @default(cuid())
  hiringManagerId   String
  candidateId       String
  status            String   // 'pending', 'approved', 'declined', 'expired'
  message           String
  roleTitle         String?
  roleDescription   String?
  createdAt         DateTime @default(now())
  respondedAt       DateTime?

  hiringManager     HiringManager @relation(fields: [hiringManagerId], references: [id])
  candidate         User          @relation(fields: [candidateId], references: [id])

  @@map("interview_requests")
}

model CandidatePreferences {
  id                  String   @id @default(cuid())
  userId              String   @unique
  discoverable        Boolean  @default(false)
  desiredRoles        String[] // Array of role types
  preferredLocations  String[] // Array of locations
  salaryMin           Int?
  salaryMax           Int?
  remoteOnly          Boolean  @default(false)
  availableDate       DateTime?
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id])

  @@map("candidate_preferences")
}

model CandidateSearch {
  id                String   @id @default(cuid())
  hiringManagerId   String
  searchQuery       String
  filters           Json?    // Store search filters
  resultsCount      Int
  createdAt         DateTime @default(now())

  hiringManager     HiringManager @relation(fields: [hiringManagerId], references: [id])

  @@map("candidate_searches")
}
```

### New API Endpoints

**Candidate Endpoints:**
- `POST /api/preferences` - Update discovery preferences
- `GET /api/interview-requests` - List pending requests
- `PATCH /api/interview-requests/:id` - Approve/decline request

**Hiring Manager Endpoints:**
- `POST /api/search/candidates` - Natural language candidate search
- `POST /api/interview-requests` - Send interview request
- `GET /api/interview-requests/sent` - View sent requests

**Enhanced Chat Endpoints:**
- `POST /api/chat` - Support dual mode (public sharing vs HM discovery)
- `POST /api/chat/context` - Add hiring context to chat sessions

---

## Implementation Priority (Post-MVP)

### Phase 1A: Dual User Types (Add to Current Phase 1)
**New Task 4.5: User Type Management**
- Add `userType` field to User model (`candidate` | `hiring_manager`)
- Create hiring manager verification flow
- Build company domain verification system
- Add onboarding flows for both user types

### Phase 2B: Discovery Preferences (Add to Current Phase 2)
**New Task 8.5: Candidate Discovery Settings**
- Build preferences management UI
- Add "Open to Opportunities" toggle
- Create role/location/salary preference forms
- Implement availability calendar

### Phase 3C: Search & Discovery (Extends Current Phase 3)
**Modified Task 9: Enhanced Vector Search**
- Add candidate search with natural language queries
- Implement preference-based filtering
- Build search result ranking algorithm
- Add privacy controls (discoverable vs private profiles)

**Modified Task 10: Dual-Mode Chat Interface**
- Support two chat modes:
  - **Public Sharing Mode:** Anyone with link can chat
  - **Discovery Mode:** HM searches, then chats with SkillScout
- Add hiring context to chat sessions
- Implement SkillScout's "career agent" persona

**New Task 10.5: Interview Request System**
- Build request creation flow for HMs
- Create candidate notification system
- Add approval/decline interface for candidates
- Implement contact information exchange on approval

---

## Business Model

### Monetization Options

**Option A: Freemium for Candidates**
- Free: Basic profile + sharing link
- Premium ($10-15/month):
  - Discoverable in HM searches
  - Profile analytics (who viewed, who chatted)
  - Priority in search results
  - Custom domain (sarah.smartfolio.com)

**Option B: Subscription for Hiring Managers**
- $99-299/month per hiring manager
- Unlimited candidate search
- Unlimited chat with SkillScout
- Limited interview requests per month (5-20)
- Analytics on candidate engagement

**Option C: Hybrid (Recommended)**
- Free for all candidates (network effects)
- Premium candidate features ($10/month)
- Hiring manager subscriptions ($149/month)
- Enterprise plans for companies ($499/month for 5 HMs)

### Revenue Projections (Simplified)
- 1,000 candidates × 20% premium × $10 = $2,000/month
- 100 hiring managers × $149 = $14,900/month
- **Total MRR:** ~$17,000/month at modest scale

---

## Success Metrics

### Candidate Success
- Profile completion rate >80%
- Average time to create profile <30 minutes
- Candidate satisfaction score >4.5/5
- Interview request approval rate >30%
- Successful placements within 90 days

### Hiring Manager Success
- Average candidates discovered per search >10
- Chat engagement rate (questions asked per profile viewed) >5
- Interview request acceptance rate >30%
- Time to first interview <7 days
- Hiring manager NPS >50

### Platform Health
- Candidate-to-HM ratio: 10:1 (healthy marketplace)
- Monthly active candidates: >1,000
- Monthly active hiring managers: >100
- Average interview requests per candidate: 2-5/month
- Platform GMV (placed candidate salaries): Track for future

---

## Competitive Positioning

### vs. LinkedIn
- **LinkedIn:** Social network with recruiting features
- **SmartFolio:** Purpose-built for job discovery with AI screening

### vs. Indeed/ZipRecruiter
- **Job Boards:** Candidates apply to jobs
- **SmartFolio:** Candidates create profile once, opportunities come to them

### vs. Hired/Vettery
- **Marketplace Recruiters:** Curated matching, high fees (20-30%)
- **SmartFolio:** Direct discovery, low fees, candidate-controlled

### vs. Portfolio Sites (Webflow, Notion)
- **Portfolio Sites:** Static, no discovery, no screening
- **SmartFolio:** Conversational, discoverable, intelligent screening

---

## Open Questions & Decisions Needed

1. **Discovery Opt-In:** Should all public profiles be searchable by default, or require explicit opt-in?
   - **Recommendation:** Opt-in only (respects candidate control)

2. **Verification Requirements:** Should candidates be verified (LinkedIn, email, identity)?
   - **Recommendation:** Email + LinkedIn verification for discoverable profiles

3. **HM Company Verification:** How strict should company verification be?
   - **Recommendation:** Email domain verification + manual review for first-time companies

4. **Interview Request Limits:** Should we limit how many requests a HM can send?
   - **Recommendation:** Yes, 5-20/month depending on plan (prevents spam)

5. **Candidate Response Time:** Should interview requests expire?
   - **Recommendation:** Yes, 7-day expiration (keeps marketplace active)

6. **Geographic Scope:** Launch globally or US-first?
   - **Recommendation:** US-first, expand after product-market fit

7. **Pricing Strategy:** Free for candidates or charge premium features?
   - **Recommendation:** Free basic, premium for discovery + analytics

---

## Next Steps

### Immediate (Before Building)
1. ✅ Document this vision (this document)
2. ⬜ User research: Interview 10 candidates + 5 hiring managers
3. ⬜ Validate key assumptions:
   - Will candidates opt-in to discovery?
   - Will HMs pay for access?
   - Is AI screening valuable enough?
4. ⬜ Competitive analysis: Deep dive on Hired, Vettery, Wellfound
5. ⬜ Refine pricing model based on research

### Post-MVP (After Current Tasks 1-13)
1. ⬜ Build user type management system
2. ⬜ Implement discovery preferences UI
3. ⬜ Create candidate search functionality
4. ⬜ Build interview request system
5. ⬜ Add dual-mode chat interface
6. ⬜ Launch beta with 50 candidates + 10 hiring managers
7. ⬜ Iterate based on feedback

### Long-Term (6-12 Months Out)
1. ⬜ Add team collaboration for HMs (share candidate notes)
2. ⬜ Build integration with ATS systems (Greenhouse, Lever)
3. ⬜ Create interview scheduling features
4. ⬜ Add salary benchmarking tools
5. ⬜ Expand to international markets
6. ⬜ Build mobile apps (iOS/Android)

---

## Risk Mitigation

### Risk 1: Chicken-and-Egg Problem
**Risk:** Need candidates to attract HMs, need HMs to attract candidates
**Mitigation:**
- Launch candidate-side first (MVP focus)
- Build value for candidates even without HM discovery (shareable profile)
- Manually recruit first 10 HMs for beta testing
- Offer free HM accounts during launch phase

### Risk 2: Privacy & Trust
**Risk:** Candidates worried about current employer seeing profile
**Mitigation:**
- Clear privacy controls (block specific companies)
- Opt-in discovery (not default)
- Anonymous mode (hide personal info until candidate approves)
- Trust badges for verified companies

### Risk 3: HM Spam/Abuse
**Risk:** Low-quality outreach from HMs annoys candidates
**Mitigation:**
- Strict HM verification (company domain + manual review)
- Limit interview requests per HM
- Candidate blocking/reporting features
- HM quality score (based on candidate feedback)

### Risk 4: AI Quality Issues
**Risk:** SkillScout gives wrong answers, hurts candidate credibility
**Mitigation:**
- Extensive testing of AI responses
- Candidate review/edit of AI-generated profile summaries
- Disclaimer that SkillScout is AI ("AI career agent")
- Fallback to human review for critical inaccuracies

### Risk 5: Monetization Resistance
**Risk:** Neither candidates nor HMs want to pay
**Mitigation:**
- Prove value before asking for payment
- Free tier with meaningful functionality
- A/B test pricing tiers
- Usage-based pricing (pay for results, not access)

---

## Appendix: User Testimonials (Target State)

### Candidate: Sarah Martinez, Senior Backend Engineer
> "I was so tired of filling out the same application forms over and over. With SmartFolio, I created my profile once, and in 3 months I got 8 interview requests from companies I actually wanted to work for. I declined 5, interviewed with 3, and accepted an offer with a 40% salary increase. I never applied to a single job."

### Hiring Manager: Alex Chen, Engineering Manager at TechCorp
> "We used to post jobs on LinkedIn and get 200+ applicants we had to screen manually. Now I just search SmartFolio for 'backend engineers with Kubernetes in SF' and chat with SkillScout about the top 10 matches. I sent 5 interview requests, 3 accepted, and we hired 1. Saved us probably 40 hours of screening time."

### Hiring Manager: Maria Rodriguez, Head of Talent at StartupX
> "What I love is that candidates on SmartFolio actually want to hear from us. On LinkedIn, cold InMails get 5% response rates. On SmartFolio, interview requests get 40% acceptance because candidates opted in. It's night and day."

---

**End of Document**

*This is a living document. Update as vision evolves, user research reveals insights, and market conditions change.*
