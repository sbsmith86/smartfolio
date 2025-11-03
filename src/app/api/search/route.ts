import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  handleSemanticSearch,
  handleFullTextSearch,
  handleHybridSearch,
} from '@/lib/mcp/handlers/queries';

/**
 * Search API Endpoint
 *
 * Supports three search types:
 * 1. semantic - Vector similarity search using pgvector
 * 2. fulltext - Fuzzy text matching using pg_trgm
 * 3. hybrid - Combined approach with weighted scoring (default)
 *
 * Query Parameters:
 * - q: Search query (required)
 * - type: Search type (semantic|fulltext|hybrid) - default: hybrid
 * - limit: Maximum results - default: 10
 * - entityTypes: Filter by content types (experience,education,skill)
 * - semanticWeight: Weight for semantic vs fulltext (hybrid only) - default: 0.7
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const searchType = searchParams.get('type') || 'hybrid';
    const limit = parseInt(searchParams.get('limit') || '10');
    const entityTypesParam = searchParams.get('entityTypes');
    const semanticWeight = parseFloat(searchParams.get('semanticWeight') || '0.7');

    // Validation
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    if (!['semantic', 'fulltext', 'hybrid'].includes(searchType)) {
      return NextResponse.json(
        { error: 'Invalid search type. Must be: semantic, fulltext, or hybrid' },
        { status: 400 }
      );
    }

    // Parse entity types filter
    const entityTypes = entityTypesParam
      ? entityTypesParam.split(',').map((t) => t.trim())
      : undefined;

    // Build search input
    const searchInput = {
      userId: session.user.id,
      query,
      limit,
      entityTypes,
      semanticWeight,
      sessionId: session.user.id, // Using user ID as session for now
    };

    // Create mock MCP session (Fast Forks will be implemented in Task 12)
    const mcpSession = {
      id: session.user.id,
      userId: session.user.id,
      createdAt: new Date(),
      lastActivity: new Date(),
      context: new Map(),
    };

    // Execute search based on type
    let result;
    switch (searchType) {
      case 'semantic':
        result = await handleSemanticSearch(searchInput, mcpSession);
        break;
      case 'fulltext':
        result = await handleFullTextSearch(searchInput, mcpSession);
        break;
      case 'hybrid':
      default:
        result = await handleHybridSearch(searchInput, mcpSession);
        break;
    }

    return NextResponse.json({
      success: true,
      query,
      searchType: result.searchType,
      results: result.results,
      count: result.results.length,
      weights: result.weights,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
