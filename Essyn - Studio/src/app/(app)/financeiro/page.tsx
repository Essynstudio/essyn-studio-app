import { createServerSupabase } from "@/lib/supabase/server";
import { FinanceiroClient } from "./financeiro-client";
import { redirect } from "next/navigation";

export default async function FinanceiroPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const { data: installments } = await supabase
    .from("installments")
    .select(`
      id, type, description, amount, due_date, status,
      payment_method, paid_at, paid_amount, category, notes,
      asaas_payment_id, asaas_billing_url, asaas_pix_qr, asaas_pix_code,
      created_at, updated_at,
      projects (id, name),
      clients (id, name)
    `)
    .eq("studio_id", studio.id)
    .is("deleted_at", null)
    .order("due_date", { ascending: true });

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
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

  // Check if Asaas integration is connected
  const { data: asaasIntegration } = await supabase
    .from("integrations")
    .select("status")
    .eq("studio_id", studio.id)
    .eq("provider", "asaas")
    .single();

  return (
    <FinanceiroClient
      installments={(installments || []) as never[]}
      projects={(projects || []) as never[]}
      clients={(clients || []) as never[]}
      studioId={studio.id}
      asaasConnected={asaasIntegration?.status === "connected"}
    />
  );
}
