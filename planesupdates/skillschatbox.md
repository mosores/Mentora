Sí, Carlos. La idea es buena, pero hay que integrarla correctamente: **Understand Anything** debe servir como referencia para crear una capa de “knowledge graph” en Mentora, y **Stop Slop** debe convertirse en una capa de estilo para que el chat deje de sonar robótico. Understand Anything convierte codebases, knowledge bases o docs en grafos interactivos y funciona con Codex; además usa un pipeline multiagente que genera un `knowledge-graph.json`. ([GitHub][1]) Stop Slop es una skill para detectar y eliminar patrones típicos de texto generado por IA, con reglas, frases prohibidas y ejemplos antes/después. ([GitHub][2]) También conecto esto con tu plan anterior de mejorar el UI, chat, diagramas y persistencia de Mentora.

# Mentora Smart Chat Skills Integration Task Plan

Repository:

```text
https://github.com/mosores/Mentora
```

## Main Goal

Make Mentora’s AI chatbox smarter, more visual, more useful for students, and less robotic.

This plan adds two new intelligence layers:

```text
1. Graph Intelligence Layer
   Inspired by Understand Anything.
   Goal: help Mentora understand documents, topics, concepts, dependencies, and relationships as a graph.

2. Human Writing / Anti-Slop Layer
   Inspired by Stop Slop.
   Goal: make Mentora’s answers sound natural, clear, direct, human, and academic instead of robotic AI text.
```

Important:

```text
Do not blindly copy these repositories into Mentora.
Study them, extract useful patterns, and implement a Mentora-native version.
```

---

# Work Discipline Instructions for Codex

make sure to mark each checkbox after completing a task, so we can clearly track what has been done.

Please do not jump back and forth between different phases.

Work in an organized and sequential way: finish one phase first, then continue with the next one.

Additional rules:

* [ ] Mark each checkbox immediately after completing its corresponding task.
* [ ] Do not jump back and forth between different phases.
* [ ] Work in an organized and sequential way.
* [ ] Complete one phase fully before moving to the next phase.
* [ ] If a task cannot be completed, leave it unchecked and add a short note explaining why.
* [ ] Do not rewrite Mentora from zero.
* [ ] Reuse existing Mentora architecture.
* [ ] Do not remove Supabase auth, study spaces, documents, document chunks, citations, messages, conversations, or AI usage logs.
* [ ] Do not add heavy graph processing directly into the real-time chat path.
* [ ] Test each phase before moving to the next one.

---

# New Skills to Add

## Skill 1 — Understand Anything Graph Intelligence

Reference:

```text
https://github.com/Egonex-AI/Understand-Anything
```

Purpose:

```text
Use this as inspiration for a graph-based understanding layer.
Mentora should understand PDFs, topics, summaries, citations, diagrams, and study paths as connected knowledge.
```

Main ideas to reuse:

* [ ] Interactive knowledge graph.
* [ ] Nodes and edges.
* [ ] Plain-English summaries for each node.
* [ ] Searchable graph.
* [ ] Guided tours.
* [ ] Domain/business logic graph concept.
* [ ] Incremental updates.
* [ ] Persona-adaptive explanations.
* [ ] Visual exploration instead of only text chat.

---

## Skill 2 — Stop Slop Human Writing Layer

Reference:

```text
https://github.com/hardikpandya/stop-slop
```

Purpose:

```text
Use this as inspiration for a writing-quality layer that removes robotic AI tone.
Mentora should sound like a clear, human academic tutor, not like generic AI.
```

Main ideas to reuse:

* [ ] Remove AI tells.
* [ ] Remove repetitive phrases.
* [ ] Remove generic AI filler.
* [ ] Remove robotic structure.
* [ ] Improve directness.
* [ ] Improve rhythm.
* [ ] Improve authenticity.
* [ ] Improve density.
* [ ] Preserve factual accuracy.
* [ ] Preserve citations.
* [ ] Preserve student-friendly tone.

---

# GitHub References

## Reference 1 — Understand Anything

GitHub:

```text
https://github.com/Egonex-AI/Understand-Anything
```

Clone:

```bash
git clone --depth 1 https://github.com/Egonex-AI/Understand-Anything.git references/understand-anything
```

Optional Codex install:

```bash
curl -fsSL https://raw.githubusercontent.com/Egonex-AI/Understand-Anything/main/install.sh | bash -s codex
```

Use this for:

