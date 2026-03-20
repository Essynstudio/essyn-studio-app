/**
 * POST /api/automations/trigger
 * Event-triggered automations — auth required (studio context from JWT).
 *
 * Body: { action: "client_created" | "workflow_all_done", ...payload }
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { runTriggerAutomation, type AutomationTrigger } from "@/lib/automations";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name, owner_id, settings")
    .eq("owner_id", user.id)
    .single();

  if (!studio) return Response.json({ error: "Studio not found" }, { status: 404 });

  let body: AutomationTrigger;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await runTriggerAutomation(
    supabase,
    studio as { id: string; name: string; owner_id: string; settings: Record<string, unknown> | null },
    body
  );

  return Response.json(result);
}
