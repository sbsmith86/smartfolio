import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { processResumeWithAI, createKnowledgeEmbeddings } from '@/lib/documentProcessor';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const documentId = params.id;

    // Get document from database
    const document = await prisma.userDocument.findUnique({
      where: {
        id: documentId,
        userId: session.user.id,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.processed) {
      return NextResponse.json({
        success: true,
        message: 'Document already processed',
      });
    }

    // Check if we have extracted text
    if (!document.extractedText) {
      return NextResponse.json(
        { error: 'Document text extraction failed' },
        { status: 400 }
      );
    }

    // Process with AI
    const processedData = await processResumeWithAI(document.extractedText);

    if (!processedData) {
      return NextResponse.json(
        { error: 'Failed to process document with AI' },
        { status: 500 }
      );
    }

    // Update user profile with extracted information
    const updateData: any = {};

    if (processedData.personalInfo.name) {
      const nameParts = processedData.personalInfo.name.split(' ');
      if (nameParts.length >= 2) {
        updateData.firstName = nameParts[0];
        updateData.lastName = nameParts.slice(1).join(' ');
      }
    }

    if (processedData.personalInfo.location) {
      updateData.location = processedData.personalInfo.location;
    }

    if (processedData.personalInfo.phone) {
      updateData.phone = processedData.personalInfo.phone;
    }

    if (processedData.summary) {
      updateData.bio = processedData.summary;
    }

    // Update user profile
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      });
    }

    // Add skills
    for (const skillName of processedData.skills) {
      // Find or create skill
      const skill = await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName },
      });

      // Add to user's skills if not already added
      await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId: session.user.id,
            skillId: skill.id,
          },
        },
        update: {},
        create: {
          userId: session.user.id,
          skillId: skill.id,
          level: 'intermediate',
        },
      });
    }

    // Add experience
    for (const exp of processedData.experience) {
      await prisma.experience.create({
        data: {
          userId: session.user.id,
          company: exp.company,
          position: exp.position,
          startDate: exp.startDate,
          endDate: exp.endDate === 'Present' ? null : exp.endDate,
          description: exp.description,
        },
      });
    }

    // Add education
    for (const edu of processedData.education) {
      await prisma.education.create({
        data: {
          userId: session.user.id,
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.field,
          startDate: null, // Not extracted from resume
          endDate: edu.graduationDate,
        },
      });
    }

    // Create knowledge embeddings
    await createKnowledgeEmbeddings(session.user.id, processedData);

    // Mark document as processed
    await prisma.userDocument.update({
      where: { id: documentId },
      data: { processed: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Document processed successfully',
      data: {
        skillsAdded: processedData.skills.length,
        experienceAdded: processedData.experience.length,
        educationAdded: processedData.education.length,
      },
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
