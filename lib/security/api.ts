import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserBySessionToken, type UserRecord } from "@/lib/server/store";

const sessionCookieName = "mentora_session";

export const idSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{1,80}$/);
export const boundedTextSchema = (min = 1, max = 50000) => z.string().trim().min(min).max(max);

export function badRequest(error = "Invalid request.") {
  return NextResponse.json({ error }, { status: 400 });
}

export async function readJson(request: Request, maxBytes = 64 * 1024) {
  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > maxBytes) {
    throw new RequestPayloadError("Request body is too large.", 413);
  }

  const text = await request.text();

  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new RequestPayloadError("Request body is too large.", 413);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestPayloadError("Malformed JSON.", 400);
  }
}

export class RequestPayloadError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function requestPayloadErrorResponse(error: unknown) {
  if (error instanceof RequestPayloadError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  throw error;
}

export function sanitizeFileName(name: string) {
  const baseName = name
    .split(/[\\/]/)
    .pop()
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();

  if (!baseName) {
    return "Uploaded material";
  }

  return baseName.slice(0, 120);
}

export function normalizePlainText(text: string, maxChars = 50000) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxChars);
}

export function getSessionToken(request: Request) {
  const auth = request.headers.get("authorization");

  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  return request.headers.get("x-mentora-session")?.trim() || readCookie(request.headers.get("cookie"), sessionCookieName);
}

export function attachSessionCookie(response: NextResponse, token: string, expiresAt: string) {
  response.cookies.set({
    name: sessionCookieName,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: sessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  return response;
}

export async function requireUser(request: Request): Promise<UserRecord | NextResponse> {
  const token = getSessionToken(request);

  if (!token) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const user = await findUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  return user;
}

export async function requireAdminUser(request: Request): Promise<UserRecord | NextResponse> {
  const user = await requireUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  return user;
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return "";
  }

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");

    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return "";
}
