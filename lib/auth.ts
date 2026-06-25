import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { createId, nowIso, publicUser, readDb, updateDb } from "@/lib/data";
import type { PublicUser, SessionRecord, UserRecord } from "@/lib/types";

export const SESSION_COOKIE = "mentora_session";
const sessionDays = 14;

export class AuthError extends Error {
  status: number;

  constructor(message = "Authentication required", status = 401) {
    super(message);
    this.status = status;
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiry() {
  return new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000).toISOString();
}

export async function verifyPassword(password: string, user: UserRecord) {
  return bcrypt.compare(password, user.passwordHash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const session: SessionRecord = {
    id: createId("session"),
    userId,
    tokenHash: hashToken(token),
    createdAt: nowIso(),
    expiresAt: sessionExpiry()
  };

  await updateDb((db) => {
    db.sessions.push(session);
  });

  return token;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionDays * 24 * 60 * 60,
    path: "/"
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  });
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);
  await updateDb((db) => {
    db.sessions = db.sessions.filter((session) => session.tokenHash !== tokenHash);
  });
}

export async function getCurrentSession(): Promise<{ user: PublicUser; record: UserRecord; session: SessionRecord } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const db = await readDb();
  const tokenHash = hashToken(token);
  const session = db.sessions.find((candidate) => candidate.tokenHash === tokenHash);

  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  const record = db.users.find((user) => user.id === session.userId);

  if (!record || record.status !== "active") {
    return null;
  }

  return { user: publicUser(record), record, session };
}

export async function requireUser() {
  const session = await getCurrentSession();

  if (!session) {
    throw new AuthError();
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireUser();

  if (session.user.role !== "admin") {
    throw new AuthError("Admin access required", 403);
  }

  return session;
}
