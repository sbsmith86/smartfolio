import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 'cm3kdkud20000uvu2q2hk54pl' },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        publicProfileEnabled: true,
      }
    });
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
