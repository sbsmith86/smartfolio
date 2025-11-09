import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Find user by username or fallback to ID (for now, until usernames are set)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { id: username }, // Fallback to ID if username not set
        ],
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        location: true,
        bio: true,
        profilePictureUrl: true,
        publicProfileEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!user.publicProfileEnabled) {
      return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
    }

    // Fetch all professional data
    const [experiences, education, skills, documents, testimonials, links] = await Promise.all([
      // Experiences - sorted by most recent
      prisma.experience.findMany({
        where: { userId: user.id },
        orderBy: { startDate: 'desc' },
      }),

      // Education - sorted by most recent
      prisma.education.findMany({
        where: { userId: user.id },
        orderBy: { startDate: 'desc' },
      }),

      // Skills with proficiency levels
      prisma.skill.findMany({
        where: {
          userSkills: {
            some: { userId: user.id },
          },
        },
        include: {
          userSkills: {
            where: { userId: user.id },
            select: { level: true },
          },
        },
        orderBy: { name: 'asc' },
      }),

      // Documents (only processed ones)
      prisma.userDocument.findMany({
        where: {
          userId: user.id,
          processed: true,
        },
        select: {
          id: true,
          fileName: true,
          documentType: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Public testimonials
      prisma.testimonial.findMany({
        where: {
          userId: user.id,
          public: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // External links
      prisma.userLink.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Transform skills to include proficiency
    const transformedSkills = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      proficiency: skill.userSkills[0]?.level || null,
    }));

    // Group skills by category
    const skillsByCategory = transformedSkills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, typeof transformedSkills>);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        location: user.location,
        bio: user.bio,
        profilePictureUrl: user.profilePictureUrl,
      },
      experiences,
      education,
      skills: transformedSkills,
      skillsByCategory,
      documents,
      testimonials,
      links,
      stats: {
        experienceYears: calculateYearsOfExperience(experiences),
        totalSkills: transformedSkills.length,
        testimonialsCount: testimonials.length,
        projectsCount: documents.filter((d) => d.documentType === 'portfolio').length,
      },
      meta: {
        experienceCalculation: 'sum_of_positions', // For tooltip/explanation
        oldestExperienceDate: experiences.length > 0
          ? experiences[experiences.length - 1].startDate
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// Helper function to calculate years of experience
function calculateYearsOfExperience(experiences: Array<{ startDate: string; endDate: string | null }>): number {
  if (experiences.length === 0) return 0;

  const now = new Date();

  // Find earliest start date and latest end date (or present)
  const startDates = experiences.map(e => new Date(e.startDate));
  const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));

  // Latest end is either the most recent endDate, or now if any job is current
  const hasCurrentJob = experiences.some(e => !e.endDate);
  const latestEnd = hasCurrentJob ? now :
    new Date(Math.max(...experiences
      .filter(e => e.endDate)
      .map(e => new Date(e.endDate!).getTime())
    ));

  // Calculate total months from earliest to latest
  const totalMonths = (latestEnd.getFullYear() - earliestStart.getFullYear()) * 12 +
                     (latestEnd.getMonth() - earliestStart.getMonth());

  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
}
