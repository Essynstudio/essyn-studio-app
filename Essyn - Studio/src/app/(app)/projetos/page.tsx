import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProjetosClient } from "./projetos-client";
import { redirect } from "next/navigation";

export default async function ProjetosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const [projectsRes, clientsRes, packsRes, workflowsRes, productsRes, teamMembersRes] = await Promise.all([
    supabase
      .from("projects")
      .select(`
        id, name, event_type, status, production_phase,
        event_date, event_location, value, paid, notes, tags,
        team_ids,
        created_at, updated_at,
        clients (id, name),
        project_locations (name, sort_order),
        project_workflows (id, status),
        installments (id, status, due_date)
      `)
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name, email, phone")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("packs")
      .select("*")
      .eq("studio_id", studio.id)
      .eq("active", true)
      .order("name"),
    supabase
      .from("workflow_templates")
      .select("*")
      .eq("studio_id", studio.id)
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("catalog_products")
      .select("*")
      .eq("studio_id", studio.id)
      .eq("active", true)
      .order("name"),
    supabase
      .from("team_members")
      .select("id, name, role, avatar_url")
      .eq("studio_id", studio.id)
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <Suspense>
      <ProjetosClient
        projects={(projectsRes.data || []) as never[]}
        clients={(clientsRes.data || []) as never[]}
        packs={(packsRes.data || []) as never[]}
        workflowTemplates={(workflowsRes.data || []) as never[]}
        catalogProducts={(productsRes.data || []) as never[]}
        teamMembers={(teamMembersRes.data || []) as never[]}
        studioId={studio.id}
      />
    </Suspense>
  );
}
