import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Generate a portal preview token for the photographer to view a client's portal.
 * No email is sent — returns the portal URL directly.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { clientId } = await request.json();
    if (!clientId) return NextResponse.json({ error: "clientId obrigatório" }, { status: 400 });

    // Verify user owns the studio
    const { data: studio } = await supabase
      .from("studios")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!studio) return NextResponse.json({ error: "Estúdio não encontrado" }, { status: 404 });

    // Verify client belongs to this studio
    const { data: client } = await supabase
      .from("clients")
      .select("id, name")
      .eq("id", clientId)
      .eq("studio_id", studio.id)
      .single();

    if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    // Create token via service role (bypasses RLS)
    const serviceSupabase = createServiceSupabase();
    const { data: tokenData, error } = await serviceSupabase
      .from("client_portal_tokens")
      .insert({ client_id: clientId, studio_id: studio.id })
      .select("token")
      .single();

    if (error || !tokenData) {
      return NextResponse.json({ error: "Erro ao gerar token" }, { status: 500 });
    }

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.essyn.studio"}/portal/auth?token=${tokenData.token}`;

    return NextResponse.json({ url: portalUrl, clientName: client.name });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
