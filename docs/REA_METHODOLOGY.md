# REA Methodology & Reverse Engineering Standards

This document describes how `meta-graph-unofficial` establishes and verifies every API endpoint using the **Reverse Engineer Anything (REA)** framework.

---

## 1. Zero Guesswork Policy
In traditional web scraping or unofficial wrappers, developers guess payload formats or borrow unverified schemas from mobile apps. In MetaGraph, **every single method is backed by recorded evidence**.

## 2. Evidence Capture Pipeline
1. **Target Identification:** Identifying the exact user-initiated browser or network flow.
2. **Passive Sniffing:** Observing the full HTTP request (Headers, URL, Method, Body, TLS handshake).
3. **Fingerprint Normalization:** Stripping user-identifying credentials while retaining exact casing, schema types, and query doc_ids.
4. **Evidence Storage:** Committing the raw verified JSON into `evidence/`.
5. **Code Synthesis:** Implementing the pure Node.js client method referencing the Evidence ID.

## 3. Discovered & Proven Endpoints Table

| Feature | Verified Endpoint | Method | Evidence File |
| :--- | :--- | :--- | :--- |
| **Feed Photo Upload** | `/rupload_igphoto/{upload_id}` | `POST` | `evidence/instagram_upload_evidence.json` |
| **Feed Post Config** | `/api/v1/media/configure/` | `POST` | `evidence/instagram_upload_evidence.json` |
| **Story Upload** | `/api/v1/media/configure_to_story/` | `POST` | `evidence/instagram_upload_evidence.json` |
| **Comments Fetching** | `/api/v1/media/{media_id}/comments/` | `GET` | `evidence/comments_evidence.json` |
| **Mentions & Activity** | `/api/v1/news/inbox/?mark_as_read=false` | `GET` | `evidence/instagram_inbox_mentions_evidence.json` |
| **Facebook Post** | `https://www.facebook.com/api/graphql/` | `POST` | `evidence/facebook_graphql_evidence.json` |
