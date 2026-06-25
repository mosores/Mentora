import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createId, nowIso, updateDb } from "@/lib/data";
import type { StudyLanguage } from "@/lib/types";
import { detailSpace, summarizeSpace } from "@/lib/workspace";

const createSpaceSchema = z.object({
  title: z.string().trim().min(2).max(80),
  course: z.string().trim().min(2).max(80),
  language: z.enum(["en", "es", "bilingual"]).default("bilingual")
});

export async function GET() {
  try {
    const { user } = await requireUser();
    const spaces = await updateDb((db) =>
      db.spaces
        .filter((space) => space.userId === user.id)
        .map((space) => summarizeSpace(db, space.id))
        .filter(Boolean)
    );
    return NextResponse.json({ spaces });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const payload = createSpaceSchema.parse(await readJson<unknown>(request));
    const timestamp = nowIso();

    const space = await updateDb((db) => {
      const created = {
        id: createId("space"),
        userId: user.id,
        title: payload.title,
        course: payload.course,
        language: payload.language as StudyLanguage,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      db.spaces.push(created);
      return detailSpace(db, user.id, created.id);
    });

    return NextResponse.json({ space }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
