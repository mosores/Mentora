import { NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/server/store";
import { attachSessionCookie, readJson, requestPayloadErrorResponse } from "@/lib/security/api";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().email().max(160)
});

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await readJson(request, 8 * 1024);
  } catch (error) {
    return requestPayloadErrorResponse(error);
  }

  const body = loginSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const session = await loginUser(body.data.email);

  if (!session) {
    return NextResponse.json({ error: "This user is disabled." }, { status: 403 });
  }

  return attachSessionCookie(NextResponse.json(session), session.token, session.expiresAt);
}
