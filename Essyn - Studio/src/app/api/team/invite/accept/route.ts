import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// ── POST: Accept invite (called after signup/login) ──
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Faça login primeiro" }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Token obrigatório" }, { status: 400 });

    // Find invite
    const { data: invite } = await supabase
      .from("team_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
    if (invite.accepted_at) return NextResponse.json({ error: "Convite já aceito" }, { status: 410 });
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Convite expirado" }, { status: 410 });
    }

    // Check if user is already a member of this studio
    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("studio_id", invite.studio_id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Already a member — just mark invite as accepted
      await supabase
        .from("team_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);

      return NextResponse.json({ success: true, already_member: true });
    }

    // Check if there's a team_member entry by email (created before invite)
    const { data: emailMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("studio_id", invite.studio_id)
      .eq("email", invite.email)
      .is("user_id", null)
      .single();

    if (emailMember) {
      // Link existing member to user
      await supabase
        .from("team_members")
        .update({
          user_id: user.id,
          joined_at: new Date().toISOString(),
          permissions: invite.permissions,
          custom_role: invite.custom_role || undefined,
          active: true,
        })
        .eq("id", emailMember.id);
    } else {
      // Create new team_member
      await supabase
        .from("team_members")
        .insert({
          studio_id: invite.studio_id,
          user_id: user.id,
          name: invite.name,
          email: invite.email,
          phone: invite.phone,
          role: invite.role,
          custom_role: invite.custom_role,
          permissions: invite.permissions,
          member_type: "interno",
          active: true,
          joined_at: new Date().toISOString(),
        });
    }

    // Mark invite as accepted
    await supabase
      .from("team_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[invite/accept] Error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
