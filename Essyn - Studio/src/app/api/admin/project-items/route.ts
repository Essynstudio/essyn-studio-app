import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

async function getStudioId() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const svc = createServiceSupabase();
  const { data: studio } = await svc
    .from("studios")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  return studio?.id || null;
}

/** POST — Create a new project item */
export async function POST(req: NextRequest) {
  const studioId = await getStudioId();
  if (!studioId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { project_id, client_id, name, description, category, quantity, unit_price } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Verify project and client belong to this studio
  if (project_id) {
    const { data: proj } = await supabase.from("projects").select("id").eq("id", project_id).eq("studio_id", studioId).is("deleted_at", null).single();
    if (!proj) return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }
  if (client_id) {
    const { data: cli } = await supabase.from("clients").select("id").eq("id", client_id).eq("studio_id", studioId).is("deleted_at", null).single();
    if (!cli) return NextResponse.json({ error: "client_not_found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("project_items")
    .insert({
      studio_id: studioId,
      project_id: project_id || null,
      client_id: client_id || null,
      name: name.trim(),
      description: description?.trim() || null,
      category: category || "servico",
      quantity: quantity || 1,
      unit_price: unit_price || 0,
      status: "contratado",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

/** PATCH — Update a project item (status, delivered_at, etc) */
export async function PATCH(req: NextRequest) {
  const studioId = await getStudioId();
  if (!studioId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  // Only allow specific fields
  const allowed: Record<string, unknown> = {};
  if (updates.name !== undefined) allowed.name = updates.name;
  if (updates.description !== undefined) allowed.description = updates.description;
  if (updates.category !== undefined) allowed.category = updates.category;
  if (updates.quantity !== undefined) allowed.quantity = updates.quantity;
  if (updates.unit_price !== undefined) allowed.unit_price = updates.unit_price;
  if (updates.status !== undefined) {
    allowed.status = updates.status;
    if (updates.status === "entregue") allowed.delivered_at = new Date().toISOString();
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("project_items")
    .update(allowed)
    .eq("id", id)
    .eq("studio_id", studioId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

/** DELETE — Remove a project item */
export async function DELETE(req: NextRequest) {
  const studioId = await getStudioId();
  if (!studioId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from("project_items")
    .delete()
    .eq("id", id)
    .eq("studio_id", studioId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
