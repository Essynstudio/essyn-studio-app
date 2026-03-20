import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail, teamInviteEmail } from "@/lib/email";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ── POST: Create invite ──
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // Verify user owns a studio
    const { data: studio } = await supabase
      .from("studios")
      .select("id, name")
      .eq("owner_id", user.id)
      .single();

    if (!studio) return NextResponse.json({ error: "Estúdio não encontrado" }, { status: 404 });

    const body = await req.json();
    const { name, email, phone, role, customRole, permissions, sendMethod } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }

    // Check if already invited (pending)
    const { data: existing } = await supabase
      .from("team_invites")
      .select("id")
      .eq("studio_id", studio.id)
      .eq("email", email.trim().toLowerCase())
      .is("accepted_at", null)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Este email já possui um convite pendente" }, { status: 409 });
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("studio_id", studio.id)
      .eq("email", email.trim().toLowerCase())
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "Este email já é membro da equipe" }, { status: 409 });
    }

    // Create invite
    const { data: invite, error } = await supabase
      .from("team_invites")
      .insert({
        studio_id: studio.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        role: role || "fotografo",
        custom_role: customRole?.trim() || null,
        permissions: permissions || { modules: [], scope: {} },
        invited_by: user.id,
      })
      .select("id, token, name, email, phone, role, custom_role, permissions, expires_at, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const inviteUrl = `${req.nextUrl.origin}/convite/${invite.token}`;

    // Send email if requested
    if (sendMethod === "email") {
      const { subject, html } = teamInviteEmail({
        inviteeName: name.trim(),
        studioName: studio.name,
        inviteUrl,
        role: role || "fotografo",
      });
      const emailSent = await sendEmail({ to: email.trim(), subject, html });
      if (!emailSent) {
        return NextResponse.json({
          invite,
          inviteUrl,
          emailSent: false,
          warning: "Convite criado mas o email não pôde ser enviado. Configure RESEND_API_KEY ou use o link.",
        });
      }
    }

    return NextResponse.json({
      invite,
      inviteUrl,
      emailSent: sendMethod === "email",
    });
  } catch (err) {
    console.error("[invite] Error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ── GET: Validate token (public) ──
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token obrigatório" }, { status: 400 });

  // Use service role to read invite without RLS restrictions
  const res = await fetch(`${SUPABASE_URL}/rest/v1/team_invites?token=eq.${token}&select=id,token,name,email,role,permissions,expires_at,accepted_at,studios(name)&studio_id=fk.studios`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });

  // Simpler: use supabase server with service role header
  const supabase = await createServerSupabase();
  const { data: invite } = await supabase
    .from("team_invites")
    .select("id, token, name, email, role, permissions, expires_at, accepted_at, studio_id")
    .eq("token", token)
    .single();

  if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });

  if (invite.accepted_at) {
    return NextResponse.json({ error: "Este convite já foi aceito", expired: true }, { status: 410 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Este convite expirou", expired: true }, { status: 410 });
  }

  // Get studio name
  const { data: studio } = await supabase
    .from("studios")
    .select("name")
    .eq("id", invite.studio_id)
    .single();

  return NextResponse.json({
    invite: {
      ...invite,
      studio_name: studio?.name || "Estúdio",
    },
  });
}
