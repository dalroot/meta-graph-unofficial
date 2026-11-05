# Meta Graph API v21.0: Nodes and Edges Specification

## 1. Overview
The Meta Graph API is the primary way for apps to read and write data to the Facebook/Instagram platform. It is an HTTP-based API where:
- **Nodes**: Individual objects with unique IDs (e.g., User, Page, Instagram Media, Comment).
- **Edges**: Connections between objects (e.g., photos on a Page, comments on a post).
- **Fields**: Specific properties of an object (e.g., `id`, `name`, `caption`, `like_count`).

---

## 2. Core Nodes

### `/{user_id}` or `/me`
Represents an individual user or Instagram Business/Creator Account.
- **Node Type:** `User` / `InstagramUser`
- **Supported Fields:**
  - `id`: Unique user ID.
  - `username`: Profile handle.
  - `name`: Display full name.
  - `biography`: Profile bio.
  - `followers_count`: Total followers.
  - `follows_count`: Total accounts followed.
  - `media_count`: Count of published media.
  - `profile_picture_url`: High-resolution avatar URL.
  - `website`: Linked external URL.

### `/{media_id}`
Represents an Instagram media object (Post, Carousel, Reel, Story).
- **Node Type:** `InstagramMedia`
- **Supported Fields:**
  - `id`: Media ID.
  - `ig_id`: Legacy Instagram internal ID.
  - `caption`: Media description and hashtags.
  - `media_type`: `IMAGE`, `VIDEO`, `CAROUSEL_ALBUM`.
  - `media_product_type`: `FEED`, `STORY`, `REELS`.
  - `media_url`: CDN asset URL.
  - `permalink`: Web URL to post.
  - `timestamp`: ISO 8601 creation timestamp.
  - `like_count`: Like count.
  - `comments_count`: Inbound comments count.

---

## 3. Core Edges

### `/{user_id}/media`
Connection representing all media published by an account.
- **HTTP Methods:**
  - `GET`: Returns a paginated list of media objects.
  - `POST`: Creates a new media container or publishes media.
- **Parameters:**
  - `image_url` / `video_url`: Upload payload.
  - `caption`: Text caption.
  - `media_type`: `STORIES`, `REELS`, `IMAGE`, `VIDEO`.

### `/{media_id}/insights`
Retrieves performance and engagement metrics for a post or reel.
- **Supported Metric Keys:**
  - `reach`: Unique accounts that saw the media.
  - `impressions`: Total view count.
  - `plays`: Video play starts (Reels).
  - `total_interactions`: Sum of likes, comments, shares, saves.
  - `saved`: Bookmark saves.
  - `shares`: Reshares.

### `/{media_id}/comments`
Retrieves comments published on a media object.
- **HTTP Methods:**
  - `GET`: List comments.
  - `POST`: Reply to a comment or post a top-level comment.
