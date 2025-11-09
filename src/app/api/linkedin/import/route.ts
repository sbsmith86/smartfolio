import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { generateEmbedding } from "@/lib/openai-utils";
import { findDuplicateExperience, findDuplicateEducation } from "@/lib/semantic-deduplication";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ParsedLinkedInProfile {
  experiences: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  skills: Array<{
    name: string;
    category: string;
  }>;
}

async function parseLinkedInWithAI(profileText: string): Promise<ParsedLinkedInProfile> {
  const prompt = `Parse the following LinkedIn profile text and extract structured data.

LinkedIn Profile Text:
${profileText}

Extract and return a JSON object with:
1. experiences: array of work experiences with:
   - company (string)
   - position (string)
   - startDate (YYYY-MM format, use first day of month if only year given)
   - endDate (YYYY-MM format, null if currently employed)
   - description (string, comprehensive summary of role and achievements)

2. education: array of education records with:
   - institution (string)
   - degree (string)
   - fieldOfStudy (string, optional)
   - startDate (YYYY-MM format, optional)
   - endDate (YYYY-MM format, optional)
   - description (string, optional)

3. skills: array of skills with:
   - name (string, canonical skill name)
   - category (one of: "technical", "soft", "language", "certification", "other")

Return ONLY valid JSON, no markdown formatting.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a precise data extraction system. Extract structured data from LinkedIn profiles and return valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  const result = completion.choices[0].message.content;
  if (!result) {
    throw new Error("No response from OpenAI");
  }

  return JSON.parse(result);
}

function categorizeSkill(skillName: string): string {
  const technicalKeywords = [
    "javascript", "python", "java", "react", "node", "sql", "aws", "docker",
    "typescript", "api", "git", "database", "cloud", "devops", "frontend",
    "backend", "fullstack", "mobile", "web", "software", "programming",
    "html", "css", "vue", "angular", "django", "flask", "express", "mongodb",
    "postgresql", "mysql", "redis", "kubernetes", "terraform", "ci/cd"
  ];

  const softKeywords = [
    "leadership", "communication", "management", "teamwork", "problem solving",
    "collaboration", "mentoring", "presentation", "negotiation", "strategic",
    "analytical", "creative", "agile", "scrum", "project management"
  ];

  const languageKeywords = [
    "english", "spanish", "french", "german", "chinese", "japanese", "korean",
    "portuguese", "arabic", "hindi", "russian", "italian"
  ];

  const certificationKeywords = [
    "certified", "certification", "license", "credential", "certificate",
    "aws certified", "pmp", "scrum master", "cpa", "cfa"
  ];

  const lowerName = skillName.toLowerCase();

  if (certificationKeywords.some(keyword => lowerName.includes(keyword))) {
    return "certification";
  }
  if (languageKeywords.some(keyword => lowerName.includes(keyword))) {
    return "language";
  }
  if (technicalKeywords.some(keyword => lowerName.includes(keyword))) {
    return "technical";
  }
  if (softKeywords.some(keyword => lowerName.includes(keyword))) {
    return "soft";
  }

  return "other";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileText, userId } = body;

    if (!profileText || !userId) {
      return NextResponse.json(
        { error: "profileText and userId are required" },
        { status: 400 }
      );
    }

    console.log("Parsing LinkedIn profile with GPT-4o...");
    const parsed = await parseLinkedInWithAI(profileText);

    let experiencesAdded = 0;
    let educationAdded = 0;
    let skillsAdded = 0;
    let embeddingsCreated = 0;
    const errors: string[] = [];

    // Process experiences
    if (parsed.experiences && parsed.experiences.length > 0) {
      for (const exp of parsed.experiences) {
        try {
          // Use semantic deduplication via pgvector
          // This catches duplicates even with text variations like "Tech Lead" vs "Technical Lead"
          const duplicateId = await findDuplicateExperience(userId, {
            company: exp.company,
            position: exp.position,
            startDate: exp.startDate,
            endDate: exp.endDate || null,
            description: exp.description,
          });

          if (duplicateId) {
            console.log(`Skipping semantic duplicate: ${exp.position} at ${exp.company}`);
            errors.push(`Skipped duplicate: ${exp.position} at ${exp.company} (${exp.startDate})`);
            continue;
          }

          // Create experience
          const experience = await prisma.experience.create({
            data: {
              userId,
              company: exp.company,
              position: exp.position,
              startDate: exp.startDate,
              endDate: exp.endDate || null,
              description: exp.description,
            },
          });

          experiencesAdded++;

          // Generate embedding for the experience
          const embeddingText = `${exp.position} at ${exp.company}. ${exp.description}`;
          const embedding = await generateEmbedding(embeddingText);

          // Store embedding using raw SQL
          await prisma.$executeRaw`
            INSERT INTO "knowledge_embeddings" (id, "userId", "contentType", "contentId", "textContent", embedding, "createdAt")
            VALUES (
              ${`emb_${Date.now()}_${Math.random().toString(36).substring(7)}`},
              ${userId},
              'experience',
              ${experience.id},
              ${embeddingText},
              ${`[${embedding.join(",")}]`}::vector,
              NOW()
            )
          `;

          embeddingsCreated++;
        } catch (error) {
          console.error(`Error processing experience ${exp.position}:`, error);
          errors.push(`Failed to process experience: ${exp.position}`);
        }
      }
    }

    // Process education
    if (parsed.education && parsed.education.length > 0) {
      for (const edu of parsed.education) {
        try {
          // Use semantic deduplication via pgvector
          // This catches duplicates even with variations like "B.A" vs "Bachelor of Arts"
          const duplicateId = await findDuplicateEducation(userId, {
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy || null,
          });

          if (duplicateId) {
            console.log(`Skipping semantic duplicate: ${edu.degree} from ${edu.institution}`);
            errors.push(`Skipped duplicate: ${edu.degree} from ${edu.institution}`);
            continue;
          }

          // Create education record
          const education = await prisma.education.create({
            data: {
              userId,
              institution: edu.institution,
              degree: edu.degree,
              fieldOfStudy: edu.fieldOfStudy || null,
              startDate: edu.startDate || null,
              endDate: edu.endDate || null,
              description: edu.description || null,
            },
          });

          educationAdded++;

          // Generate embedding for education
          const embeddingText = `${edu.degree} in ${edu.fieldOfStudy || "general studies"} from ${edu.institution}. ${edu.description || ""}`;
          const embedding = await generateEmbedding(embeddingText);

          // Store embedding using raw SQL
          await prisma.$executeRaw`
            INSERT INTO "knowledge_embeddings" (id, "userId", "contentType", "contentId", "textContent", embedding, "createdAt")
            VALUES (
              ${`emb_${Date.now()}_${Math.random().toString(36).substring(7)}`},
              ${userId},
              'education',
              ${education.id},
              ${embeddingText},
              ${`[${embedding.join(",")}]`}::vector,
              NOW()
            )
          `;

          embeddingsCreated++;
        } catch (error) {
          console.error(`Error processing education ${edu.institution}:`, error);
          errors.push(`Failed to process education: ${edu.institution}`);
        }
      }
    }

    // Process skills
    if (parsed.skills && parsed.skills.length > 0) {
      for (const skillData of parsed.skills) {
        try {
          const category = skillData.category || categorizeSkill(skillData.name);

          // Find or create the global skill
          let skill = await prisma.skill.findUnique({
            where: { name: skillData.name },
          });

          if (!skill) {
            skill = await prisma.skill.create({
              data: {
                name: skillData.name,
                category,
              },
            });
          }

          // Check if UserSkill already exists
          const existingUserSkill = await prisma.userSkill.findUnique({
            where: {
              userId_skillId: {
                userId,
                skillId: skill.id,
              },
            },
          });

          if (!existingUserSkill) {
            await prisma.userSkill.create({
              data: {
                userId,
                skillId: skill.id,
              },
            });
            skillsAdded++;
          }
        } catch (error) {
          console.error(`Error processing skill ${skillData.name}:`, error);
          errors.push(`Failed to process skill: ${skillData.name}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      experiencesAdded,
      educationAdded,
      skillsAdded,
      embeddingsCreated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error importing LinkedIn profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to import LinkedIn profile",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
