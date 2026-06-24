# Mentora UI Design System

Forked from `E:\Kipia\Mentora\UI\mentora_ui_design_instructions_for_codex.md` and adapted into the active Mentora implementation direction.

## Product Direction

Mentora is a premium, high-tech, friendly EdTech web app for LATAM college, university, and institute students. The UI should feel youthful, motivating, polished, and trustworthy. It must not feel like a generic SaaS dashboard or a mock app shell.

## Active Visual Style

- Light background: `#f7f9ff`
- Main text: `#071038`
- Secondary text: `#4c5a7a`
- Primary gradient: `#4f46e5 -> #2563eb -> #06b6d4`
- Accent colors: violet `#a855f7`, coral `#ff6b8a`, mint `#16c7a3`, yellow `#f9c74f`
- Surfaces: white/glass cards with soft blue/violet borders
- Cards: rounded 24-32px, soft shadows, subtle hover lift
- Buttons: rounded gradient CTAs with glow
- Icons: Lucide icons in colorful rounded containers
- Visuals: friendly product mockups, floating cards, soft mascot/AI companion, progress charts, and student dashboard widgets

## Required Screens

1. Landing page:
   - Navbar with Mentora logo, links, language, and CTA.
   - Hero headline: "Estudia mejor con IA".
   - Product mockup with laptop, upload card, tutor card, flashcards, progress, mascot, and trust badges.
   - University/social proof strip.
   - Six feature cards.
   - Four-step "Así funciona Mentora" section.
   - Student testimonials.
   - Dark blue footer.

2. Onboarding / learning profile:
   - Friendly, non-clinical learning preference setup.
   - Required dropdown/select answers.
   - Visual progress and recommendations.
   - Mentora must not diagnose, label, or clinically classify students.

3. Student dashboard:
   - Left sidebar.
   - Greeting / study workspace.
   - Upload and ask actions.
   - Courses/materials/progress/recommendation cards.
   - Study pulse and quick tools.

4. Study workspace:
   - Left sidebar.
   - Central study/document area.
   - Right Tutor IA panel.
   - OpenRouter model selector and free/paid gating.
   - Tools for summaries, flashcards, quiz, APA, and notes.

## Functional Rules

- Every student must log in before accessing private data.
- Each user can only access their own spaces, documents, tools, chat, and profile.
- Chat must use OpenRouter when configured.
- Mentora only provides free model access; paid models require the student to connect their own account.
- Upload processing, source retrieval, citations, and learning-profile personalization remain core functionality.
- UI changes must not break Supabase auth, OpenRouter model loading, document ingestion, or private row-level access.
