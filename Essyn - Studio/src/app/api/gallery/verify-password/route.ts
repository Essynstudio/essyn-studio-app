import { createServiceSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { galleryId, password } = await request.json();

    if (!galleryId || !password) {
      return NextResponse.json({ ok: false, error: "Dados incompletos" }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    const { data: gallery } = await supabase
      .from("galleries")
      .select("id, password_hash")
      .eq("id", galleryId)
      .single();

    if (!gallery || !gallery.password_hash) {
      return NextResponse.json({ ok: false, error: "Galeria não encontrada" }, { status: 404 });
    }

    // Simple comparison (password_hash stores the plain password for now)
    if (password !== gallery.password_hash) {
      return NextResponse.json({ ok: false, error: "Senha incorreta" }, { status: 401 });
    }

    // Set cookie so layout.tsx can validate
    const cookieStore = await cookies();
    cookieStore.set(`gallery_pwd_${galleryId}`, gallery.password_hash, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/g",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro interno" }, { status: 500 });
  }
}
