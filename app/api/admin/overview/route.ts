import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { publicUser, updateDb } from "@/lib/data";
import type { UserRole, UserStatus } from "@/lib/types";
import { getAdminSnapshot } from "@/lib/workspace";

const updateUserSchema = z.object({
  userId: z.string().min(2),
  role: z.enum(["student", "admin"]).optional(),
  status: z.enum(["active", "suspended"]).optional()
});

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getAdminSnapshot());
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireAdmin();
    const payload = updateUserSchema.parse(await readJson<unknown>(request));

    if (payload.userId === user.id && payload.status === "suspended") {
      throw new Error("You cannot suspend your own active admin session.");
    }

    const updated = await updateDb((db) => {
      const target = db.users.find((candidate) => candidate.id === payload.userId);

      if (!target) {
        throw new Error("User not found");
      }

      if (payload.role) {
        target.role = payload.role as UserRole;
      }

      if (payload.status) {
        target.status = payload.status as UserStatus;
      }

      return publicUser(target);
    });

    return NextResponse.json({ user: updated, snapshot: await getAdminSnapshot() });
  } catch (error) {
    return jsonError(error);
  }
}
