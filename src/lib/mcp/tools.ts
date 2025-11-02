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
