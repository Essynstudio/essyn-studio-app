import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/log-activity";
import { addBusinessDays } from "@/lib/business-days";
import type { WizardFormData } from "@/lib/types";

export async function createProject(
  form: WizardFormData,
  studioId: string
): Promise<{ projectId: string; warnings: string[] }> {
  const supabase = createClient();
  const warnings: string[] = [];

  // ─── Step 1: Client (optional) ────────────────────
  let clientId: string | null = form.client_id || null;

  if (form.client_mode === "new" && form.client_name.trim()) {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        studio_id: studioId,
        name: form.client_name.trim(),
        email: form.client_email.trim() || null,
        phone: form.client_phone.trim() || null,
        document: form.client_document.trim() || null,
        status: "ativo",
        tags: [],
      })
      .select("id")
      .single();

    if (clientError || !newClient) {
      throw new Error(`Erro ao criar cliente: ${clientError?.message || "Desconhecido"}`);
    }
    clientId = newClient.id;
  }

  // ─── Step 2: Project ───────────────────────────────
  const deliveryDeadlineDate =
    form.event_date && form.delivery_deadline_days
      ? addBusinessDays(new Date(form.event_date), form.delivery_deadline_days)
          .toISOString().split("T")[0]
      : null;

  // Build insert payload — only include columns that exist on the table
  const projectPayload: Record<string, unknown> = {
    studio_id: studioId,
    client_id: clientId,
    name: form.project_name.trim(),
    event_type: form.event_type,
    status: "rascunho",
    production_phase: "agendado",
    event_date: form.event_date || null,
    event_time: form.event_time || null,
    event_location: form.locations[0]?.address || null,
    value: form.total_value || 0,
    paid: 0,
    pack_id: form.pack_id || null,
    delivery_deadline_days: form.delivery_deadline_days || null,
    delivery_deadline_date: deliveryDeadlineDate,
    payment_method: form.payment_method || null,
    payment_split: form.payment_splits.length > 0 ? form.payment_splits : null,
    team_ids: form.selected_team_ids.length > 0 ? form.selected_team_ids : [],
    notes: form.notes.trim() || null,
    tags: [],
  };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert(projectPayload)
    .select("id")
    .single();

  if (projectError) {
    console.error("[Wizard] Project creation error:", projectError);
    throw new Error(`Erro ao criar projeto: ${projectError.message}`);
  }

  if (!project) {
    console.error("[Wizard] Project creation returned no data (possible RLS block)");
    throw new Error("Erro ao criar projeto: operação bloqueada. Verifique suas permissões.");
  }

  const projectId = project.id;

  // ─── Step 3: Project Locations ─────────────────────
  const validLocations = form.locations.filter(
    (loc) => loc.name.trim() || loc.address.trim()
  );

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

  // ─── Step 4: Installments ─────────────────────────
  if (form.payment_splits.length > 0 && form.total_value > 0) {
    const installmentRows = form.payment_splits.map((split) => ({
      studio_id: studioId,
      project_id: projectId,
      client_id: clientId || null,
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

  // ─── Step 5: Project Workflows ────────────────────
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

  // ─── Step 6: Project Products ─────────────────────
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

    // Sync to project_items (visible in client portal)
    if (clientId) {
      const itemRows = form.selected_products.map((p) => ({
        studio_id: studioId,
        client_id: clientId,
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
  }

  // ─── Step 7: Events ────────────
  if (form.event_date) {
    const time = form.event_time || "09:00";
    const startAt = `${form.event_date}T${time}:00`;

    if (validLocations.length > 0) {
      // One event per location
      const eventRows = validLocations.map((loc) => {
        const locTime = loc.event_time || time;
        return {
          project_id: projectId,
          studio_id: studioId,
          title: loc.name.trim() || form.project_name,
          description: `${form.event_type} — ${form.project_name}`,
          start_at: `${form.event_date}T${locTime}:00`,
          location: loc.address.trim() || null,
          status: "agendado" as const,
        };
      });

      const { error: eventError } = await supabase
        .from("events")
        .insert(eventRows);

      if (eventError) {
        warnings.push("Eventos não foram salvos: " + eventError.message);
      }
    } else {
      // No locations — still create a calendar event
      const { error: eventError } = await supabase
        .from("events")
        .insert({
          project_id: projectId,
          studio_id: studioId,
          title: form.project_name,
          description: `${form.event_type} — ${form.project_name}`,
          start_at: startAt,
          location: form.locations[0]?.address?.trim() || null,
          status: "agendado",
        });

      if (eventError) {
        warnings.push("Evento não foi salvo: " + eventError.message);
      }
    }
  }

  // ─── Step 8: Gallery (auto-create) ───────────────
  if (form.gallery_auto_create) {
    const gallerySlug = form.project_name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Gallery inherits the project's delivery deadline
    const galleryDeliveryDays = form.delivery_deadline_days || form.gallery_delivery_days || 60;
    const galleryDeadlineDate =
      form.event_date && galleryDeliveryDays
        ? addBusinessDays(new Date(form.event_date), galleryDeliveryDays)
            .toISOString().split("T")[0]
        : null;

    // If event is in the future, mark as "agendada" so it stays hidden until event day
    const galleryStatus =
      form.event_date && new Date(form.event_date) > new Date()
        ? "agendada"
        : "rascunho";

    const { error: galleryError } = await supabase
      .from("galleries")
      .insert({
        studio_id: studioId,
        project_id: projectId,
        client_id: clientId || null,
        name: form.project_name.trim(),
        slug: gallerySlug + "-" + Date.now().toString(36),
        status: galleryStatus,
        privacy: form.gallery_privacy || "privado",
        download_enabled: form.gallery_download_enabled ?? true,
        watermark_enabled: false,
        photo_count: 0,
        views: 0,
        downloads: 0,
        delivery_deadline_days: form.gallery_delivery_days,
        delivery_deadline_date: galleryDeadlineDate,
        settings: { auto_created: true },
      });

    if (galleryError) {
      warnings.push("Galeria não foi criada: " + galleryError.message);
    }
  }

  // ─── Step 9: Contract Upload ────────────────────
  if (form.contract_file) {
    const file = form.contract_file;
    const fileExt = file.name.split(".").pop() || "pdf";
    const filePath = `${studioId}/${projectId}/contrato.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      warnings.push("Contrato não foi enviado: " + uploadError.message);
    } else {
      const { data: urlData } = supabase.storage
        .from("contracts")
        .getPublicUrl(filePath);

      const contractTitle = form.contract_name.trim() || form.project_name;

      const { error: contractError } = await supabase
        .from("contracts")
        .insert({
          studio_id: studioId,
          project_id: projectId,
          client_id: clientId || null,
          title: contractTitle,
          content: "",
          value: form.total_value,
          status: "rascunho" as const,
          file_url: urlData?.publicUrl || filePath,
        });

      if (contractError) {
        warnings.push("Registro do contrato não foi salvo: " + contractError.message);
      }
    }
  }

  // ─── Step 10: Activity Log ────────────────────────
  await logActivity({
    studioId,
    projectId,
    entityType: "project",
    entityId: projectId,
    action: "created",
    details: { message: `Projeto "${form.project_name}" criado` },
  });

  return { projectId, warnings };
}
