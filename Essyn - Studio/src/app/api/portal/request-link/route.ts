import { createServiceSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sendEmail, portalAccessEmail } from "@/lib/email";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 });
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, email, studio_id, studios(name)")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "ativo");

    if (!clients || clients.length === 0) {
      return NextResponse.json({ ok: true });
    }

    for (const client of clients) {
      const { data: tokenData } = await supabase
        .from("client_portal_tokens")
        .insert({ client_id: client.id, studio_id: client.studio_id })
        .select("token")
        .single();

      if (!tokenData) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studioName = (client as any).studios?.name || "seu fotógrafo";
      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.essyn.studio"}/portal/auth?token=${tokenData.token}`;

      const { subject, html } = portalAccessEmail({ clientName: client.name, studioName, portalUrl });
      await sendEmail({ to: email, subject, html });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
