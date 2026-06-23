# Mentora

Mentora is a bilingual, Peru-first AI study platform for college and university students. This project is a working web application, not an app shell or static mockup: users log in, core flows persist data, process uploaded material, generate study outputs, enforce per-user isolation, and route tutor chat through the AI gateway.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy

See [docs/deployment.md](docs/deployment.md) for environment variables, OpenRouter setup, and production persistence notes.

## Environment

Create `.env.local` from `.env.example` before connecting real services.

## Current Scope

- Bilingual English/Spanish UI
- Premium landing and live study workspace UI
- Login with local persisted sessions
- Per-user ownership isolation for study spaces, files, tools, chats, and study plans
- Admin-only operations dashboard with KPIs, user counter, user list, role changes, and status controls
- Create study spaces locally
- Upload PDF/TXT or paste academic material
- Extract text, chunk documents, summarize, and generate flashcards/quizzes
- Source-grounded tutor chat over uploaded chunks
- Source-based study plan generation from uploaded materials
- Local JSON persistence in `.mentora-data/` for fast local development
- Prisma schema for multi-tenant SaaS foundations
- OpenRouter/OpenAI-compatible model router with local fallback for development resilience
- API routes for study spaces, upload, study tooling, tutor chat, and provider admin metadata
- Privacy-first UX and academic integrity guardrails

## AI Providers

Mentora connects to OpenRouter through the OpenAI-compatible gateway. To use live OpenRouter models, set the key and default provider in `.env.local`:

```env
DEFAULT_AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="..."
```

If OpenRouter is unavailable or no key is configured, the app still answers from uploaded source chunks using the local study engine so the webapp remains functional during development.
