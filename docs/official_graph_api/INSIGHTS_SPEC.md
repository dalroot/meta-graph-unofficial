# Meta Graph API v21.0: Insights Specification

## 1. Overview
The Graph API v21.0 Insights endpoint (`/{media_id}/insights` and `/{user_id}/insights`) provides organic metrics for business and creator accounts.

---

## 2. Media Insights (`/{media_id}/insights`)

### Supported Metrics for Feed Posts & Carousels:
- `reach`: Number of unique accounts that have seen the media.
- `impressions`: Total number of times the media has been viewed.
- `saved`: Number of unique accounts that saved the media.
- `video_views`: Number of times the video has been viewed for at least 3 seconds.

### Supported Metrics for Instagram Reels (`media_product_type: REELS`):
- `plays`: Number of times the Reel starts playing after video begins.
- `reach`: Number of unique accounts that watched the Reel at least once.
- `total_interactions`: Sum of likes, comments, shares, and saves.
- `shares`: Number of times the Reel was reshared.
- `saved`: Number of times the Reel was bookmarked.
- `ig_reels_avg_watch_time`: The average time spent playing the Reel (seconds).
- `ig_reels_video_view_total_time`: Total time the Reel was played, including replays (seconds).

---

## 3. Account Insights (`/{user_id}/insights`)

### Query Parameters:
- `metric`: Comma-separated list of metrics (e.g. `reach,impressions,profile_views,follower_count`).
- `period`: `day`, `week`, `days_28`, `month`, `lifetime`.
- `metric_type`: `total_value` or `time_series`.

### Response Shape (Graph API v21.0):
```json
{
  "data": [
    {
      "name": "reach",
      "period": "day",
      "values": [
        {
          "value": 1420,
          "end_time": "2026-10-16T07:00:00+0000"
        }
      ],
      "title": "Reach",
      "description": "Total unique accounts that viewed your content.",
      "id": "19835089130/insights/reach/day"
    }
  ]
}
```
