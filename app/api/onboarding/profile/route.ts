import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, readJson, requestPayloadErrorResponse } from "@/lib/security/api";
import { saveLearningProfile, getLearningProfile } from "@/lib/server/store";

export const runtime = "nodejs";

const profileSchema = z.object({
  goals: z.array(z.string()).max(20).optional(),
  formats: z.array(z.string()).max(20).optional(),
  sessionDuration: z.number().int().min(5).max(180).optional(),
  pomodoroStyle: z.string().max(60).optional(),
  habits: z.array(z.string()).max(30).optional()
});

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) {
    return user;
  }

  const profile = await getLearningProfile(user.id);
  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) {
    return user;
  }

  let parsed: unknown;
  try {
    parsed = await readJson(request);
  } catch (err) {
    return requestPayloadErrorResponse(err);
  }

  const validation = profileSchema.safeParse(parsed);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid learning profile.", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const profile = await saveLearningProfile(user.id, {
    goals: validation.data.goals ?? [],
    formats: validation.data.formats ?? [],
    sessionDuration: validation.data.sessionDuration ?? 25,
    pomodoroStyle: validation.data.pomodoroStyle ?? "balanced",
    habits: validation.data.habits ?? []
  });
  return NextResponse.json({ profile });
}

