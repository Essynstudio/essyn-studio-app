import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("portal_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceSupabase();
  const { data: session } = await supabase
    .from("client_portal_sessions")
    .select("client_id, studio_id, expires_at")
    .eq("session_token", token)
    .single();

  if (!session || (session.expires_at && new Date(session.expires_at) < new Date())) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  await supabase
    .from("client_google_calendars")
    .delete()
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id);

  return NextResponse.json({ success: true });
}
