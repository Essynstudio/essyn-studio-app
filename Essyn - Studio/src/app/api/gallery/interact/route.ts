import { createServiceSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Gallery interaction API — handles favorites, selections, view/download tracking
 * POST /api/gallery/interact
 * Body: { action, token, photoId?, selection? }
 */
export async function POST(request: Request) {
  try {
    const { action, token, photoId, selection } = await request.json();

    if (!token || !action) {
      return NextResponse.json({ error: "token e action obrigatorios" }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    // Validate token → get invite + gallery
    const { data: invite } = await supabase
      .from("gallery_invites")
      .select("id, gallery_id, studio_id, client_id, role")
      .eq("token", token)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Token invalido" }, { status: 404 });
    }

    // ── LOAD EXISTING SELECTIONS ──
    if (action === "load_selections") {
      const { data: sels } = await supabase
        .from("gallery_selections")
        .select("photo_id, status")
        .eq("gallery_id", invite.gallery_id)
        .eq("client_id", invite.client_id);

      const favorites: string[] = [];
      const selections: Record<string, string> = {};
      for (const s of sels || []) {
        if (s.status === "aprovada") favorites.push(s.photo_id);
        selections[s.photo_id] = s.status;
      }
      return NextResponse.json({ ok: true, favorites, selections });
    }

    // ── INCREMENT VIEW ──
    if (action === "view") {
      const { data: gal } = await supabase
        .from("galleries")
        .select("views")
        .eq("id", invite.gallery_id)
        .single();
      await supabase
        .from("galleries")
        .update({ views: (gal?.views || 0) + 1 })
        .eq("id", invite.gallery_id);
      return NextResponse.json({ ok: true });
    }

    // ── INCREMENT DOWNLOAD ──
    if (action === "download") {
      const { data: gal } = await supabase
        .from("galleries")
        .select("downloads")
        .eq("id", invite.gallery_id)
        .single();
      await supabase
        .from("galleries")
        .update({ downloads: (gal?.downloads || 0) + 1 })
        .eq("id", invite.gallery_id);
      return NextResponse.json({ ok: true });
    }

    // ── TOGGLE FAVORITE ──
    if (action === "favorite" && photoId) {
      // Check if already favorited
      const { data: existing } = await supabase
        .from("gallery_selections")
        .select("id")
        .eq("gallery_id", invite.gallery_id)
        .eq("photo_id", photoId)
        .eq("client_id", invite.client_id)
        .eq("status", "aprovada")
        .single();

      if (existing) {
        // Remove favorite
        await supabase
          .from("gallery_selections")
          .delete()
          .eq("id", existing.id);
        return NextResponse.json({ ok: true, favorited: false });
      } else {
        // Add favorite
        await supabase
          .from("gallery_selections")
          .insert({
            gallery_id: invite.gallery_id,
            photo_id: photoId,
            studio_id: invite.studio_id,
            client_id: invite.client_id,
            status: "aprovada",
          });
        return NextResponse.json({ ok: true, favorited: true });
      }
    }

    // ── PHOTO SELECTION (approve/reject/doubt) ──
    if (action === "select" && photoId && selection) {
      if (!["aprovada", "rejeitada", "duvida"].includes(selection)) {
        return NextResponse.json({ error: "Status invalido" }, { status: 400 });
      }

      // Upsert selection
      const { error } = await supabase
        .from("gallery_selections")
        .upsert(
          {
            gallery_id: invite.gallery_id,
            photo_id: photoId,
            studio_id: invite.studio_id,
            client_id: invite.client_id,
            status: selection,
          },
          { onConflict: "gallery_id,photo_id,client_id" }
        );

      if (error) {
        return NextResponse.json({ error: "Erro ao salvar seleção" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, status: selection });
    }

    return NextResponse.json({ error: "Ação não reconhecida" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
