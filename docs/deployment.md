# Mentora Deployment

Mentora is ready for a standard Next.js deployment target such as Vercel, Render, Railway, or Fly.io.

## Required Environment

Set these values in the hosting provider:

```env
APP_URL="https://your-domain.example"
JWT_SECRET="replace-with-a-strong-secret"
ADMIN_API_TOKEN="replace-with-a-random-admin-token"
DEFAULT_AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="..."
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
OPENROUTER_CHAT_MODEL="openai/gpt-4.1-mini"
MAX_UPLOAD_SIZE_MB="15"
FREE_DAILY_AI_MESSAGES="30"
FREE_MONTHLY_DOCUMENTS="5"
```

`OPENROUTER_API_KEY` is required for live OpenRouter responses. Without it, Mentora falls back to the local source-grounded study engine.

## Current Local Persistence

The current local runtime uses `.mentora-data/` JSON storage for development, including users, hashed sessions, study spaces, documents, chats, and usage events. This is intentionally ignored by git and is not suitable for multi-instance production hosting.

Before a production launch, replace local JSON persistence with the Prisma/PostgreSQL schema in `prisma/schema.prisma`, private object storage for files, and managed auth/session storage. Preserve the current ownership rule: users can only access their own projects, tools, files, chats, and study plans; admin views require admin role.

## Verification

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

Then smoke test:

```bash
npm run dev
npm run smoke
```