* [ ] Knowledge graph architecture.
* [ ] Graph JSON structure.
* [ ] Node summaries.
* [ ] Relationship mapping.
* [ ] Guided tours.
* [ ] Searchable graph UX.
* [ ] Graph dashboard inspiration.
* [ ] Incremental graph updates.

Codex instruction:

```text
Study Understand Anything before building Mentora’s graph layer. Do not copy the whole plugin. Extract graph architecture ideas and implement a Mentora-native graph system for PDFs, concepts, summaries, citations, study paths, and diagrams.
```

---

## Reference 2 — Stop Slop

GitHub:

```text
https://github.com/hardikpandya/stop-slop
```

Clone:

```bash
git clone --depth 1 https://github.com/hardikpandya/stop-slop.git references/stop-slop
```

Use this for:

* [ ] Anti-robotic writing rules.
* [ ] AI phrase detection.
* [ ] Sentence rhythm improvement.
* [ ] Before/after examples.
* [ ] Human-style answer rewriting.
* [ ] Removing generic AI patterns.
* [ ] Improving student-friendly explanations.

Codex instruction:

```text
Study Stop Slop before modifying Mentora’s prompts. Implement a Mentora-safe human writing layer that improves tone without changing facts, citations, equations, code, tables, diagrams, or source-grounded claims.
```

---

## Reference 3 — Google DESIGN.md

GitHub:

```text
https://github.com/google-labs-code/design.md
```

Clone:

```bash
git clone --depth 1 https://github.com/google-labs-code/design.md.git references/google-design-md
```

Use this for:

* [ ] Keeping design consistent.
* [ ] Defining visual identity.
* [ ] Preventing mixed UI.
* [ ] Giving Codex persistent design tokens.

---

## Reference 4 — Anthropic Frontend Design Skill

URL:

```text
https://www.skills.sh/anthropics/skills/frontend-design
```

Use this for:

* [ ] Better UI quality.
* [ ] Avoiding generic AI UI.
* [ ] Better layout.
* [ ] Better visual hierarchy.
* [ ] Better component polish.

---

# Phase 0 — Create Safe Working Branch

* [ ] Create a new branch.

```bash
git checkout -b carlos/add-smart-chat-skills-graph-humanizer
```

* [ ] Install current dependencies.

```bash
npm install
```

* [ ] Run the app.

```bash
npm run dev
```

* [ ] Confirm current problems:

  * [ ] Chat answers sound robotic.
  * [ ] Chat sometimes gives generic AI phrases.
  * [ ] Chat cannot show clear concept graphs.
  * [ ] Chat diagrams are weak or broken.
  * [ ] PDF knowledge is not visually connected.
  * [ ] Student cannot explore relationships between concepts.
  * [ ] UI still needs better visual intelligence.

* [ ] Take screenshots or notes before modifying.

---

# Phase 1 — Add Reference Repositories Locally

* [ ] Create `references/` folder.

```bash
mkdir references
```

* [ ] Add `references/` to `.gitignore`.

```bash
echo "references/" >> .gitignore
```

* [ ] Clone Understand Anything.

```bash
git clone --depth 1 https://github.com/Egonex-AI/Understand-Anything.git references/understand-anything
```

* [ ] Clone Stop Slop.

```bash
git clone --depth 1 https://github.com/hardikpandya/stop-slop.git references/stop-slop
```

* [ ] Clone Google DESIGN.md.

```bash
git clone --depth 1 https://github.com/google-labs-code/design.md.git references/google-design-md
```

* [ ] Search Understand Anything for graph patterns.

```bash
grep -R "knowledge-graph\|nodes\|edges\|graph\|guided tour\|semantic search" references/understand-anything -n --exclude-dir=node_modules --exclude-dir=.git
```

* [ ] Search Stop Slop for writing rules.

```bash
grep -R "phrases\|structures\|examples\|AI tells\|slop\|directness\|rhythm" references/stop-slop -n --exclude-dir=node_modules --exclude-dir=.git
```

* [ ] Summarize what can be reused.

Create:

```text
docs/references/understand-anything-analysis.md
docs/references/stop-slop-analysis.md
```

Acceptance criteria:

* [ ] References are cloned.
* [ ] `references/` is ignored by Git.
* [ ] Codex inspected the repos before coding.
* [ ] Analysis docs are created.

---

# Phase 2 — Define Mentora Graph Intelligence Architecture

Goal:

Create a Mentora-native graph system inspired by Understand Anything.

Important:

