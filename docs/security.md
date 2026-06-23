# Mentora Security Notes

## Fixed in this pass

- Uploads now bound manual text size, sanitize stored file names, restrict accepted MIME types/extensions, reject malformed PDF headers, and sniff text uploads for binary/null-byte content before local persistence.
- JSON API routes now reject malformed or oversized request bodies before Zod validation on study-space creation, document chunking, AI summarize, flashcard, quiz, chat, and tool regeneration endpoints.
- Dynamic study-space and document IDs now use a strict short ID shape to reduce accidental path/key abuse and noisy persistence lookups.
- Chat now requires an existing study space and ignores client-supplied context, so model prompts are grounded only in chunks retrieved from that study space.
- Provider prompts now explicitly treat uploaded source context as untrusted evidence and wrap source/request content in separate delimiters to reduce prompt-injection success.
- The admin AI provider inventory now requires `ADMIN_API_TOKEN` and the `x-admin-token` request header when enabled, otherwise it returns a non-disclosing 404.
- Deployment headers now set `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, and a restrictive `Permissions-Policy`.
- Login is required for core APIs. Local sessions are persisted with hashed tokens, and authenticated routes derive user identity from the session instead of trusting client-supplied user IDs.
- Study spaces are owned by users. Study-space listing, upload, tool regeneration, tutor chat, and study-plan routes enforce ownership server-side.
- Admin endpoints require an authenticated admin user. The admin overview exposes KPIs, a user counter, and sanitized user data only to admins.

## Remaining production gaps

- Local authentication and authorization are functional for development, but production should replace them with managed auth, hardened cookies, CSRF protections, passwordless/OAuth flows, and tenant membership checks backed by the database.
- Local JSON persistence under `.mentora-data` is for development only. Move users, sessions, documents, chats, usage events, and audit logs to the Prisma/Postgres tenant schema with RLS, encryption/backups, and secret-managed session signing as appropriate.
- Upload processing still extracts full text in memory. Production should stream uploads through malware scanning, stricter content-type detection, per-tenant quotas, and async processing.
- AI provider routing is environment-driven and not yet tenant-policy enforced. Add allow-lists per tenant/task, audit provider decisions, and prevent paid/external model selection without authorization.
- Prompt-injection defenses are improved but not complete. Add output citation validation, source-only answer checks for strict mode, and red-team tests for malicious uploaded documents.
- Public API routes still need production rate limits, stronger CSRF/session protections, bot controls, and structured audit logging.
- `JWT_SECRET`, `ADMIN_API_TOKEN`, and provider keys must be generated and stored in a secrets manager; never commit local `.env` files or key text files.
