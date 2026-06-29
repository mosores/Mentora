import { z } from "zod";
import { generateGroundedText } from "@/lib/ai/gateway";
import { isFreeOpenRouterModel } from "@/lib/ai/models";
import { buildToolPrompt, tutorSystemPrompt } from "@/lib/ai/prompts";
import { retrieveCitations } from "@/lib/rag/search";
import { getAuthedProfile } from "@/lib/supabase/service";
import type { Citation, GeneratedArtifact, LearningProfile } from "@/lib/types";
import {
  errorResponse,
  jsonError,
  jsonResponse,
  parseJsonBody,
  rateLimit,
  rateLimitKey,
  requireOwnedStudySpace,
  safeErrorMessage,
} from "@/app/api/_shared/security";

export const runtime = "nodejs";

const toolSchema = z.object({
  studySpaceId: z.string().uuid(),
  kind: z.enum(["summary", "quiz", "flashcards", "apa_summary", "mind_map", "data_table", "study_guide", "diagram", "infographic"]),
  locale: z.enum(["es", "en"]).default("es"),
  model: z.string().trim().min(1).max(160).optional(),
  openRouterApiKey: z.string().trim().min(20).max(512).optional(),
  selectedDocumentIds: z.array(z.string().uuid()).max(20).default([]),
});

const titles = {
  es: {
    summary: "Resumen generado",
    quiz: "Quiz generado",
    flashcards: "Flashcards generadas",
    apa_summary: "Resumen APA",
    mind_map: "Mapa mental",
    data_table: "Tabla de datos",
    study_guide: "Guia de estudio",
    diagram: "Diagrama generado",
    infographic: "Infografia generada",
  },
  en: {
    summary: "Generated summary",
    quiz: "Generated quiz",
    flashcards: "Generated flashcards",
    apa_summary: "APA summary",
    mind_map: "Mind map",
    data_table: "Data table",
    study_guide: "Study guide",
    diagram: "Generated diagram",
    infographic: "Generated infographic",
  },
};

type ToolKind = z.infer<typeof toolSchema>["kind"];

export async function POST(request: Request) {
  const startedAt = Date.now();
  let usageContext:
    | {
        service: Awaited<ReturnType<typeof getAuthedProfile>>["service"];
        profile: Awaited<ReturnType<typeof getAuthedProfile>>["profile"];
        task: z.infer<typeof toolSchema>["kind"];
        provider: string;
        model: string;
      }
    | null = null;

  try {
    const { profile, service } = await getAuthedProfile(request.headers.get("authorization"));
    const body = await parseJsonBody(request, toolSchema);
    const limit = rateLimit(rateLimitKey(request, profile.id, "tools"), 20);
    if (!limit.ok) {
      return jsonError("Too many generation requests. Please wait a minute and try again.", 429);
    }

    if (body.model && !(await isFreeOpenRouterModel(body.model)) && !body.openRouterApiKey) {
      return jsonError("Paid models require the student to connect their own OpenRouter account. Mentora only provides access to free models.", 402);
    }

    await requireOwnedStudySpace(service, profile, body.studySpaceId);

    let provider = "unknown";
    let model = "unknown";
    usageContext = { service, profile, task: body.kind, provider, model };

    const citations = await retrieveCitations({
      service,
      tenantId: profile.tenant_id,
      studySpaceId: body.studySpaceId,
      query: `Generate ${body.kind} from the most important concepts in this study space.`,
      limit: 12,
      selectedDocumentIds: body.selectedDocumentIds,
    });

    if (citations.length === 0) {
      return jsonError("No ready source chunks found. Wait for processing or upload another readable source.", 409);
    }

    const aiResult = await generateToolTextWithFallback({
      kind: body.kind,
      citations,
      locale: body.locale,
      learningProfile: profile.learning_profile,
      model: body.model,
      openRouterApiKey: body.openRouterApiKey,
    });
    provider = aiResult.provider;
    model = aiResult.model;
    usageContext = { service, profile, task: body.kind, provider, model };

    const title = titles[body.locale][body.kind];
    const artifact = await insertGeneratedArtifact({
      service,
      tenantId: profile.tenant_id,
      userId: profile.id,
      studySpaceId: body.studySpaceId,
      kind: body.kind,
      title,
      content: aiResult.text,
      citations,
    });

    await service.from("ai_usage_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: profile.id,
      task: body.kind,
      provider: aiResult.provider,
      model: aiResult.model,
      input_tokens: aiResult.inputTokens,
      output_tokens: aiResult.outputTokens,
      latency_ms: aiResult.latencyMs,
      status: "success",
      metadata: { route_latency_ms: Date.now() - startedAt, selected_document_count: body.selectedDocumentIds.length },
    });

    return jsonResponse({ artifact, provider: aiResult.provider, model: aiResult.model });
  } catch (error) {
    if (usageContext) {
      await usageContext.service.from("ai_usage_logs").insert({
        tenant_id: usageContext.profile.tenant_id,
        user_id: usageContext.profile.id,
        task: usageContext.task,
        provider: usageContext.provider,
        model: usageContext.model,
        latency_ms: Date.now() - startedAt,
        status: "error",
        error_message: safeErrorMessage(error, "Unknown study tool error."),
      });
    }

    return errorResponse(error, "Unable to generate study tool.");
  }
}

