# Ghost Mode MCP Server — QA Report

## Scope

Repository: dalroot/meta-graph-unofficial

Reviewed all seven registered Ghost Mode MCP tools.

Testing included MCP protocol checks, basic schema checks,
missing-argument handling, one live profile request,
offline discovery execution, and source-code review.

## Test Results

| Test | Result |
|---|---|
| MCP initialization | PASS |
| Seven tools registered | PASS |
| Basic tool schemas | PASS |
| Five missing-argument checks | PASS (rejection observed) |
| Live profile request (@instagram) | BLOCKED — Instagram HTTP 302 login challenge |
| Offline search result semantics | ISSUE CONFIRMED |
| Offline viral result semantics | ISSUE CONFIRMED |

Note: Live data accuracy has not been verified.

## Findings

### F01 — HIGH: Timeline request errors are silently swallowed

File: ts_src/mcp/ghost_service.ts

The timeline request catch block suppresses network failures.
A failed request may return an empty posts array without
distinguishing failure from an account with no posts.

### F02 — HIGH: Timeline pagination is incomplete

File: ts_src/mcp/ghost_service.ts

The cursor parameter is not used.
has_next_page is determined by a fixed threshold of 12,
regardless of the requested limit or an actual next-page cursor.

### F03 — HIGH: Media metrics errors are silently swallowed

File: ts_src/mcp/ghost_service.ts

Network errors, including Instagram HTTP 302 challenges,
may produce default zero metrics instead of an error.

### F04 — HIGH: Media engagement rate uses an unsupported denominator

File: ts_src/mcp/ghost_service.ts

The formula divides likes plus comments by
(likes * 10 || 100). This is not a documented follower-based
or reach-based engagement rate.

### F05 — HIGH: Media type is hardcoded to VIDEO

File: ts_src/mcp/ghost_service.ts

getMediaMetrics always reports VIDEO even for image-post inputs.

### F06 — HIGH: Comments request failures are reported as empty results

File: ts_src/mcp/ghost_service.ts

HTTP 302 and network errors can result in an empty comments array,
without communicating that data retrieval failed.

### F07 — HIGH: Offline search reports status ok

File: ts_src/twins/discovery_twin.ts

Confirmed through MCP with OFFLINE_MODE=true:
ghost_search returned empty users/hashtags with status "ok".
No live search was performed.

### F08 — HIGH: Offline viral exploration reports an empty array

File: ts_src/twins/discovery_twin.ts

Confirmed through MCP with OFFLINE_MODE=true:
ghost_explore_viral returned [] without an error or offline marker.

### F09 — MEDIUM: Missing timestamps are replaced with current time

File: ts_src/mcp/ghost_service.ts

Timeline, media metrics, and comments use current time as a
fallback when original publication timestamps are unavailable.

### F10 — MEDIUM: Audit contains permanently empty sections

File: ts_src/mcp/ghost_service.ts

top_performing_reels and discussion_driver_posts are
hardcoded to empty arrays.

### F11 — MEDIUM: Feed filtering occurs after retrieval limit

File: ts_src/mcp/ghost_service.ts

Timeline posts are limited before feedType filtering,
which can return fewer matching items than requested.

## Additional Risks

- Missing likes/comments can be represented as zero.
- Post URLs are normalized to /reel/ in metrics and comments.
- Search and Viral require an active session for live requests.
- Audit aggregates can be misleading when timeline retrieval fails.
- Rank-token generation uses a fixed prefix.
- Full schema semantics and live data correctness need further testing.

## Live Testing Limitation

The live MCP call to ghost_get_profile for @instagram
returned GHOST_TOOL_ERROR caused by Instagram Guest Challenge,
HTTP 302 / is_from_rle.

This is a BLOCKED live-data test, not proof that profile parsing
works or fails when Instagram allows access.

## Recommendations

1. Distinguish unavailable data from valid empty results.
2. Propagate structured network/authentication errors.
3. Implement real cursor-based pagination.
4. Preserve unknown values instead of fabricating timestamps.
5. Document engagement-rate definitions and required denominators.
6. Determine media type from actual media metadata.
7. Implement or explicitly mark incomplete audit sections.
8. Add deterministic mocked-transport tests and live integration tests.

## Evidence

- qa/test_mcp.mjs
- qa/test_schemas.mjs
- qa/test_errors.mjs
- qa/test_live_profile.mjs
- qa/test_offline_discovery.mjs
- qa/results/offline_discovery.json

## Status

QA findings documented.
Full end-to-end live Instagram verification remains incomplete.
