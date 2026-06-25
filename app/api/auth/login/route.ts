import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { publicUser, readDb } from "@/lib/data";

const loginSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(6).max(200)
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const db = await readDb();
    const user = db.users.find((candidate) => candidate.email.toLowerCase() === payload.email.toLowerCase());

    if (!user || !(await verifyPassword(payload.password, user))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json({ error: "This account is suspended" }, { status: 403 });
    }

    const token = await createSession(user.id);
    const response = NextResponse.json({ user: publicUser(user) });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