async function insertGeneratedArtifact({
  citations,
  content,
  kind,
  service,
  studySpaceId,
  tenantId,
  title,
  userId,
}: {
  service: Awaited<ReturnType<typeof getAuthedProfile>>["service"];
  tenantId: string;
  userId: string;
  studySpaceId: string;
  kind: ToolKind;
  title: string;
  content: string;
  citations: Citation[];
}) {
  const basePayload = {
    tenant_id: tenantId,
    user_id: userId,
    study_space_id: studySpaceId,
    title,
    content,
    citations,
  };
  const { data: artifact, error } = await service
    .from("generated_artifacts")
    .insert({
      ...basePayload,
      kind,
    })
    .select("id, study_space_id, kind, title, content, citations, created_at")
    .single<GeneratedArtifact>();

  if (!error && artifact) {
    return artifact;
  }

  if (!isLegacyArtifactKindConstraint(error)) {
    throw error ?? new Error("Unable to save generated artifact.");
  }

  const legacyKind = legacyArtifactKind(kind);
  const { data: legacyArtifact, error: legacyError } = await service
    .from("generated_artifacts")
    .insert({
      ...basePayload,
      kind: legacyKind,
    })
    .select("id, study_space_id, kind, title, content, citations, created_at")
    .single<GeneratedArtifact>();

  if (legacyError || !legacyArtifact) {
    throw legacyError ?? new Error("Unable to save generated artifact.");
  }

  return {
    ...legacyArtifact,
    kind,
  };
}

function isLegacyArtifactKindConstraint(error: unknown) {
  const code = String((error as { code?: unknown } | null)?.code ?? "");
  const message = String((error as { message?: unknown } | null)?.message ?? "").toLowerCase();
  return code === "23514" && message.includes("generated_artifacts_kind_check");
}

function legacyArtifactKind(kind: ToolKind) {
  if (kind === "quiz" || kind === "flashcards" || kind === "apa_summary") {
    return kind;
  }

  return "apa_summary";
}

async function generateToolTextWithFallback({
  citations,
  kind,
  learningProfile,
  locale,
  model,
  openRouterApiKey,
}: {
  citations: Citation[];
  kind: ToolKind;
  learningProfile: LearningProfile;
  locale: "es" | "en";
  model?: string;
  openRouterApiKey?: string;
}) {
  const startedAt = Date.now();
  try {
    return await generateGroundedText({
      task: kind,
      priority: kind === "apa_summary" ? "quality" : "cost",
      system: tutorSystemPrompt,
      prompt: buildToolPrompt(kind, citations, locale, learningProfile),
      model,
      openRouterApiKey,
    });
  } catch (error) {
    console.warn("[Mentora] Studio AI generation failed. Using local citation fallback.", error);
    return {
      text: buildLocalToolFallback(kind, citations, locale),
      provider: "local",
      model: "citation-fallback",
      inputTokens: null,
      outputTokens: null,
      latencyMs: Date.now() - startedAt,
    };
  }
}

function buildLocalToolFallback(kind: ToolKind, citations: Citation[], locale: "es" | "en") {
  const sourceRows = citations.slice(0, 10).map((citation, index) => ({
    index: index + 1,
    source: citation.fileName || "Source",
    page: citation.pageNumber ? String(citation.pageNumber) : "n/a",
    excerpt: cleanExcerpt(citation.content),
  }));

  if (kind === "data_table") {
    const title = locale === "es" ? "## Tabla de datos" : "## Data table";
    const header = "| # | Source | Page | Key evidence |\n|---:|---|---:|---|";
    const rows = sourceRows.map((row) => `| ${row.index} | ${escapeTableCell(row.source)} | ${row.page} | ${escapeTableCell(row.excerpt)} |`);
    return [title, header, ...rows].join("\n");
  }

  if (kind === "quiz") {
    const title = locale === "es" ? "## Quiz de practica" : "## Practice quiz";
    const questions = sourceRows.slice(0, 6).map((row) => {
      const question = locale === "es"
        ? `Explica la idea principal de la fuente ${row.index}.`
        : `Explain the main idea from source ${row.index}.`;
      return `### ${row.index}. ${question}\n- A. ${row.excerpt}\n- B. It is unrelated to the provided material.\n- C. It contradicts the cited source.\n- D. The source does not discuss this topic.\n\n**Answer:** A\n\n**Source:** ${row.source}${row.page !== "n/a" ? `, p. ${row.page}` : ""}`;
    });
    return [title, ...questions].join("\n\n");
  }

  if (kind === "flashcards") {
    return sourceRows.slice(0, 8).map((row) => (
      `CARD ${row.index}\nFront: ${locale === "es" ? "Que debes recordar de esta fuente?" : "What should you remember from this source?"}\nBack: ${row.excerpt}\nSource: ${row.source}${row.page !== "n/a" ? `, p. ${row.page}` : ""}`
    )).join("\n\n");
  }

  if (kind === "mind_map" || kind === "diagram") {
    const nodes = sourceRows.slice(0, 8).map((row) => `  A --> S${row.index}["${escapeMermaidLabel(row.excerpt)}"]`);
    return ["```mermaid", "graph TD", `  A["${kind === "mind_map" ? "Mind Map" : "Diagram"}"]`, ...nodes, "```"].join("\n");
  }

  const heading = {
    apa_summary: locale === "es" ? "## Resumen APA" : "## APA summary",
    infographic: locale === "es" ? "## Infografia" : "## Infographic",
    study_guide: locale === "es" ? "## Guia de estudio" : "## Study guide",
    summary: locale === "es" ? "## Resumen" : "## Summary",
  }[kind] ?? "## Study output";

  const bullets = sourceRows.map((row) => `- **${row.source}${row.page !== "n/a" ? `, p. ${row.page}` : ""}:** ${row.excerpt}`);
  return [heading, locale === "es" ? "Generado desde las fuentes disponibles:" : "Generated from the available sources:", ...bullets].join("\n");
}

function cleanExcerpt(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 220) || "No readable excerpt.";
}

function escapeTableCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function escapeMermaidLabel(value: string) {
  return value.replace(/"/g, "'").replace(/[{}[\]]/g, "").slice(0, 80);
}
