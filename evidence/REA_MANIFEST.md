# Evidence & Provenance Manifest (REA Standard)

This directory maintains captured network records, verified GraphQL schemas, and REST response shapes observed under legitimate browser executions.

## Rules of Engagement:
1. **Zero Guesswork:** No endpoint is implemented into `src/` without an associated entry here.
2. **Provenance Linkage:** Every method in `src/instagram/` and `src/facebook/` cites the verified endpoint, required tokens, and behavior boundary.

### Verified Endpoints:
- `POST /rupload_igphoto/{upload_id}`: Media upload protocol.
- `POST /api/v1/media/configure/`: Feed post configuration.
- `POST /api/v1/media/configure_to_story/`: Story media configuration.
- `GET /api/v1/media/{media_id}/comments/`: Inbound comments retrieval.
- `GET /api/v1/news/inbox/?mark_as_read=false`: Notifications and story mentions intake.
- `POST https://www.facebook.com/api/graphql/`: Facebook Native post publisher.
