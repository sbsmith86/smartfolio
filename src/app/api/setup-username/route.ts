import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const user = await prisma.user.update({
      where: { id: 'cm3kdkud20000uvu2q2hk54pl' },
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
