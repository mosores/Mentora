import { NextResponse } from "next/server";
import { z } from "zod";
import { modelRouter } from "@/lib/ai/model-router";
import { screenAcademicIntegrityRequest } from "@/lib/security/academic-integrity";
import { boundedTextSchema, idSchema, readJson, requestPayloadErrorResponse, requireUser } from "@/lib/security/api";
import { addChatMessagesForUser, addUsageEvent, getStudySpace } from "@/lib/server/store";
import { answerFromContext, retrieveContext } from "@/lib/study/generate";

export const runtime = "nodejs";

const chatSchema = z.object({
  message: boundedTextSchema(1, 4000),
  language: z.enum(["en", "es"]).default("es"),
  studySpaceId: idSchema,
  mode: z.enum(["fast", "deep", "low_cost", "source_strict"]).default("source_strict"),
  selectedModel: z.string().trim().regex(/^[A-Za-z0-9._:/-]{1,180}$/).optional()
});

export async function POST(request: Request) {
  const user = await requireUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  let payload: unknown;

  try {
    payload = await readJson(request);
  } catch (error) {
    return requestPayloadErrorResponse(error);
  }

  const body = chatSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const integrity = screenAcademicIntegrityRequest(body.data.message);

  if (!integrity.allowed) {
    return NextResponse.json({ answer: integrity.redirect, blocked: true });
  }

  const studySpace = await getStudySpace(body.data.studySpaceId, user);

  if (!studySpace) {
    return NextResponse.json({ error: "Study space not found." }, { status: 404 });
  }

  const chunks =
    studySpace.documents.flatMap((document) =>
      document.chunks.map((chunk) => ({
        content: chunk.content,
        documentName: document.name
      }))
    );
  const retrieved = retrieveContext(body.data.message, chunks);
  const context = retrieved.map((item) => item.content);
  const result = await modelRouter.generateText({
    taskType: body.data.mode === "deep" ? "tutor_chat_deep" : "tutor_chat_basic",
    prompt: body.data.message,
    language: body.data.language,
    mode: body.data.mode,
    context,
    requestedModel: body.data.selectedModel
  });

  let answer = result.text;
  if (result.provider === "mock" && retrieved.length > 0) {
    answer = answerFromContext(body.data.message, retrieved, body.data.language);
  } else if (result.provider === "mock" && retrieved.length === 0) {
    answer =
      body.data.language === "es"
        ? "No encontre contenido relacionado en tus materiales subidos. Sube apuntes sobre este tema o pregunta por un concepto que este en tus documentos."
        : "I could not find related content in your uploaded materials. Upload notes about this topic or ask about a concept that appears in your documents.";
  }

  const savedMessages = await addChatMessagesForUser([
    {
      id: crypto.randomUUID(),
      studySpaceId: studySpace.id,
      role: "user",
      content: body.data.message,
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      studySpaceId: studySpace.id,
      role: "assistant",
      content: answer,
      citations: retrieved.map((item) => item.documentName ?? "Source"),
      model: result.model,
      createdAt: new Date().toISOString()
    }
  ], user);

  if (!savedMessages) {
    return NextResponse.json({ error: "Study space not found." }, { status: 404 });
  }

  await addUsageEvent({
    eventType: "tutor_question_asked",
    userId: user.id,
    studySpaceId: studySpace.id,
    provider: result.provider,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    estimatedCost: result.estimatedCost,
    retrievedChunks: retrieved.length
  });

  return NextResponse.json({
    answer,
    provider: result.provider,
    model: result.model,
    citations: retrieved.map((item) => item.documentName ?? "Uploaded source"),
    usage: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost
    }
  });
}