```text
Understand Anything is mainly for codebase and knowledge-base graphs.
Mentora needs a student-learning graph for PDFs, courses, concepts, citations, summaries, diagrams, quizzes, and study paths.
```

Define graph node types:

```text
document
page
section
concept
definition
example
citation
summary
diagram
quiz
flashcard
study_goal
learning_gap
related_topic
```

Define graph edge types:

```text
contains
explains
depends_on
related_to
summarized_by
cited_by
visualized_by
tested_by
precedes
contrasts_with
supports
```

Tasks:

* [ ] Create graph architecture document.

```text
docs/graph-intelligence-architecture.md
```

* [ ] Define node types.
* [ ] Define edge types.
* [ ] Define graph use cases.
* [ ] Define what graph data is stored in Supabase.
* [ ] Define what graph data is generated from PDFs.
* [ ] Define what graph data is generated from chat.
* [ ] Define how graph data is rendered in UI.
* [ ] Define how graph data is used by the chat.

Acceptance criteria:

* [ ] Graph architecture is documented.
* [ ] Graph is designed for learning, not only code analysis.
* [ ] Graph does not slow down normal chat.
* [ ] Graph generation happens mostly in background after PDF processing.

---

# Phase 3 — Add Supabase Tables for Knowledge Graph

Goal:

Store graph nodes and relationships in Supabase.

Create migration:

```text
supabase/migrations/000X_knowledge_graph.sql
```

Suggested schema:

```sql
create table if not exists public.knowledge_graphs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  study_space_id uuid not null,
  document_id uuid,
  title text not null,
  graph_type text not null default 'document',
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_graph_nodes (
  id uuid primary key default gen_random_uuid(),
  graph_id uuid not null references public.knowledge_graphs(id) on delete cascade,
  tenant_id uuid not null,
  study_space_id uuid not null,
  document_id uuid,
  node_type text not null,
  label text not null,
  summary text,
  source_page integer,
  source_chunk_id uuid,
  importance numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_graph_edges (
  id uuid primary key default gen_random_uuid(),
  graph_id uuid not null references public.knowledge_graphs(id) on delete cascade,
  tenant_id uuid not null,
  study_space_id uuid not null,
  source_node_id uuid not null references public.knowledge_graph_nodes(id) on delete cascade,
  target_node_id uuid not null references public.knowledge_graph_nodes(id) on delete cascade,
  edge_type text not null,
  label text,
  confidence numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

Add indexes:

```sql
create index if not exists knowledge_graphs_tenant_study_idx
on public.knowledge_graphs (tenant_id, study_space_id);

create index if not exists knowledge_graph_nodes_graph_idx
on public.knowledge_graph_nodes (graph_id);

create index if not exists knowledge_graph_edges_graph_idx
on public.knowledge_graph_edges (graph_id);
```

Tasks:

* [ ] Create migration.
* [ ] Add graph tables.
* [ ] Add indexes.
* [ ] Respect tenant isolation.
* [ ] Respect study space isolation.
* [ ] Make sure graph data is deleted when related study space/document is deleted if needed.
* [ ] Test migration locally.

Acceptance criteria:

* [ ] Graph tables exist.
* [ ] Nodes can be stored.
* [ ] Edges can be stored.
* [ ] Queries are scoped by tenant and study space.
* [ ] Migration runs without error.

---

# Phase 4 — Add Graph Intelligence Module

Create folder:

```text
src/lib/graph/
```

Create files:

```text
src/lib/graph/types.ts
src/lib/graph/build-document-graph.ts
src/lib/graph/extract-concepts.ts
src/lib/graph/extract-relationships.ts
src/lib/graph/graph-store.ts
src/lib/graph/graph-search.ts
src/lib/graph/graph-to-mermaid.ts
src/lib/graph/graph-to-study-map.ts
```

Tasks:

* [ ] Create graph TypeScript types.
* [ ] Create `GraphNode` type.
* [ ] Create `GraphEdge` type.
* [ ] Create `KnowledgeGraph` type.
* [ ] Create concept extraction function.
* [ ] Create relationship extraction function.
* [ ] Create graph storage function.
* [ ] Create graph search function.
* [ ] Create graph-to-Mermaid converter.
* [ ] Create graph-to-study-map converter.

Example types:

```ts
export type GraphNodeType =
  | "document"
  | "page"
  | "section"
  | "concept"
  | "definition"
  | "example"
  | "citation"
  | "summary"
  | "diagram"
  | "quiz"
  | "flashcard"
  | "study_goal"
  | "learning_gap"
  | "related_topic";

