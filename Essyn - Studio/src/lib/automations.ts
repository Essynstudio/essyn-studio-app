/**
 * Essyn Studio — Automation Engine
 * Handles all studio automations: cron-based (daily digest) + event-triggered
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "./email";

// ── Default on/off per automation id ──────────────────────────────────────────
const AUTOMATION_DEFAULTS: Record<string, boolean> = {
  lembrete_pagamento: true,
  lead_sem_contato: true,
  avancar_producao: false,
  enviar_galeria: false,
  contrato_expirando: true,
  novo_cliente_portal: false,
  lembrete_evento: true,
  lembrete_sessao_cliente: true,
  cobranca_cliente: false,
  backup_fotos: false,
};

function isEnabled(settings: Record<string, boolean>, id: string): boolean {
  return id in settings ? settings[id] : (AUTOMATION_DEFAULTS[id] ?? false);
}

function dateISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function cur(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(v);
}

// ── Email templates (photographer notifications) ───────────────────────────────

function digestEmailWrapper(studioName: string, body: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;">
      <p style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#A58D66;margin-bottom:24px;">
        ${studioName} · Essyn Studio
      </p>
      ${body}
      <hr style="border:none;border-top:1px solid #E5E1DD;margin:32px 0;" />
      <p style="font-size:11px;color:#B5AFA6;">
        Você pode ajustar suas automações em <strong>Automações</strong> no painel.
      </p>
    </div>
  `;
}

function itemRow(text: string, detail?: string): string {
  return `
    <div style="padding:10px 0;border-bottom:1px solid #F0EDE9;">
      <span style="font-size:14px;color:#0C100E;">${text}</span>
      ${detail ? `<span style="font-size:12px;color:#7A8A8F;margin-left:8px;">${detail}</span>` : ""}
    </div>
  `;
}

function galleryReadyEmail({
  clientName,
  studioName,
  galleryName,
  galleryUrl,
  isProof,
}: {
  clientName: string;
  studioName: string;
  galleryName: string;
  galleryUrl: string;
  isProof: boolean;
}): { subject: string; html: string } {
  const action = isProof ? "selecionar suas fotos favoritas" : "baixar suas fotos";
  return {
    subject: `${isProof ? "Suas fotos estão prontas para seleção" : "Sua galeria final está pronta"} — ${studioName}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
        <p style="font-size:15px;color:#0C100E;line-height:1.6;">
          Olá <strong>${clientName}</strong>,
        </p>
        <p style="font-size:15px;color:#0C100E;line-height:1.6;">
          ${isProof
            ? `Suas fotos de <strong>${galleryName}</strong> já estão disponíveis para você fazer sua seleção.`
            : `Sua galeria final de <strong>${galleryName}</strong> está pronta!`
          }
        </p>
        <div style="margin:32px 0;">
          <a href="${galleryUrl}" style="display:inline-block;padding:14px 28px;background:#A58D66;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;">
            ${isProof ? "Ver e selecionar fotos" : "Acessar galeria"}
          </a>
        </div>
        <p style="font-size:13px;color:#7A8A8F;line-height:1.6;">
          Você pode ${action} diretamente pelo link acima.
        </p>
        <hr style="border:none;border-top:1px solid #E5E1DD;margin:24px 0;" />
        <p style="font-size:11px;color:#B5AFA6;">
          Enviado por <strong>${studioName}</strong> via <em>Essyn Studio</em>
        </p>
      </div>
    `,
  };
}

function sessionReminderClientEmail({
  clientName,
  studioName,
  eventTitle,
  date,
  time,
  location,
}: {
  clientName: string;
  studioName: string;
  eventTitle: string;
  date: string;
  time: string;
  location?: string;
}): { subject: string; html: string } {
  return {
    subject: `Lembrete: ${eventTitle} é amanhã — ${studioName}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
        <p style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#A58D66;margin-bottom:24px;">
          ${studioName}
        </p>
        <p style="font-size:15px;color:#0C100E;line-height:1.6;">
          Olá <strong>${clientName}</strong>,
        </p>
        <p style="font-size:15px;color:#0C100E;line-height:1.6;">
          Só um lembrete de que <strong>${eventTitle}</strong> está marcado para amanhã.
        </p>
        <div style="margin:28px 0;padding:20px;background:#F7F5F2;border-radius:12px;">
          <p style="margin:0 0 8px;font-size:13px;color:#7A8A8F;font-weight:500;">DETALHES</p>
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0C100E;">${date} às ${time}</p>
          ${location ? `<p style="margin:0;font-size:13px;color:#7A8A8F;">${location}</p>` : ""}
        </div>
        <p style="font-size:13px;color:#7A8A8F;line-height:1.6;">
          Em caso de dúvidas, entre em contato com o estúdio.
        </p>
        <hr style="border:none;border-top:1px solid #E5E1DD;margin:24px 0;" />
        <p style="font-size:11px;color:#B5AFA6;">
          Enviado por <strong>${studioName}</strong> via <em>Essyn Studio</em>
        </p>
      </div>
    `,
  };
}

function paymentReminderClientEmail({
  clientName,
  studioName,
  amount,
  description,
  dueDate,
}: {
  clientName: string;
  studioName: string;
  amount: number;
  description: string;
  dueDate: string;
}): { subject: string; html: string } {
  return {
    subject: `Lembrete de pagamento — ${studioName}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
        <p style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#A58D66;margin-bottom:24px;">
          ${studioName}
        </p>
        <p style="font-size:15px;color:#0C100E;line-height:1.6;">
          Olá <strong>${clientName}</strong>,
        </p>
        <p style="font-size:15px;color:#0C100E;line-height:1.6;">
          Identificamos um pagamento em aberto referente ao seu contrato com <strong>${studioName}</strong>.
        </p>
        <div style="margin:28px 0;padding:20px;background:#FFF8F0;border:1px solid #F59E0B33;border-radius:12px;">
          <p style="margin:0 0 8px;font-size:13px;color:#92400E;font-weight:500;">PAGAMENTO EM ABERTO</p>
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0C100E;">${description}</p>
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#0C100E;">${cur(amount)}</p>
          <p style="margin:0;font-size:12px;color:#92400E;">Venceu em ${dueDate}</p>
        </div>
        <p style="font-size:13px;color:#7A8A8F;line-height:1.6;">
          Entre em contato com o estúdio para regularizar ou agendar o pagamento.
        </p>
        <hr style="border:none;border-top:1px solid #E5E1DD;margin:24px 0;" />
        <p style="font-size:11px;color:#B5AFA6;">
          Enviado por <strong>${studioName}</strong> via <em>Essyn Studio</em>
        </p>
      </div>
    `,
  };
}

// ── Cron Automations (run daily) ──────────────────────────────────────────────

interface Studio {
  id: string;
  name: string;
  owner_id: string;
  settings: Record<string, unknown> | null;
}

export interface CronResult {
  studioId: string;
  studioName: string;
  ran: string[];
  skipped: string[];
  errors: string[];
}

export async function runCronAutomationsForStudio(
  supabase: SupabaseClient,
  studio: Studio,
  ownerEmail: string
): Promise<CronResult> {
  const automationSettings = (studio.settings?.automations as Record<string, boolean>) || {};
  const today = dateISO();
  const tomorrow = dateISO(1);
  const in7d = dateISO(7);
  const ago3d = dateISO(-3);

  const result: CronResult = {
    studioId: studio.id,
    studioName: studio.name,
    ran: [],
    skipped: [],
    errors: [],
  };

  // 1. Lembrete de pagamentos vencidos
  if (isEnabled(automationSettings, "lembrete_pagamento")) {
    try {
      const { data: overdue } = await supabase
        .from("installments")
        .select("amount, due_date, description")
        .eq("studio_id", studio.id)
        .eq("type", "receita")
        .in("status", ["pendente", "vencido"])
        .lt("due_date", today)
        .is("deleted_at", null)
        .limit(20);

      if (overdue && overdue.length > 0) {
        const total = overdue.reduce((s, i) => s + (i.amount || 0), 0);
        const rows = overdue
          .map((i) => itemRow(
            i.description || "Cobrança",
            `${cur(i.amount)} · venceu ${i.due_date}`
          ))
          .join("");

        const sent = await sendEmail({
          to: ownerEmail,
          subject: `${overdue.length} cobrança${overdue.length > 1 ? "s" : ""} vencida${overdue.length > 1 ? "s" : ""} — ${studio.name}`,
          html: digestEmailWrapper(studio.name, `
            <p style="font-size:18px;font-weight:600;color:#0C100E;margin-bottom:4px;">
              ${overdue.length} cobrança${overdue.length > 1 ? "s" : ""} vencida${overdue.length > 1 ? "s" : ""}
            </p>
            <p style="font-size:13px;color:#7A8A8F;margin-bottom:24px;">Total em aberto: ${cur(total)}</p>
            ${rows}
            <div style="margin-top:24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/financeiro" style="font-size:13px;color:#A58D66;text-decoration:none;font-weight:600;">
                Ver no Financeiro →
              </a>
            </div>
          `),
        });
        if (sent) result.ran.push("lembrete_pagamento");
        else result.errors.push("lembrete_pagamento: email failed");
      } else {
        result.skipped.push("lembrete_pagamento (nenhum vencido)");
      }
    } catch (e) {
      result.errors.push(`lembrete_pagamento: ${e}`);
    }
  } else {
    result.skipped.push("lembrete_pagamento (desativado)");
  }

  // 2. Leads sem contato (3+ dias úteis)
  if (isEnabled(automationSettings, "lead_sem_contato")) {
    try {
      const { data: stale } = await supabase
        .from("leads")
        .select("name, stage, estimated_value, next_action_date, updated_at")
        .eq("studio_id", studio.id)
        .not("stage", "in", '("ganho","perdido")')
        .or(`next_action_date.is.null,next_action_date.lt.${today}`)
        .lt("updated_at", `${ago3d}T00:00:00Z`)
        .is("deleted_at", null)
        .limit(15);

      if (stale && stale.length > 0) {
        const rows = stale
          .map((l) => itemRow(
            l.name,
            `${l.stage}${l.estimated_value ? ` · ${cur(l.estimated_value)}` : ""}`
          ))
          .join("");

        const sent = await sendEmail({
          to: ownerEmail,
          subject: `${stale.length} lead${stale.length > 1 ? "s" : ""} aguardando seu retorno — ${studio.name}`,
          html: digestEmailWrapper(studio.name, `
            <p style="font-size:18px;font-weight:600;color:#0C100E;margin-bottom:4px;">
              ${stale.length} lead${stale.length > 1 ? "s" : ""} sem contato
            </p>
            <p style="font-size:13px;color:#7A8A8F;margin-bottom:24px;">Sem ação nos últimos 3 dias úteis</p>
            ${rows}
            <div style="margin-top:24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/crm" style="font-size:13px;color:#A58D66;text-decoration:none;font-weight:600;">
                Ver no CRM →
              </a>
            </div>
          `),
        });
        if (sent) result.ran.push("lead_sem_contato");
        else result.errors.push("lead_sem_contato: email failed");
      } else {
        result.skipped.push("lead_sem_contato (nenhum parado)");
      }
    } catch (e) {
      result.errors.push(`lead_sem_contato: ${e}`);
    }
  } else {
    result.skipped.push("lead_sem_contato (desativado)");
  }

  // 3. Contratos expirando em 7 dias
  if (isEnabled(automationSettings, "contrato_expirando")) {
    try {
      const { data: expiring } = await supabase
        .from("contracts")
        .select("title, expires_at, clients(name)")
        .eq("studio_id", studio.id)
        .eq("status", "enviado")
        .gte("expires_at", today)
        .lte("expires_at", in7d)
        .limit(10);

      if (expiring && expiring.length > 0) {
        const rows = expiring
          .map((c) => {
            const client = Array.isArray(c.clients) ? c.clients[0] : c.clients;
            return itemRow(
              c.title,
              `${(client as { name?: string })?.name || ""} · expira ${c.expires_at}`
            );
          })
          .join("");

        const sent = await sendEmail({
          to: ownerEmail,
          subject: `${expiring.length} contrato${expiring.length > 1 ? "s" : ""} prestes a expirar — ${studio.name}`,
          html: digestEmailWrapper(studio.name, `
            <p style="font-size:18px;font-weight:600;color:#0C100E;margin-bottom:4px;">
              ${expiring.length} contrato${expiring.length > 1 ? "s" : ""} expirando em breve
            </p>
            <p style="font-size:13px;color:#7A8A8F;margin-bottom:24px;">Enviados mas ainda sem aceite do cliente</p>
            ${rows}
            <div style="margin-top:24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/contratos" style="font-size:13px;color:#A58D66;text-decoration:none;font-weight:600;">
                Ver contratos →
              </a>
            </div>
          `),
        });
        if (sent) result.ran.push("contrato_expirando");
        else result.errors.push("contrato_expirando: email failed");
      } else {
        result.skipped.push("contrato_expirando (nenhum expirando)");
      }
    } catch (e) {
      result.errors.push(`contrato_expirando: ${e}`);
    }
  } else {
    result.skipped.push("contrato_expirando (desativado)");
  }

  // 4. Eventos amanhã
  if (isEnabled(automationSettings, "lembrete_evento")) {
    try {
      const { data: events } = await supabase
        .from("events")
        .select("title, start_at, location, projects(name)")
        .eq("studio_id", studio.id)
        .gte("start_at", `${tomorrow}T00:00:00Z`)
        .lt("start_at", `${tomorrow}T23:59:59Z`)
        .is("deleted_at", null)
        .limit(10);

      if (events && events.length > 0) {
        const rows = events
          .map((ev) => {
            const time = new Date(ev.start_at).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const proj = Array.isArray(ev.projects) ? ev.projects[0] : ev.projects;
            return itemRow(
              ev.title,
              `${time}${ev.location ? ` · ${ev.location}` : ""}${(proj as { name?: string })?.name ? ` · ${(proj as { name?: string }).name}` : ""}`
            );
          })
          .join("");

        const sent = await sendEmail({
          to: ownerEmail,
          subject: `Você tem ${events.length} evento${events.length > 1 ? "s" : ""} amanhã — ${studio.name}`,
          html: digestEmailWrapper(studio.name, `
            <p style="font-size:18px;font-weight:600;color:#0C100E;margin-bottom:4px;">
              ${events.length} evento${events.length > 1 ? "s" : ""} amanhã
            </p>
            <p style="font-size:13px;color:#7A8A8F;margin-bottom:24px;">${new Date(tomorrow).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
            ${rows}
            <div style="margin-top:24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/agenda" style="font-size:13px;color:#A58D66;text-decoration:none;font-weight:600;">
                Ver agenda →
              </a>
            </div>
          `),
        });
        if (sent) result.ran.push("lembrete_evento");
        else result.errors.push("lembrete_evento: email failed");
      } else {
        result.skipped.push("lembrete_evento (sem eventos amanhã)");
      }
    } catch (e) {
      result.errors.push(`lembrete_evento: ${e}`);
    }
  } else {
    result.skipped.push("lembrete_evento (desativado)");
  }

  // 5. Galerias publicadas nas últimas 24h → email cliente
  if (isEnabled(automationSettings, "enviar_galeria")) {
    try {
      const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25h window
      const { data: galleries } = await supabase
        .from("galleries")
        .select("id, name, slug, status, settings, clients(name, email)")
        .eq("studio_id", studio.id)
        .in("status", ["prova", "final"])
        .gte("updated_at", since)
        .is("deleted_at", null)
        .limit(20);

      let sent = 0;
      for (const gallery of galleries || []) {
        const gSettings = (gallery.settings || {}) as Record<string, unknown>;
        if (gSettings.gallery_ready_notified) continue; // already sent

        const client = Array.isArray(gallery.clients) ? gallery.clients[0] : gallery.clients;
        const clientEmail = (client as { email?: string } | null)?.email;
        const clientName = (client as { name?: string } | null)?.name;

        if (!clientEmail) continue;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.essyn.studio";
        const galleryUrl = `${appUrl.replace("app.", "")}/g/${gallery.slug}`;

        const { subject, html } = galleryReadyEmail({
          clientName: clientName || "Cliente",
          studioName: studio.name,
          galleryName: gallery.name,
          galleryUrl,
          isProof: gallery.status === "prova",
        });

        const ok = await sendEmail({ to: clientEmail, subject, html });
        if (ok) {
          // Mark as notified in gallery settings
          await supabase
            .from("galleries")
            .update({ settings: { ...gSettings, gallery_ready_notified: new Date().toISOString() } })
            .eq("id", gallery.id);
          sent++;
        }
      }

      if (sent > 0) result.ran.push(`enviar_galeria (${sent} emails)`);
      else result.skipped.push("enviar_galeria (nenhuma nova publicação)");
    } catch (e) {
      result.errors.push(`enviar_galeria: ${e}`);
    }
  } else {
    result.skipped.push("enviar_galeria (desativado)");
  }

  // 6. Lembrete de sessão para o cliente (1 dia antes)
  if (isEnabled(automationSettings, "lembrete_sessao_cliente")) {
    try {
      const { data: events } = await supabase
        .from("events")
        .select("title, start_at, location, projects(name, clients(name, email))")
        .eq("studio_id", studio.id)
        .gte("start_at", `${tomorrow}T00:00:00Z`)
        .lt("start_at", `${tomorrow}T23:59:59Z`)
        .not("project_id", "is", null)
        .is("deleted_at", null)
        .limit(20);

      let sent = 0;
      for (const ev of events || []) {
        const proj = Array.isArray(ev.projects) ? ev.projects[0] : ev.projects;
        const client = (proj as { clients?: { name?: string; email?: string } | { name?: string; email?: string }[] } | null)?.clients;
        const c = Array.isArray(client) ? client[0] : client;
        if (!c?.email) continue;

        const start = new Date(ev.start_at);
        const date = start.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
        const time = start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        const { subject, html } = sessionReminderClientEmail({
          clientName: c.name || "Cliente",
          studioName: studio.name,
          eventTitle: ev.title,
          date,
          time,
          location: ev.location || undefined,
        });

        const ok = await sendEmail({ to: c.email, subject, html });
        if (ok) sent++;
      }

      if (sent > 0) result.ran.push(`lembrete_sessao_cliente (${sent} emails)`);
      else result.skipped.push("lembrete_sessao_cliente (sem sessões com cliente amanhã)");
    } catch (e) {
      result.errors.push(`lembrete_sessao_cliente: ${e}`);
    }
  } else {
    result.skipped.push("lembrete_sessao_cliente (desativado)");
  }

  // 7. Cobrança vencida para o cliente (dispara apenas no 1º dia de atraso)
  if (isEnabled(automationSettings, "cobranca_cliente")) {
    try {
      const yesterday = dateISO(-1);
      const { data: overdue } = await supabase
        .from("installments")
        .select("amount, due_date, description, projects(name, clients(name, email))")
        .eq("studio_id", studio.id)
        .eq("type", "receita")
        .in("status", ["pendente", "vencido"])
        .eq("due_date", yesterday)
        .is("deleted_at", null)
        .limit(20);

      let sent = 0;
      for (const inst of overdue || []) {
        const proj = Array.isArray(inst.projects) ? inst.projects[0] : inst.projects;
        const client = (proj as { clients?: { name?: string; email?: string } | { name?: string; email?: string }[] } | null)?.clients;
        const c = Array.isArray(client) ? client[0] : client;
        if (!c?.email) continue;

        const { subject, html } = paymentReminderClientEmail({
          clientName: c.name || "Cliente",
          studioName: studio.name,
          amount: inst.amount || 0,
          description: inst.description || "Pagamento",
          dueDate: inst.due_date,
        });

        const ok = await sendEmail({ to: c.email, subject, html });
        if (ok) sent++;
      }

      if (sent > 0) result.ran.push(`cobranca_cliente (${sent} emails)`);
      else result.skipped.push("cobranca_cliente (sem vencimentos ontem)");
    } catch (e) {
      result.errors.push(`cobranca_cliente: ${e}`);
    }
  } else {
    result.skipped.push("cobranca_cliente (desativado)");
  }

  return result;
}

// ── Event Trigger Automations ─────────────────────────────────────────────────

export type AutomationTrigger =
  | { action: "client_created"; clientId: string; clientName: string; clientEmail: string }
  | { action: "workflow_all_done"; projectId: string };

export async function runTriggerAutomation(
  supabase: SupabaseClient,
  studio: Studio,
  trigger: AutomationTrigger
): Promise<{ success: boolean; message: string }> {
  const automationSettings = (studio.settings?.automations as Record<string, boolean>) || {};

  // ── Client created → send portal access automatically ─────────────────────
  if (trigger.action === "client_created") {
    if (!isEnabled(automationSettings, "novo_cliente_portal")) {
      return { success: false, message: "novo_cliente_portal desativado" };
    }

    if (!trigger.clientEmail) {
      return { success: false, message: "cliente sem email" };
    }

    try {
      // Generate magic link via Supabase admin auth
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.essyn.studio";

      // Create a portal session token (same pattern as /api/portal/send-access)
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await supabase.from("client_portal_sessions").upsert({
        client_id: trigger.clientId,
        studio_id: studio.id,
        session_token: token,
        expires_at: expiresAt,
      }, { onConflict: "client_id,studio_id" });

      const portalUrl = `${appUrl}/portal/login?token=${token}`;

      const { portalAccessEmail } = await import("./email");
      const { subject, html } = portalAccessEmail({
        clientName: trigger.clientName,
        studioName: studio.name,
        portalUrl,
      });

      const sent = await sendEmail({ to: trigger.clientEmail, subject, html });
      return {
        success: sent,
        message: sent ? "portal access sent" : "email failed",
      };
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  // ── All workflow items done → advance production phase ─────────────────────
  if (trigger.action === "workflow_all_done") {
    if (!isEnabled(automationSettings, "avancar_producao")) {
      return { success: false, message: "avancar_producao desativado" };
    }

    try {
      const { data: project } = await supabase
        .from("projects")
        .select("id, production_phase")
        .eq("id", trigger.projectId)
        .eq("studio_id", studio.id)
        .single();

      if (!project) return { success: false, message: "project not found" };

      const phases = [
        "importacao",
        "selecao",
        "edicao",
        "exportacao",
        "entrega",
        "concluido",
      ];
      const currentIdx = phases.indexOf(project.production_phase || "importacao");
      const nextPhase = phases[Math.min(currentIdx + 1, phases.length - 1)];

      if (nextPhase === project.production_phase) {
        return { success: false, message: "já na última fase" };
      }

      const { error } = await supabase
        .from("projects")
        .update({ production_phase: nextPhase })
        .eq("id", trigger.projectId)
        .eq("studio_id", studio.id);

      return {
        success: !error,
        message: error ? error.message : `production_phase → ${nextPhase}`,
      };
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  return { success: false, message: "unknown action" };
}
