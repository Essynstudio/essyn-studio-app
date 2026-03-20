import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import ArmazenamentoClient from "./armazenamento-client";

const PLAN_STORAGE_GB: Record<string, number> = {
  starter: 10,
  pro: 50,
  studio: 200,
};

export default async function ArmazenamentoPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: studio } = await supabase
    .from("studios")
    .select("storage_used_bytes, plan")
    .eq("owner_id", user.id)
    .single();

  // Query storage.objects grouped by bucket_id for breakdown
  let storageObjects: Array<{ bucket_id: string | null; metadata: unknown }> = [];
  try {
    const result = await (supabase as unknown as {
      schema(s: string): { from(t: string): { select(q: string): Promise<{ data: Array<{ bucket_id: string | null; metadata: unknown }> | null }> } }
    }).schema("storage").from("objects").select("bucket_id, metadata");
    storageObjects = result.data ?? [];
  } catch {
    storageObjects = [];
  }

  const breakdown = Object.entries(
    storageObjects.reduce<Record<string, { bytes: number; count: number }>>((acc, obj) => {
      const bucket = obj.bucket_id ?? "outros";
      const size = (obj.metadata as { size?: number } | null)?.size ?? 0;
      if (!acc[bucket]) acc[bucket] = { bytes: 0, count: 0 };
      acc[bucket].bytes += size;
      acc[bucket].count += 1;
      return acc;
    }, {})
  ).map(([bucket, data]) => ({ bucket, ...data }));

  const plan = studio?.plan ?? "starter";
  const usedBytes = studio?.storage_used_bytes ?? 0;
  const planGb = PLAN_STORAGE_GB[plan] ?? 10;

  return (
    <ArmazenamentoClient
      usedBytes={usedBytes}
      planStorageGb={planGb}
      plan={plan}
      breakdown={breakdown}
    />
  );
}
