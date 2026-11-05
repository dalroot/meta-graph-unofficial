# [QA / Validation] Comprehensive Testing of Instagram Ghost Mode MCP Server

## 1. Overview & Objective

The **Ghost Mode MCP Server** (`meta-graph-ghost-mcp`) is a standard Model Context Protocol (MCP) server that exposes 100% anonymous, read-only Instagram intelligence tools to AI agents (Claude Desktop, Cursor, Antigravity, or custom LLM agents).

It operates under strict **Zero-Account / Zero-Cookie (Pure Guest)** constraints:
- No login credentials or cookies required.
- Zero risk of account checkpoints or bans.
- Real-time extraction via SSR hydration and public media nodes.

**Goal:** Test and validate all 7 Ghost Mode MCP tools end-to-end, verify error handling, and confirm seamless connectivity with AI agent clients.

---

## 2. Server Location & File Structure

- **TypeScript Source:** `ts_src/mcp/server.ts`
- **Service Implementation:** `ts_src/mcp/ghost_service.ts`
- **Compiled Binary:** `dist/mcp/server.js`
- **Automated JSON-RPC Test Harness:** `scratch/test_mcp_client.js`

---

## 3. Build & Terminal Commands

### Step 1: Install Dependencies & Build
```bash
# Clone or navigate to the repository directory
cd <PATH_TO_REPOSITORY>

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

### Step 2: Automated JSON-RPC Verification Script
Run the automated test runner to verify MCP handshake and protocol compliance:
```bash
node scratch/test_mcp_client.js
```

### Step 3: Standalone Stdio Execution
To run the server directly on stdio:
```bash
npm run mcp
# or:
node dist/mcp/server.js
```

---

## 4. Connecting the MCP Server to AI Agents

Replace `<REPO_DIR>` with the absolute path to your cloned repository.

### Option A: Claude Desktop Configuration (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "instagram-ghost": {
      "command": "node",
      "args": ["<REPO_DIR>/dist/mcp/server.js"]
    }
  }
}
```

### Option B: Cursor / Antigravity MCP Configuration
In Settings > Features > MCP > Add New MCP Server:
- **Name:** `instagram-ghost`
- **Type:** `command`
- **Command:** `node <REPO_DIR>/dist/mcp/server.js`

---

## 5. Tool Verification Suite (Dynamic Inputs)

All tools accept dynamic arguments. Test each tool using arbitrary public targets:

- [ ] **1. `ghost_get_profile`**
  - **Input Schema:** `{"username": "<target_username>"}`
  - **Verification:** Returns `id`, `username`, `full_name`, `followers_count`, `following_count`, `media_count`, `is_verified`, and `profile_pic_url_hd`.

- [ ] **2. `ghost_get_posts`**
  - **Input Schema:** `{"username": "<target_username>", "limit": 12, "feedType": "all"}`
  - **Verification:** Returns recent posts/reels with `shortcode`, `caption`, `taken_at`, `like_count`, `comment_count`, and media URLs.

- [ ] **3. `ghost_get_media_metrics`**
  - **Input Schema:** `{"mediaId": "<media_shortcode_or_id>"}`
  - **Verification:** Returns granular metrics for a specific post or reel (views, plays, likes, comments, engagement rate).

- [ ] **4. `ghost_get_comments`**
  - **Input Schema:** `{"mediaId": "<media_shortcode_or_id>", "limit": 15}`
  - **Verification:** Returns public comments with author username, text, timestamp, and likes.

- [ ] **5. `ghost_search`**
  - **Input Schema:** `{"query": "<keyword_or_hashtag>", "type": "all"}`
  - **Verification:** Returns matching public accounts and hashtags without saving history.

- [ ] **6. `ghost_explore_viral`**
  - **Input Schema:** `{"limit": 10, "minCommentRatio": 0.02}`
  - **Verification:** Extracts viral posts and high-discussion content from explore.

- [ ] **7. `ghost_audit_account`**
  - **Input Schema:** `{"username": "<target_username>", "sampleCount": 15}`
  - **Verification:** Automated analytical audit: average views, overall engagement rate, top viral content, and discussion drivers.

---

## 6. Edge Cases to Verify
1. Non-existent username (proper 404 / error JSON returned).
2. Private profile handling.
3. Media shortcode with disabled comments.
