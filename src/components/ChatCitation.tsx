'use client';

import { ExternalLink } from 'lucide-react';

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
  const getTypeColor = () => {
    switch (citation.type) {
      case 'experience':
        return 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200';
      case 'education':
        return 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200';
      case 'skill':
        return 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200';
      case 'testimonial':
        return 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200';
      default:
        return 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200';
    }
  };

  const handleClick = () => {
    // First try to scroll to the specific item by ID
    const element = document.getElementById(citation.id);

    if (element) {
      // Get element position relative to the page
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      // Scroll with offset to account for any fixed headers
      const offset = 100; // Adjust this value as needed
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    } else {
      // Fallback: scroll to the section if specific item not found
      const sectionMap: Record<string, string> = {
        experience: 'experience-section',
        education: 'education-section',
        skill: 'skills-section',
        testimonial: 'testimonials-section'
      };

      const sectionId = sectionMap[citation.type];
      if (sectionId) {
        const sectionElement = document.getElementById(sectionId);
        if (sectionElement) {
          const elementPosition = sectionElement.getBoundingClientRect().top + window.scrollY;
          const offset = 100;
          window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${getTypeColor()}`}
      title={citation.excerpt}
    >
      <span className="truncate max-w-[200px]">{citation.title}</span>
      <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
    </button>
  );
}
