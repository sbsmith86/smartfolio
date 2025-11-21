import { getDefaultUser } from '@/lib/getDefaultUser';
import { NextRequest, NextResponse } from 'next/server';
import { handleParseResume } from '@/lib/mcp/handlers/ingestion';

export async function POST(request: NextRequest) {
  const session = getDefaultUser();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { documentId } = await request.json();

  if (!documentId) {
    return NextResponse.json(
      { error: 'documentId is required' },
      { status: 400 }
    );
  }

  try {
    const result = await handleParseResume(
      {
        userId: session.user.id,
        documentId,
        sessionId: `web-${Date.now()}`,
      },
      {
        id: `web-${Date.now()}`,
        userId: session.user.id,
        createdAt: new Date(),
        lastActivity: new Date(),
        context: new Map(),
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      {
        error: 'Failed to parse document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
