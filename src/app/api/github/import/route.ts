import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/openai-utils';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  default_branch: string;
}

interface ParsedProject {
  name: string;
  description: string;
  techStack: string[];
  keyFeatures: string[];
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, userId } = body;

    if (!username) {
      return NextResponse.json({ error: 'GitHub username required' }, { status: 400 });
    }

    // For MVP/demo: Allow unauthenticated imports when userId is provided
    // In production, you'd want to add API key auth or restrict this
    const session = await getServerSession(authOptions);
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId required when not authenticated' }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`Fetching GitHub repos for: ${username}`);

    // Fetch repos from GitHub API (no auth, public repos only)
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SmartFolio-App',
        },
      }
    );

    if (!reposResponse.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${reposResponse.statusText}` },
        { status: reposResponse.status }
      );
    }

    const repos: GitHubRepo[] = await reposResponse.json();
    console.log(`Found ${repos.length} repos`);

    let projectsAdded = 0;
    let skillsAdded = 0;
    let embeddingsCreated = 0;
    const processedProjects: ParsedProject[] = [];
    const processingErrors: Array<{repo: string, error: string}> = [];

    for (const repo of repos) {
      try {
        console.log(`\n📦 Processing: ${repo.name}`);

        // Fetch README
        const readmeUrl = `https://api.github.com/repos/${username}/${repo.name}/readme`;
        console.log(`  Fetching README from: ${readmeUrl}`);

        const readmeResponse = await fetch(readmeUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'SmartFolio-App',
          },
        });

        let readmeText = '';
        if (readmeResponse.ok) {
          readmeText = await readmeResponse.text();
          // Limit README length for GPT-4o
          readmeText = readmeText.slice(0, 4000);
          console.log(`  ✅ README fetched (${readmeText.length} chars)`);
        } else {
          console.log(`  ⚠️  No README found (${readmeResponse.status})`);
        }

        // Parse with GPT-4o
        console.log(`  Parsing with GPT-4o...`);
        const projectData = await parseProjectWithAI(repo, readmeText);
        processedProjects.push(projectData);
        console.log(`  ✅ Parsed: ${projectData.name}`);

        // Create Experience record with type 'project'
        console.log(`  Creating Experience record...`);
        // Convert date to YYYY-MM format (schema expects String)
        const lastUpdated = new Date(repo.updated_at);
        const startDateStr = `${lastUpdated.getFullYear()}-${String(lastUpdated.getMonth() + 1).padStart(2, '0')}`;

        // Build description with project details
        const fullDescription = `${projectData.description}${projectData.keyFeatures.length > 0 ? '\n\nKey features:\n' + projectData.keyFeatures.map(f => `• ${f}`).join('\n') : ''}`;

        const experience = await prisma.experience.create({
          data: {
            userId: targetUserId,
            company: 'GitHub',
            position: projectData.name,
            startDate: startDateStr,
            endDate: null,
            description: fullDescription,
          },
        });
        projectsAdded++;

        // Extract and link skills
        const allSkills = [...projectData.techStack];
        if (repo.language) {
          allSkills.push(repo.language);
        }

        for (const skillName of allSkills) {
          // Find or create skill in global skills table
          let skillRecord = await prisma.skill.findUnique({
            where: { name: skillName },
          });

          if (!skillRecord) {
            skillRecord = await prisma.skill.create({
              data: {
                name: skillName,
                category: categorizeSkill(skillName),
              },
            });
          }

          // Check if user-skill association already exists
          const existingUserSkill = await prisma.userSkill.findUnique({
            where: {
              userId_skillId: {
                userId: targetUserId,
                skillId: skillRecord.id,
              },
            },
          });

          if (!existingUserSkill) {
            await prisma.userSkill.create({
              data: {
                userId: targetUserId,
                skillId: skillRecord.id,
                level: 'intermediate',
              },
            });
            skillsAdded++;
          }
        }

        // Generate embedding for project description using raw SQL (pgvector)
        const embeddingText = `${projectData.name}: ${projectData.description}. Tech stack: ${projectData.techStack.join(', ')}. Key features: ${projectData.keyFeatures.join(', ')}.`;
        const embedding = await generateEmbedding(embeddingText);
        const embeddingId = `cemb_github_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await prisma.$executeRaw`
          INSERT INTO "knowledge_embeddings" (id, "userId", "contentType", "contentId", "textContent", embedding, metadata, "createdAt")
          VALUES (
            ${embeddingId},
            ${targetUserId},
            'experience',
            ${experience.id},
            ${embeddingText},
            ${`[${embedding.join(',')}]`}::vector,
            ${JSON.stringify({ source: 'github', repoName: repo.name, repoUrl: repo.html_url })}::jsonb,
            NOW()
          )
        `;
        embeddingsCreated++;

        console.log(`✅ Processed: ${repo.name}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error processing ${repo.name}:`, errorMsg);
        processingErrors.push({ repo: repo.name, error: errorMsg });
        // Continue with next repo
      }
    }

    return NextResponse.json({
      success: true,
      projectsAdded,
      skillsAdded,
      embeddingsCreated,
      projects: processedProjects.map(p => ({ name: p.name, url: p.url })),
      errors: processingErrors.length > 0 ? processingErrors : undefined,
    });
  } catch (error) {
    console.error('GitHub import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}

async function parseProjectWithAI(
  repo: GitHubRepo,
  readmeText: string
): Promise<ParsedProject> {
  const prompt = `You are parsing a GitHub repository to extract structured project information.

Repository: ${repo.name}
Description: ${repo.description || 'No description'}
Primary Language: ${repo.language || 'Unknown'}
README excerpt: ${readmeText || 'No README available'}

Extract the following in JSON format:
{
  "name": "Project name (use repo name if unclear)",
  "description": "One-sentence description of what the project does",
  "techStack": ["Array of technologies/frameworks/languages used"],
  "keyFeatures": ["2-4 key features or achievements"]
}

Be concise. For techStack, include languages, frameworks, databases, and major libraries mentioned. For keyFeatures, focus on notable capabilities or results.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You extract structured data from project repositories. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(completion.choices[0].message.content || '{}');

  return {
    name: parsed.name || repo.name,
    description: parsed.description || repo.description || 'GitHub project',
    techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
    keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : [],
    url: repo.html_url,
  };
}

function categorizeSkill(skillName: string): string {
  const skill = skillName.toLowerCase();

  // Programming languages
  if (['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin'].includes(skill)) {
    return 'technical';
  }

  // Frameworks
  if (['react', 'vue', 'angular', 'next.js', 'express', 'django', 'flask', 'spring', 'rails'].includes(skill)) {
    return 'technical';
  }

  // Databases
  if (['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'timescaledb'].includes(skill)) {
    return 'technical';
  }

  // DevOps/Tools
  if (['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'git'].includes(skill)) {
    return 'technical';
  }

  return 'technical'; // Default for GitHub-sourced skills
}
