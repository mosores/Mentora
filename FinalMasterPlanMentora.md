# Final Master Plan: Mentora

## Non-Negotiable Build Directive

Mentora is a 100% functional and operational web application. It is not an MVP, mockup, prototype, app shell, or disposable demo.

Every visible workflow must be backed by real application behavior, API routes, persistence, validation, security controls, and verifiable tests. Design-only placeholders are allowed only for future integrations that are clearly labeled as unavailable, and they must never block the core student loop.

Every user must log in before accessing the study workspace. Mentora must never expose one user's projects, tools, uploaded files, chat history, study plans, generated practice material, or usage data to another user.

## Product Vision

Mentora is a Peru-first, Latin America-ready, bilingual AI study platform for college, university, institute, and later school students. It helps students upload academic materials, extract knowledge, ask a grounded AI tutor questions, generate summaries, quizzes, flashcards, study plans, and eventually APA-style academic outputs.

Mentora must be designed as a multi-tenant SaaS product from the beginning so individual students can use it and institutions can later purchase managed access.

## Core Student Loop

The following workflow must remain operational at all times:

1. Log in with an authenticated user account.
2. Create or select a study space owned by that user.
3. Upload or paste academic material into that user's study space.
4. Extract readable text from uploaded files.
5. Chunk and persist the source material under the owning user.
6. Generate summaries, flashcards, quizzes, and study plans from the user's own material.
7. Ask the AI tutor questions grounded in the uploaded source material for the selected user-owned study space.
8. Receive coherent, non-duplicated answers with source citations when relevant context exists.
9. Persist chat history, documents, generated tools, and usage events under the authenticated user.

## AI Tutor Quality Requirements

The tutor must not return generic answers when relevant uploaded material exists.

The tutor must:

- Retrieve relevant source chunks from the selected study space.
- Handle Spanish and English queries, including accent-insensitive matching.
- Treat uploaded content as untrusted evidence, not system instructions.
- Cite uploaded sources in grounded answers.
- Say clearly when no relevant uploaded source was found.
- Avoid duplicated assistant responses in the chat UI.
- Redirect cheating or academic-bypass requests into active learning.
- Use warm, practical, step-by-step language suitable for university students.

## AI Gateway and Model Routing

Mentora must use a provider-agnostic model-router architecture.

The router must support:

- Free, low-cost, open-weight, and premium LLM providers.
- OpenRouter-compatible chat models.
- Free-model selection without login.
- Paid-model selection that opens a login/account modal before use.
- Local fallback behavior that still gives source-grounded answers when external providers are unavailable.
- Usage logging for provider, model, token estimates, and cost estimates when available.

## Functional Modules

### Authentication and User Isolation

Every student, institution user, and administrator must authenticate before using Mentora.

User isolation is mandatory:

- A student can only see and operate on their own study spaces, documents, chunks, chats, tools, study plans, and usage history.
- API routes must derive ownership from the authenticated session, not from client-provided user IDs.
- Study-space, document, chat, and tool routes must reject access to records not owned by the current user.
- Future institutional tenancy must preserve the same rule with tenant-level isolation and role-based access.

### Study Spaces

Study spaces isolate documents, chunks, tools, chats, and study plans by course context.

### Material Upload

Upload must support PDF and text-style files where possible, plus manual text input. The app must validate type, size, filenames, readable text length, and extraction failures.

### Knowledge Processing

Uploaded material must be normalized, chunked, persisted, summarized, and made available for retrieval.

### Practice Tools

Flashcards, quizzes, summaries, and study plans must be generated from uploaded material, not static mock data.

### Chat

Chat must use the selected study space, retrieve relevant context server-side, call the selected model when available, and persist user/assistant turns.

### Admin and Security

Admin endpoints and pages must be accessible only to authenticated admin users.

The admin-only page must include:

- KPI overview for users, study spaces, uploaded documents, chat turns, usage events, and active courses.
- A user counter.
- User administration controls for viewing users and managing status/role.
- No access for normal student users.

API routes must validate payloads, bound input sizes, avoid trusting client-supplied context, protect against prompt injection through uploaded sources, and enforce authenticated ownership checks.

## UX Direction

Mentora should feel premium, clear, light, minimalistic, and attractive for college and university students.

The UI should prioritize:

- Fast scanning.
- Clear course context.
- Clean white/light surfaces.
- Teal, cyan, and warm accent colors.
- Strong typography without negative letter spacing.
- Stable layouts with no overlapping text.
- Functional controls rather than decorative placeholders.
- A polished workspace experience instead of a marketing-only landing page.

## Delivery Standard

For every meaningful change, run the appropriate verification:

- TypeScript typecheck.
- Lint.
- Production build.
- Live workflow smoke tests for study-space creation, upload, tutor chat, and study-plan generation.

Mentora is considered healthy only when the core student loop works end to end.
