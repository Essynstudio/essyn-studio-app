import { createServerSupabase } from "@/lib/supabase/server";
import { PedidosClient } from "./pedidos-client";
import { redirect } from "next/navigation";

export default async function PedidosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  const [ordersRes, productsRes, galleriesRes] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        id, status, total, items, tracking_code, notes, created_at, updated_at,
        galleries (id, name),
        clients (id, name)
      `)
      .eq("studio_id", studio.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("catalog_products")
      .select("id, name, description, category, base_price, sizes, image_url, active, created_at")
      .eq("studio_id", studio.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("galleries")
      .select("id, name")
      .eq("studio_id", studio.id)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
  ]);

  return (
    <PedidosClient
      orders={(ordersRes.data || []) as never[]}
      products={(productsRes.data || []) as never[]}
      galleries={(galleriesRes.data || []) as never[]}
      studioId={studio.id}
    />
  );
}
