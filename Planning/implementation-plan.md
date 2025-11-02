# SmartFolio Implementation Plan - Option 2: Document-Powered Smart Profiles

**Target Completion:** January 15, 2026
**Status:** Not Started
**Success Probability:** 70%

---

## Overview

This implementation plan follows **Option 2: Document-Powered Smart Profiles (8-10 weeks)** from the technical design. The plan focuses on building a **candidate-centric platform** where professionals can consolidate all their career data (resumes, GitHub repos, LinkedIn profiles, project documentation, testimonials) into one intelligent, conversational profile that visitors can explore naturally.

**Core Conversational Features:**
- **Multi-Source Data Integration**: Unified ingestion from resumes, GitHub, LinkedIn, project docs, and testimonials
- **Intelligent Knowledge Graph**: AI connects relationships between projects, skills, experiences, and achievements
- **Natural Conversation Interface**: Visitors can ask questions about your career and get contextual, detailed responses via SkillScout
- **Adaptive Responses**: SkillScout tailors explanations based on what visitors are trying to understand about your background, prioritizing project examples over resume content

**Key Technical Features:**
- Email/password + Google OAuth authentication
- Resume/PDF upload with text extraction and AI processing
- GitHub/LinkedIn integration for automatic profile data sync
- Project documentation upload and processing
- Testimonial management system with verification requests
- Public chat interface with SkillScout AI for conversational career exploration
- Vector embeddings for intelligent context matching and response generation, with project work prioritized over resume content

---

# Phase 1: Foundation & Authentication

**Target Completion:** Week 2
**Status:** Not Started

---

## 1.1 Project Setup & Environment

## Task 1: Initialize Next.js project with TypeScript ✅ COMPLETE

**Status:** Complete

**Completed:** October 27, 2025

**What was accomplished:**
- ✅ Created Next.js 14 project with TypeScript, Tailwind CSS, and ESLint
- ✅ Installed all required dependencies:
  - Prisma & @prisma/client for database
  - NextAuth.js & bcryptjs for authentication
  - OpenAI API client
  - Zod for environment validation
  - React Hook Form & React Dropzone for forms
  - PDF-parse & Mammoth for document processing
  - Shadcn/ui components (button, input, card, form, etc.)
- ✅ Set up environment variable validation with Zod
- ✅ Created Prisma client configuration
- ✅ Configured TimescaleDB connection string
- ✅ Set up project structure with src/ directory
**Deliverables:**
- Create Next.js 14 project with TypeScript
- Configure Tailwind CSS and Shadcn/ui components
- Set up PostgreSQL database connection
- Configure environment variables with Zod validation

**Implementation:**

```bash
# Initialize project
npx create-next-app@latest smartfolio --typescript --tailwind --eslint --app --src-dir
cd smartfolio

# Add required dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install prisma @prisma/client
npm install zod
npm install openai
npm install @hookform/resolvers react-hook-form
npm install lucide-react
npm install pdf-parse mammoth

# Add Shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card form textarea avatar
```

