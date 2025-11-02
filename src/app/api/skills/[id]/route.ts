import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSkillSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['technical', 'soft', 'language', 'certification', 'other']).optional(),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateSkillSchema.parse(body);

    // Verify ownership - check through UserSkill
    const userSkill = await prisma.userSkill.findFirst({
      where: {
        userId: session.user.id,
        skillId: id,
      },
    });

    if (!userSkill) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update skill and/or proficiency
    if (validatedData.name || validatedData.category) {
      await prisma.skill.update({
        where: { id },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.category && { category: validatedData.category }),
        },
      });
    }

    if (validatedData.proficiency) {
      await prisma.userSkill.update({
        where: {
          userId_skillId: {
            userId: session.user.id,
            skillId: id,
          },
        },
        data: {
          level: validatedData.proficiency,
        },
      });
    }

    // Return updated skill with proficiency
    const updated = await prisma.skill.findUnique({
      where: { id },
      include: {
        userSkills: {
          where: { userId: session.user.id },
          select: { level: true },
        },
      },
    });

    return NextResponse.json({
      ...updated,
      proficiency: updated?.userSkills[0]?.level,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete user-skill association
    const deleted = await prisma.userSkill.deleteMany({
      where: {
        userId: session.user.id,
        skillId: id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check if skill is orphaned and delete if so
    const remainingUsers = await prisma.userSkill.count({
      where: { skillId: id },
    });

    if (remainingUsers === 0) {
      await prisma.skill.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
