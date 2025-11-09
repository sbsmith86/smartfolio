/**
 * Chat utilities for context building and citation extraction
 * Used by the chat API endpoint
 */

interface RetrievedItem {
  id: string;
  type: 'experience' | 'education' | 'skill' | 'testimonial';
  content: string;
  title: string;
  similarity?: number;
}

interface Citation {
  id: string;
  type: 'experience' | 'education' | 'skill' | 'testimonial';
  title: string;
  excerpt: string;
}

/**
 * Build context string from retrieved items for GPT-4o prompt
 */
export function buildContext(items: RetrievedItem[]): string {
  const sections: string[] = [];

  // Group items by type
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, RetrievedItem[]>);

  // Build experiences section
  if (grouped.experience?.length > 0) {
    sections.push('PROFESSIONAL EXPERIENCES:');
    grouped.experience.forEach((item, idx) => {
      sections.push(`${idx + 1}. ${item.title}`);
      sections.push(`   ${item.content}`);
      sections.push('');
    });
  }

  // Build education section
  if (grouped.education?.length > 0) {
    sections.push('EDUCATION:');
    grouped.education.forEach((item, idx) => {
      sections.push(`${idx + 1}. ${item.title}`);
      if (item.content) {
        sections.push(`   ${item.content}`);
      }
      sections.push('');
    });
  }

  // Build skills section
  if (grouped.skill?.length > 0) {
    sections.push('SKILLS:');
    const skillsList = grouped.skill.map((item) => item.title).join(', ');
    sections.push(skillsList);
    sections.push('');
  }

  // Build testimonials section
  if (grouped.testimonial?.length > 0) {
    sections.push('TESTIMONIALS:');
    grouped.testimonial.forEach((item, idx) => {
      sections.push(`${idx + 1}. ${item.title}`);
      sections.push(`   "${item.content}"`);
      sections.push('');
    });
  }

  return sections.join('\n');
}

/**
 * Extract citations from the answer by matching against retrieved items
 * Returns relevant citations that were likely referenced in the answer
 */
export function extractCitations(
  answer: string,
  retrievedItems: RetrievedItem[]
): Citation[] {
  const citations: Citation[] = [];
  const answerLower = answer.toLowerCase();

  // Check each retrieved item to see if it was referenced in the answer
  for (const item of retrievedItems) {
    // Extract key terms from the title (company names, institutions, etc.)
    const keyTerms = extractKeyTerms(item.title, item.type);

    // Check if any key terms appear in the answer
    const isReferenced = keyTerms.some(term =>
      answerLower.includes(term.toLowerCase())
    );

    if (isReferenced) {
      // Create excerpt (first 150 chars of content)
      const excerpt = item.content.length > 150
        ? item.content.substring(0, 147) + '...'
        : item.content;

      citations.push({
        id: item.id,
        type: item.type,
        title: item.title,
        excerpt,
      });
    }
  }

  // If no citations found but we have items, include top 2-3 most relevant
  if (citations.length === 0 && retrievedItems.length > 0) {
    const topItems = retrievedItems
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, 3);

    for (const item of topItems) {
      const excerpt = item.content.length > 150
        ? item.content.substring(0, 147) + '...'
        : item.content;

      citations.push({
        id: item.id,
        type: item.type,
        title: item.title,
        excerpt,
      });
    }
  }

  // Deduplicate citations by ID
  const uniqueCitations = Array.from(
    new Map(citations.map(c => [c.id, c])).values()
  );

  // Limit to top 5 citations
  return uniqueCitations.slice(0, 5);
}

/**
 * Extract key searchable terms from a title based on item type
 */
function extractKeyTerms(title: string, type: string): string[] {
  const terms: string[] = [];

  switch (type) {
    case 'experience': {
      // Extract company name and position
      // Format: "Position at Company"
      const parts = title.split(' at ');
      if (parts.length === 2) {
        terms.push(parts[0].trim()); // Position
        terms.push(parts[1].trim()); // Company
      }
      break;
    }

    case 'education': {
      // Extract degree and institution
      // Format: "Degree from Institution"
      const parts = title.split(' from ');
      if (parts.length === 2) {
        terms.push(parts[0].trim()); // Degree
        terms.push(parts[1].trim()); // Institution
      }
      break;
    }

    case 'testimonial': {
      // Extract recommender name
      // Format: "Recommendation from Name, Title"
      const parts = title.replace('Recommendation from ', '').split(',');
      if (parts.length > 0) {
        terms.push(parts[0].trim()); // Name
      }
      break;
    }

    case 'skill': {
      // Skill title is the term itself
      terms.push(title);
      break;
    }
  }

  // Also include the full title as a term
  terms.push(title);

  return terms;
}
