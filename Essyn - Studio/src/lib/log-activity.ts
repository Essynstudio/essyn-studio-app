import { createClient } from "@/lib/supabase/client";

export async function logActivity(params: {
  studioId: string;
  projectId?: string;
  entityType: string;
  entityId: string;
  action: string;
  details?: Record<string, unknown>;
}) {
  try {
    const supabase = createClient();
    await supabase.from("activity_log").insert({
      studio_id: params.studioId,
      project_id: params.projectId || null,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      details: params.details || {},
    });
  } catch {
    // Silent failure — logging should never crash the calling operation
  }
}
