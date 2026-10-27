#!/usr/bin/env node
/**
 * Meta Graph Unofficial - Ghost Mode MCP Server
 *
 * Standards-compliant Model Context Protocol (MCP) tool provider.
 * Exposes 100% anonymous, read-only Instagram intelligence tools to AI agents.
 *
 * Complies with Meta Graph API v21.0 specs, Xiaomi Redmi Note 13 4G telemetry,
 * and zero-footprint Ghost Mode constraints.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GhostService } from './ghost_service.js';
// Initialize the Ghost Service (wraps TwinGraph & Mobile/Web Twins)
const ghost = new GhostService();
const SERVER_NAME = 'meta-graph-ghost-mcp';
const SERVER_VERSION = '1.0.0';
const server = new Server({
    name: SERVER_NAME,
    version: SERVER_VERSION
}, {
    capabilities: {
        tools: {}
    }
});
// 1. Tool Definitions
const GHOST_TOOLS = [
    {
        name: 'ghost_get_profile',
        description: 'Inspect any Instagram account anonymously in Ghost Mode. Returns username, full name, bio, follower count, following count, total post count, verified status, and HD profile picture without leaving any footprint.',
        inputSchema: {
            type: 'object',
            properties: {
                username: {
                    type: 'string',
                    description: 'Instagram handle/username to inspect (e.g. "cristiano", "hokar368")'
                }
            },
            required: ['username']
        }
    },
    {
        name: 'ghost_get_posts',
        description: 'Extract feed posts, reels, and carousels of an account with full pagination in Ghost Mode. Includes media type, captions, timestamps, likes, comments, video play counts, and pagination cursor for deep scrolling.',
        inputSchema: {
            type: 'object',
            properties: {
                username: {
                    type: 'string',
                    description: 'Instagram username to inspect'
                },
                userId: {
                    type: 'string',
                    description: 'Numerical user ID (optional if username is provided)'
                },
                limit: {
                    type: 'number',
                    description: 'Number of posts to retrieve (1-50, default 20)'
                },
                cursor: {
                    type: 'string',
                    description: 'Pagination token (after/max_id cursor) for fetching the next page of posts'
                },
                feedType: {
                    type: 'string',
                    enum: ['all', 'reels', 'posts'],
                    description: 'Filter posts by content type: "all", "reels", or "posts"'
                }
            }
        }
    },
    {
        name: 'ghost_get_media_metrics',
        description: 'Get granular metrics and view counts for a specific reel or post anonymously. Returns video plays, views, likes, comments, shares, saves, retention drop-off estimates, and calculated engagement rate.',
        inputSchema: {
            type: 'object',
            properties: {
                mediaId: {
                    type: 'string',
                    description: 'Instagram media shortcode (e.g. "Deyg1mxiobv") or numerical media ID'
                }
            },
            required: ['mediaId']
        }
    },
    {
        name: 'ghost_get_comments',
        description: 'Harvest public comments on any Instagram post or reel anonymously. Returns comment text, author usernames, timestamps, and like counts.',
        inputSchema: {
            type: 'object',
            properties: {
                mediaId: {
                    type: 'string',
                    description: 'Instagram media shortcode or numerical ID'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of comments to harvest (default 25)'
                }
            },
            required: ['mediaId']
        }
    },
    {
        name: 'ghost_search',
        description: 'Search Instagram users and hashtags in Ghost Mode without recording the search query into your account search history.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Keyword, username prefix, or hashtag to search'
                },
                type: {
                    type: 'string',
                    enum: ['users', 'hashtags', 'all'],
                    description: 'Search filter: "users", "hashtags", or "all"'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'ghost_explore_viral',
        description: 'Scan Instagram Explore feed anonymously for viral and high-controversy debate posts, ranked by discussion intensity and comment-to-like ratio.',
        inputSchema: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Number of viral posts to fetch (default 10)'
                },
                minCommentRatio: {
                    type: 'number',
                    description: 'Filter for high-controversy discussions (e.g. 0.05 = at least 5 comments per 100 likes)'
                }
            }
        }
    },
    {
        name: 'ghost_audit_account',
        description: 'Run an automated, end-to-end analytical audit of any Instagram page in Ghost Mode. Returns total sampled plays, average views per reel, overall engagement rate, top 3 viral reels, discussion driver posts, and content mix ratios.',
        inputSchema: {
            type: 'object',
            properties: {
                username: {
                    type: 'string',
                    description: 'Target Instagram username to audit'
                },
                sampleCount: {
                    type: 'number',
                    description: 'Number of recent posts to sample for the audit (default 15)'
                }
            },
            required: ['username']
        }
    }
];
// 2. List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: GHOST_TOOLS };
});
// 3. Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    try {
        switch (name) {
            case 'ghost_get_profile': {
                const username = String(args.username || '');
                if (!username) {
                    throw new Error('Argument "username" is required.');
                }
                const profile = await ghost.getProfile(username);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(profile, null, 2)
                        }
                    ]
                };
            }
            case 'ghost_get_posts': {
                const result = await ghost.getTimelinePosts({
                    username: args.username ? String(args.username) : undefined,
                    userId: args.userId ? String(args.userId) : undefined,
                    limit: args.limit ? Number(args.limit) : 20,
                    cursor: args.cursor ? String(args.cursor) : undefined,
                    feedType: args.feedType
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            case 'ghost_get_media_metrics': {
                const mediaId = String(args.mediaId || '');
                if (!mediaId) {
                    throw new Error('Argument "mediaId" is required.');
                }
                const metrics = await ghost.getMediaMetrics(mediaId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(metrics, null, 2)
                        }
                    ]
                };
            }
            case 'ghost_get_comments': {
                const mediaId = String(args.mediaId || '');
                if (!mediaId) {
                    throw new Error('Argument "mediaId" is required.');
                }
                const comments = await ghost.getComments(mediaId, args.limit ? Number(args.limit) : 25);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(comments, null, 2)
                        }
                    ]
                };
            }
            case 'ghost_search': {
                const query = String(args.query || '');
                if (!query) {
                    throw new Error('Argument "query" is required.');
                }
                const searchRes = await ghost.search(query, args.type || 'all');
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(searchRes, null, 2)
                        }
                    ]
                };
            }
            case 'ghost_explore_viral': {
                const viral = await ghost.getViralExplore(args.limit ? Number(args.limit) : 10, args.minCommentRatio ? Number(args.minCommentRatio) : undefined);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(viral, null, 2)
                        }
                    ]
                };
            }
            case 'ghost_audit_account': {
                const username = String(args.username || '');
                if (!username) {
                    throw new Error('Argument "username" is required.');
                }
                const report = await ghost.auditAccount(username, args.sampleCount ? Number(args.sampleCount) : 15);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(report, null, 2)
                        }
                    ]
                };
            }
            default:
                throw new Error(`Unknown Ghost Mode MCP Tool: "${name}"`);
        }
    }
    catch (err) {
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: {
                            message: err?.message || 'Ghost Mode Tool Execution Error',
                            code: 'GHOST_TOOL_ERROR',
                            type: 'MCPToolException'
                        }
                    }, null, 2)
                }
            ]
        };
    }
});
// 4. Start Server via Stdio Transport
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write(`[MetaGraph MCP] Ghost Mode Server running on stdio (v${SERVER_VERSION})\n`);
}
run().catch((error) => {
    process.stderr.write(`[MetaGraph MCP] Fatal Error: ${error}\n`);
    process.exit(1);
});