export type GraphEdgeType =
  | "contains"
  | "explains"
  | "depends_on"
  | "related_to"
  | "summarized_by"
  | "cited_by"
  | "visualized_by"
  | "tested_by"
  | "precedes"
  | "contrasts_with"
  | "supports";
```

Acceptance criteria:

* [ ] Graph module exists.
* [ ] Graph types are reusable.
* [ ] Document chunks can be converted into graph nodes.
* [ ] Relationships can be generated.
* [ ] Graph can be saved and loaded.

---

# Phase 5 — Generate Graph After PDF Processing

Goal:

Graph generation must happen after PDF upload and processing, not during every chat.

Integrate graph generation into the PDF pipeline.

Files to inspect:

```text
src/lib/pdf-pipeline/
src/lib/rag/search.ts
src/app/api/documents/*
```

Tasks:

* [ ] Identify where PDF processing completes.
* [ ] Add graph generation step after chunks are ready.
* [ ] Extract concepts from document chunks.
* [ ] Create concept nodes.
* [ ] Create section nodes.
* [ ] Create citation/source nodes.
* [ ] Create relationships between concepts.
* [ ] Create summary node.
* [ ] Create diagram node if available.
* [ ] Save graph to Supabase.
* [ ] Mark graph status as `ready`.
* [ ] If graph generation fails, do not fail the whole document.
* [ ] Log graph generation error safely.

Pipeline:

```text
PDF upload
  -> text extraction
  -> chunking
  -> embeddings
  -> summary
  -> graph generation
  -> document ready
```

Acceptance criteria:

* [ ] PDF processing creates a graph.
* [ ] Graph generation does not block chat.
* [ ] Graph errors do not crash the document pipeline.
* [ ] Graph status is visible in metadata.

---

# Phase 6 — Add Graph API Routes

Create API routes:

```text
src/app/api/graphs/route.ts
src/app/api/graphs/[graphId]/route.ts
src/app/api/graphs/[graphId]/search/route.ts
src/app/api/graphs/[graphId]/mermaid/route.ts
```

Tasks:

* [ ] Add GET `/api/graphs`.
* [ ] Add GET `/api/graphs/[graphId]`.
* [ ] Add POST `/api/graphs/[graphId]/search`.
* [ ] Add GET `/api/graphs/[graphId]/mermaid`.
* [ ] Require authentication.
* [ ] Verify tenant ownership.
* [ ] Verify study space ownership.
* [ ] Return only safe graph data.
* [ ] Do not expose private metadata or API keys.
* [ ] Add Zod validation.

Acceptance criteria:

* [ ] Graph API works.
* [ ] Unauthorized users cannot access other graphs.
* [ ] Graph search works.
* [ ] Mermaid export works.

---

# Phase 7 — Add Graph UI Components

Goal:

The student can visually explore PDF knowledge.

Create components:

```text
src/components/graph/knowledge-graph-viewer.tsx
src/components/graph/graph-node-details.tsx
src/components/graph/graph-search-box.tsx
src/components/graph/graph-legend.tsx
src/components/graph/graph-empty-state.tsx
src/components/graph/graph-loading-state.tsx
```

Tasks:

* [ ] Create graph viewer.
* [ ] Create search box.
* [ ] Create graph legend.
* [ ] Create node details panel.
* [ ] Create loading state.
* [ ] Create empty state.
* [ ] Add click behavior for nodes.
* [ ] Show node summary.
* [ ] Show source page if available.
* [ ] Show related concepts.
* [ ] Show citations.
* [ ] Add export as Mermaid button.
* [ ] Add copy Mermaid button.

Rendering options:

```text
Option A: Start with Mermaid for simple graphs.
Option B: Add interactive graph renderer later.
```

Recommended MVP:

```text
Start with Mermaid + graph details panel.
Only add a full interactive graph renderer after data structure is stable.
```

Acceptance criteria:

* [ ] Student can view a concept map.
* [ ] Student can click or inspect graph concepts.
* [ ] Student can search graph nodes.
* [ ] Student can export graph as Mermaid.
* [ ] Graph UI does not crash on large documents.

---

# Phase 8 — Add Chat Tools for Graph Intelligence

Goal:

The chat should use graph knowledge when useful.

Create tools:

```text
src/lib/ai/tools/search-knowledge-graph.ts
src/lib/ai/tools/get-related-concepts.ts
src/lib/ai/tools/generate-study-path-from-graph.ts
src/lib/ai/tools/explain-graph-node.ts
src/lib/ai/tools/export-graph-diagram.ts
```

Tasks:

* [ ] Create `searchKnowledgeGraph`.
* [ ] Create `getRelatedConcepts`.
* [ ] Create `generateStudyPathFromGraph`.
* [ ] Create `explainGraphNode`.
* [ ] Create `exportGraphDiagram`.
* [ ] Connect tools to Smart Agent mode.
* [ ] Do not call graph tools for every message.
* [ ] Call graph tools only when the user asks for:

  * [ ] Concept map.
  * [ ] Diagram.
  * [ ] Related topics.
  * [ ] Study path.
  * [ ] “What should I learn first?”
  * [ ] “How are these concepts connected?”
  * [ ] “Make a visual map.”
  * [ ] “Show dependencies.”

Acceptance criteria:

* [ ] Chat can search the graph.
* [ ] Chat can explain related concepts.
* [ ] Chat can create a study path.
* [ ] Chat can generate a diagram from graph data.
* [ ] Fast Chat remains fast.

---

# Phase 9 — Add Stop Slop Writing Layer

Goal:

Make Mentora sound natural, direct, and human, without changing facts.

Create folder:

```text
src/lib/ai/style/
```

Create files:

```text
src/lib/ai/style/stop-slop-rules.ts
src/lib/ai/style/mentora-tone.ts
src/lib/ai/style/humanize-answer.ts
src/lib/ai/style/answer-quality-score.ts
src/lib/ai/style/protected-content.ts
```

Tasks:

* [ ] Create `stop-slop-rules.ts`.
* [ ] Create phrase list based on Stop Slop concepts.
* [ ] Create structure rules.
* [ ] Create sentence-level rules.
* [ ] Create protected-content rules.
* [ ] Create humanizer function.
* [ ] Create answer quality scoring function.
* [ ] Integrate with prompts.
* [ ] Do not rewrite citations.
* [ ] Do not rewrite code blocks.
* [ ] Do not rewrite formulas.
* [ ] Do not rewrite Mermaid diagrams.
* [ ] Do not rewrite quoted document text.
* [ ] Do not change facts.

Protected content:

```text
citations
direct quotes
code blocks
math formulas
Mermaid diagrams
tables with factual data
source titles
page numbers
legal/medical/safety disclaimers
```

Acceptance criteria:

* [ ] Mentora answers sound less robotic.
* [ ] Factual content remains unchanged.
* [ ] Citations are preserved.
* [ ] Diagrams are preserved.
* [ ] Code blocks are preserved.
* [ ] Tables are preserved.

---

# Phase 10 — Add Human Tone Modes

Add tone modes:

```text
Natural
Academic
Simple
Visual
Exam Coach
Norwegian Teacher
Spanish Tutor
```

Tasks:

* [ ] Add tone mode type.

```ts
export type MentoraToneMode =
  | "natural"
  | "academic"
  | "simple"
  | "visual"
  | "exam_coach"
  | "norwegian_teacher"
  | "spanish_tutor";
```

* [ ] Add tone selector in UI.
* [ ] Store selected tone in user profile or localStorage.
* [ ] Pass tone mode to chat API.
* [ ] Use tone mode in prompt builder.
* [ ] Apply Stop Slop rules to all modes.
* [ ] Keep PDF citations unchanged.

Tone behavior:

```text
Natural:
Sounds human and warm.

Academic:
Structured, precise, professional.

Simple:
Short, clear, easy language.

Visual:
Uses diagrams, tables, bullets, and examples.

Exam Coach:
Focuses on memory, likely exam questions, and practice.

Norwegian Teacher:
Explains language, grammar, vocabulary, and examples.

Spanish Tutor:
Explains clearly in Spanish with natural tone.
```

Acceptance criteria:

* [ ] User can choose tone.
* [ ] Chat responds in selected tone.
* [ ] Tone does not affect factual grounding.
* [ ] Tone does not break citations.

---

# Phase 11 — Update Prompt Builder

Files:

```text
src/lib/ai/prompts.ts
src/app/api/chat/route.ts
```

Tasks:

* [ ] Add graph instructions to system prompt.
* [ ] Add Stop Slop style rules to system prompt.
* [ ] Add tone mode to prompt builder.
* [ ] Add instruction to avoid robotic AI phrases.
* [ ] Add instruction to prefer direct explanations.
* [ ] Add instruction to use graph tools only when needed.
* [ ] Add instruction to use Mermaid for visual maps.
* [ ] Add instruction to preserve citations.

Prompt rules:

```text
Answer like a human academic tutor.
Be direct and useful.
Avoid generic AI filler.
Avoid robotic phrases.
Do not announce what you are going to do unless necessary.
Use clear structure only when it helps.
Use examples when useful.
Use Mermaid diagrams when the user asks for visual maps or concept graphs.
Preserve citations exactly.
Do not invent document support.
If using graph context, explain how concepts connect.
```

Avoid phrases:

```text
Certainly
Sure, here is
In conclusion
It is important to note
As an AI
Let's dive into
Unlock the power
Delve into
In today's world
This comprehensive guide
```

Spanish avoid phrases:

```text
Claro, aquí tienes
Es importante destacar
En conclusión
Cabe mencionar
Como inteligencia artificial
Vamos a profundizar
En el mundo actual
Esta guía completa
```

Preferred style:

```text
Short opening.
Useful answer immediately.
Clear structure.
Human rhythm.
No filler.
No robotic transitions.
```

Acceptance criteria:

* [ ] Prompt builder supports graph context.
* [ ] Prompt builder supports tone mode.
* [ ] Prompt builder includes anti-slop rules.
* [ ] Output sounds more natural.
* [ ] Citations remain correct.

---

# Phase 12 — Add Optional Post-Processing Humanizer

Important:

```text
Post-processing must be safe.
It must never change citations, code, formulas, diagrams, or facts.
```

Tasks:

* [ ] Add `humanizeAnswer()` function.
* [ ] Detect protected blocks.
* [ ] Split answer into protected and editable segments.
* [ ] Apply simple cleanup only to editable text.
* [ ] Remove robotic phrases.
* [ ] Reduce redundant sentence starters.
* [ ] Reduce excessive transitions.
* [ ] Preserve markdown.
* [ ] Preserve citations.
* [ ] Preserve tables.
* [ ] Preserve diagrams.
* [ ] Preserve code blocks.
* [ ] Add tests.

Pseudo-flow:

```text
assistant answer
  -> parse protected blocks
  -> clean editable prose
  -> reassemble answer
  -> render in UI
```

Acceptance criteria:

* [ ] Humanizer improves prose.
* [ ] Humanizer does not damage Markdown.
* [ ] Humanizer does not damage citations.
* [ ] Humanizer does not damage Mermaid.
* [ ] Humanizer has tests.

---

# Phase 13 — Add Graph + Humanizer Metadata to Chat API

File:

```text
src/app/api/chat/route.ts
```

Add request fields:

```ts
tone: z.enum([
  "natural",
  "academic",
  "simple",
  "visual",
  "exam_coach",
  "norwegian_teacher",
  "spanish_tutor",
]).default("natural"),

useGraph: z.boolean().default(false),

humanize: z.boolean().default(true)
```

Tasks:

* [ ] Add `tone`.
* [ ] Add `useGraph`.
* [ ] Add `humanize`.
* [ ] Add metadata to stream events.
* [ ] Add metadata to usage logs.

Metadata example:

```json
{
  "tone": "natural",
  "useGraph": true,
  "humanize": true,
  "graphNodesUsed": 5,
  "graphEdgesUsed": 7,
  "styleScore": 42
}
```

Acceptance criteria:

* [ ] Chat API accepts tone.
* [ ] Chat API accepts graph mode.
* [ ] Chat API accepts humanize flag.
* [ ] Metadata is logged.
* [ ] Default behavior remains stable.

---

# Phase 14 — Add UI Controls

Create or update:

```text
src/components/chat/chat-settings.tsx
src/components/chat/tone-selector.tsx
src/components/chat/graph-toggle.tsx
src/components/chat/humanize-toggle.tsx
```

Tasks:

* [ ] Add tone selector.
* [ ] Add graph mode toggle.
* [ ] Add humanize toggle.
* [ ] Add small explanation tooltip for each.
* [ ] Save user preferences.
* [ ] Keep defaults simple:

  * [ ] Tone: Natural
  * [ ] Graph: Auto
  * [ ] Humanize: On

UI labels:

```text
Tone: Natural
Graph: Auto
Humanize: On
```

Spanish labels:

```text
Tono: Natural
Grafo: Automático
Humanizar: Activado
```

Acceptance criteria:

* [ ] User can choose tone.
* [ ] User can enable graph intelligence.
* [ ] User can enable/disable humanized style.
* [ ] Settings persist after refresh.
* [ ] UI does not feel overloaded.

---

# Phase 15 — Add Graph-Based Student Features

Features:

* [ ] “Create concept map from this PDF.”
* [ ] “Show related concepts.”
* [ ] “What should I study first?”
* [ ] “Generate learning path.”
* [ ] “Find weak areas.”
* [ ] “Explain this node.”
* [ ] “Make a diagram.”
* [ ] “Compare these concepts.”

Tasks:

* [ ] Add quick action buttons.
* [ ] Connect quick actions to graph tools.
* [ ] Show graph result as Mermaid first.
* [ ] Show interactive graph later.
* [ ] Store generated study paths as artifacts.
* [ ] Store generated diagrams as artifacts.

Acceptance criteria:

* [ ] Student can ask for concept map.
* [ ] Student can ask for related topics.
* [ ] Student can generate a study path.
* [ ] Student can inspect graph-based explanations.

---

# Phase 16 — Add Tests for Stop Slop Layer

Create tests:

```text
src/lib/ai/style/humanize-answer.test.ts
src/lib/ai/style/answer-quality-score.test.ts
```

Test cases:

* [ ] Removes “Certainly, here is”.
* [ ] Removes “It is important to note”.
* [ ] Removes robotic opening phrases.
* [ ] Preserves citations.
* [ ] Preserves code blocks.
* [ ] Preserves Mermaid diagrams.
* [ ] Preserves tables.
* [ ] Preserves Spanish answers.
* [ ] Preserves Norwegian examples.
* [ ] Does not change facts.

Example:

```text
Input:
Certainly, here is a comprehensive guide to photosynthesis.

Output:
Photosynthesis is how plants convert light into energy.
```

Acceptance criteria:

* [ ] Tests pass.
* [ ] Humanizer is safe.
* [ ] Protected content remains unchanged.

---

# Phase 17 — Add Tests for Graph Layer

Create tests:

```text
src/lib/graph/build-document-graph.test.ts
src/lib/graph/graph-to-mermaid.test.ts
src/lib/graph/graph-search.test.ts
```

Test cases:

* [ ] Build graph from sample chunks.
* [ ] Create concept nodes.
* [ ] Create relationship edges.
* [ ] Export Mermaid.
* [ ] Search graph by concept.
* [ ] Handle empty document.
* [ ] Handle duplicate concepts.
* [ ] Handle large graph safely.

Acceptance criteria:

* [ ] Graph tests pass.
* [ ] Graph generation is stable.
* [ ] Mermaid export works.
* [ ] Large graphs do not crash.

---

# Phase 18 — Performance and Safety Rules

Important:

```text
Graph intelligence must not make chat slow.
Humanizer must not make chat slow.
```

Tasks:

* [ ] Measure graph generation time.
* [ ] Measure graph search time.
* [ ] Measure humanizer time.
* [ ] Add timeout to graph generation.
* [ ] Add timeout to graph search.
* [ ] Add maximum graph nodes per document.
* [ ] Add maximum graph edges per document.
* [ ] Add maximum graph context passed to model.

Recommended limits:

```text
Max graph nodes per document: 150
Max graph edges per document: 300
Max graph nodes used in one chat answer: 10
Max graph edges used in one chat answer: 20
Graph search timeout: 2 seconds
Humanizer timeout: 500 ms
```

Acceptance criteria:

* [ ] Chat remains fast.
* [ ] Graph mode does not freeze UI.
* [ ] Humanizer does not delay streaming significantly.
* [ ] Limits prevent overload.

---

# Phase 19 — Update Documentation

Create or update:

```text
docs/graph-intelligence.md
docs/human-writing-layer.md
docs/codex-skills.md
README.md
```

Tasks:

* [ ] Document Understand Anything reference.
* [ ] Document Stop Slop reference.
* [ ] Document graph architecture.
* [ ] Document humanizer safety rules.
* [ ] Document tone modes.
* [ ] Document graph UI.
* [ ] Document how to run tests.
* [ ] Document performance limits.

README addition:

```markdown
## Smart Chat Skills

Mentora includes two smart chat layers:

1. Graph Intelligence
   Generates and searches concept graphs from uploaded documents, summaries, citations, and learning artifacts.

2. Human Writing Layer
   Reduces robotic AI tone and makes answers more natural, direct, and student-friendly while preserving citations and factual content.
```

Acceptance criteria:

* [ ] Documentation exists.
* [ ] Future contributors understand the new skills.
* [ ] Codex can continue development without confusion.

---

# Phase 20 — QA Checklist

Run:

```bash
npm run lint
npm run typecheck
npm run build
npm run qa:study-content
npm run qa:responsive
```

Manual tests:

* [ ] Ask a normal question without graph.
* [ ] Ask for a concept map.
* [ ] Ask for related concepts.
* [ ] Ask for a study path.
* [ ] Ask for a PDF summary.
* [ ] Ask for a diagram.
* [ ] Ask in Spanish.
* [ ] Ask in English.
* [ ] Ask in Norwegian if supported.
* [ ] Toggle humanize off.
* [ ] Toggle humanize on.
* [ ] Compare tone before and after.
* [ ] Confirm citations are preserved.
* [ ] Confirm Mermaid diagrams are preserved.
* [ ] Confirm code blocks are preserved.
* [ ] Confirm no robotic AI phrases remain.

Acceptance criteria:

* [ ] QA commands pass.
* [ ] Graph mode works.
* [ ] Humanized style works.
* [ ] Chat remains fast.
* [ ] No citations break.
* [ ] No diagrams break.
* [ ] No PDF chat regression.

---

# Phase 21 — Commit and Pull Request

* [ ] Review changes.

```bash
git status
```

* [ ] Stage changes.

```bash
git add .
```

* [ ] Commit.

```bash
git commit -m "feat: add graph intelligence and human writing layer"
```

* [ ] Push branch.

```bash
git push -u origin carlos/add-smart-chat-skills-graph-humanizer
```

* [ ] Open pull request.

PR title:

```text
feat: add graph intelligence and human writing layer
```

PR description:

```markdown
## Summary

This PR adds two smart chat layers to Mentora:

1. Graph Intelligence Layer
   Inspired by Understand Anything.
   Adds document concept graphs, graph search, graph-to-Mermaid export, and graph-aware chat tools.

2. Human Writing Layer
   Inspired by Stop Slop.
   Reduces robotic AI tone and improves answer clarity while preserving facts, citations, code, tables, and diagrams.

## References

- https://github.com/Egonex-AI/Understand-Anything
- https://github.com/hardikpandya/stop-slop
- https://github.com/google-labs-code/design.md
- https://www.skills.sh/anthropics/skills/frontend-design

## Tests

- [ ] npm run lint
- [ ] npm run typecheck
- [ ] npm run build
- [ ] npm run qa:study-content
- [ ] npm run qa:responsive
- [ ] Graph generation tested
- [ ] Graph search tested
- [ ] Graph-to-Mermaid tested
- [ ] Humanizer tested
- [ ] Citations preserved
- [ ] Code blocks preserved
- [ ] Mermaid diagrams preserved
- [ ] Spanish answers tested
- [ ] Chat speed tested
```

---

# Final Acceptance Criteria

* [ ] Understand Anything reference was inspected before implementation.
* [ ] Stop Slop reference was inspected before implementation.
* [ ] Mentora has a graph intelligence architecture.
* [ ] Supabase graph tables exist.
* [ ] PDF chunks can generate graph nodes.
* [ ] Graph edges represent relationships between concepts.
* [ ] Chat can search graph context.
* [ ] Chat can generate concept maps.
* [ ] Chat can generate study paths.
* [ ] Graph data does not slow normal chat.
* [ ] Stop Slop-inspired rules are added.
* [ ] Chat answers sound less robotic.
* [ ] Humanizer preserves citations.
* [ ] Humanizer preserves code.
* [ ] Humanizer preserves Mermaid.
* [ ] Humanizer preserves tables.
* [ ] Tone modes work.
* [ ] UI controls exist for tone, graph, and humanize.
* [ ] All tests pass.
* [ ] Build passes.

```
```

[1]: https://github.com/Egonex-AI/Understand-Anything "GitHub - Egonex-AI/Understand-Anything: Graphs that teach > graphs that impress. Turn any code into an interactive knowledge graph you can explore, search, and ask questions about. Works with Claude Code, Codex, Cursor, Copilot, Gemini CLI, and more. · GitHub"
[2]: https://github.com/hardikpandya/stop-slop "GitHub - hardikpandya/stop-slop: A skill file for removing AI tells from prose · GitHub"
