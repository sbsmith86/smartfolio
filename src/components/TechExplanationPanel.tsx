'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Database, Search, Zap, FileStack, BrainCircuit } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  content: string;
}

const sections: Section[] = [
  {
    id: 'semantic',
    title: 'Semantic Layer',
    icon: BrainCircuit,
    color: 'text-purple-600',
    content: 'Each experience, education record, and skill is converted to a 1536-dimensional embedding using OpenAI\'s text-embedding-3-small model. When you ask a question, it\'s also converted to an embedding, and we use pgvector\'s cosine distance operator (<=> ) to find semantically similar content. This captures meaning and context, not just keyword matches.',
  },
  {
    id: 'fulltext',
    title: 'Full-Text Layer',
    icon: Search,
    color: 'text-blue-600',
    content: 'PostgreSQL\'s pg_trgm extension provides trigram similarity matching for exact terms and acronyms. This complements semantic search by ensuring specific technologies, company names, and industry terms are matched precisely. The similarity() function scores text overlap even with typos or variations.',
  },
  {
    id: 'hybrid',
    title: 'Hybrid Scoring',
    icon: Zap,
    color: 'text-amber-600',
    content: 'We combine both approaches with a weighted blend: 70% semantic similarity + 30% full-text similarity. This balances conceptual understanding with keyword precision. The system retrieves top candidates from each layer, merges them, and re-ranks by hybrid score to deliver the most relevant results.',
  },
  {
    id: 'fluid',
    title: 'Fluid Storage',
    icon: FileStack,
    color: 'text-green-600',
    content: 'When you upload a resume, import GitHub projects, or paste LinkedIn data, GPT-4o parses the content and immediately generates embeddings. There\'s no schema migration or manual indexing—new data becomes searchable instantly. The knowledge_embeddings table grows dynamically as users add more information.',
  },
  {
    id: 'agent',
    title: 'Agent Pattern (MCP)',
    icon: Database,
    color: 'text-orange-600',
    content: 'SmartFolio follows the Model Context Protocol pattern with specialized agents: an Ingestion Agent (GPT-4o) normalizes and structures incoming data, while a Query Agent retrieves relevant context and synthesizes grounded answers. This separation ensures data quality on write and intelligent responses on read.',
  },
];

export default function TechExplanationPanel() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedSections.size === sections.length) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(sections.map((s) => s.id)));
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Database className="h-6 w-6 text-purple-600" />
            Agentic Postgres Technology
          </CardTitle>
          <button
            onClick={toggleAll}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            {expandedSections.size === sections.length ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          This chat is powered by TimescaleDB Cloud with pgvector and pg_trgm for hybrid search
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);

          return (
            <div
              key={section.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${section.color}`} />
                  <span className="font-semibold text-gray-900">{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-700 leading-relaxed">{section.content}</p>
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-4 pt-4 border-t border-purple-200">
          <p className="text-xs text-gray-600 text-center">
            Built for the{' '}
            <a
              href="https://dev.to/challenges/timescale"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Agentic Postgres Challenge
            </a>
            {' '}using TimescaleDB Cloud (Tiger Data)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
