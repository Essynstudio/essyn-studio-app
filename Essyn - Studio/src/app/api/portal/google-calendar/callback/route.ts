import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

const REDIRECT_PATH = "/api/portal/google-calendar/callback";
const PORTAL_AGENDA = "/portal/meu/agenda";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}${PORTAL_AGENDA}?error=google_denied`);
  }

  let clientId: string;
  let studioId: string;
  try {
    const padded = state.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(state.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));
    clientId = decoded.clientId;
    studioId = decoded.studioId;
  } catch {
    return NextResponse.redirect(`${appUrl}${PORTAL_AGENDA}?error=invalid_state`);
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code, REDIRECT_PATH);
  } catch {
    return NextResponse.redirect(`${appUrl}${PORTAL_AGENDA}?error=token_failed`);
  }

  const supabase = createServiceSupabase();
  await supabase
    .from("client_google_calendars")
    .upsert({
      client_id: clientId,
      studio_id: studioId,
      credentials: tokens,
      calendar_id: "primary",
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "client_id,studio_id" });

  return NextResponse.redirect(`${appUrl}${PORTAL_AGENDA}?success=connected`);
}
