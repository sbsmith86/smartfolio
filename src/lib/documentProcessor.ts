import mammoth from 'mammoth';
import { readFile } from 'fs/promises';
import OpenAI from 'openai';
import { env } from '@/lib/env';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function extractText(filePath: string, mimeType: string): Promise<string> {
  const buffer = await readFile(filePath);

  if (mimeType === 'application/pdf') {
    // Dynamic import of pdf-parse
    const { PDFParse } = await import('pdf-parse');

    // Set up GlobalWorkerOptions to point to a valid worker
    // Must be set before creating PDFParse instance
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // IMPORTANT: Must use string literal, checking the property can cause issues
    const workerPath: string = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
    (pdfjs as any).GlobalWorkerOptions.workerSrc = workerPath;

    // Convert Buffer to Uint8Array as required by pdf-parse
    const uint8Array = new Uint8Array(buffer);

    // Create parser with the data
    const pdfParser = new PDFParse({
      data: uint8Array,
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const result = await pdfParser.getText();
    return result.text;
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error('Unsupported file type');
}

export interface ProcessedResumeData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  summary?: string;
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
}

export async function processResumeWithAI(text: string): Promise<ProcessedResumeData | null> {
  const prompt = `
    Analyze this resume and extract structured information. Return a JSON object with:

    {
      "personalInfo": {
        "name": "Full name",
        "email": "email@example.com",
        "phone": "phone number",
        "location": "city, state/country"
      },
      "summary": "Professional summary/bio",
      "skills": ["skill1", "skill2", "skill3"],
      "experience": [
        {
          "company": "Company Name",
          "position": "Job Title",
          "startDate": "YYYY-MM",
          "endDate": "YYYY-MM or Present",
          "description": "Job description and achievements"
        }
      ],
      "education": [
        {
          "institution": "School Name",
          "degree": "Degree Type",
          "field": "Field of Study",
          "graduationDate": "YYYY"
        }
      ]
    }

    Only include fields that are present in the resume. If a field is missing, omit it or use an empty array/string.

    Resume text:
    ${text}
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const result = completion.choices[0].message.content;
  try {
    return JSON.parse(result || '{}');
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return null;
  }
}

export async function createKnowledgeEmbeddings(
  userId: string,
  processedData: ProcessedResumeData
): Promise<void> {
  // Create embeddings for different sections of the resume
  const embeddingTexts: Array<{
    contentType: string;
    text: string;
    metadata: any;
  }> = [];

  // Summary embedding
  if (processedData.summary) {
    embeddingTexts.push({
      contentType: 'summary',
      text: processedData.summary,
      metadata: { type: 'professional_summary' }
    });
  }

  // Experience embeddings
  processedData.experience.forEach((exp, index) => {
    embeddingTexts.push({
      contentType: 'experience',
      text: `${exp.position} at ${exp.company}. ${exp.description}`,
      metadata: {
        company: exp.company,
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate,
        index
      }
    });
  });

  // Skills embedding
  if (processedData.skills.length > 0) {
    embeddingTexts.push({
      contentType: 'skills',
      text: `Skills: ${processedData.skills.join(', ')}`,
      metadata: { skills: processedData.skills }
    });
  }

  // Education embeddings
  processedData.education.forEach((edu, index) => {
    embeddingTexts.push({
      contentType: 'education',
      text: `${edu.degree} in ${edu.field} from ${edu.institution}`,
      metadata: {
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        graduationDate: edu.graduationDate,
        index
      }
    });
  });

  // Create embeddings using OpenAI
  for (const item of embeddingTexts) {
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: item.text,
      });

      const embedding = embeddingResponse.data[0].embedding;

      // Store in database
      const { prisma } = await import('@/lib/prisma');
      await prisma.knowledgeEmbedding.create({
        data: {
          userId,
          contentType: item.contentType,
          textContent: item.text,
          embedding,
          metadata: item.metadata,
        },
      });
    } catch (error) {
      console.error(`Failed to create embedding for ${item.contentType}:`, error);
    }
  }
}