**Environment Setup:**
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  OPENAI_API_KEY: z.string(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
```

**Success Criteria:**
- Project initializes and runs on localhost:3000
- Tailwind CSS styling works
- Environment validation passes
- Database connection established

---

## Task 2: Set up database schema with Prisma ✅ COMPLETE

**Status:** Complete

**Completed:** October 27, 2025

**What was accomplished:**
- ✅ Defined complete Prisma schema with all core tables:
  - Users table with authentication fields and preferences
  - UserDocuments for file uploads (PDF/DOCX processing)
  - UserLinks for LinkedIn/GitHub/portfolio connections
  - Testimonials with verification system
  - Experience and Education tables for profile data
  - Skills and UserSkills with proficiency levels
  - KnowledgeEmbeddings for vector search capabilities
  - ChatSessions and ChatMessages for AI chat functionality
- ✅ Successfully connected to TimescaleDB cloud instance
- ✅ Pushed database schema and created all tables
- ✅ Generated Prisma client and verified database connectivity
- ✅ All 11 tables created successfully in TimescaleDB

**Dependencies:**
- Task 1: Project initialization

**Deliverables:**
- Define Prisma schema for all core tables
- Generate and run initial migration
- Set up database connection and client

**Implementation:**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                    String      @id @default(cuid())
  email                 String      @unique
  passwordHash          String?
  googleId              String?     @unique
  firstName             String
  lastName              String
  location              String?
  phone                 String?
  profilePictureUrl     String?
  bio                   String?
  publicProfileEnabled  Boolean     @default(true)
  chatInterfaceEnabled  Boolean     @default(true)
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  lastLogin             DateTime?

  documents             UserDocument[]
  links                 UserLink[]
  testimonials          Testimonial[]
  skills                UserSkill[]
  experiences           Experience[]
  education             Education[]
  knowledgeEmbeddings   KnowledgeEmbedding[]
  chatSessions          ChatSession[]

  @@map("users")
}

model UserDocument {
  id            String    @id @default(cuid())
  userId        String
  documentType  String    // 'resume', 'portfolio', 'other'
  fileName      String
  filePath      String
  fileSize      BigInt
  mimeType      String
  processed     Boolean   @default(false)
  extractedText String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_documents")
}

model UserLink {
  id           String    @id @default(cuid())
  userId       String
  linkType     String    // 'linkedin', 'github', 'portfolio', 'other'
  url          String
  title        String?
  description  String?
  verified     Boolean   @default(false)
  createdAt    DateTime  @default(now())

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_links")
}

model Testimonial {
  id                 String    @id @default(cuid())
  userId             String
  recommenderName    String
  recommenderTitle   String?
  recommenderCompany String?
  recommenderEmail   String?
  relationship       String?   // 'colleague', 'supervisor', 'client'
  content            String
  verified           Boolean   @default(false)
  public             Boolean   @default(true)
  createdAt          DateTime  @default(now())

  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("testimonials")
}

model KnowledgeEmbedding {
  id            String    @id @default(cuid())
  userId        String
  contentType   String    // 'experience', 'skill', 'testimonial', 'document'
  contentId     String?
  textContent   String
  embedding     Float[]   // Vector embedding
  metadata      Json?
  createdAt     DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("knowledge_embeddings")
}

model ChatSession {
  id               String        @id @default(cuid())
  profileUserId    String
  visitorId        String?
  visitorEmail     String?
  sessionStartedAt DateTime      @default(now())
  sessionEndedAt   DateTime?
  totalMessages    Int           @default(0)

  profileUser      User          @relation(fields: [profileUserId], references: [id], onDelete: Cascade)
  messages         ChatMessage[]

  @@map("chat_sessions")
}

model ChatMessage {
  id        String      @id @default(cuid())
  sessionId String
  role      String      // 'user' | 'assistant'
  content   String
  createdAt DateTime    @default(now())

  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@map("chat_messages")
}
```

**Success Criteria:**
- Prisma schema defined and valid
- Database migration runs successfully
- Prisma client generates without errors
- Can query database from Next.js

---

## 1.2 Authentication System

## Task 3: Implement NextAuth.js with email/password and Google OAuth ✅ COMPLETE

**Status:** Complete

**Completed:** October 27, 2025

**What was accomplished:**
- ✅ Configured NextAuth.js with Prisma adapter for database storage
- ✅ Implemented email/password authentication with bcrypt password hashing
- ✅ Set up Google OAuth provider with proper client credentials
- ✅ Created complete signin page (`/src/app/auth/signin/page.tsx`) with both auth methods
- ✅ Created complete signup page (`/src/app/auth/signup/page.tsx`) with validation
- ✅ Built signup API endpoint (`/src/app/api/auth/signup/route.ts`) with user creation
- ✅ Implemented session management with JWT strategy
- ✅ Added custom NextAuth callbacks for user data handling
- ✅ Created protected dashboard page with session verification
- ✅ Set up SessionProvider integration in app layout
- ✅ Added proper TypeScript definitions for NextAuth
- ✅ Functional testing confirmed: both email/password and Google OAuth working

**Dependencies:**
- Task 2: Database schema setup

**Deliverables:**
- Configure NextAuth.js with Prisma adapter
- Implement email/password authentication
- Set up Google OAuth provider
- Create login/register pages

**Implementation:**

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          firstName: profile.given_name,
          lastName: profile.family_name,
          profilePictureUrl: profile.picture,
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
```

**Auth Pages:**

```typescript
// src/app/auth/signin/page.tsx
"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard");
    } else {
      alert("Invalid credentials");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In to SmartFolio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full"
          >
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Success Criteria:**
- Users can register with email/password
- Users can sign in with email/password
- Google OAuth works and creates user profiles
- Session management works correctly
- Protected routes redirect to login

---

## Task 4: Redesign all UI pages to align with candidate-centric product vision ✅ COMPLETE

**Status:** Complete

**Completed:** October 28, 2025

**What was accomplished:**
- ✅ Redesigned homepage with candidate-centric messaging and conversational examples
- ✅ Added Agentic Postgres branding and technical differentiators throughout
- ✅ Updated authentication pages (Sign Up/Sign In) with unified professional data vision
- ✅ Enhanced dashboard as central hub for data consolidation and sharing
- ✅ Applied consistent blue/purple gradient design language
- ✅ Added live conversation examples and interactive elements
- ✅ Emphasized "professional story" messaging over employer-focused approach
- ✅ Integrated Agentic Postgres/Tiger MCP highlights throughout user experience
- ✅ Created mobile-responsive design optimized for professional sharing

**Dependencies:**
- Task 3: Authentication system

**Deliverables:**
- Redesigned homepage emphasizing conversational career stories
- Updated authentication pages reflecting unified professional data vision
- Enhanced dashboard showcasing data consolidation and sharing capabilities
- Visual emphasis on agentic Postgres-powered features

---

### 🎨 C.R.A.F.T.E.D Prompt

### Context

You're redesigning **SmartFolio's user interface** to align with the refined product vision: a candidate-centric platform where professionals consolidate all their career data (resumes, GitHub repos, LinkedIn profiles, project documentation, testimonials) into one intelligent, conversational profile. The current UI was designed with an employer-focused approach, but now needs to emphasize the candidate journey of creating unified, explorable professional stories.

The redesign must showcase how **Agentic Postgres (Tiger MCP)** powers the platform's unique capabilities, making the technical differentiators visible and compelling to users who want to understand why SmartFolio is superior to scattered traditional profiles.

### Role

You are a **full-stack developer and UX designer** creating a cohesive user experience that clearly communicates SmartFolio's value proposition while showcasing the technical sophistication of Agentic Postgres integration throughout the user journey.

### Action

**Redesign** the following key pages with candidate-centric messaging and Agentic Postgres integration highlights:

1. **Homepage (/)** - Transform from employer-focused landing to candidate journey showcase
2. **Sign Up (/auth/signup)** - Emphasize the value of consolidating professional data
3. **Sign In (/auth/signin)** - Welcome back messaging for unified profile management
4. **Dashboard (/dashboard)** - Central hub for data consolidation and sharing

### Format

**Homepage Redesign:**
```typescript
// src/app/page.tsx - Candidate-Centric Landing Page
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Github, Linkedin, MessageSquare, Zap, Database,
  ArrowRight, CheckCircle, Sparkles, BrainCircuit, Users
} from "lucide-react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const [currentExample, setCurrentExample] = useState(0);

  const conversationExamples = [
    "Tell me about Sarah's experience with distributed systems",
    "What machine learning projects has John worked on?",
    "How did Maria lead her team through the product redesign?",
    "What frameworks does Alex prefer for backend development?"
  ];

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % conversationExamples.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your professional story...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <BrainCircuit className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SmartFolio
                </h1>
                <p className="text-xs text-gray-500">Powered by Agentic Postgres</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Create Your Story
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Your Complete Professional Story, Conversationally
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Stop Scattering Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Career Story
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload your resume, connect GitHub & LinkedIn, add project docs and testimonials.
            SmartFolio creates one intelligent profile where people can explore your professional
            journey through natural conversation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3">
                <FileText className="mr-2 h-5 w-5" />
                Create Your SmartFolio
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-3">
              <MessageSquare className="mr-2 h-5 w-5" />
              See Example Conversation
            </Button>
          </div>

          {/* Live Conversation Example */}
          <Card className="max-w-2xl mx-auto border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Instead of scanning static profiles, visitors ask:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4 border border-blue-100 min-h-[60px] flex items-center justify-center">
                <p className="text-gray-800 font-medium text-lg transition-all duration-500">
                  "{conversationExamples[currentExample]}"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Sources Section */}
      <section className="bg-white/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Unify All Your Professional Data
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              SmartFolio intelligently connects information from all your sources into one conversational experience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { icon: FileText, label: "Resumes & CVs", color: "bg-red-100 text-red-600" },
              { icon: Github, label: "GitHub Repos", color: "bg-gray-100 text-gray-700" },
              { icon: Linkedin, label: "LinkedIn Profile", color: "bg-blue-100 text-blue-600" },
              { icon: Users, label: "Testimonials", color: "bg-green-100 text-green-600" }
            ].map((source, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 ${source.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <source.icon className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-gray-900">{source.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Agentic Postgres Highlight */}
          <Card className="bg-gradient-to-r from-purple-100 to-blue-100 border-purple-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <Database className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-2xl font-bold text-purple-900">Powered by Agentic Postgres</h3>
                <Zap className="h-6 w-6 text-yellow-500 ml-2" />
              </div>
              <p className="text-center text-purple-800 text-lg mb-6 max-w-3xl mx-auto">
                Tiger MCP enables direct AI-to-database communication, creating intelligent connections
                between your projects, skills, and experiences for contextually perfect responses.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-2">
                    <BrainCircuit className="h-8 w-8 text-purple-600 mx-auto" />
                  </div>
                  <p className="font-semibold text-purple-900">Smart Connections</p>
                  <p className="text-sm text-purple-700">AI understands relationships in your data</p>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-2">
                    <Zap className="h-8 w-8 text-yellow-600 mx-auto" />
                  </div>
                  <p className="font-semibold text-purple-900">Instant Responses</p>
                  <p className="text-sm text-purple-700">Sub-second query processing</p>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-2">
                    <Sparkles className="h-8 w-8 text-blue-600 mx-auto" />
                  </div>
                  <p className="font-semibold text-purple-900">Contextual Intelligence</p>
                  <p className="text-sm text-purple-700">Responses adapt to visitor interest</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Your Professional Story,
                <span className="text-blue-600"> Intelligently Connected</span>
              </h2>
              <div className="space-y-4">
                {[
                  "Stop updating profiles across multiple platforms",
                  "Let visitors explore your experience conversationally",
                  "AI connects your projects, skills, and achievements",
                  "Share one link instead of scattered information",
                  "Get insights on how people discover your expertise"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 font-medium">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span>Visitor exploring your profile</span>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg rounded-br-sm max-w-xs">
                          What experience does Sarah have with React?
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-sm max-w-sm">
                          Sarah has extensive React experience! She built the frontend for EcoTrack
                          (2023) using React 18 with TypeScript, led the migration of LegalFlow's
                          interface from Vue to React (2022), and contributed to several open-source
                          React components. Would you like details about any specific project?
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-blue-600 font-medium text-center">
                    <Sparkles className="h-4 w-4 inline mr-1" />
                    Powered by intelligent data connections
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Create Your Conversational Profile?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join professionals who are making their career stories more discoverable and engaging
            through intelligent conversation.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 font-semibold">
              <FileText className="mr-2 h-5 w-5" />
              Start Building Your SmartFolio
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BrainCircuit className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold">SmartFolio</p>
                <p className="text-xs text-gray-400">Powered by Agentic Postgres</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 SmartFolio. Your professional story, intelligently connected.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

### Tone

Create a **warm, professional, and empowering** user experience that makes candidates feel excited about consolidating their professional story. The design should feel modern and trustworthy while clearly communicating the technical sophistication of Agentic Postgres without being overly technical.

### Examples

**Key Design Principles:**
1. **Candidate Journey Focus**: Every page emphasizes the user's journey of creating a unified professional story
2. **Agentic Postgres Integration**: Subtle but clear references to the technical differentiators
3. **Conversational Emphasis**: UI elements that show the chat/conversation aspect
4. **Data Consolidation**: Visual representation of bringing scattered data together
5. **Professional but Approachable**: Clean design that feels both sophisticated and welcoming

**Authentication Pages**:
- Sign up emphasizes "Create Your Professional Story"
- Sign in welcomes back to "Your Unified Profile"
- Both highlight the value of data consolidation

**Dashboard Redesign**:
- Central hub showing connected data sources
- Chat interface prominence
- Sharing and analytics features
- Clear Agentic Postgres benefits

### Deliverables

1. ✅ Redesigned homepage with candidate-centric messaging and Agentic Postgres highlights
2. ✅ Updated authentication pages reflecting unified professional data vision
3. ✅ Enhanced dashboard as central hub for data consolidation and sharing
4. ✅ Consistent design language emphasizing conversational career exploration
5. ✅ Visual integration of Agentic Postgres technical differentiators
6. ✅ Mobile-responsive design optimized for professional sharing

---

### ✅ Success Criteria

- [ ] Homepage clearly communicates candidate value proposition with conversational examples
- [ ] Authentication flow emphasizes professional data unification benefits
- [ ] Dashboard serves as effective hub for data management and sharing
- [ ] Agentic Postgres features are prominently but tastefully highlighted
- [ ] UI design is consistent, modern, and professionally appealing
- [ ] Mobile experience works seamlessly for profile sharing
- [ ] User testing shows improved understanding of SmartFolio's unique value

---

# Phase 2: Core Profile Building

**Target Completion:** Week 5
**Status:** Not Started (Blocked on Phase 1)

---

## 2.1 Document Upload & Processing

## Task 5: Implement file upload with document processing

**Status:** Blocked on Task 4

**Dependencies:**
- Task 4: UI redesign alignment

**Deliverables:**
- File upload component for PDF/DOCX files
- Text extraction from uploaded documents
- Store documents in database with metadata
- Basic AI processing to extract structured data

---

### 🎨 C.R.A.F.T.E.D Prompt

### Context

You're building **SmartFolio's document upload system** as part of Option 2 implementation. Users need to upload their resumes (PDF/DOCX format) which will be processed to extract text content and structured data using AI. This is a core feature that transforms static documents into queryable profile information.

The system needs to handle file validation, text extraction, storage, and trigger AI processing to identify skills, experience, education, and other structured data from unstructured resume text.

### Role

You are a **full-stack developer** implementing a document upload and processing system that can extract meaningful profile data from resume files using AI assistance.

### Action

**Create** the document upload system with these components:

1. `src/components/DocumentUpload.tsx` - File upload UI component
2. `src/app/api/documents/upload/route.ts` - Upload API endpoint
3. `src/lib/documentProcessor.ts` - Text extraction and AI processing utilities
4. `src/app/dashboard/documents/page.tsx` - Document management page

**Specific Features:**
1. Drag-and-drop file upload interface
2. File validation (PDF/DOCX only, size limits)
3. Text extraction from PDF and DOCX files
4. AI processing to extract structured profile data
5. Progress tracking and error handling
6. Document management interface

### Format

**File Upload Component:**
```typescript
// src/components/DocumentUpload.tsx
"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadedDocument {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  processed: boolean;
}

