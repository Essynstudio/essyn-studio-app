import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { getOAuthUrl } from "@/lib/google-calendar";
import { cookies } from "next/headers";

const REDIRECT_PATH = "/api/portal/google-calendar/callback";

export async function GET() {
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

  const state = btoa(JSON.stringify({ clientId: session.client_id, studioId: session.studio_id }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return NextResponse.redirect(getOAuthUrl(state, REDIRECT_PATH));
}
