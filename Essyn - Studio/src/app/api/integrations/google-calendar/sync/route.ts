/**
 * Sync Essyn events → Google Calendar (studio + client)
 * Called fire-and-forget from agenda-client after create/update/delete
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  syncEventCreate,
  syncEventUpdate,
  syncEventDelete,
  syncEventCreateToClient,
  syncEventUpdateToClient,
  syncEventDeleteFromClient,
} from "@/lib/sync-google-calendar";


export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    action: "create" | "update" | "delete";
    event?: {
      id: string;
      title: string;
      description?: string | null;
      location?: string | null;
      start_at: string;
      end_at?: string | null;
      all_day: boolean;
      google_calendar_event_id?: string | null;
      client_google_event_id?: string | null;
      project_id?: string | null;
    };
    googleEventId?: string;
    clientGoogleEventId?: string;
    clientId?: string;
  };

  const service = createServiceSupabase();

  try {
    if (body.action === "create" && body.event) {
      // Sync to studio calendar
      await syncEventCreate(service, studio.id, body.event);
      // Sync to client calendar (if project has a client with Google Calendar)
      syncEventCreateToClient(service, studio.id, body.event).catch(() => {});

    } else if (body.action === "update" && body.event) {
      await syncEventUpdate(service, studio.id, body.event);
      syncEventUpdateToClient(service, studio.id, body.event).catch(() => {});

    } else if (body.action === "delete") {
      if (body.googleEventId) {
        await syncEventDelete(service, studio.id, body.googleEventId);
      }
      if (body.clientGoogleEventId && body.clientId) {
        syncEventDeleteFromClient(service, studio.id, body.clientGoogleEventId, body.clientId).catch(() => {});
      }
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Google Calendar sync error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
