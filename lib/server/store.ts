import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";
import type { GeneratedFlashcard, GeneratedQuizQuestion } from "@/lib/study/generate";

export type MentoraDocument = {
  id: string;
  studySpaceId: string;
  name: string;
  mimeType: string;
  status: "pending" | "processing" | "ready" | "failed";
  storageKey?: string;
  text: string;
  summary: string;
  chunks: Array<{ id: string; content: string; index: number; tokenEstimate: number }>;
  flashcards: GeneratedFlashcard[];
  quiz: GeneratedQuizQuestion[];
  createdAt: string;
  updatedAt: string;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  status: "active" | "disabled";
  createdAt: string;
  lastLoginAt?: string;
};

export type SessionRecord = {
  token?: string;
  tokenHash?: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type StudySpaceRecord = {
  id: string;
  ownerUserId: string;
  title: string;
  courseName: string;
  institution: string;
  language: "en" | "es";
  createdAt: string;
  updatedAt: string;
};

export type ChatRecord = {
  id: string;
  studySpaceId: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  model?: string;
  createdAt: string;
};

type MentoraDb = {
  users: UserRecord[];
  sessions: SessionRecord[];
  studySpaces: StudySpaceRecord[];
  documents: MentoraDocument[];
  chats: ChatRecord[];
  usageEvents: Array<Record<string, unknown>>;
  learningProfiles: LearningProfileRecord[];
};

export type LearningProfileRecord = {
  userId: string;
  goals: string[];
  formats: string[];
  sessionDuration: number;
  pomodoroStyle: string;
  habits: string[];
  updatedAt: string;
};

type StoredStudySpaceRecord = Omit<StudySpaceRecord, "ownerUserId"> & {
  ownerUserId?: string;
};

type StoredMentoraDb = Partial<Omit<MentoraDb, "studySpaces" | "users" | "sessions" | "learningProfiles">> & {
  users?: Array<Partial<UserRecord>>;
  sessions?: Array<Partial<SessionRecord>>;
  studySpaces?: StoredStudySpaceRecord[];
  learningProfiles?: LearningProfileRecord[];
};

const dataDir = path.join(process.cwd(), ".mentora-data");
const dbPath = path.join(dataDir, "mentora-db.json");

const defaultDb: MentoraDb = {
  users: [
    {
      id: "user-student-demo",
      name: "Mentora Student",
      email: "student@mentora.local",
      role: "student",
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: "user-admin-demo",
      name: "Mentora Admin",
      email: "admin@mentora.local",
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString()
    }
  ],
  sessions: [],
  studySpaces: [
    {
      id: "space-demo-biology",
      ownerUserId: "user-student-demo",
      title: "Biologia Celular",
      courseName: "BIO 204",
      institution: "UNMSM",
      language: "es",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  documents: [],
  chats: [],
  usageEvents: [],
  learningProfiles: []
};

export async function getDb() {
  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(dbPath, "utf8");
    const db = migrateDb(JSON.parse(raw) as StoredMentoraDb);
    await saveDb(db);
    return db;
  } catch {
    await saveDb(defaultDb);
    return structuredClone(defaultDb);
  }
}

export async function saveDb(db: MentoraDb) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

export async function findUserBySessionToken(token: string) {
  const db = await getDb();
  const now = Date.now();
  const tokenHash = hashSessionToken(token);
  const session = db.sessions.find((item) => isMatchingSession(item, token, tokenHash) && new Date(item.expiresAt).getTime() > now);

  if (!session) {
    return null;
  }

  const user = db.users.find((item) => item.id === session.userId && item.status === "active");
  return user ?? null;
}

export async function loginUser(email: string) {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();
  let user = db.users.find((item) => item.email.toLowerCase() === normalizedEmail);
  const now = new Date().toISOString();

  if (!user) {
    user = {
      id: crypto.randomUUID(),
      name: normalizedEmail.split("@")[0] || "Mentora Student",
      email: normalizedEmail,
      role: normalizedEmail.startsWith("admin") ? "admin" : "student",
      status: "active",
      createdAt: now
    };
    db.users.push(user);
  }

  if (user.status !== "active") {
    return null;
  }

  user.lastLoginAt = now;
  const token = createSessionToken();
  const session: SessionRecord = {
    tokenHash: hashSessionToken(token),
    userId: user.id,
    createdAt: now,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
  };
  db.sessions = db.sessions.filter((item) => new Date(item.expiresAt).getTime() > Date.now());
  db.sessions.push(session);
  await saveDb(db);

  return { user, token, expiresAt: session.expiresAt };
}

export async function logoutSession(token: string) {
  const db = await getDb();
  const tokenHash = hashSessionToken(token);
  db.sessions = db.sessions.filter((session) => !isMatchingSession(session, token, tokenHash));
  await saveDb(db);
}

export async function listUsers() {
  const db = await getDb();
  return db.users;
}

export async function updateUserByAdmin(
  userId: string,
  input: Partial<Pick<UserRecord, "role" | "status" | "name">>,
  actor: UserRecord
) {
  const db = await getDb();
  const target = db.users.find((user) => user.id === userId);

  if (!target) {
    return null;
  }

  if (target.id === actor.id && input.status === "disabled") {
    throw new Error("Admins cannot disable their own active session user.");
  }

  target.name = input.name?.trim() || target.name;
  target.role = input.role ?? target.role;
  target.status = input.status ?? target.status;
  await saveDb(db);
  return target;
}

export async function getAdminStats() {
  const db = await getDb();
  return {
    userCount: db.users.length,
    activeUserCount: db.users.filter((user) => user.status === "active").length,
    adminCount: db.users.filter((user) => user.role === "admin").length,
    studySpaceCount: db.studySpaces.length,
    documentCount: db.documents.length,
    chatTurnCount: db.chats.length,
    usageEventCount: db.usageEvents.length,
    activeCourseCount: new Set(db.studySpaces.map((space) => space.courseName).filter(Boolean)).size
  };
}

export async function listStudySpaces(user: UserRecord) {
  const db = await getDb();
  const spaces = db.studySpaces.filter((space) => space.ownerUserId === user.id);

  return spaces.map((space) => ({
    ...space,
    documents: db.documents.filter((document) => document.studySpaceId === space.id),
    chats: db.chats.filter((chat) => chat.studySpaceId === space.id)
  }));
}

export async function createStudySpace(input: Pick<StudySpaceRecord, "title" | "courseName" | "institution" | "language">, user: UserRecord) {
  const db = await getDb();
  const now = new Date().toISOString();
  const studySpace: StudySpaceRecord = {
    id: crypto.randomUUID(),
    ownerUserId: user.id,
    title: input.title,
    courseName: input.courseName,
    institution: input.institution,
    language: input.language,
    createdAt: now,
    updatedAt: now
  };

  db.studySpaces.unshift(studySpace);
  await saveDb(db);
  return studySpace;
}

export async function addDocumentForUser(document: MentoraDocument, user: UserRecord) {
  const db = await getDb();
  const studySpace = db.studySpaces.find((space) => space.id === document.studySpaceId && space.ownerUserId === user.id);

  if (!studySpace) {
    return null;
  }

  db.documents.unshift(document);
  await saveDb(db);
  return document;
}

export async function updateDocumentForUser(document: MentoraDocument, user: UserRecord) {
  const db = await getDb();
  const existing = db.documents.find((item) => item.id === document.id);
  const studySpace = existing
    ? db.studySpaces.find((space) => space.id === existing.studySpaceId && space.ownerUserId === user.id)
    : null;

  if (!existing || !studySpace || document.studySpaceId !== existing.studySpaceId) {
    return null;
  }

  db.documents = db.documents.map((item) => (item.id === document.id ? document : item));
  await saveDb(db);
  return document;
}

export async function deleteDocumentForUser(documentId: string, user: UserRecord) {
  const db = await getDb();
  const existing = db.documents.find((item) => item.id === documentId);
  const studySpace = existing
    ? db.studySpaces.find((space) => space.id === existing.studySpaceId && space.ownerUserId === user.id)
    : null;

  if (!existing || !studySpace) {
    return null;
  }

  db.documents = db.documents.filter((item) => item.id !== documentId);
  await saveDb(db);
  return existing;
}

export async function getStudySpace(id: string, user: UserRecord) {
  const db = await getDb();
  const studySpace = db.studySpaces.find((space) => space.id === id);

  if (!studySpace || studySpace.ownerUserId !== user.id) {
    return null;
  }

  return {
    ...studySpace,
    documents: db.documents.filter((document) => document.studySpaceId === id),
    chats: db.chats.filter((chat) => chat.studySpaceId === id)
  };
}

export async function addChatMessagesForUser(messages: ChatRecord[], user: UserRecord) {
  if (messages.length === 0) {
    return messages;
  }

  const db = await getDb();
  const studySpaceIds = new Set(messages.map((message) => message.studySpaceId));
  const ownsEverySpace = [...studySpaceIds].every((studySpaceId) =>
    db.studySpaces.some((space) => space.id === studySpaceId && space.ownerUserId === user.id)
  );

  if (!ownsEverySpace) {
    return null;
  }

  db.chats.push(...messages);
  await saveDb(db);
  return messages;
}

export async function addUsageEvent(event: Record<string, unknown>) {
  const db = await getDb();
  db.usageEvents.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...event });
  await saveDb(db);
}

