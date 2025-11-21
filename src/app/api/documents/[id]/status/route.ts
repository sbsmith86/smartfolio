import { getDefaultUser } from '@/lib/getDefaultUser';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getDefaultUser();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.userDocument.findUnique({
      where: { id },
      select: {
        id: true,
        processed: true,
        processingError: true,
        userId: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      processed: document.processed,
      processingError: document.processingError,
    });
  } catch (error) {
    console.error('Error fetching document status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
