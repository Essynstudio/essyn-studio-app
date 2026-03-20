import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

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

/** GET — Fetch briefing for a project or client */
export async function GET(req: NextRequest) {
  const studioId = await getStudioId();
  if (!studioId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("project_id");
  const clientId = req.nextUrl.searchParams.get("client_id");
  const supabase = createServiceSupabase();

  let query = supabase
    .from("portal_briefings")
    .select("*")
    .eq("studio_id", studioId);

  if (projectId) query = query.eq("project_id", projectId);
  else if (clientId) query = query.eq("client_id", clientId);
  else return NextResponse.json({ error: "missing_filter" }, { status: 400 });

  const { data, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ briefing: data });
}
