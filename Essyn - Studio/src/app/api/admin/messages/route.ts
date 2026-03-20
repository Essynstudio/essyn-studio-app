import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

/** Get authenticated studio_id */
async function getStudioId() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const svc = createServiceSupabase();
  const { data: studio } = await svc
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  return studio?.id || null;
}

/** GET — List all conversations (grouped by client) or messages for a specific client */
export async function GET(req: NextRequest) {
  const studioId = await getStudioId();
  if (!studioId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id");
  const supabase = createServiceSupabase();

  if (clientId) {
    // Fetch messages for a specific client
    const { data, error } = await supabase
      .from("portal_messages")
      .select("id, sender_type, message, read_at, created_at")
      .eq("studio_id", studioId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark unread client messages as read
    await supabase
      .from("portal_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("studio_id", studioId)
      .eq("client_id", clientId)
      .eq("sender_type", "client")
      .is("read_at", null);

    return NextResponse.json({ messages: data || [] });
  }

  // List all conversations grouped by client
  const { data: conversations, error } = await supabase
    .from("portal_messages")
    .select("client_id, sender_type, message, read_at, created_at")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by client — get latest message + unread count
  const grouped: Record<string, { client_id: string; last_message: string; last_at: string; last_sender: string; unread: number }> = {};
  for (const msg of conversations || []) {
    if (!grouped[msg.client_id]) {
      grouped[msg.client_id] = {
        client_id: msg.client_id,
        last_message: msg.message,
        last_at: msg.created_at,
        last_sender: msg.sender_type,
        unread: 0,
      };
    }
    if (msg.sender_type === "client" && !msg.read_at) {
      grouped[msg.client_id].unread++;
    }
  }

  // Get client names
  const clientIds = Object.keys(grouped);
  let clients: { id: string; name: string; email: string | null }[] = [];
  if (clientIds.length > 0) {
    const { data: c } = await supabase
      .from("clients")
      .select("id, name, email")
      .in("id", clientIds)
      .is("deleted_at", null);
    clients = c || [];
  }

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));
  const result = Object.values(grouped)
    .map(conv => ({
      ...conv,
      client_name: clientMap[conv.client_id]?.name || "Cliente",
      client_email: clientMap[conv.client_id]?.email || null,
    }))
    .sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

  return NextResponse.json({ conversations: result });
}

/** POST — Studio sends a message to a client */
export async function POST(req: NextRequest) {
  const studioId = await getStudioId();
  if (!studioId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { client_id, message: msg } = body;
  const text = (msg || "").trim();

  if (!client_id || !text || text.length > 2000) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("portal_messages")
    .insert({
      studio_id: studioId,
      client_id,
      sender_type: "studio",
      message: text,
    })
    .select("id, sender_type, message, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: data });
}
