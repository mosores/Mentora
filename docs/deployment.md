# Mentora Deployment

Mentora currently ships with local JSON persistence for development and a Prisma schema for the production database shape.

## Required environment variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mentora"
JWT_SECRET="replace-with-a-secure-secret"
APP_URL="https://your-site.example"
DEFAULT_AI_PROVIDER="mock"
OPENROUTER_API_KEY=""
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
OPENROUTER_CHAT_MODEL="openai/gpt-4.1-mini"
MAX_UPLOAD_SIZE_MB="15"
```

## Local development

```bash
npm install
npm run dev
```

The local app seeds these accounts into `.mentora-data/db.json`:

- `student@mentora.local` / `mentora123`
- `admin@mentora.local` / `admin123`

## Verification

Run the static checks before deployment:

```bash
npm run typecheck
npm run lint
npm run build
```

With the dev server running, verify the core workflow:

```bash
npm run smoke
```

## Production persistence

The checked-in Prisma schema mirrors the local records and is ready for a Postgres migration path. Before production launch, replace the JSON data adapter in `lib/data.ts` with Prisma calls while preserving the same ownership checks in the API routes.