function migrateDb(db: StoredMentoraDb): MentoraDb {
  const users = db.users?.length
    ? db.users.map((user, index) => normalizeUser(user, index))
    : structuredClone(defaultDb.users);
  const fallbackOwnerId = users.find((user) => user.role === "student")?.id ?? users[0]?.id ?? defaultDb.users[0].id;
  const next: MentoraDb = {
    users,
    sessions: (db.sessions ?? []).flatMap(normalizeSession),
    studySpaces: db.studySpaces?.length ? (db.studySpaces as StudySpaceRecord[]) : structuredClone(defaultDb.studySpaces),
    documents: db.documents ?? [],
    chats: db.chats ?? [],
    usageEvents: db.usageEvents ?? [],
    learningProfiles: db.learningProfiles ?? []
  };

  next.studySpaces = next.studySpaces.map((space) => ({
    ...space,
    ownerUserId: space.ownerUserId ?? fallbackOwnerId
  }));
  next.sessions = next.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());

  return next;
}

function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isMatchingSession(session: SessionRecord, token: string, tokenHash: string) {
  if (session.tokenHash && timingSafeStringEqual(session.tokenHash, tokenHash)) {
    return true;
  }

  return Boolean(session.token && timingSafeStringEqual(session.token, token));
}

function timingSafeStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeUser(user: Partial<UserRecord>, index: number): UserRecord {
  const email = user.email?.trim().toLowerCase() || `student-${index + 1}@mentora.local`;
  const now = new Date().toISOString();

  return {
    id: user.id || (email === "admin@mentora.local" ? "user-admin-demo" : `user-${createHash("sha1").update(email).digest("hex").slice(0, 12)}`),
    name: user.name?.trim() || email.split("@")[0] || "Mentora Student",
    email,
    role: user.role === "admin" ? "admin" : "student",
    status: user.status === "disabled" ? "disabled" : "active",
    createdAt: user.createdAt || now,
    lastLoginAt: user.lastLoginAt
  };
}

