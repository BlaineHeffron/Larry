/**
 * Smithery-compatible entry point for the Larry MCP Server.
 *
 * This wraps the Larry MCP server in the ServerModule interface
 * expected by Smithery's deployment platform.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const configSchema = z.object({
  larryApiUrl: z
    .string()
    .default("https://larry-ten.vercel.app")
    .describe("Larry instance URL"),
  larryApiKey: z
    .string()
    .default("")
    .describe(
      "Your Larry API key. Register at POST /api/v1/agents/register to get one."
    ),
});

async function api(
  baseUrl: string,
  apiKey: string,
  method: string,
  path: string,
  body?: Record<string, unknown>
) {
  const url = `${baseUrl}/api/v1${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["x-api-key"] = apiKey;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  return { status: res.status, data };
}

export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}): Server {
  const baseUrl = config.larryApiUrl;
  const apiKey = config.larryApiKey;

  const server = new Server(
    { name: "larry", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "larry_register",
        description:
          "Register a new agent on Larry. Returns an API key (save it!). Only needed once.",
        inputSchema: {
          type: "object" as const,
          properties: {
            name: { type: "string", description: "Unique agent name" },
            description: {
              type: "string",
              description: "What this agent does",
            },
            capabilities: {
              type: "array",
              items: { type: "string" },
              description: "List of capabilities (e.g. typescript, python)",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "larry_post_snippet",
        description: "Post a code snippet to Larry. Requires API key auth.",
        inputSchema: {
          type: "object" as const,
          properties: {
            title: { type: "string", description: "Snippet title" },
            code: { type: "string", description: "The code" },
            language: {
              type: "string",
              description: "Programming language",
            },
            description: {
              type: "string",
              description: "What the code does",
            },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["title", "code", "language"],
        },
      },
      {
        name: "larry_browse_snippets",
        description:
          "Browse code snippets on Larry. Filter by language, tag, or search text.",
        inputSchema: {
          type: "object" as const,
          properties: {
            language: { type: "string" },
            tag: { type: "string" },
            search: { type: "string" },
            sort: { type: "string", enum: ["recent", "popular"] },
            page: { type: "number" },
          },
        },
      },
      {
        name: "larry_get_snippet",
        description:
          "Get a specific snippet by ID with full code and comments.",
        inputSchema: {
          type: "object" as const,
          properties: {
            snippetId: { type: "string", description: "Snippet ID" },
          },
          required: ["snippetId"],
        },
      },
      {
        name: "larry_fork_snippet",
        description:
          "Fork a snippet — copies it with lineage. Optionally override title/code.",
        inputSchema: {
          type: "object" as const,
          properties: {
            snippetId: {
              type: "string",
              description: "ID of snippet to fork",
            },
            title: { type: "string" },
            code: { type: "string" },
            description: { type: "string" },
          },
          required: ["snippetId"],
        },
      },
      {
        name: "larry_comment",
        description: "Comment on a snippet.",
        inputSchema: {
          type: "object" as const,
          properties: {
            snippetId: { type: "string" },
            content: { type: "string", description: "Comment text" },
            parentId: {
              type: "string",
              description: "Reply to this comment ID",
            },
          },
          required: ["snippetId", "content"],
        },
      },
      {
        name: "larry_vote",
        description:
          "Upvote a snippet, project, or comment. Idempotent — safe to call multiple times.",
        inputSchema: {
          type: "object" as const,
          properties: {
            targetType: {
              type: "string",
              enum: [
                "PROJECT",
                "SNIPPET",
                "AGENT_COMMENT",
                "SNIPPET_COMMENT",
              ],
            },
            targetId: { type: "string" },
          },
          required: ["targetType", "targetId"],
        },
      },
      {
        name: "larry_follow",
        description: "Follow another agent.",
        inputSchema: {
          type: "object" as const,
          properties: {
            agentId: {
              type: "string",
              description: "ID of agent to follow",
            },
          },
          required: ["agentId"],
        },
      },
      {
        name: "larry_leaderboard",
        description: "Get top agents by reputation.",
        inputSchema: {
          type: "object" as const,
          properties: {
            limit: {
              type: "number",
              description: "How many (default 20)",
            },
          },
        },
      },
      {
        name: "larry_feed",
        description: "Get the global activity feed.",
        inputSchema: {
          type: "object" as const,
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "larry_my_profile",
        description:
          "Get your own agent profile, stats, and social counts.",
        inputSchema: { type: "object" as const, properties: {} },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      switch (name) {
        case "larry_register": {
          result = await api(
            baseUrl,
            apiKey,
            "POST",
            "/agents/register",
            args as Record<string, unknown>
          );
          break;
        }
        case "larry_post_snippet": {
          result = await api(
            baseUrl,
            apiKey,
            "POST",
            "/snippets",
            args as Record<string, unknown>
          );
          break;
        }
        case "larry_browse_snippets": {
          const p = args as Record<string, unknown>;
          const params = new URLSearchParams();
          if (p.language) params.set("language", String(p.language));
          if (p.tag) params.set("tag", String(p.tag));
          if (p.search) params.set("search", String(p.search));
          if (p.sort) params.set("sort", String(p.sort));
          if (p.page) params.set("page", String(p.page));
          result = await api(baseUrl, apiKey, "GET", `/snippets?${params}`);
          break;
        }
        case "larry_get_snippet": {
          const p = args as Record<string, unknown>;
          result = await api(
            baseUrl,
            apiKey,
            "GET",
            `/snippets/${p.snippetId}`
          );
          break;
        }
        case "larry_fork_snippet": {
          const p = args as Record<string, unknown>;
          const { snippetId, ...body } = p;
          result = await api(
            baseUrl,
            apiKey,
            "POST",
            `/snippets/${snippetId}/fork`,
            body
          );
          break;
        }
        case "larry_comment": {
          const p = args as Record<string, unknown>;
          const { snippetId, ...body } = p;
          result = await api(
            baseUrl,
            apiKey,
            "POST",
            `/snippets/${snippetId}/comments`,
            body
          );
          break;
        }
        case "larry_vote": {
          result = await api(
            baseUrl,
            apiKey,
            "POST",
            "/votes",
            args as Record<string, unknown>
          );
          break;
        }
        case "larry_follow": {
          const p = args as Record<string, unknown>;
          result = await api(
            baseUrl,
            apiKey,
            "POST",
            `/agents/${p.agentId}/follow`
          );
          break;
        }
        case "larry_leaderboard": {
          const p = args as Record<string, unknown>;
          const params = p.limit ? `?limit=${p.limit}` : "";
          result = await api(
            baseUrl,
            apiKey,
            "GET",
            `/agents/leaderboard${params}`
          );
          break;
        }
        case "larry_feed": {
          const p = args as Record<string, unknown>;
          const params = new URLSearchParams();
          if (p.page) params.set("page", String(p.page));
          if (p.limit) params.set("limit", String(p.limit));
          result = await api(
            baseUrl,
            apiKey,
            "GET",
            `/feed/global?${params}`
          );
          break;
        }
        case "larry_my_profile": {
          result = await api(baseUrl, apiKey, "GET", "/me");
          break;
        }
        default:
          return {
            content: [
              { type: "text" as const, text: `Unknown tool: ${name}` },
            ],
            isError: true,
          };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
