import { createServiceSupabase } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/portal?error=token_missing", request.url));
  }

  const supabase = createServiceSupabase();

  // Validate magic link token
  const { data: tokenData } = await supabase
    .from("client_portal_tokens")
    .select("id, client_id, studio_id, used, expires_at")
    .eq("token", token)
    .single();

  if (!tokenData) {
    return NextResponse.redirect(new URL("/portal?error=token_invalid", request.url));
  }

  if (tokenData.used) {
    return NextResponse.redirect(new URL("/portal?error=token_used", request.url));
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.redirect(new URL("/portal?error=token_expired", request.url));
  }

  // Mark token as used
  await supabase
    .from("client_portal_tokens")
    .update({ used: true })
    .eq("id", tokenData.id);

  // Create portal session (30 days)
  const { data: session } = await supabase
    .from("client_portal_sessions")
    .insert({
      client_id: tokenData.client_id,
      studio_id: tokenData.studio_id,
    })
    .select("session_token")
    .single();

  if (!session) {
    return NextResponse.redirect(new URL("/portal?error=session_failed", request.url));
  }

  // Update client's last access
  await supabase
    .from("clients")
    .update({ portal_last_access: new Date().toISOString() })
    .eq("id", tokenData.client_id);

  // Set httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set("portal_session", session.session_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/portal",
  });

  // Redirect to portal hub
  return NextResponse.redirect(new URL("/portal/meu", request.url));
}
