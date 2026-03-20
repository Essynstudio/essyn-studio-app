import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getOAuthUrl } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });

  // State encodes studio_id for verification in callback
  const state = btoa(JSON.stringify({ studioId: studio.id, userId: user.id }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const url = getOAuthUrl(state);

  return NextResponse.redirect(url);
}
