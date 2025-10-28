# SmartFolio Technical Design

## Overview
SmartFolio is an AI-powered professional platform that transforms static resumes into intelligent, conversational profiles. This document outlines the technical architecture, implementation details, and system design.

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend API    │────│   Database      │
│   (React/Next)  │    │   (Node.js)      │    │   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────────────┐              │
         └──────────────│  AI Services   │──────────────┘
                        │  (OpenAI/LLM)  │
                        └────────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  File Storage   │    │  Authentication  │    │   Search Index  │
│  (AWS S3/GCS)   │    │  (Auth0/Clerk)   │    │  (pgvector)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    google_id VARCHAR(255) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    phone VARCHAR(20),
    profile_picture_url TEXT,
    bio TEXT,
    public_profile_enabled BOOLEAN DEFAULT true,
    chat_interface_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);
```

#### User Documents Table
```sql
CREATE TABLE user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'resume', 'portfolio', 'other'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    processed BOOLEAN DEFAULT false,
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### User Links Table
```sql
CREATE TABLE user_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    link_type VARCHAR(50) NOT NULL, -- 'linkedin', 'github', 'portfolio', 'other'
    url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Testimonials Table
```sql
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommender_name VARCHAR(255) NOT NULL,
    recommender_title VARCHAR(255),
    recommender_company VARCHAR(255),
    recommender_email VARCHAR(255),
    relationship VARCHAR(100), -- 'colleague', 'supervisor', 'client', etc.
    content TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Skills Table
```sql
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- 'technical', 'soft', 'language'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
    years_experience INTEGER,
    source VARCHAR(50), -- 'manual', 'extracted', 'inferred'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);
```

#### Experience Table
```sql
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for current position
    description TEXT,
    achievements TEXT[],
    technologies VARCHAR(100)[],
    location VARCHAR(255),
    employment_type VARCHAR(50), -- 'full-time', 'part-time', 'contract', 'internship'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Education Table
```sql
CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    gpa DECIMAL(3,2),
    achievements TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### AI Knowledge Base Table (for semantic search)
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'experience', 'skill', 'testimonial', 'document'
    content_id UUID, -- references the specific record
    text_content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX knowledge_embeddings_vector_idx ON knowledge_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

#### Chat Sessions Table
```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255), -- Anonymous visitor identifier
    visitor_email VARCHAR(255), -- Optional if visitor provides email
    session_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_ended_at TIMESTAMP WITH TIME ZONE,
    total_messages INTEGER DEFAULT 0
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Design

### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/profile
PUT  /api/auth/profile
```

### User Profile Endpoints
```
GET    /api/users/me
PUT    /api/users/me
DELETE /api/users/me
GET    /api/users/:id/public           # Public profile view
POST   /api/users/upload-avatar
DELETE /api/users/avatar
```

### Document Management Endpoints
```
POST   /api/documents/upload           # Upload resume/documents
GET    /api/documents                  # List user's documents
GET    /api/documents/:id              # Get document details
DELETE /api/documents/:id              # Delete document
POST   /api/documents/:id/process      # Trigger AI processing
```

### Links Management Endpoints
```
POST   /api/links                      # Add LinkedIn/GitHub URL
GET    /api/links                      # List user's links
PUT    /api/links/:id                  # Update link
DELETE /api/links/:id                  # Delete link
POST   /api/links/:id/verify           # Verify link ownership
```

### Testimonials Endpoints
```
POST   /api/testimonials               # Add testimonial
GET    /api/testimonials               # List user's testimonials
PUT    /api/testimonials/:id           # Update testimonial
DELETE /api/testimonials/:id           # Delete testimonial
POST   /api/testimonials/:id/verify    # Request verification
```

### Skills & Experience Endpoints
```
POST   /api/skills                     # Add skill
GET    /api/skills                     # List user's skills
PUT    /api/skills/:id                 # Update skill
DELETE /api/skills/:id                 # Delete skill

POST   /api/experience                 # Add work experience
GET    /api/experience                 # List user's experience
PUT    /api/experience/:id             # Update experience
DELETE /api/experience/:id             # Delete experience

POST   /api/education                  # Add education
GET    /api/education                  # List user's education
PUT    /api/education/:id              # Update education
DELETE /api/education/:id              # Delete education
```

