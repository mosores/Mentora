# Mentora UI Implementation Plan

## Direction

Visual thesis: Mentora should feel like a calm university study cockpit: clean white surfaces, soft lavender/blue depth, crisp product UI, and friendly AI accents without the heavy yellow/black Miro treatment.

Content plan: keep the landing as a clear product-first page, then make onboarding feel guided, make the student dashboard useful at a glance, and make tutor/documents/tools feel like one coherent study workspace.

Interaction thesis: use small entrance/reveal motions, tactile hover states, and stable responsive panels so the app feels polished without adding visual noise.

## Progress

### Phase 0 - Discovery and checklist setup

- [x] Read `planesUI.md` and confirmed it was empty before implementation.
- [x] Reviewed the supplied Mentora visual references for landing, onboarding, dashboard, and PDF/tutor workspace direction.
- [x] Read the local Next.js 16 App Router, Client Component, and CSS docs from `node_modules/next/dist/docs/`.
- [x] Inspected the current app structure, major React components, global CSS layers, and existing Miro-style overrides.
- [x] Created this sequential checklist to track the work.

### Phase 1 - Landing/auth visual refresh

- [x] Preserve the landing structure the user likes while moving the styling from Miro yellow/black into Mentora blue/lavender/white.
- [x] Improve the Mentora logo mark, hero product mockup, floating panels, university strip, feature cards, testimonials, auth panel, and footer.
- [x] Ensure the first viewport clearly shows Mentora, the IA study promise, CTAs, and a product UI preview without looking overloaded.

### Phase 2 - Onboarding/profile flow refresh

- [x] Rework onboarding into the reference-like guided setup: left progress rail, large question area, option tiles, progress preview, and calm right-side recommendation panel.
- [x] Bring profile settings into the same visual system as onboarding.
- [x] Keep all existing onboarding/profile save behavior intact.

### Phase 3 - Authenticated dashboard shell refresh

- [x] Replace remaining Miro-style dashboard shell colors with Mentora surfaces, blue/violet active states, and soft app panels.
- [x] Improve sidebar, topbar, dashboard hero, quick actions, course/material widgets, recommendations, and progress cards.
- [x] Keep existing navigation, upload, chat entry, and data-driven states working.

### Phase 4 - Tutor/documents/tools workspace refresh

- [x] Refresh Tutor IA workspace to match the PDF/chat reference: clean chat panel, model/mode controls, source context, and grounded status states.
- [x] Refresh document upload/library and generated tools surfaces to match the Mentora internal UI.
- [x] Remove or override the visible Miro palette from internal workspaces.

### Phase 5 - Verification and responsive QA

- [x] Run typecheck/lint/build or the closest available validation.
- [x] Run the app locally and inspect key screens with browser screenshots where possible.
- [x] Fix layout/text overlap issues found during QA.
- [x] Mark all completed checklist items in this file.

### Phase 6 - Sidebar polish follow-up

- [x] Fix the cramped spaces controls so the create-space action does not overlap sidebar content.
- [x] Restore readable active navigation contrast in the sidebar.
- [x] Verify the sidebar polish with project checks.

### Phase 7 - Dashboard panel polish follow-up

- [x] Reduce oversized empty dashboard cards and make the main panel denser.
- [x] Fix awkward list rows, colored label bars, and overlapping plan details.
- [x] Align quick actions, tutor recommendations, and hero visual with the Mentora reference style.
- [x] Verify the dashboard polish with project checks.
