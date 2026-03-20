import { createServerSupabase } from "@/lib/supabase/server";
import { ContratosClient } from "./contratos-client";
import { redirect } from "next/navigation";

export default async function ContratosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const { data: contracts } = await supabase
    .from("contracts")
    .select(`
      id, title, content, value, status, file_url,
      sent_at, signed_at, expires_at, viewed_at, accepted_at,
      autentique_document_id, autentique_signing_url,
      created_at, updated_at,
      projects (id, name),
      clients (id, name, email)
    `)
    .eq("studio_id", studio.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, client_id")
    .eq("studio_id", studio.id)
    .is("deleted_at", null)
    .neq("status", "cancelado")
    .order("name");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("studio_id", studio.id)
    .is("deleted_at", null)
    .order("name");

  return (
    <ContratosClient
      contracts={(contracts || []) as never[]}
      projects={(projects || []) as never[]}
      clients={(clients || []) as never[]}
      studioId={studio.id}
      studioName={studio.name}
    />
  );
}
