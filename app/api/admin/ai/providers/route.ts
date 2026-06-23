import { NextResponse } from "next/server";
import { modelRegistry } from "@/lib/ai/model-registry";
import { requireAdminUser } from "@/lib/security/api";

type RegisteredModel = (typeof modelRegistry)[number];

export async function GET(request: Request) {
  const user = await requireAdminUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  const providers = modelRegistry.reduce<Record<string, { models: RegisteredModel[]; enabled: boolean }>>((acc, model) => {
    acc[model.provider] ??= { models: [], enabled: false };
    acc[model.provider].models.push(model);
    acc[model.provider].enabled = acc[model.provider].enabled || model.enabled;
    return acc;
  }, {});

  return NextResponse.json({ providers });
}
