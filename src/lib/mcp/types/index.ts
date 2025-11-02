import { z } from 'zod';

// ===== Data Ingestion Schemas (AI Writes) =====

export const ResumeDataSchema = z.object({
  experiences: z.array(z.object({
    title: z.string(),
    company: z.string(),
    startDate: z.string().nullable().optional(), // ISO date - might not be on resume
    endDate: z.string().nullable().optional(), // null = current position
    description: z.string().nullable().optional(), // Some resumes just list bullets
    skills: z.array(z.string()).optional(),
  })).optional(), // Entire array is optional - some resumes might not have work experience
  education: z.array(z.object({
    degree: z.string(), // At minimum we need the degree
    institution: z.string(), // And the school
    fieldOfStudy: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    gpa: z.string().nullable().optional(),
  })).optional(), // Optional - maybe just a skills-based resume
  skills: z.array(z.object({
    name: z.string(), // Just the skill name
    category: z.enum(['technical', 'soft', 'language', 'certification', 'other']).optional(),
    proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  })).optional(), // Optional - not all resumes have a skills section
  summary: z.string().nullable().optional(),
  contactInfo: z.object({
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    github: z.string().nullable().optional(),
    portfolio: z.string().nullable().optional(),
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
  context: Map<string, unknown>; // Session-specific state
}

// ===== MCP Tool Definitions =====

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (input: unknown, session: MCPSession) => Promise<unknown>;
}
