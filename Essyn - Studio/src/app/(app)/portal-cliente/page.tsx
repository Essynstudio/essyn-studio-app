import { createServerSupabase } from "@/lib/supabase/server";
import { PortalClienteClient } from "./portal-client";
import { redirect } from "next/navigation";

export default async function PortalClientePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  // Fetch stats + clients with portal access info in parallel
  const [galleriesRes, installmentsRes, contractsRes, clientsRes] = await Promise.all([
    supabase
      .from("galleries")
      .select("id, status")
      .eq("studio_id", studio.id)
      .is("deleted_at", null),
    supabase
      .from("installments")
      .select("id, status, amount")
      .eq("studio_id", studio.id)
      .is("deleted_at", null),
    supabase
      .from("contracts")
      .select("id, status")
      .eq("studio_id", studio.id)
      .is("deleted_at", null),
    supabase
      .from("clients")
      .select("id, name, email, portal_sent_at, portal_last_access")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("portal_last_access", { ascending: false, nullsFirst: false }),
  ]);

  const galleries = galleriesRes.data || [];
  const installments = installmentsRes.data || [];
  const contracts = contractsRes.data || [];
  const clients = clientsRes.data || [];

  const sharedGalleries = galleries.filter((g) => ["prova", "final", "entregue"].includes(g.status)).length;
  const paidInstallments = installments.filter((i) => i.status === "pago").length;
  const totalInstallments = installments.length;
  const paidValue = installments
    .filter((i) => i.status === "pago")
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const signedContracts = contracts.filter((c) => c.status === "assinado").length;

  // Split clients into those with portal access and without
  const clientsWithAccess = clients.filter((c) => c.portal_sent_at);
  const clientsWithoutAccess = clients.filter((c) => !c.portal_sent_at && c.email);

  return (
    <PortalClienteClient
      studioId={studio.id}
      studioName={studio.name || "Meu Estúdio"}
      stats={{
        totalClients: clients.length,
        sharedGalleries,
        paidInstallments,
        totalInstallments,
        paidValue,
        signedContracts,
        totalContracts: contracts.length,
      }}
      clientsWithAccess={clientsWithAccess}
      clientsWithoutAccess={clientsWithoutAccess}
    />
  );
}
