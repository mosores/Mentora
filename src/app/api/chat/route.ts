import { z } from "zod";
import { generateGroundedText, streamGroundedText } from "@/lib/ai/gateway";
import { isFreeOpenRouterModel } from "@/lib/ai/models";
import { buildGeneralTutorPrompt, buildGroundedPrompt, generalTutorSystemPrompt, tutorSystemPrompt } from "@/lib/ai/prompts";
import { retrieveCitations } from "@/lib/rag/search";
import { getAuthedProfile } from "@/lib/supabase/service";
import {
  errorResponse,
  jsonError,
  parseJsonBody,
  rateLimit,
  rateLimitKey,
  requireOwnedStudySpace,
  safeErrorMessage,
  streamHeaders,
} from "@/app/api/_shared/security";

export const runtime = "nodejs";

const chatSchema = z.object({
  studySpaceId: z.string().uuid(),
  message: z.string().trim().min(1).max(4000),
  locale: z.enum(["es", "en"]).default("es"),
  model: z.string().trim().min(1).max(160).optional(),
  openRouterApiKey: z.string().trim().min(20).max(512).optional(),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const { profile, service } = await getAuthedProfile(request.headers.get("authorization"));
    const body = await parseJsonBody(request, chatSchema);
    const limit = rateLimit(rateLimitKey(request, profile.id, "chat"), 30);
    if (!limit.ok) {
      return jsonError("Too many chat requests. Please wait a minute and try again.", 429);
    }

    if (body.model && !(await isFreeOpenRouterModel(body.model)) && !body.openRouterApiKey) {
      return jsonError("Paid models require the student to connect their own OpenRouter account. Mentora only provides access to free models.", 402);
    }

    const encoder = new TextEncoder();

    function encodeEvent(event: string, data: unknown) {
      return encoder.encode(`${JSON.stringify({ event, data })}\n`);
    }

    await requireOwnedStudySpace(service, profile, body.studySpaceId);

    const citations = await retrieveCitations({
      service,
      tenantId: profile.tenant_id,
      studySpaceId: body.studySpaceId,
      query: body.message,
    });

    const isGeneralChat = citations.length === 0;

    const { data: conversation, error: conversationError } = await service
    .from("conversations")
    .insert({
      tenant_id: profile.tenant_id,
      study_space_id: body.studySpaceId,
      user_id: profile.id,
      title: body.message.slice(0, 90),
    })
    .select("id")
    .single();

  if (conversationError || !conversation) {
    throw conversationError ?? new Error("Unable to create conversation.");
  }

  const { error: userMessageError } = await service.from("messages").insert({
    tenant_id: profile.tenant_id,
    conversation_id: conversation.id,
    user_id: profile.id,
    role: "user",
    content: body.message,
  });

  if (userMessageError) {
    throw userMessageError;
  }

  const aiRequest = {
    task: "tutor_chat",
    priority: "cost",
    system: isGeneralChat ? generalTutorSystemPrompt : tutorSystemPrompt,
    prompt: isGeneralChat
      ? buildGeneralTutorPrompt(body.message, body.locale, profile.learning_profile)
      : buildGroundedPrompt(body.message, citations, body.locale, profile.learning_profile),
    model: body.model,
    openRouterApiKey: body.openRouterApiKey,
  } as const;

  const aiStream = await streamGroundedText(aiRequest);

  return new Response(
    new ReadableStream({
      async start(controller) {
        let answer = "";

        try {
          controller.enqueue(
            encodeEvent("meta", {
              conversationId: conversation.id,
              citations,
              provider: aiStream.provider,
              model: aiStream.model,
            }),
          );

          for await (const delta of aiStream.textStream) {
            answer += delta;
            controller.enqueue(encodeEvent("delta", delta));
          }

          if (!answer.trim()) {
            throw new Error("No output generated. Check the stream for errors.");
          }

          const { data: assistantMessage, error: messageError } = await service
            .from("messages")
            .insert({
              tenant_id: profile.tenant_id,
              conversation_id: conversation.id,
              user_id: profile.id,
              role: "assistant",
              content: answer,
              citations,
            })
            .select("id")
            .single();

          if (messageError) {
            throw messageError;
          }

          const usage = await aiStream.getUsage();
          await service.from("ai_usage_logs").insert({
            tenant_id: profile.tenant_id,
            user_id: profile.id,
            task: "tutor_chat",
            provider: aiStream.provider,
            model: aiStream.model,
            input_tokens: usage.inputTokens,
            output_tokens: usage.outputTokens,
            latency_ms: usage.latencyMs,
            status: "success",
            metadata: { route_latency_ms: Date.now() - startedAt },
          });

          controller.enqueue(
            encodeEvent("done", {
              conversationId: conversation.id,
              messageId: assistantMessage?.id,
              answer,
              citations,
              provider: aiStream.provider,
              model: aiStream.model,
            }),
          );
          controller.close();
        } catch (error) {
          const streamErrorMessage = safeErrorMessage(error, "Unknown chat streaming error.");
          await service.from("ai_usage_logs").insert({
            tenant_id: profile.tenant_id,
            user_id: profile.id,
            task: "tutor_chat",
            provider: aiStream.provider,
            model: aiStream.model,
            latency_ms: Date.now() - startedAt,
            status: "error",
            error_message: streamErrorMessage,
          });

          try {
            const fallback = await generateGroundedText({
              ...aiRequest,
              model: body.model ? "openrouter/free" : aiRequest.model,
              openRouterApiKey: undefined,
            });
            const fallbackAnswer = fallback.text.trim();

            if (!fallbackAnswer) {
              throw new Error("Fallback model returned an empty answer.");
            }

            const { data: assistantMessage, error: messageError } = await service
              .from("messages")
              .insert({
                tenant_id: profile.tenant_id,
                conversation_id: conversation.id,
                user_id: profile.id,
                role: "assistant",
                content: fallbackAnswer,
                citations,
              })
              .select("id")
              .single();

            if (messageError) {
              throw messageError;
            }

            await service.from("ai_usage_logs").insert({
              tenant_id: profile.tenant_id,
              user_id: profile.id,
              task: "tutor_chat",
              provider: fallback.provider,
              model: fallback.model,
              input_tokens: fallback.inputTokens,
              output_tokens: fallback.outputTokens,
              latency_ms: fallback.latencyMs,
              status: "success",
              metadata: {
                route_latency_ms: Date.now() - startedAt,
                fallback_from: aiStream.model,
                fallback_reason: streamErrorMessage,
              },
            });

            controller.enqueue(
              encodeEvent("done", {
                conversationId: conversation.id,
                messageId: assistantMessage?.id,
                answer: fallbackAnswer,
                citations,
                provider: fallback.provider,
                model: fallback.model,
                fallbackFrom: aiStream.model,
              }),
            );
          } catch (fallbackError) {
            const answer =
              body.locale === "es"
                ? "Estoy teniendo problemas para obtener una respuesta completa del modelo seleccionado. El documento si esta procesado; intenta de nuevo o cambia al modelo gratuito por defecto."
                : "I am having trouble getting a complete answer from the selected model. The document is processed; try again or switch to the default free model.";

            await service.from("ai_usage_logs").insert({
              tenant_id: profile.tenant_id,
              user_id: profile.id,
              task: "tutor_chat",
              provider: aiStream.provider,
              model: aiStream.model,
              latency_ms: Date.now() - startedAt,
              status: "error",
              error_message: safeErrorMessage(fallbackError, "Tutor fallback failed."),
              metadata: { original_error: streamErrorMessage },
            });

            controller.enqueue(encodeEvent("error", { error: "Tutor request failed.", answer, citations }));
          }
          controller.close();
        }
      },
    }),
    { headers: streamHeaders("application/x-ndjson; charset=utf-8") },
  );
  } catch (error) {
    return errorResponse(error, "Unable to start tutor request.");
  }
}
