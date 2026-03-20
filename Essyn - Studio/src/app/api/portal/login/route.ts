import { createServiceSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Direct portal login via email + CPF (last 4 digits).
 * Creates a session immediately without magic link.
 */
export async function POST(request: Request) {
  try {
    const { email, cpf } = await request.json();

    if (!email || !cpf) {
      return NextResponse.json({ error: "Email e CPF são obrigatórios" }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    // Find client by email
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, email, document, studio_id")
      .eq("email", email.toLowerCase().trim())
      .is("deleted_at", null);

    if (!clients || clients.length === 0) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 404 });
    }

    // Verify CPF (last 4 digits match)
    const cleanCpf = cpf.replace(/\D/g, "");
    const client = clients.find((c) => {
      if (!c.document) return false;
      const cleanDoc = c.document.replace(/\D/g, "");
      return cleanDoc.endsWith(cleanCpf) || cleanDoc === cleanCpf;
    });

    if (!client) {
      return NextResponse.json({ error: "CPF não confere com o cadastro" }, { status: 401 });
    }

    // Create session (30 days)
    const crypto = await import("crypto");
    const sessionToken = crypto.randomBytes(32).toString("hex");

    const { error: sessionError } = await supabase
      .from("client_portal_sessions")
      .insert({
        client_id: client.id,
        studio_id: client.studio_id,
        session_token: sessionToken,
      });

    if (sessionError) {
      return NextResponse.json({ error: "Erro ao criar sessão" }, { status: 500 });
    }

    // Update portal_last_access
    await supabase
      .from("clients")
      .update({ portal_last_access: new Date().toISOString() })
      .eq("id", client.id);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("portal_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/portal",
    });

    return NextResponse.json({ ok: true, name: client.name });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
