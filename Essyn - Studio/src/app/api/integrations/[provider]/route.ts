import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getBalance, type AsaasConfig } from "@/lib/asaas";

// ── GET: Read integration config ──
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { data: studio } = await supabase
      .from("studios")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    if (!studio) return NextResponse.json({ error: "Estúdio não encontrado" }, { status: 404 });

    const { data: integration } = await supabase
      .from("integrations")
      .select("id, provider, status, config, connected_at, created_at")
      .eq("studio_id", studio.id)
      .eq("provider", provider)
      .single();

    return NextResponse.json({ integration: integration || null });
  } catch (err) {
    console.error("[integrations/GET]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ── POST: Save/connect integration ──
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { data: studio } = await supabase
      .from("studios")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    if (!studio) return NextResponse.json({ error: "Estúdio não encontrado" }, { status: 404 });

    const body = await req.json();
    const { apiKey, sandbox, ...extraConfig } = body;

    if (!apiKey?.trim()) {
      return NextResponse.json({ error: "API Key é obrigatória" }, { status: 400 });
    }

    // Test connection based on provider
    let testResult: { success: boolean; details?: string } = { success: false };

    if (provider === "asaas") {
      try {
        const config: AsaasConfig = { apiKey: apiKey.trim(), sandbox: !!sandbox };
        const balance = await getBalance(config);
        testResult = { success: true, details: `Saldo: R$ ${balance.balance.toFixed(2)}` };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao conectar";
        return NextResponse.json({
          error: `Falha na conexão com Asaas: ${msg}`,
          testResult: { success: false },
        }, { status: 400 });
      }
    }

    // Upsert integration
    const { data: integration, error } = await supabase
      .from("integrations")
      .upsert(
        {
          studio_id: studio.id,
          provider,
          status: "connected",
          credentials: { apiKey: apiKey.trim() },
          config: { sandbox: !!sandbox, ...extraConfig },
          connected_at: new Date().toISOString(),
        },
        { onConflict: "studio_id,provider" }
      )
      .select("id, provider, status, config, connected_at")
      .single();

    if (error) {
      console.error("[integrations/POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ integration, testResult });
  } catch (err) {
    console.error("[integrations/POST]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ── DELETE: Disconnect integration ──
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { data: studio } = await supabase
      .from("studios")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    if (!studio) return NextResponse.json({ error: "Estúdio não encontrado" }, { status: 404 });

    await supabase
      .from("integrations")
      .update({
        status: "disconnected",
        credentials: {},
        connected_at: null,
      })
      .eq("studio_id", studio.id)
      .eq("provider", provider);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[integrations/DELETE]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
