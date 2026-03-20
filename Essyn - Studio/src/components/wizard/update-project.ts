import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/log-activity";
import { addBusinessDays } from "@/lib/business-days";
import type { WizardFormData } from "@/lib/types";

export async function updateProject(
  projectId: string,
  form: WizardFormData,
  studioId: string
): Promise<{ warnings: string[] }> {
  const supabase = createClient();
  const warnings: string[] = [];

  // ─── Client update ──────────────────────────────
  if (form.client_id) {
    const { error: clientErr } = await supabase
      .from("clients")
      .update({
        name: form.client_name.trim() || undefined,
        email: form.client_email.trim() || null,
        phone: form.client_phone.trim() || null,
        document: form.client_document.trim() || null,
      })
      .eq("id", form.client_id);
    if (clientErr) warnings.push("Erro ao atualizar cliente: " + clientErr.message);
  }

  // ─── Project update ─────────────────────────────
  const deliveryDeadlineDate =
    form.event_date && form.delivery_deadline_days
      ? addBusinessDays(new Date(form.event_date), form.delivery_deadline_days)
          .toISOString().split("T")[0]
      : null;

  const { error: projectError } = await supabase
    .from("projects")
    .update({
      client_id: form.client_id || null,
      name: form.project_name.trim(),
      event_type: form.event_type,
      event_date: form.event_date || null,
      event_time: form.event_time || null,
      event_location: form.locations[0]?.address || null,
      value: form.total_value,
      pack_id: form.pack_id || null,
      delivery_deadline_days: form.delivery_deadline_days || null,
      delivery_deadline_date: deliveryDeadlineDate,
      payment_method: form.payment_method || null,
      payment_split: form.payment_splits.length > 0 ? form.payment_splits : null,
      team_ids: form.selected_team_ids.length > 0 ? form.selected_team_ids : [],
      notes: form.notes.trim() || null,
    })
    .eq("id", projectId);

  if (projectError) {
    throw new Error(`Erro ao atualizar projeto: ${projectError.message}`);
  }

  // ─── Replace locations ──────────────────────────
  const validLocations = form.locations.filter(
    (loc) => loc.name.trim() || loc.address.trim()
  );

  await supabase.from("project_locations").delete().eq("project_id", projectId);

  if (validLocations.length > 0) {
    const locationRows = validLocations.map((loc, i) => ({
      project_id: projectId,
      studio_id: studioId,
      name: loc.name.trim(),
      address: loc.address.trim(),
      event_time: loc.event_time || null,
      sort_order: i,
    }));

    const { error: locError } = await supabase
      .from("project_locations")
      .insert(locationRows);

    if (locError) {
      warnings.push("Locais não foram salvos: " + locError.message);
    }
  }

  // ─── Replace installments ─────────────────────────
  await supabase.from("installments").delete().eq("project_id", projectId);

  if (form.payment_splits.length > 0 && form.total_value > 0) {
    const installmentRows = form.payment_splits.map((split) => ({
      studio_id: studioId,
      project_id: projectId,
      client_id: form.client_id || null,
      type: "receita" as const,
      description: split.label,
      amount: Math.round((form.total_value * split.percent) / 100 * 100) / 100,
      due_date: split.due_date,
      status: "pendente" as const,
      payment_method: form.payment_method || null,
      category: "projeto",
    }));

    const { error: installError } = await supabase
      .from("installments")
      .insert(installmentRows);

    if (installError) {
      warnings.push("Parcelas não foram salvas: " + installError.message);
    }
  }

  // ─── Replace workflows ──────────────────────────
  await supabase.from("project_workflows").delete().eq("project_id", projectId);

  if (form.workflows.length > 0) {
    const workflowRows: {
      project_id: string;
      studio_id: string;
      name: string;
      status: "pendente";
      deadline: string | null;
      sort_order: number;
      notes: string | null;
      assigned_to: string | null;
    }[] = [];

    for (const wf of form.workflows) {
      for (const step of wf.steps) {
        const deadline =
          form.event_date && step.sla_days
            ? addBusinessDays(new Date(form.event_date), step.sla_days)
                .toISOString().split("T")[0]
            : null;

        workflowRows.push({
          project_id: projectId,
          studio_id: studioId,
          name: `${wf.name} — ${step.name}`,
          status: "pendente",
          deadline,
          sort_order: step.sort_order,
          notes: wf.backup_location || null,
          assigned_to: wf.editor_id || null,
        });
      }
    }

    const { error: wfError } = await supabase
      .from("project_workflows")
      .insert(workflowRows);

    if (wfError) {
      warnings.push("Workflows não foram salvos: " + wfError.message);
    }
  }

  // ─── Replace products ───────────────────────────
  await supabase.from("project_products").delete().eq("project_id", projectId);

  if (form.selected_products.length > 0) {
    const productRows = form.selected_products.map((p) => ({
      project_id: projectId,
      catalog_product_id: p.catalog_product_id,
      name: p.name,
      description: p.description,
      quantity: p.quantity,
      unit_price: p.unit_price,
      notes: p.notes,
    }));

    const { error: prodError } = await supabase
      .from("project_products")
      .insert(productRows);

    if (prodError) {
      warnings.push("Produtos não foram salvos: " + prodError.message);
    }
  }

  // ─── Sync project_items (portal) ───────────────
  await supabase.from("project_items").delete().eq("project_id", projectId);

  if (form.selected_products.length > 0 && form.client_id) {
    const itemRows = form.selected_products.map((p) => ({
      studio_id: studioId,
      client_id: form.client_id,
      project_id: projectId,
      name: p.name,
      description: p.description,
      category: "produto" as const,
      quantity: p.quantity,
      unit_price: p.unit_price,
      status: "contratado" as const,
    }));

    const { error: itemError } = await supabase
      .from("project_items")
      .insert(itemRows);

    if (itemError) {
      warnings.push("Itens do portal não foram sincronizados: " + itemError.message);
    }
  }

  // ─── Activity Log ───────────────────────────────
  await logActivity({
    studioId,
    projectId,
    entityType: "project",
    entityId: projectId,
    action: "updated",
    details: { message: `Projeto "${form.project_name}" atualizado via wizard` },
  });

  return { warnings };
}
