import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/** Validate portal session and return client_id + studio_id */
async function getPortalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("portal_session")?.value;
  if (!token) return null;

  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from("client_portal_sessions")
    .select("client_id, studio_id, expires_at")
    .eq("session_token", token)
    .single();

  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return data;
}

/** GET — Fetch messages for this client/studio pair */
export async function GET() {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("portal_messages")
    .select("id, sender_type, message, read_at, created_at")
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark unread studio messages as read
  await supabase
    .from("portal_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .eq("sender_type", "studio")
    .is("read_at", null);

  return NextResponse.json({ messages: data || [] });
}

/** POST — Client sends a message */
export async function POST(req: NextRequest) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const message = (body.message || "").trim();
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("portal_messages")
    .insert({
      studio_id: session.studio_id,
      client_id: session.client_id,
      sender_type: "client",
      message,
    })
    .select("id, sender_type, message, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create notification for the studio
  await supabase.from("notifications").insert({
    studio_id: session.studio_id,
    type: "sistema",
    title: "Nova mensagem do cliente",
    description: message.slice(0, 120),
    route: `/mensagens`,
  });

  return NextResponse.json({ message: data });
}
