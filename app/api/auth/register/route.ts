import { NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/server/store";
import { attachSessionCookie, readJson, requestPayloadErrorResponse } from "@/lib/security/api";

export const runtime = "nodejs";

const registerSchema = z.object({
  email: z.string().trim().email().max(160),
  name: z.string().trim().min(2).max(100).optional()
});

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await readJson(request, 8 * 1024);
  } catch (error) {
    return requestPayloadErrorResponse(error);
  }

  const body = registerSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  // Register (loginUser creates the user if they don't exist yet)
  const session = await loginUser(body.data.email);

  if (!session) {
    return NextResponse.json({ error: "This user is disabled." }, { status: 403 });
  }

  // If user is new and custom name is provided, update it
  if (body.data.name) {
    try {
      const { getDb, saveDb } = await import("@/lib/server/store");
      const db = await getDb();
      const dbUser = db.users.find(u => u.id === session.user.id);
      if (dbUser) {
        dbUser.name = body.data.name.trim();
        await saveDb(db);
        session.user.name = dbUser.name;
      }
    } catch (e) {
      console.error("Failed to update registered user name:", e);
    }
  }

  return attachSessionCookie(NextResponse.json(session), session.token, session.expiresAt);
}
