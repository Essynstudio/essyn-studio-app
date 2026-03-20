/**
 * POST /api/storage/upload-url
 * Gera uma presigned URL para upload direto ao Cloudflare R2.
 * O browser faz PUT direto no R2 — o Worker não precisa receber o arquivo.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getUploadPresignedUrl, getPublicUrl } from "@/lib/r2";

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

  let body: { filename: string; contentType: string; galleryId: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { filename, contentType, galleryId } = body;

  if (!filename || !contentType || !galleryId) {
    return Response.json({ error: "filename, contentType e galleryId são obrigatórios" }, { status: 400 });
  }

  // Path: studioId/galleryId/filename — isolado por studio
  const path = `${studio.id}/${galleryId}/${filename}`;

  try {
    const uploadUrl = await getUploadPresignedUrl(path, contentType);
    const publicUrl = getPublicUrl(path);
    return Response.json({ uploadUrl, publicUrl, path });
  } catch (err) {
    console.error("[Storage] Failed to generate presigned URL:", err);
    return Response.json({ error: "Erro ao gerar URL de upload" }, { status: 500 });
  }
}