function normalizeSession(session: Partial<SessionRecord>): SessionRecord[] {
  if (!session.userId || !session.expiresAt || (!session.token && !session.tokenHash)) {
    return [];
  }

  return [
    {
      token: session.token,
      tokenHash: session.tokenHash ?? (session.token ? hashSessionToken(session.token) : undefined),
      userId: session.userId,
      createdAt: session.createdAt ?? new Date().toISOString(),
      expiresAt: session.expiresAt
    }
  ];
}

export async function saveLearningProfile(
  userId: string,
  profile: Omit<LearningProfileRecord, "userId" | "updatedAt">
): Promise<LearningProfileRecord> {
  const db = await getDb();
  const record: LearningProfileRecord = {
    userId,
    goals: profile.goals ?? [],
    formats: profile.formats ?? [],
    sessionDuration: profile.sessionDuration ?? 25,
    pomodoroStyle: profile.pomodoroStyle ?? "balanced",
    habits: profile.habits ?? [],
    updatedAt: new Date().toISOString()
  };

  const existingIdx = db.learningProfiles.findIndex((p) => p.userId === userId);
  if (existingIdx >= 0) {
    db.learningProfiles[existingIdx] = record;
  } else {
    db.learningProfiles.push(record);
  }
  await saveDb(db);
  return record;
}

export async function getLearningProfile(userId: string): Promise<LearningProfileRecord | null> {
  const db = await getDb();
  return db.learningProfiles.find((p) => p.userId === userId) ?? null;
}

