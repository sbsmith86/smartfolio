import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.userDocument.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        fileName: true,
        documentType: true,
        processed: true,
        processingError: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Fetch related data
    const [experiences, education, skills] = await Promise.all([
      prisma.experience.findMany({
        where: { userId: session.user.id },
        orderBy: { startDate: 'desc' },
      }),
      prisma.education.findMany({
        where: { userId: session.user.id },
        orderBy: { startDate: 'desc' },
      }),
      prisma.skill.findMany({
        where: {
          userSkills: {
            some: { userId: session.user.id },
          },
        },
        include: {
          userSkills: {
            where: { userId: session.user.id },
            select: { level: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Transform skills to include proficiency
    const transformedSkills = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      proficiency: skill.userSkills[0]?.level || null,
    }));

    return NextResponse.json({
      ...document,
      experiences,
      education,
      skills: transformedSkills,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
