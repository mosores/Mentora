import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser, idSchema, readJson, requestPayloadErrorResponse } from "@/lib/security/api";
import { updateUserByAdmin } from "@/lib/server/store";

export const runtime = "nodejs";

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["student", "admin"]).optional(),
  status: z.enum(["active", "disabled"]).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdminUser(request);

  if (actor instanceof NextResponse) {
    return actor;
  }

  const { id } = await params;
  const parsedId = idSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  let payload: unknown;

  try {
    payload = await readJson(request, 16 * 1024);
  } catch (error) {
    return requestPayloadErrorResponse(error);
  }

  const body = updateUserSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid user update." }, { status: 400 });
  }

  try {
    const user = await updateUserByAdmin(id, body.data, actor);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update user." },
      { status: 400 }
    );
  }
}
