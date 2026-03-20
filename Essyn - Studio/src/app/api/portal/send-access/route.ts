import { createServiceSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail, portalAccessEmail } from "@/lib/email";

/* ── Rate limiter: 10 sends per studio per 5 minutes ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { clientId, studioId } = await request.json();

    if (!clientId || !studioId) {
      return NextResponse.json({ error: "clientId e studioId obrigatórios" }, { status: 400 });
    }

    // Rate limit per studio
    const now = Date.now();
    const entry = rateLimitMap.get(studioId);
    if (entry && now < entry.resetAt && entry.count >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "Muitos envios. Aguarde alguns minutos." }, { status: 429 });
    }
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(studioId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    } else {
      entry.count++;
    }

    const supabase = createServiceSupabase();

    const { data: client } = await supabase
      .from("clients")
      .select("id, name, email, studio_id, studios(name)")
      .eq("id", clientId)
      .eq("studio_id", studioId)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    if (!client.email) {
      return NextResponse.json({ error: "Cliente sem email cadastrado" }, { status: 400 });
    }

    // Create magic link token
    const { data: tokenData, error: tokenError } = await supabase
      .from("client_portal_tokens")
      .insert({ client_id: client.id, studio_id: studioId })
      .select("token")
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Erro ao gerar token" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const studioName = (client as any).studios?.name || "seu fotógrafo";
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.essyn.studio"}/portal/auth?token=${tokenData.token}`;

    const { subject, html } = portalAccessEmail({ clientName: client.name, studioName, portalUrl });
    const emailSent = await sendEmail({ to: client.email, subject, html });

    // Update portal_sent_at
    await supabase
      .from("clients")
      .update({ portal_sent_at: new Date().toISOString() })
      .eq("id", client.id);

    if (!emailSent) {
      return NextResponse.json({
        ok: true,
        email: client.email,
        warning: "Token criado mas email não enviado. Configure RESEND_API_KEY.",
      });
    }

    return NextResponse.json({ ok: true, email: client.email });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
