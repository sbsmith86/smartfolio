import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { ResumeDataSchema, MCPSession } from '../types';
import { generateEmbedding } from '@/lib/openai-utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ParseResumeInput {
  userId: string;
  documentId: string;
  sessionId?: string;
}

export async function handleParseResume(
  input: unknown,
  _session: MCPSession
) {
  const { userId, documentId } = input as ParseResumeInput;

  // 1. Fetch document with extracted text
  const document = await prisma.userDocument.findUnique({
    where: { id: documentId },
    include: { user: true },
  });

  if (!document) {
    throw new Error(`Document ${documentId} not found`);
  }

  if (document.userId !== userId) {
    throw new Error('Unauthorized: Document does not belong to user');
  }

  if (!document.extractedText) {
    throw new Error('Document has no extracted text. Upload may have failed.');
  }

  // 2. Use GPT-4o to extract structured data with deterministic settings
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0, // Deterministic output - same input = same output
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a resume parsing assistant. Extract structured data from resumes.

CRITICAL - SKILL EXTRACTION:
You MUST extract skills from the resume text. Look for:
1. Technologies mentioned (React, Node.js, Python, AWS, GraphQL, etc.)
2. Tools and platforms (JIRA, Confluence, Figma, Google Analytics, etc.)
3. Methodologies (Agile, Scrum, Kanban, etc.)
4. Soft skills (leadership, collaboration, communication, etc.)
5. Domain expertise (product management, frontend development, etc.)

Extract skills from:
- Job descriptions (technologies used, tools mentioned)
- Explicit skills sections
- Project descriptions
- Responsibilities that imply skills

CRITICAL - SKILL CATEGORIES:
You MUST categorize each skill using ONLY these exact values:
- "technical" - programming languages, frameworks, libraries, tools, platforms, databases, cloud services, APIs, methodologies
- "soft" - leadership, communication, collaboration, problem-solving, creativity, etc.
- "language" - spoken/written languages ONLY (English, Spanish, French, etc.)
- "certification" - professional certifications (AWS Certified, PMP, etc.)
- "other" - anything that doesn't clearly fit above

MAPPING GUIDE:
- JIRA, Confluence, Figma, Google Analytics → "technical"
- Agile, Scrum, Kanban, DevOps → "technical"
- React, Node.js, Python, GraphQL → "technical"
- Leadership, teamwork, communication → "soft"
- DO NOT create categories like "tools", "methodologies", "domain" - map them to the 5 allowed categories

CRITICAL - CANONICAL SKILL NAMES:
Use standard, canonical names for technologies to avoid duplicates:
- ✅ "React" (not ReactJS, React.js)
- ✅ "Node.js" (not Node, NodeJS)
- ✅ "JavaScript" (not JS, Javascript)
- ✅ "TypeScript" (not TS, Typescript)
- ✅ "PostgreSQL" (not Postgres, psql)
- ✅ "MongoDB" (not Mongo)
- ✅ "AWS" (not Amazon Web Services)
- ✅ "API" (not APIs)
- ✅ "Leadership" (not "Team management", "Team leadership")
- ✅ "Collaboration" (not "Team collaboration", "Cross-functional collaboration")
- ✅ "Project management" (not "Project planning", "Managing projects")

CRITICAL - SKILL DEDUPLICATION:
Before adding a skill to the array, check if a similar skill already exists.
Consolidate variants into canonical forms:
- "Team collaboration" + "Collaboration" → keep only "Collaboration"
- "Team management" + "Leadership" → keep only "Leadership"
- "Project planning" + "Project management" → keep only "Project management"
- "API development" + "API" → keep only "API"
- "Agile methodology" + "Agile" → keep only "Agile"
**Result: NO duplicate or similar skills in the final array**

CRITICAL - DATE FORMATTING:
ALL dates MUST be in YYYY-MM format or null:
- ✅ "2020-01", "2023-12", null
- ❌ "2020-01-15", "January 2020", "2020", "Jan 2020"
If only year is available, use YYYY-01 (January as default month)

Return a JSON object with these fields:
- experiences: Array of work experience (REQUIRED: title, company)
- education: Array of education (REQUIRED: degree, institution)
- skills: Array of ALL skills found with STRICT category enforcement
- summary: Professional summary if present
- contactInfo: Any contact details found

IMPORTANT:
- If dates are missing, use null
- If descriptions are missing, use null or empty string
- If GPA not mentioned, use null
- Don't invent information that's not in the resume
- Be flexible with date formats - convert to YYYY-MM if possible, otherwise null
- **EXTRACT EVERY SKILL YOU CAN IDENTIFY** - err on the side of including more
- **ENFORCE CATEGORY RESTRICTIONS** - only use: technical, soft, language, certification, other

Example schema:
{
  "experiences": [{"title": "Software Engineer", "company": "ABC Corp", "startDate": "2020-01" or null, "endDate": null, "description": "...", "skills": ["Python", "Django", "AWS"]}],
  "education": [{"degree": "BS Computer Science", "institution": "MIT", "fieldOfStudy": null, "startDate": null, "endDate": null, "gpa": null}],
  "skills": [
    {"name": "Python", "category": "technical", "proficiency": "advanced"},
    {"name": "React", "category": "technical", "proficiency": "expert"},
    {"name": "JIRA", "category": "technical", "proficiency": "advanced"},
    {"name": "Agile", "category": "technical", "proficiency": "expert"},
    {"name": "Leadership", "category": "soft", "proficiency": "advanced"},
    {"name": "Spanish", "category": "language", "proficiency": "intermediate"}
  ],
  "summary": "Experienced developer..." or null,
  "contactInfo": {"email": "...", "phone": null, "location": null, "linkedin": null, "github": null, "portfolio": null}
}`,
      },
      {
        role: 'user',
        content: `Parse this resume:\n\n${document.extractedText}`,
      },
    ],
  });

  const rawData = JSON.parse(completion.choices[0].message.content || '{}');

  // Application-level deduplication as safety net
  if (rawData.skills && Array.isArray(rawData.skills)) {
    const uniqueSkills = new Map<string, { name: string; category?: string; proficiency?: string }>();

    for (const skill of rawData.skills) {
      const normalizedName = skill.name.toLowerCase().trim();

      // Check if we already have this skill (case-insensitive)
      if (!uniqueSkills.has(normalizedName)) {
        uniqueSkills.set(normalizedName, skill);
      }
    }

    rawData.skills = Array.from(uniqueSkills.values());
  }

  // 3. Validate with Zod
  const parsedData = ResumeDataSchema.parse(rawData);

  // 4. Generate ALL embeddings BEFORE transaction (to avoid timeout)
  const experienceEmbeddings = parsedData.experiences
    ? await Promise.all(
        parsedData.experiences.map(exp => {
          const text = exp.description
            ? `${exp.title} at ${exp.company}: ${exp.description}`
            : `${exp.title} at ${exp.company}`;
          return generateEmbedding(text);
        })
      )
    : [];
  const educationEmbeddings = parsedData.education
    ? await Promise.all(
        parsedData.education.map(edu =>
          generateEmbedding(`${edu.degree} in ${edu.fieldOfStudy || 'Unknown'} from ${edu.institution}`)
        )
      )
    : [];

  // 5. Create database records in transaction (fast operations only)
  const result = await prisma.$transaction(async (tx) => {
    const createdRecords = {
      experiences: [] as unknown[],
      education: [] as unknown[],
      skills: [] as unknown[],
      embeddings: [] as unknown[],
    };

    // Create Experience records with pre-generated embeddings
    if (parsedData.experiences) {
      for (let i = 0; i < parsedData.experiences.length; i++) {
        const exp = parsedData.experiences[i];

        // Check if similar experience already exists (same company, position, and start date)
        const existingExperience = await tx.experience.findFirst({
          where: {
            userId: userId,
            company: exp.company,
            position: exp.title,
            startDate: exp.startDate || new Date().toISOString(),
          },
        });

        if (existingExperience) {
          createdRecords.experiences.push(existingExperience);
          continue;
        }

        const experience = await tx.experience.create({
          data: {
            userId: userId,
            company: exp.company,
            position: exp.title,
            startDate: exp.startDate || new Date().toISOString(),
            endDate: exp.endDate || null,
            description: exp.description || '',
          },
        });
        createdRecords.experiences.push(experience);

        // Insert embedding using raw SQL (pgvector)
        const embeddingVector = experienceEmbeddings[i];
        const embeddingId = `cemb_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        const textContent = exp.description || `${exp.title} at ${exp.company}`;
        await tx.$executeRaw`
          INSERT INTO "knowledge_embeddings" (id, "userId", "contentType", "contentId", "textContent", embedding, metadata, "createdAt")
          VALUES (
            ${embeddingId},
            ${userId},
            'experience',
            ${experience.id},
            ${textContent},
            ${`[${embeddingVector.join(',')}]`}::vector,
            ${JSON.stringify({ source: 'resume', documentId })}::jsonb,
            NOW()
          )
        `;
        createdRecords.embeddings.push({ id: embeddingId });
      }
    }

    // Create Education records with pre-generated embeddings
    if (parsedData.education) {
      for (let i = 0; i < parsedData.education.length; i++) {
        const edu = parsedData.education[i];

        // Check if similar education already exists (same degree and institution)
        const existingEducation = await tx.education.findFirst({
          where: {
            userId: userId,
            degree: edu.degree,
            institution: edu.institution,
          },
        });

        if (existingEducation) {
          createdRecords.education.push(existingEducation);
          continue;
        }

        const education = await tx.education.create({
          data: {
            userId: userId,
            degree: edu.degree,
            institution: edu.institution,
            fieldOfStudy: edu.fieldOfStudy || '',
            startDate: edu.startDate || new Date().toISOString(),
            endDate: edu.endDate || null,
          },
        });
        createdRecords.education.push(education);

        // Insert embedding using raw SQL (pgvector)
        const embeddingVector = educationEmbeddings[i];
        const embeddingId = `eedb_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        await tx.$executeRaw`
          INSERT INTO "knowledge_embeddings" (id, "userId", "contentType", "contentId", "textContent", embedding, metadata, "createdAt")
          VALUES (
            ${embeddingId},
            ${userId},
            'education',
            ${education.id},
            ${`${edu.degree} - ${edu.institution}`},
            ${`[${embeddingVector.join(',')}]`}::vector,
            ${JSON.stringify({ source: 'resume', documentId })}::jsonb,
            NOW()
          )
        `;
        createdRecords.embeddings.push({ id: embeddingId });
      }
    }

    // Create Skill records
    if (parsedData.skills) {
      // First, get or create the skill in the global skills table
      for (const skill of parsedData.skills) {
        let skillRecord = await tx.skill.findUnique({
          where: { name: skill.name },
        });

        if (!skillRecord) {
          skillRecord = await tx.skill.create({
            data: {
              name: skill.name,
              category: skill.category,
            },
          });
        }

        // Check if user-skill association already exists
        const existingUserSkill = await tx.userSkill.findUnique({
          where: {
            userId_skillId: {
              userId: userId,
              skillId: skillRecord.id,
            },
          },
        });

        if (!existingUserSkill) {
          // Create user-skill association only if it doesn't exist
          const userSkill = await tx.userSkill.create({
            data: {
              userId: userId,
              skillId: skillRecord.id,
              level: skill.proficiency || 'intermediate',
            },
          });
          createdRecords.skills.push(userSkill);
        } else {
          // Update proficiency level if it exists and new level is different
          if (skill.proficiency && existingUserSkill.level !== skill.proficiency) {
            const updatedUserSkill = await tx.userSkill.update({
              where: {
                userId_skillId: {
                  userId: userId,
                  skillId: skillRecord.id,
                },
              },
              data: {
                level: skill.proficiency,
              },
            });
            createdRecords.skills.push(updatedUserSkill);
          } else {
            createdRecords.skills.push(existingUserSkill);
          }
        }
      }
    }

    return createdRecords;
  }, {
    maxWait: 10000, // 10 seconds max wait for transaction lock
    timeout: 30000, // 30 seconds total transaction timeout
  });

  return {
    success: true,
    message: 'Resume parsed and structured data created',
    summary: {
      experiencesCreated: result.experiences.length,
      educationCreated: result.education.length,
      skillsCreated: result.skills.length,
      embeddingsCreated: result.embeddings.length,
    },
    data: result,
  };
}

// Placeholder for GitHub analysis
export async function handleAnalyzeGitHub(_input: unknown, _session: MCPSession) {
  // TODO: Implement in Task 8
  throw new Error('GitHub analysis not yet implemented (Task 8)');
}

// Placeholder for LinkedIn processing
export async function handleProcessLinkedIn(_input: unknown, _session: MCPSession) {
  // TODO: Implement in Task 9
  throw new Error('LinkedIn processing not yet implemented (Task 9)');
}
