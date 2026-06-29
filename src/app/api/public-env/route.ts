import { z } from "zod";
import { jsonResponse } from "@/app/api/_shared/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const publicEnvSchema = z.object({
  supabaseAnonKey: z.string().min(1),
  supabaseUrl: z.string().url(),
});

export function GET() {
  const parsed = publicEnvSchema.safeParse({
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });

  if (!parsed.success) {
    return jsonResponse(
      {
        configured: false,
        error: "Supabase browser environment variables are not configured.",
      },
      { status: 503 },
    );
  }

  return jsonResponse({
    configured: true,
    ...parsed.data,
  });
}