### Public Chat Interface Endpoints
```
POST   /api/chat/:userId/start         # Start chat session
POST   /api/chat/sessions/:sessionId/message  # Send message
GET    /api/chat/sessions/:sessionId/messages # Get conversation history
POST   /api/chat/sessions/:sessionId/end      # End session
```

### Search & Discovery Endpoints (Future)
```
POST   /api/search/professionals       # Search for professionals
GET    /api/search/suggestions          # Get search suggestions
POST   /api/search/save                # Save search query
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Components**: Tailwind CSS + Headless UI or Shadcn/ui
- **State Management**: Zustand or TanStack Query
- **File Upload**: React Dropzone
- **Authentication**: NextAuth.js or Clerk
- **Real-time Chat**: Socket.io client

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Prisma or Drizzle ORM
- **Authentication**: JWT + OAuth (Google)
- **File Storage**: AWS S3 or Google Cloud Storage
- **Document Processing**: PDF.js, mammoth (for DOCX)
- **AI/LLM**: OpenAI API or Azure OpenAI
- **Real-time**: Socket.io
- **Queue**: Bull/BullMQ with Redis (for async processing)

### Infrastructure
- **Hosting**: Vercel (Frontend) + Railway/Render (Backend)
- **Database**: Neon, Supabase, or PlanetScale (PostgreSQL)
- **File Storage**: AWS S3 or Cloudflare R2
- **CDN**: Cloudflare
- **Monitoring**: Sentry + PostHog
- **CI/CD**: GitHub Actions

## Key Features Implementation

### 1. Authentication System
- **Email/Password**: Standard JWT-based authentication
- **Google OAuth**: Implement Google Sign-in with profile import
- **Session Management**: Refresh tokens, secure cookies
- **Password Reset**: Email-based password recovery

### 2. File Upload & Processing
- **Resume Upload**: Support PDF and DOCX formats
- **Text Extraction**: Use libraries to extract text content
- **AI Processing**: Send extracted text to LLM for structured data extraction
- **Metadata Storage**: Store file info, processing status, and extracted data

### 3. Profile Building
- **Form-based Input**: Allow manual entry of experience, skills, education
- **AI-assisted Parsing**: Auto-populate from uploaded documents
- **Link Verification**: Verify GitHub and LinkedIn profile ownership
- **Testimonial Management**: Allow testimonial upload and verification requests

### 4. Public Chat Interface
- **Anonymous Chat**: Allow visitors to chat without registration
- **AI-powered Responses**: Use embeddings to find relevant profile information
- **Context-aware Conversations**: Maintain chat context and provide relevant answers
- **Rate Limiting**: Prevent abuse with proper rate limiting

### 5. Search & Embeddings
- **Document Embeddings**: Create vector embeddings of all profile content
- **Semantic Search**: Use pgvector for similarity search
- **Hybrid Search**: Combine full-text search with semantic search
- **Real-time Updates**: Update embeddings when profile changes

## Security Considerations

### Data Protection
- **Encryption**: Encrypt sensitive data at rest and in transit
- **File Scanning**: Scan uploaded files for malware
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Protection**: Implement proper content security policies

### Privacy Controls
- **Profile Visibility**: Allow users to control what's public
- **Data Deletion**: Implement proper data deletion (GDPR compliance)
- **Consent Management**: Track user consent for data processing
- **Audit Logging**: Log all data access and modifications

### Authentication Security
- **Password Hashing**: Use bcrypt or similar for password hashing
- **Rate Limiting**: Implement login attempt limiting
- **Session Security**: Secure session management
- **CSRF Protection**: Implement CSRF tokens
- **OAuth Security**: Secure OAuth implementation

## Performance Optimization

### Database Optimization
- **Indexing**: Proper indexes on frequently queried columns
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Optimize complex queries
- **Caching**: Redis caching for frequently accessed data

### File Handling
- **Lazy Loading**: Load large files on demand
- **Compression**: Compress uploaded files
- **CDN**: Use CDN for file delivery
- **Background Processing**: Process large files asynchronously

### AI/LLM Optimization
- **Caching**: Cache AI responses and embeddings
- **Batching**: Batch embedding generation
- **Rate Limiting**: Respect API rate limits
- **Fallback**: Implement fallback for AI service failures

## Deployment Strategy

### Development Environment
- **Local Development**: Docker Compose setup
- **Database**: Local PostgreSQL with pgvector
- **File Storage**: Local file system or Minio
- **Environment Variables**: Comprehensive .env setup

### Staging Environment
- **Database**: Managed PostgreSQL (Neon/Supabase)
- **File Storage**: AWS S3 or equivalent
- **Deployment**: Automated via GitHub Actions
- **Testing**: Automated testing pipeline

### Production Environment
- **High Availability**: Multi-region deployment
- **Monitoring**: Comprehensive logging and monitoring
- **Backup**: Automated database backups
- **Scaling**: Horizontal scaling capabilities

## Future Enhancements

### Phase 2 Features
- **Advanced Search**: Employer search interface
- **Analytics**: Profile view analytics for users
- **API Access**: Public API for integrations
- **Mobile App**: React Native mobile application

### Phase 3 Features
- **AI Recommendations**: Job/candidate matching
- **Video Testimonials**: Support for video content
- **Multi-language**: Internationalization support
- **Enterprise Features**: Team management, bulk operations

## MVP Options & Probabilities

### Option 1: Minimal Viable Chat Profile (4-6 weeks) - **85% Success Probability**

**Core Features:**
- Basic user registration (email/password only)
- Simple profile creation form (name, bio, contact info)
- Resume text upload (copy/paste, no file upload)
- Basic public profile page with chat interface
- Simple AI chat using OpenAI API with profile context

**Tech Stack:**
- Frontend: Next.js with Tailwind CSS
- Backend: Next.js API routes
- Database: PostgreSQL (Neon free tier)
- AI: OpenAI API directly
- Authentication: NextAuth.js
- Deployment: Vercel

**Why High Probability:**
- Minimal external dependencies
- No complex file processing
- Uses proven, simple tech stack
- Single developer can complete
- No complex AI embeddings needed

**Deliverable:** Functional chat-enabled profiles that work

---

### Option 2: Document-Powered Smart Profiles (8-10 weeks) - **70% Success Probability**

**Core Features:**
- Email/password + Google OAuth
- Resume/PDF upload with text extraction
- Auto-populated profile from resume data
- LinkedIn/GitHub URL integration (display only)
- Testimonial management system
- Public chat interface with document-aware AI
- Basic vector embeddings for better chat context

**Tech Stack:**
- Frontend: Next.js with TypeScript
- Backend: Express.js + PostgreSQL
- File Processing: PDF.js, basic NLP
- AI: OpenAI embeddings + chat
- Storage: Local files initially
- Deployment: Vercel + Railway

**Why Moderate Probability:**
- More complex file processing
- Multiple integrations required
- Vector database setup needed
- Requires more sophisticated AI logic
- Higher chance of scope creep

**Deliverable:** Professional-grade profiles with intelligent chat

---

### Option 3: Full-Featured Professional Platform (12-16 weeks) - **50% Success Probability**

**Core Features:**
- Complete authentication system (email, Google, password reset)
- Advanced document processing (PDF, DOCX, LinkedIn import)
- Rich profile builder with skills, experience, education
- Testimonial verification system
- Advanced AI chat with semantic search
- Profile analytics and visitor tracking
- Mobile-responsive design
- Privacy controls and settings

**Tech Stack:**
- Full stack as designed in technical spec
- PostgreSQL with pgvector
- AWS S3 for file storage
- Redis for caching
- Background job processing
- Comprehensive testing suite

**Why Lower Probability:**
- Large scope with many moving parts
- Complex integrations and dependencies
- Requires significant AI/ML expertise
- Higher infrastructure costs and complexity
- Risk of feature bloat and timeline overrun
- Single developer may struggle with scope

**Deliverable:** Production-ready platform competitive with LinkedIn

## Recommended Approach: **Option 1 → Option 2 Evolution**

**Start with Option 1** (85% success) to validate core concept and user interest, then evolve to Option 2 based on user feedback and traction. This approach:

- Minimizes initial risk and time investment
- Provides early user validation
- Allows for iterative improvement
- Maintains high probability of success
- Can pivot based on real user needs

## Development Timeline

### Phase 2 (4-6 weeks)
- Enhanced search functionality
- Advanced analytics
- Performance optimizations
- Mobile responsiveness improvements

### Phase 3 (6-8 weeks)
- Employer search interface
- Advanced AI features
- API development
- Enterprise features

This technical design provides a comprehensive foundation for building SmartFolio while maintaining scalability, security, and performance considerations throughout the development process.