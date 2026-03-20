import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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

/** GET — Fetch briefing for this client */
export async function GET() {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServiceSupabase();

  // Get the project for this client (to know event_type)
  const { data: project } = await supabase
    .from("projects")
    .select("id, event_type")
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get or create briefing
  let { data: briefing } = await supabase
    .from("portal_briefings")
    .select("*")
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .limit(1)
    .single();

  if (!briefing) {
    const { data: created } = await supabase
      .from("portal_briefings")
      .insert({
        studio_id: session.studio_id,
        client_id: session.client_id,
        project_id: project?.id || null,
        event_type: project?.event_type || "casamento",
        sections: {},
        status: "rascunho",
      })
      .select("*")
      .single();
    briefing = created;
  }

  return NextResponse.json({ briefing });
}

/** PATCH — Update briefing sections */
export async function PATCH(req: NextRequest) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { sections, status } = body;

  const supabase = createServiceSupabase();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (sections) updateData.sections = sections;
  if (status) updateData.status = status;

  // Generate markdown when status is "preenchido"
  if (status === "preenchido" && sections) {
    updateData.markdown_output = generateMarkdown(sections);
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("portal_briefings")
    .update(updateData)
    .eq("client_id", session.client_id)
    .eq("studio_id", session.studio_id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify studio when briefing is completed
  if (status === "preenchido") {
    await supabase.from("notifications").insert({
      studio_id: session.studio_id,
      type: "sistema",
      title: "Briefing preenchido pelo cliente",
      description: "O cliente finalizou o preenchimento do briefing do evento.",
      route: `/projetos`,
    });
  }

  return NextResponse.json({ briefing: data });
}

function generateMarkdown(sections: Record<string, Record<string, string>>): string {
  const lines: string[] = ["# Briefing do Evento\n"];
  const sectionLabels: Record<string, string> = {
    info: "Informações do Casal",
    making_noiva: "Making Of da Noiva",
    making_noivo: "Making Of do Noivo",
    cerimonia: "Sobre a Cerimônia",
    festa: "Sobre a Festa",
    detalhes: "Detalhes Importantes",
    preferencias: "Preferências do Casal",
    fornecedores: "Lista de Fornecedores",
  };

  for (const [key, label] of Object.entries(sectionLabels)) {
    const data = sections[key];
    if (!data || Object.keys(data).length === 0) continue;
    lines.push(`## ${label}\n`);
    for (const [question, answer] of Object.entries(data)) {
      if (answer && answer.trim()) {
        lines.push(`**${question}**`);
        lines.push(`${answer.trim()}\n`);
      }
    }
  }

  lines.push(`\n---\n*Preenchido em ${new Date().toLocaleDateString("pt-BR")}*`);
  return lines.join("\n");
}
