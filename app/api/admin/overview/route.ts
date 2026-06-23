import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/security/api";
import { getAdminStats, listUsers } from "@/lib/server/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireAdminUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  const [stats, users] = await Promise.all([getAdminStats(), listUsers()]);
  const safeUsers = users.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
    status: item.status,
    createdAt: item.createdAt,
    lastLoginAt: item.lastLoginAt
  }));

  return NextResponse.json({
    kpis: {
      users: stats.userCount,
      activeUsers: stats.activeUserCount,
      admins: stats.adminCount,
      studySpaces: stats.studySpaceCount,
      documents: stats.documentCount,
      chatTurns: stats.chatTurnCount,
      usageEvents: stats.usageEventCount,
      activeCourses: stats.activeCourseCount
    },
    userCounter: stats.userCount,
    stats,
    users: safeUsers
  });
}
