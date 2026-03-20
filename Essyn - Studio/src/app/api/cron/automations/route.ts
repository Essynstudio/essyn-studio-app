/**
 * POST /api/cron/automations
 * Daily automation runner — protected by x-cron-secret header.
 * Called by Cloudflare Cron Trigger (see _scheduled.ts + wrangler-cron.jsonc).
 */

import { createServiceSupabase } from "@/lib/supabase/server";
import { runCronAutomationsForStudio } from "@/lib/automations";

export const runtime = "edge";

export async function POST(req: Request) {
  // ── Auth: verify cron secret ──
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabase();

  // ── Fetch all studios with their settings ──
  const { data: studios, error } = await supabase
    .from("studios")
    .select("id, name, owner_id, settings")
    .limit(500);

  if (error || !studios) {
    console.error("[Cron] Failed to fetch studios:", error);
    return Response.json({ error: "Failed to fetch studios" }, { status: 500 });
  }

  const results = [];

  for (const studio of studios) {
    // Get owner email from auth.users
    const { data: userData } = await supabase.auth.admin.getUserById(studio.owner_id);
    const ownerEmail = userData?.user?.email;

    if (!ownerEmail) {
      results.push({ studioId: studio.id, error: "owner email not found" });
      continue;
    }

    const result = await runCronAutomationsForStudio(
      supabase,
      studio as { id: string; name: string; owner_id: string; settings: Record<string, unknown> | null },
      ownerEmail
    );

    results.push(result);
    if (result.errors.length > 0) console.error(`[Cron] ${studio.name} errors: ${result.errors.join(",")}`);
  }

  return Response.json({
    ok: true,
    studiosProcessed: studios.length,
    results,
  });
}
