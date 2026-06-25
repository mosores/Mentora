import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MentoraDb, PublicUser, UserRecord } from "@/lib/types";

const dataDir = process.env.MENTORA_DATA_DIR ?? path.join(process.cwd(), ".mentora-data");
const dbPath = path.join(dataDir, "db.json");

let writeQueue = Promise.resolve();

export function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  };
}

async function createSeedDb(): Promise<MentoraDb> {
  const createdAt = nowIso();
  const [studentHash, adminHash] = await Promise.all([
    bcrypt.hash("mentora123", 10),
    bcrypt.hash("admin123", 10)
  ]);

  const studentId = "user_demo_student";
  const adminId = "user_demo_admin";
  const spaceId = "space_intro_biology";
  const documentId = "doc_intro_notes";
  const chunkId = "chunk_intro_notes_1";

  return {
    users: [
      {
        id: studentId,
        name: "Demo Student",
        email: "student@mentora.local",
        passwordHash: studentHash,
        role: "student",
        status: "active",
        createdAt
      },
      {
        id: adminId,
        name: "Mentora Admin",
        email: "admin@mentora.local",
        passwordHash: adminHash,
        role: "admin",
        status: "active",
        createdAt
      }
    ],
    sessions: [],
    spaces: [
      {
        id: spaceId,
        userId: studentId,
        title: "Intro Biology",
        course: "Biology 101",
        language: "bilingual",
        createdAt,
        updatedAt: createdAt
      }
    ],
    documents: [
      {
        id: documentId,
        userId: studentId,
        spaceId,
        name: "Cell respiration notes.txt",
        mimeType: "text/plain",
        text:
          "Cellular respiration is the process cells use to convert glucose into usable ATP energy. Glycolysis happens in the cytoplasm and breaks glucose into pyruvate. The Krebs cycle and electron transport chain happen in mitochondria and produce most ATP. Oxygen acts as the final electron acceptor, which allows the chain to keep moving electrons efficiently.",
        summary:
          "Cellular respiration converts glucose into ATP through glycolysis, the Krebs cycle, and the electron transport chain. Oxygen keeps the process efficient by acting as the final electron acceptor.",
        chunkCount: 1,
        createdAt
      }
    ],
    chunks: [
      {
        id: chunkId,
        userId: studentId,
        spaceId,
        documentId,
        sourceName: "Cell respiration notes.txt",
        chunkIndex: 1,
        text:
          "Cellular respiration is the process cells use to convert glucose into usable ATP energy. Glycolysis happens in the cytoplasm and breaks glucose into pyruvate. The Krebs cycle and electron transport chain happen in mitochondria and produce most ATP. Oxygen acts as the final electron acceptor, which allows the chain to keep moving electrons efficiently.",
        keywords: ["cellular", "respiration", "glucose", "glycolysis", "pyruvate", "krebs", "mitochondria", "oxygen"],
        createdAt
      }
    ],
    tools: [],
    chatTurns: [],
    usageEvents: []
  };
}

async function ensureDbFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dbPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    const seed = await createSeedDb();
    await writeFile(dbPath, `${JSON.stringify(seed, null, 2)}\n`, "utf8");
  }
}

export async function readDb(): Promise<MentoraDb> {
  await ensureDbFile();
  const raw = await readFile(dbPath, "utf8");
  const db = JSON.parse(raw) as MentoraDb;
  db.sessions = db.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
  return db;
}

async function writeDb(db: MentoraDb) {
  await mkdir(dataDir, { recursive: true });
  const tempPath = `${dbPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  await rename(tempPath, dbPath);
}

export async function updateDb<T>(updater: (db: MentoraDb) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDb();
    const result = await updater(db);
    db.sessions = db.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
    await writeDb(db);
    return result;
  });

  writeQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
}
