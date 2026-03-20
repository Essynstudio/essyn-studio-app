/**
 * POST /api/storage/delete
 * Remove um arquivo do Cloudflare R2.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { deleteFromR2 } from "@/lib/r2";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!studio) return Response.json({ error: "Studio not found" }, { status: 404 });

  let body: { path: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  // Segurança: garante que o path pertence ao studio do usuário
  if (!body.path.startsWith(`${studio.id}/`)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await deleteFromR2(body.path);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[Storage] Delete failed:", err);
    return Response.json({ error: "Erro ao deletar arquivo" }, { status: 500 });
  }
}
