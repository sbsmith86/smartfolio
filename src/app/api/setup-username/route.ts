import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Find the first user (assumes single-user setup)
    const existingUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        username: 'shae',
        publicProfileEnabled: true
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error updating username:', error);
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
  }
}