interface DocumentUploadProps {
  onUploadComplete?: (document: UploadedDocument) => void;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'resume');

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadedFile(result.document);

      // Start processing
      setProcessing(true);
      await processDocument(result.document.id);

      onUploadComplete?.(result.document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const processDocument = async (documentId: string) => {
    const response = await fetch(`/api/documents/${documentId}/process`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Processing failed');
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p>Uploading document...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Drag & drop your PDF or DOCX file, or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Maximum file size: 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            {processing ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div>
                  <p className="font-medium">Processing document...</p>
                  <p className="text-sm text-gray-500">
                    Extracting profile information from your resume
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <p className="font-medium text-green-700">Document uploaded successfully!</p>
                  <p className="text-sm text-gray-500">{uploadedFile.fileName}</p>
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Upload API Route:**
```typescript
// src/app/api/documents/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { extractText } from '@/lib/documentProcessor';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'uploads', session.user.id);
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, file.name);
    await writeFile(filePath, buffer);

    // Extract text content
    const extractedText = await extractText(filePath, file.type);

    // Save to database
    const document = await prisma.userDocument.create({
      data: {
        userId: session.user.id,
        documentType,
        fileName: file.name,
        filePath,
        fileSize: BigInt(file.size),
        mimeType: file.type,
        extractedText,
        processed: false,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        documentType: document.documentType,
        fileSize: Number(document.fileSize),
        processed: document.processed,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### Tone

Build a **user-friendly, professional interface** that handles errors gracefully and provides clear feedback throughout the upload and processing stages. The system should feel reliable and trustworthy since users are uploading sensitive career documents.

### Examples

**Example 1 - Document Processing Utility:**
```typescript
// src/lib/documentProcessor.ts
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { readFile } from 'fs/promises';
import OpenAI from 'openai';
import { env } from '@/lib/env';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function extractText(filePath: string, mimeType: string): Promise<string> {
  const buffer = await readFile(filePath);

  if (mimeType === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text;
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error('Unsupported file type');
}

export async function processResumeWithAI(text: string) {
  const prompt = `
    Analyze this resume and extract structured information. Return a JSON object with:

    {
      "personalInfo": {
        "name": "Full name",
        "email": "email@example.com",
        "phone": "phone number",
        "location": "city, state/country"
      },
      "summary": "Professional summary/bio",
      "skills": ["skill1", "skill2", "skill3"],
      "experience": [
        {
          "company": "Company Name",
          "position": "Job Title",
          "startDate": "YYYY-MM",
          "endDate": "YYYY-MM or Present",
          "description": "Job description and achievements"
        }
      ],
      "education": [
        {
          "institution": "School Name",
          "degree": "Degree Type",
          "field": "Field of Study",
          "graduationDate": "YYYY"
        }
      ]
    }

    Resume text:
    ${text}
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  });

  const result = completion.choices[0].message.content;
  try {
    return JSON.parse(result || '{}');
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return null;
  }
}
```

### Deliverables

1. ✅ Create file upload component with drag-and-drop
2. ✅ Implement upload API route with validation
3. ✅ Add text extraction for PDF and DOCX files
4. ✅ Create AI processing to extract structured data
5. ✅ Add progress tracking and error handling
6. ✅ Build document management interface

---

### ✅ Success Criteria

- [ ] Users can upload PDF and DOCX files via drag-and-drop
- [ ] File validation prevents invalid file types/sizes
- [ ] Text extraction works for both PDF and DOCX formats
- [ ] AI processing extracts structured profile data
- [ ] Upload progress and processing status shown to user
- [ ] Documents stored securely with proper file organization
- [ ] Error handling provides helpful feedback
- [ ] Document management page lists uploaded files

---

## Task 6: Create profile management interface

**Status:** Blocked on Task 5

**Dependencies:**
- Task 5: Document upload system

**Deliverables:**
- Profile editing form with all user fields
- Skills management with auto-suggestions
- Experience and education forms
- Profile picture upload
- Privacy settings for public profile

**Implementation:**

```typescript
// src/app/dashboard/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  phone: string;
  bio: string;
  profilePictureUrl: string | null;
  publicProfileEnabled: boolean;
  chatInterfaceEnabled: boolean;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        alert('Profile saved successfully!');
      } else {
        alert('Failed to save profile');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Profile Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Avatar className="h-32 w-32 mx-auto">
              <AvatarImage src={profile.profilePictureUrl || ''} />
              <AvatarFallback className="text-2xl">
                {profile.firstName[0]}{profile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              Change Picture
            </Button>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({...profile, location: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                placeholder="Tell people about yourself..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Public Profile</Label>
                <p className="text-sm text-gray-500">
                  Allow others to view your profile
                </p>
              </div>
              <Switch
                checked={profile.publicProfileEnabled}
                onCheckedChange={(checked) =>
                  setProfile({...profile, publicProfileEnabled: checked})
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Chat Interface</Label>
                <p className="text-sm text-gray-500">
                  Enable AI chat on your public profile
                </p>
              </div>
              <Switch
                checked={profile.chatInterfaceEnabled}
                onCheckedChange={(checked) =>
                  setProfile({...profile, chatInterfaceEnabled: checked})
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Button onClick={saveProfile} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Success Criteria:**
- Profile form allows editing all user fields
- Changes save to database correctly
- Privacy settings control public profile visibility
- Profile picture upload works
- Form validation prevents invalid data

---

## 2.2 Links & Testimonials

## Task 7: Implement LinkedIn/GitHub URL management

**Status:** Blocked on Task 6

**Dependencies:**
- Task 6: Profile management interface

**Deliverables:**
- Links management interface
- URL validation and verification
- Display linked profiles on public page
- Basic verification system

**Success Criteria:**
- Users can add LinkedIn and GitHub URLs
- URL validation ensures proper format
- Links display correctly on public profiles
- Basic verification checks URL accessibility

---

## Task 8: Create testimonial management system

**Status:** Blocked on Task 7

**Dependencies:**
- Task 7: Links management

**Deliverables:**
- Testimonial creation and editing interface
- Email invitation system for testimonials
- Testimonial verification workflow
- Public display of verified testimonials

**Success Criteria:**
- Users can add testimonials manually
- Email invitations sent to recommenders
- Verification process validates testimonials
- Testimonials display on public profiles

---

# Phase 3: AI Integration & Chat

**Target Completion:** Week 8
**Status:** Not Started (Blocked on Phase 2)

---

## 3.1 Intent Recognition & Vector Embeddings

## Task 9: Implement intent-based vector embeddings and search

**Status:** Blocked on Task 8

**Dependencies:**
- Task 8: Testimonial system

**Deliverables:**
- Intent classification system for employer queries
- Context-aware vector embeddings for profile content
- Intent-adaptive search and matching algorithms
- Real-time intent analysis and response optimization

**Intent Recognition Implementation:**

```typescript
// src/lib/intentAnalysis.ts
import OpenAI from 'openai';
import { env } from '@/lib/env';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface IntentAnalysis {
  primaryIntent: 'technical_assessment' | 'culture_fit' | 'leadership_evaluation' | 'project_specific' | 'general_inquiry';
  confidence: number;
  keyRequirements: string[];
  contextualDepth: 'surface' | 'detailed' | 'expert';
  followUpLikelihood: number;
}

export async function analyzeQueryIntent(query: string, conversationHistory: string[] = []): Promise<IntentAnalysis> {
  const prompt = `
Analyze this employer query to understand their hiring intent:

Query: "${query}"
Previous questions: ${conversationHistory.join(', ')}

Return JSON with:
{
  "primaryIntent": "technical_assessment|culture_fit|leadership_evaluation|project_specific|general_inquiry",
  "confidence": 0.0-1.0,
  "keyRequirements": ["requirement1", "requirement2"],
  "contextualDepth": "surface|detailed|expert",
  "followUpLikelihood": 0.0-1.0
}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}
```

**Intent-Adaptive Profile Responses:**

```typescript
// src/lib/intentAdaptiveProfiles.ts
export async function generateIntentAdaptiveResponse(
  userProfile: any,
  query: string,
  intentAnalysis: IntentAnalysis
): Promise<string> {
  // Prioritize profile information based on intent
  let focusAreas: string[] = [];

  switch (intentAnalysis.primaryIntent) {
    case 'technical_assessment':
      focusAreas = ['skills', 'projects', 'technical_experience'];
      break;
    case 'culture_fit':
      focusAreas = ['testimonials', 'team_experience', 'values'];
      break;
    case 'leadership_evaluation':
      focusAreas = ['management_experience', 'team_building', 'strategic_thinking'];
      break;
    case 'project_specific':
      focusAreas = ['relevant_projects', 'similar_challenges', 'outcomes'];
      break;
    default:
      focusAreas = ['overview', 'key_highlights'];
  }

  // Generate contextually appropriate response depth
  const responseDepth = intentAnalysis.contextualDepth === 'expert' ? 'comprehensive' :
                       intentAnalysis.contextualDepth === 'detailed' ? 'moderate' : 'concise';

  // Build response with intent-specific focus
  return await buildContextualResponse(userProfile, query, focusAreas, responseDepth);
}
```

**Success Criteria:**
- Intent classification achieves >85% accuracy on test queries
- Profile responses adapt appropriately to detected intent
- Vector embeddings include intent-contextual metadata
- Real-time intent analysis completes in <2 seconds
- Intent learning improves match quality over time

---

## 3.2 Intent-Aware Chat Interface

## Task 10: Create intent-aware public profile pages with adaptive chat interface

**Status:** Blocked on Task 9

**Dependencies:**
- Task 9: Intent-based vector embeddings system

**Deliverables:**
- Intent-adaptive public profile page layout
- Real-time chat interface with intent recognition
- AI-powered responses that adapt to employer intent
- Anonymous visitor support with intent tracking
- Progressive intent learning and optimization

**SkillScout AI Features:**
- **Query Intent Analysis**: SkillScout analyzes every employer question for hiring intent and technical context
- **Project-First Prioritization**: SkillScout weighs project examples and GitHub contributions higher than resume content for technical assessments
- **Skills-to-Role Matching**: SkillScout specializes in connecting real technical abilities to specific job requirements
- **Progressive Technical Disclosure**: Follow-up questions reveal deeper project details and technical problem-solving approaches
- **Context Preservation**: SkillScout maintains technical context throughout the conversation session to provide increasingly relevant insights

---

### 🎨 C.R.A.F.T.E.D Prompt

### Context

You're building **SmartFolio's intent-aware public profile chat interface** - the core differentiating feature that revolutionizes professional discovery by understanding employer intent and adapting responses accordingly. This chat system uses AI with vector embeddings and intent recognition to provide intelligent, contextually relevant responses that prioritize information based on what employers are truly looking for.

The chat interface needs to be anonymous-friendly (no registration required), real-time, and provide intent-adaptive responses that feel like having a focused conversation with the person about exactly what matters for the specific hiring context. The system learns from interaction patterns to continuously improve intent detection and response relevance.

### Role

You are a **full-stack developer** creating an intent-first AI-powered chat interface that transforms static profiles into adaptive conversational experiences, using advanced intent recognition and vector search to provide responses that align with employer hiring intent and context.

### Action

**Create** the public chat system with these components:

1. `src/app/[username]/page.tsx` - Public profile page with chat interface
2. `src/components/ChatInterface.tsx` - Real-time chat component
3. `src/app/api/chat/route.ts` - Chat API with AI integration
4. `src/lib/chatAI.ts` - AI response generation with vector search

**Specific Intent-Based Features:**
1. Intent-adaptive public profile layout that prioritizes relevant information
2. Embedded chat interface with real-time intent analysis
3. AI responses that adapt to detected employer intent and context
4. Progressive disclosure based on conversation depth and intent sophistication
5. Anonymous visitor support with intent tracking and learning
6. Context-aware responses from intent-enhanced vector search
7. Intent-driven information prioritization and response optimization

### Format

**Public Profile Page:**
```typescript
// src/app/[username]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mail, Phone, Github, Linkedin } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';

interface PublicProfileProps {
  params: { username: string };
}

async function getUserByUsername(username: string) {
  // For now, we'll use email as username (can add username field later)
  const user = await prisma.user.findFirst({
    where: {
      email: username,
      publicProfileEnabled: true,
    },
    include: {
      links: true,
      testimonials: {
        where: { public: true, verified: true },
      },
      experiences: {
        orderBy: { startDate: 'desc' },
      },
      education: {
        orderBy: { endDate: 'desc' },
      },
      skills: {
        include: { skill: true },
      },
    },
  });

  return user;
}

export default async function PublicProfile({ params }: PublicProfileProps) {
  const user = await getUserByUsername(params.username);

  if (!user) {
    notFound();
  }

  const linkedinUrl = user.links.find(link => link.linkType === 'linkedin')?.url;
  const githubUrl = user.links.find(link => link.linkType === 'github')?.url;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={user.profilePictureUrl || ''} />
              <AvatarFallback className="text-2xl">
                {user.firstName[0]}{user.lastName[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>

              {user.bio && (
                <p className="text-lg text-gray-600 mt-2">{user.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                )}

                {user.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                )}

                {githubUrl && (
                  <a
                    href={githubUrl}
                    className="flex items-center gap-1 hover:text-blue-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}

                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    className="flex items-center gap-1 hover:text-blue-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experience */}
            {user.experiences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.experiences.map((exp) => (
                    <div key={exp.id} className="border-l-2 border-blue-200 pl-4">
                      <h3 className="font-semibold">{exp.position}</h3>
                      <p className="text-blue-600">{exp.company}</p>
                      <p className="text-sm text-gray-500">
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </p>
                      {exp.description && (
                        <p className="text-gray-700 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {user.education.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Education</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.education.map((edu) => (
                    <div key={edu.id}>
                      <h3 className="font-semibold">{edu.degree}</h3>
                      <p className="text-blue-600">{edu.institution}</p>
                      {edu.fieldOfStudy && (
                        <p className="text-gray-600">{edu.fieldOfStudy}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Testimonials */}
            {user.testimonials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Testimonials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 italic">"{testimonial.content}"</p>
                      <div className="mt-2">
                        <p className="font-medium">{testimonial.recommenderName}</p>
                        {testimonial.recommenderTitle && testimonial.recommenderCompany && (
                          <p className="text-sm text-gray-600">
                            {testimonial.recommenderTitle} at {testimonial.recommenderCompany}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {user.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((userSkill) => (
                      <Badge key={userSkill.id} variant="secondary">
                        {userSkill.skill.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chat Interface */}
            {user.chatInterfaceEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle>Ask Me Anything</CardTitle>
                  <p className="text-sm text-gray-600">
                    Chat with AI about {user.firstName}'s background
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <ChatInterface userId={user.id} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Chat Interface Component:**
```typescript
// src/components/ChatInterface.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  userId: string;
}

export default function ChatInterface({ userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help answer questions about my professional background. Ask me about my experience, skills, projects, or anything else you'd like to know!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session
    initSession();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initSession = async () => {
    try {
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
      }
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: input,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-96">
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Tone

Create a **professional yet approachable** interface that feels like having a natural conversation with someone about their career. The AI responses should be knowledgeable, accurate, and helpful while maintaining the person's voice and perspective.

### Examples

**Example - Chat API with Vector Search:**
```typescript
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChatResponse } from '@/lib/chatAI';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json();

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    });

    // Get session info
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        profileUser: {
          include: {
            knowledgeEmbeddings: true,
            experiences: true,
            skills: { include: { skill: true } },
            testimonials: { where: { public: true, verified: true } },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Generate AI response
    const response = await generateChatResponse(message, session.profileUser);

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: response,
      },
    });

    // Update session message count
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { totalMessages: { increment: 2 } },
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

### Deliverables

1. ✅ Create public profile page with professional layout
2. ✅ Build embedded chat interface with real-time messaging
3. ✅ Implement AI responses using profile context
4. ✅ Add anonymous visitor support (no registration required)
5. ✅ Create chat session management
6. ✅ Implement vector search for contextual responses

---

### ✅ Success Criteria

- [ ] Public profiles display professional information clearly
- [ ] Chat interface is intuitive and responsive
- [ ] AI responses are contextually relevant and accurate
- [ ] Anonymous visitors can chat without registration
- [ ] Real-time messaging works smoothly
- [ ] Vector search improves response quality
- [ ] Chat sessions are properly tracked
- [ ] Mobile-responsive design works well

---

# Phase 4: Testing & Deployment

**Target Completion:** Week 10
**Status:** Not Started (Blocked on Phase 3)

---

## 4.1 Testing & Quality Assurance

## Task 11: Write comprehensive tests including intent-based validation

**Status:** Blocked on Task 10

**Dependencies:**
- Task 10: Intent-aware chat interface

**Deliverables:**
- Unit tests for all core functionality including intent recognition
- Integration tests for API endpoints and intent-adaptive responses
- End-to-end tests for user workflows and intent-based scenarios
- Intent classification accuracy testing with diverse query sets
- A/B testing framework for intent-adaptive vs traditional responses

**Intent-Specific Testing:**

```typescript
// src/tests/intent.test.ts
describe('Intent Recognition System', () => {
  test('correctly identifies technical assessment intent', async () => {
    const query = "What frameworks has Sarah used for backend development?";
    const intent = await analyzeQueryIntent(query);
    expect(intent.primaryIntent).toBe('technical_assessment');
    expect(intent.confidence).toBeGreaterThan(0.8);
  });

  test('adapts profile response based on culture fit intent', async () => {
    const query = "How does John work with teams?";
    const intent = await analyzeQueryIntent(query);
    const response = await generateIntentAdaptiveResponse(mockProfile, query, intent);
    expect(response).toContain('team collaboration');
    expect(response).toContain('testimonials');
  });

  test('progressive disclosure works with follow-up questions', async () => {
    const history = ["Tell me about Maria's experience", "What specific projects has she led?"];
    const intent = await analyzeQueryIntent("Can you give me more technical details?", history);
    expect(intent.contextualDepth).toBe('detailed');
  });
});
```

**Success Criteria:**
- All core features have test coverage including intent recognition (>90%)
- Intent classification achieves >85% accuracy on diverse test queries
- Intent-adaptive responses improve relevance by >40% vs generic responses
- Critical user flows are tested end-to-end including intent scenarios
- A/B testing shows measurable improvement in employer engagement

---

## 4.2 Deployment & Launch

## Task 12: Deploy to production

**Status:** Blocked on Task 11

**Dependencies:**
- Task 11: Testing suite

**Deliverables:**
- Production deployment on Vercel/Railway
- Database setup with migrations
- Environment variables configuration
- SSL certificates and domain setup

**Success Criteria:**
- Application runs smoothly in production
- Database migrations execute successfully
- All environment variables properly configured
- HTTPS and custom domain working

---

## Task 13: Performance optimization and monitoring

**Status:** Blocked on Task 12

**Dependencies:**
- Task 12: Production deployment

**Deliverables:**
- Performance monitoring setup
- Error tracking and logging
- Database query optimization
- Caching implementation

**Success Criteria:**
- Page load times under 2 seconds
- AI responses under 5 seconds
- Error tracking captures issues
- Database queries optimized

---

# Success Metrics & Launch Criteria

## Technical Requirements
- [ ] All 13 tasks completed successfully
- [ ] Test coverage above 90% for core functionality including intent recognition
- [ ] Performance benchmarks met (including <2s intent analysis)
- [ ] Security review passed
- [ ] Documentation complete

## Intent-Based Performance Requirements
- [ ] Intent classification achieves >85% accuracy on test query sets
- [ ] Intent-adaptive responses show >40% improvement in relevance vs generic responses
- [ ] Progressive disclosure depth correlates with employer engagement (>70% correlation)
- [ ] Intent learning shows measurable improvement over time (>10% monthly accuracy gains)
- [ ] Contextual response time under 3 seconds including intent analysis

## User Experience Requirements
- [ ] User registration and login works flawlessly
- [ ] Document upload and processing completes successfully
- [ ] Public profiles display correctly with intent-adaptive prioritization
- [ ] Chat interface provides intent-aware, contextually relevant responses
- [ ] Mobile experience is fully functional with intent recognition
- [ ] Anonymous employers can discover relevant candidates through natural language queries

## Business Requirements
- [ ] Platform supports 100+ users with personalized intent learning
- [ ] AI responses demonstrate clear intent understanding and adaptation
- [ ] User profiles showcase professional information with smart prioritization
- [ ] Chat interface demonstrates superior value vs static profile browsing
- [ ] Intent-driven discovery shows measurable improvement in candidate-employer matching
- [ ] Foundation ready for Option 3 features with robust intent architecture

---

# Risk Mitigation

## High-Risk Areas
1. **Intent Recognition Accuracy** - Risk: Poor intent detection leads to irrelevant responses
   - Mitigation: Extensive training data and continuous learning from user interactions
   - Fallback: Generic response mode with option to refine query

2. **AI Response Quality & Intent Adaptation** - Risk: Responses don't align with detected intent
   - Mitigation: Intent-specific response templates and comprehensive testing
   - Fallback: Human-written response templates with intent tagging

3. **Vector Search & Intent Performance** - Risk: Combined intent+vector search is too slow
   - Mitigation: Database indexing, query optimization, and intent pre-computation
   - Fallback: Simplified intent categories with faster matching

4. **Intent Learning Complexity** - Risk: Intent learning system becomes too complex to maintain
   - Mitigation: Start with simple intent categories, gradually add sophistication
   - Fallback: Static intent classification without learning

5. **File Processing Reliability** - Risk: Document parsing failures impact intent analysis
   - Mitigation: Multiple parsing libraries and error handling
   - Fallback: Manual profile entry with intent-tagged information

## Timeline Risks
- **Scope Creep**: Stick to Option 2 feature set
- **AI Integration Complexity**: Start with simple prompts, iterate
- **Third-party Dependencies**: Have backup plans for critical services

---

This implementation plan provides a structured 10-week roadmap to build SmartFolio Option 2, with clear dependencies, deliverables, and success criteria for each task. The plan balances ambitious AI features with practical implementation constraints to achieve the 70% success probability target.