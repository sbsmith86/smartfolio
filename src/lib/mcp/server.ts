import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MCPSession } from './types';
import { registerTools, getToolHandler } from './tools';

export class SmartFolioMCPServer {
  private server: Server;
  private sessions: Map<string, MCPSession>;

  constructor() {
    this.server = new Server(
      {
        name: 'smartfolio-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.sessions = new Map();
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: registerTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Get or create session
      const sessionId = (args as Record<string, unknown>).sessionId as string || 'default';
      const userId = (args as Record<string, unknown>).userId as string;

      if (!userId) {
        throw new Error('userId is required for all tool calls');
      }

      let session = this.sessions.get(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          userId,
          createdAt: new Date(),
          lastActivity: new Date(),
          context: new Map(),
        };
        this.sessions.set(sessionId, session);
      }

      // Update last activity
      session.lastActivity = new Date();

      // Execute tool handler
      const handler = getToolHandler(name);
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        const result = await handler(args, session);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`Tool execution error (${name}):`, error);
        throw error;
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('SmartFolio MCP Server running');
  }

  // Clean up stale sessions (call periodically)
  cleanupSessions(maxAgeMinutes: number = 30) {
    const now = new Date();
    for (const [sessionId, session] of this.sessions) {
      const ageMinutes =
        (now.getTime() - session.lastActivity.getTime()) / 1000 / 60;
      if (ageMinutes > maxAgeMinutes) {
        this.sessions.delete(sessionId);
        console.log(`Cleaned up session: ${sessionId}`);
      }
    }
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new SmartFolioMCPServer();
  server.start().catch(console.error);

  // Cleanup stale sessions every 10 minutes
  setInterval(() => {
    server.cleanupSessions(30);
  }, 10 * 60 * 1000);
}
