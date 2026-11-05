# [QA / Validation] Comprehensive Testing of Instagram Ghost Mode MCP Server

## 1. Overview & Objective

The **Ghost Mode MCP Server** (`meta-graph-ghost-mcp`) is a Model Context Protocol (MCP) server that exposes 100% anonymous, read-only Instagram intelligence tools to AI agents (Claude Desktop, Cursor, Antigravity, or custom LLM agents).

It operates under strict **Zero-Account / Zero-Cookie (Pure Guest)** constraints:
- No login credentials or cookies required.
- Zero risk of account checkpoints or bans.
- Real-time extraction via SSR hydration and public media nodes.

**Goal:** Test and validate all 7 Ghost Mode MCP tools end-to-end, verify error handling, and confirm seamless connectivity with AI agent clients.

---

## 2. Server Location & File Structure

- **TypeScript Source:** [`ts_src/mcp/server.ts`](../ts_src/mcp/server.ts)
- **Service Implementation:** [`ts_src/mcp/ghost_service.ts`](../ts_src/mcp/ghost_service.ts)
- **Compiled Binary:** `dist/mcp/server.js`
- **Automated JSON-RPC Test Harness:** `scratch/test_mcp_client.js`

---

## 3. Build & Terminal Commands

### Step 1: Install Dependencies & Build
```bash
# Navigate to repository root
cd /home/hokar/Documents/antigravity/hopeful-bell

# Ensure dependencies are installed
npm install

# Build TypeScript to dist/
npm run build
```

### Step 2: Run Automated JSON-RPC Verification Script
We have provided an automated test runner that spawns the server, performs the MCP handshake, lists tools, and executes a test call:
```bash
node scratch/test_mcp_client.js
```
*Expected Output:*
```text
Sending initialize...
[MetaGraph MCP] Ghost Mode Server running on stdio (v1.0.0)
[MCP Response]: Protocol 2024-11-05 initialized
Sending tools/list...
[MCP Response]: Received 7 tools
Testing tool execution: ghost_get_profile for @cristiano...
[MCP Response]: { "username": "cristiano", "followers_count": 680000000, ... }
✅ MCP Test Completed Successfully!
```

### Step 3: Run Server Directly on Stdio
To run the server standalone (for debugging or manual pipe):
```bash
npm run mcp
# or directly:
node dist/mcp/server.js
```

---

## 4. Connecting the MCP Server to AI Agents

### Option A: Claude Desktop Configuration
Add the server to your Claude Desktop configuration file (`~/.config/Claude/claude_desktop_config.json` on Linux, or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "instagram-ghost": {
      "command": "node",
      "args": [
        "/home/hokar/Documents/antigravity/hopeful-bell/dist/mcp/server.js"
      ]
    }
  }
}
```

### Option B: Cursor / Antigravity MCP Configuration
In Cursor or Antigravity Settings > Features > MCP:
- **Name:** `instagram-ghost`
- **Type:** `command`
- **Command:** `node /home/hokar/Documents/antigravity/hopeful-bell/dist/mcp/server.js`

---

## 5. Test Suite Checklist (All 7 Ghost Tools)

Please test each of the following 7 tools and verify the JSON response schema:

- [ ] **1. `ghost_get_profile`**
  - **Input:** `{"username": "cristiano"}` or `{"username": "instagram"}`
  - **Verification:** Returns `id`, `username`, `full_name`, `followers_count`, `following_count`, `media_count`, `is_verified`, and `profile_pic_url_hd`.

- [ ] **2. `ghost_get_posts`**
  - **Input:** `{"username": "instagram", "limit": 12, "feedType": "all"}`
  - **Verification:** Returns an array of recent posts/reels with `shortcode`, `caption`, `taken_at`, `like_count`, `comment_count`, and media URLs.

- [ ] **3. `ghost_get_media_metrics`**
  - **Input:** `{"mediaId": "DQQMJ9dER-7"}`
  - **Verification:** Returns granular metrics for the specific reel, including estimated views, likes, comments, and engagement rate.

- [ ] **4. `ghost_get_comments`**
  - **Input:** `{"mediaId": "DQQMJ9dER-7", "limit": 15}`
  - **Verification:** Returns a list of public comments with commenter username, comment text, timestamp, and likes.

- [ ] **5. `ghost_search`**
  - **Input:** `{"query": "technology", "type": "all"}`
  - **Verification:** Returns matching public accounts and hashtags without saving history to any account.

- [ ] **6. `ghost_explore_viral`**
  - **Input:** `{"limit": 10, "minCommentRatio": 0.02}`
  - **Verification:** Extracts viral reels and high-engagement discussion posts.

- [ ] **7. `ghost_audit_account`**
  - **Input:** `{"username": "tawanatallks", "sampleCount": 15}`
  - **Verification:** End-to-end automated analytical audit: total plays, average views per reel, overall engagement rate, top 3 viral reels, and discussion drivers.

---

## 6. Reporting Issues & Edge Cases

When reporting issues, please provide:
1. Target username / media shortcode used.
2. The exact JSON error payload returned by the server.
3. Whether Instagram returned a rate limit or HTTP 429/checkpoint.
