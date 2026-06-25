import { publicUser, readDb } from "@/lib/data";
import type { AdminSnapshot, MentoraDb, PublicUser, SpaceDetail, SpaceSummary, WorkspaceSnapshot } from "@/lib/types";

export function summarizeSpace(db: MentoraDb, spaceId: string): SpaceSummary | null {
  const space = db.spaces.find((candidate) => candidate.id === spaceId);

  if (!space) {
    return null;
  }

  return {
    ...space,
    documentCount: db.documents.filter((document) => document.spaceId === spaceId).length,
    chunkCount: db.chunks.filter((chunk) => chunk.spaceId === spaceId).length,
    chatTurnCount: db.chatTurns.filter((turn) => turn.spaceId === spaceId).length,
    toolCount: db.tools.filter((tool) => tool.spaceId === spaceId).length
  };
}

export function detailSpace(db: MentoraDb, userId: string, spaceId: string): SpaceDetail | null {
  const summary = summarizeSpace(db, spaceId);

  if (!summary || summary.userId !== userId) {
    return null;
  }

  return {
    ...summary,
    documents: db.documents.filter((document) => document.spaceId === spaceId && document.userId === userId),
    tools: db.tools.filter((tool) => tool.spaceId === spaceId && tool.userId === userId),
    chatTurns: db.chatTurns.filter((turn) => turn.spaceId === spaceId && turn.userId === userId)
  };
}

export async function getWorkspaceSnapshot(user: PublicUser, selectedSpaceId?: string): Promise<WorkspaceSnapshot> {
  const db = await readDb();
  const spaces = db.spaces
    .filter((space) => space.userId === user.id)
    .map((space) => summarizeSpace(db, space.id))
    .filter((space): space is SpaceSummary => Boolean(space))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const chosenId = selectedSpaceId && spaces.some((space) => space.id === selectedSpaceId) ? selectedSpaceId : spaces[0]?.id ?? null;
  const selectedSpace = chosenId ? detailSpace(db, user.id, chosenId) : null;

  return {
    user,
    spaces,
    selectedSpaceId: chosenId,
    selectedSpace
  };
}

export function assertOwnedSpace(db: MentoraDb, userId: string, spaceId: string) {
  const space = db.spaces.find((candidate) => candidate.id === spaceId && candidate.userId === userId);

  if (!space) {
    throw new Error("Study space not found");
  }

  return space;
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  const db = await readDb();
  const activeCourses = new Set(db.spaces.map((space) => space.course.trim().toLowerCase()).filter(Boolean)).size;

  return {
    kpis: {
      users: db.users.length,
      activeUsers: db.users.filter((user) => user.status === "active").length,
      studySpaces: db.spaces.length,
      documents: db.documents.length,
      chunks: db.chunks.length,
      chatTurns: db.chatTurns.length,
      usageEvents: db.usageEvents.length,
      activeCourses
    },
    users: db.users.map((user) => ({
      ...publicUser(user),
      spaceCount: db.spaces.filter((space) => space.userId === user.id).length,
      documentCount: db.documents.filter((document) => document.userId === user.id).length,
      chatTurnCount: db.chatTurns.filter((turn) => turn.userId === user.id).length
    })),
    recentUsage: [...db.usageEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20)
  };
}
