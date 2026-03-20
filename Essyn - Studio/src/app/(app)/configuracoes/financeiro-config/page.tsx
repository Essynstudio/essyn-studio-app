import { createServerSupabase } from "@/lib/supabase/server";
import { FinanceiroConfigClient } from "./financeiro-config-client";
import { redirect } from "next/navigation";

export default async function FinanceiroConfigPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) redirect("/entrar");

  // Try to fetch expense_categories if table exists
  const { data: categories } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("studio_id", studio.id)
    .order("sort_order", { ascending: true });

  return (
    <FinanceiroConfigClient
      studioId={studio.id}
      initialCategories={(categories as never[]) || []}
    />
  );
}
