#!/usr/bin/env tsx
/**
 * Test what GPT-4o extracts from the resume
 */

import { prisma } from '../src/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  // Get the most recent document
  const document = await prisma.userDocument.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!document || !document.extractedText) {
    console.error('❌ No document found with extracted text');
    return;
  }

  console.log('📄 Testing GPT-4o extraction on:', document.fileName);
  console.log('📝 Text length:', document.extractedText.length, 'characters\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a resume parsing assistant. Extract structured data from resumes.
Extract ONLY what you find - don't make up data. Be flexible with missing information.

Return a JSON object with these fields:
- experiences: Array of work experience (REQUIRED: title, company)
- education: Array of education (REQUIRED: degree, institution)
- skills: Array of skill names
- summary: Professional summary if present
- contactInfo: Any contact details found

IMPORTANT:
- Extract skills from BOTH explicit "Skills" sections AND from experience descriptions
- When you see technologies mentioned (Python, Django, React, etc.) - add them to skills
- If dates are missing, use null
- If descriptions are missing, use null or empty string
- If GPA not mentioned, use null
- Don't invent information that's not in the resume
- Be flexible with date formats - convert to YYYY-MM if possible, otherwise null

Example schema:
{
  "experiences": [{"title": "Software Engineer", "company": "ABC Corp", "startDate": "2020-01" or null, "endDate": null, "description": "...", "skills": ["Python", "Django"]}],
  "education": [{"degree": "BS Computer Science", "institution": "MIT", "fieldOfStudy": null, "startDate": null, "endDate": null, "gpa": null}],
  "skills": [{"name": "Python", "category": "technical", "proficiency": "advanced"}, {"name": "Leadership", "category": "soft"}],
  "summary": "Experienced developer..." or null,
  "contactInfo": {"email": "...", "phone": null, "location": null, "linkedin": null, "github": null, "portfolio": null}
}`,
      },
      {
        role: 'user',
        content: `Parse this resume:\n\n${document.extractedText}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const rawData = JSON.parse(completion.choices[0].message.content || '{}');

  console.log('🤖 GPT-4o EXTRACTION RESULTS:\n');
  console.log('Experiences:', rawData.experiences?.length || 0);
  console.log('Education:', rawData.education?.length || 0);
  console.log('Skills:', rawData.skills?.length || 0);
  console.log('\n📊 FULL OUTPUT:\n');
  console.log(JSON.stringify(rawData, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
