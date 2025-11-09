'use client';

import { FileText, GraduationCap, Briefcase, MessageSquare, Code } from 'lucide-react';

interface Citation {
  id: string;
  type: 'experience' | 'education' | 'skill' | 'testimonial';
  title: string;
  excerpt: string;
}

interface ChatCitationProps {
  citation: Citation;
}

export default function ChatCitation({ citation }: ChatCitationProps) {
  const getIcon = () => {
    switch (citation.type) {
      case 'experience':
        return <Briefcase className="w-3 h-3" />;
      case 'education':
        return <GraduationCap className="w-3 h-3" />;
      case 'skill':
        return <Code className="w-3 h-3" />;
      case 'testimonial':
        return <MessageSquare className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const getTypeLabel = () => {
    switch (citation.type) {
      case 'experience':
        return 'Experience';
      case 'education':
        return 'Education';
      case 'skill':
        return 'Skill';
      case 'testimonial':
        return 'Testimonial';
      default:
        return 'Source';
    }
  };

  const getTypeColor = () => {
    switch (citation.type) {
      case 'experience':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'education':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'skill':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'testimonial':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleClick = () => {
    // Scroll to the relevant section on the page
    const sectionMap: Record<string, string> = {
      experience: 'experience-section',
      education: 'education-section',
      skill: 'skills-section',
      testimonial: 'testimonials-section'
    };

    const sectionId = sectionMap[citation.type];
    if (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${getTypeColor()}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium uppercase tracking-wide">
              {getTypeLabel()}
            </span>
          </div>
          <p className="text-sm font-medium mb-1 line-clamp-1">
            {citation.title}
          </p>
          <p className="text-xs opacity-80 line-clamp-2">
            {citation.excerpt}
          </p>
        </div>
      </div>
    </button>
  );
}
