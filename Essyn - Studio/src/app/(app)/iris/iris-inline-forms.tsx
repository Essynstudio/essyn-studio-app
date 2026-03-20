"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

const inputCls = "w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--info)]/40 focus:border-[var(--info)] transition-all";
const labelCls = "block text-[11px] font-medium text-[var(--fg-muted)] mb-1";
const btnCls = "h-10 px-4 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-2 justify-center";

interface InlineFormProps {
  studioId: string;
  onComplete: (summary: string) => void;
}

// ═══════════════════════════════════════════════
// NEW CLIENT FORM
// ═══════════════════════════════════════════════

export function InlineClientForm({ studioId, onComplete }: InlineFormProps) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("clients")
      .insert({
        studio_id: studioId,
        name: form.name.trim(),
        email: form.email || null,
        phone: form.phone || null,
      })
      .select("id, name")
      .single();

    setSaving(false);
    if (error) {
      toast.error("Erro ao criar cliente: " + error.message);
      return;
    }

    setDone(true);
    onComplete(`Cliente **${data.name}** cadastrado com sucesso!`);
  }

  if (done) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3 max-w-sm shadow-[var(--shadow-apple)]">
      <p className="text-[12px] font-semibold text-[var(--fg)] uppercase tracking-wide">Novo Cliente</p>
      <div>
        <label className={labelCls}>Nome *</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Maria Silva" className={inputCls} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@cliente.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Telefone</label>
          <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className={inputCls} />
        </div>
      </div>
      <button type="submit" disabled={saving || !form.name.trim()} className={`${btnCls} w-full bg-[var(--info)] text-white hover:opacity-90 disabled:opacity-40`}>
        {saving ? <><Loader2 size={14} className="animate-spin" /> Criando...</> : "Cadastrar cliente"}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════
// NEW PROJECT FORM (completo — gera galeria, parcelas, workflow, evento)
// ═══════════════════════════════════════════════

export function InlineProjectForm({ studioId, onComplete }: InlineFormProps) {
  const [form, setForm] = useState({
    name: "", event_type: "casamento", event_date: "", event_time: "",
    client_name: "", local: "", valor: "", parcelas: "1", metodo: "pix",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const warnings: string[] = [];

    // 1. Find client
    let clientId = null;
    if (form.client_name.trim()) {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .eq("studio_id", studioId)
        .ilike("name", `%${form.client_name}%`)
        .is("deleted_at", null)
        .limit(1);
      if (clients?.length) clientId = clients[0].id;
    }

    const totalValue = form.valor ? Number(form.valor) : 0;

    // 2. Create project
    const { data, error } = await supabase
      .from("projects")
      .insert({
        studio_id: studioId,
        name: form.name.trim(),
        event_type: form.event_type,
        event_date: form.event_date || null,
        event_time: form.event_time || null,
        event_location: form.local || null,
        client_id: clientId,
        status: "rascunho",
        production_phase: "agendado",
        value: totalValue,
        paid: 0,
        payment_method: form.metodo || null,
        team_ids: [],
        tags: [],
      })
      .select("id, name")
      .single();

    if (error) {
      toast.error("Erro ao criar projeto: " + error.message);
      setSaving(false);
      return;
    }

    const projectId = data.id;
    const projectName = data.name;
    const created: string[] = ["Projeto"];

    // 3. Create installments
    if (totalValue > 0) {
      const numParcelas = Math.max(1, parseInt(form.parcelas) || 1);
      const parcelaValue = Math.round(totalValue / numParcelas);
      const now = new Date();
      const installments = Array.from({ length: numParcelas }, (_, i) => {
        const due = new Date(now);
        due.setDate(due.getDate() + 7 + i * 30);
        return {
          studio_id: studioId, project_id: projectId, client_id: clientId,
          type: "receita" as const, description: `Parcela ${i + 1}/${numParcelas} — ${projectName}`,
          amount: i === numParcelas - 1 ? totalValue - parcelaValue * (numParcelas - 1) : parcelaValue,
          due_date: due.toISOString().split("T")[0], status: "pendente" as const,
          payment_method: form.metodo || null,
        };
      });
      const { error: instErr } = await supabase.from("installments").insert(installments);
      if (!instErr) created.push(`${numParcelas} parcela${numParcelas > 1 ? "s" : ""}`);
      else warnings.push("Parcelas não foram criadas");
    }

    // 4. Create calendar event
    if (form.event_date) {
      const startAt = form.event_time
        ? `${form.event_date}T${form.event_time}:00`
        : `${form.event_date}T10:00:00`;
      const endDate = new Date(startAt);
      endDate.setHours(endDate.getHours() + 4);
      const { error: evErr } = await supabase.from("events").insert({
        studio_id: studioId, title: projectName, start_at: startAt,
        end_at: endDate.toISOString(), location: form.local || null,
        status: "confirmado", project_id: projectId,
      });
      if (!evErr) created.push("evento no calendário");
      else warnings.push("Evento não foi criado");
    }

    // 5. Create production workflow (7 steps)
    const steps = ["Agendamento", "Captação", "Seleção", "Edição", "Revisão", "Entrega", "Concluído"];
    const wfRows = steps.map((s, i) => ({
      studio_id: studioId, project_id: projectId,
      name: `${projectName} — ${s}`, status: "pendente",
      sort_order: i, notes: null, assigned_to: null,
    }));
    const { error: wfErr } = await supabase.from("project_workflows").insert(wfRows);
    if (!wfErr) created.push("produção (7 etapas)");
    else warnings.push("Workflow não foi criado");

    // 6. Create gallery
    const slug = form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    const { error: galErr } = await supabase.from("galleries").insert({
      studio_id: studioId, project_id: projectId, client_id: clientId,
      name: projectName, slug, status: "rascunho", privacy: "private",
      photo_count: 0, views: 0, downloads: 0, download_enabled: false, watermark_enabled: true,
    });
    if (!galErr) created.push("galeria");
    else warnings.push("Galeria não foi criada");

    setSaving(false);
    setDone(true);

    const summary = `Projeto **${projectName}** criado com sucesso!\n\n` +
      `Gerado automaticamente: ${created.join(", ")}.` +
      (warnings.length > 0 ? `\n\nAvisos: ${warnings.join(", ")}.` : "");
    onComplete(summary);
  }

  if (done) return null;

  const eventTypes = [
    { value: "casamento", label: "Casamento" },
    { value: "ensaio", label: "Ensaio" },
    { value: "aniversario", label: "Aniversário" },
    { value: "corporativo", label: "Corporativo" },
    { value: "formatura", label: "Formatura" },
    { value: "batizado", label: "Batizado" },
    { value: "outro", label: "Outro" },
  ];

  const paymentMethods = [
    { value: "pix", label: "PIX" },
    { value: "cartao_credito", label: "Cartão" },
    { value: "boleto", label: "Boleto" },
    { value: "transferencia", label: "Transferência" },
    { value: "dinheiro", label: "Dinheiro" },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-3 max-w-md shadow-[var(--shadow-apple)]">
      <p className="text-[12px] font-semibold text-[var(--fg)] uppercase tracking-wide">Novo Projeto</p>

      {/* Nome */}
      <div>
        <label className={labelCls}>Nome do projeto *</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Casamento Ana e Pedro" className={inputCls} autoFocus />
      </div>

      {/* Tipo + Data + Hora */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelCls}>Tipo</label>
          <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} className={inputCls + " cursor-pointer"}>
            {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Data</label>
          <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Hora</label>
          <input type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} className={inputCls} />
        </div>
      </div>

      {/* Cliente + Local */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Cliente (buscar por nome)</label>
          <input type="text" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Ex: Ana Silva" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Local</label>
          <input type="text" value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} placeholder="Ex: Igreja São José" className={inputCls} />
        </div>
      </div>

      {/* Valor + Parcelas + Método */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelCls}>Valor (R$)</label>
          <input type="number" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} placeholder="10000" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Parcelas</label>
          <select value={form.parcelas} onChange={e => setForm({ ...form, parcelas: e.target.value })} className={inputCls + " cursor-pointer"}>
            {[1,2,3,4,5,6,7,8,9,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Pagamento</label>
          <select value={form.metodo} onChange={e => setForm({ ...form, metodo: e.target.value })} className={inputCls + " cursor-pointer"}>
            {paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <button type="submit" disabled={saving || !form.name.trim()} className={`${btnCls} w-full bg-[var(--info)] text-white hover:opacity-90 disabled:opacity-40`}>
        {saving ? <><Loader2 size={14} className="animate-spin" /> Criando projeto completo...</> : "Criar projeto completo"}
      </button>
      <p className="text-[10px] text-[var(--fg-muted)] text-center leading-relaxed">
        Gera automaticamente: galeria, parcelas financeiras, evento no calendário e workflow de produção com 7 etapas.
      </p>
    </form>
  );
}

// ═══════════════════════════════════════════════
// NEW TEAM MEMBER FORM
// ═══════════════════════════════════════════════

export function InlineTeamForm({ studioId, onComplete }: InlineFormProps) {
  const [form, setForm] = useState({ name: "", email: "", role: "fotografo" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          sendMethod: "email",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar convite");
        setSaving(false);
        return;
      }

      setDone(true);
      setSaving(false);
      onComplete(`Convite enviado para **${form.name}** (${form.email}) como **${form.role}**!`);
    } catch {
      toast.error("Erro de conexão");
      setSaving(false);
    }
  }

  if (done) return null;

  const roles = [
    { value: "fotografo", label: "Fotógrafo" },
    { value: "editor", label: "Editor" },
    { value: "assistente", label: "Assistente" },
    { value: "videomaker", label: "Videomaker" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3 max-w-sm shadow-[var(--shadow-apple)]">
      <p className="text-[12px] font-semibold text-[var(--fg)] uppercase tracking-wide">Convidar Membro</p>
      <div>
        <label className={labelCls}>Nome *</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Carlos Mendes" className={inputCls} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Email *</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@equipe.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Função</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputCls + " cursor-pointer"}>
            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" disabled={saving || !form.name.trim() || !form.email.trim()} className={`${btnCls} w-full bg-[var(--info)] text-white hover:opacity-90 disabled:opacity-40`}>
        {saving ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : "Enviar convite"}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════
// NEW LEAD FORM
// ═══════════════════════════════════════════════

export function InlineLeadForm({ studioId, onComplete }: InlineFormProps) {
  const [form, setForm] = useState({ name: "", email: "", event_type: "casamento", estimated_value: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("leads")
      .insert({
        studio_id: studioId,
        name: form.name.trim(),
        email: form.email || null,
        event_type: form.event_type,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : 0,
        stage: "novo",
      })
      .select("id, name")
      .single();

    setSaving(false);
    if (error) {
      toast.error("Erro ao criar lead: " + error.message);
      return;
    }

    setDone(true);
    onComplete(`Lead **${data.name}** adicionado ao CRM no estágio **Novo**!`);
  }

  if (done) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3 max-w-sm shadow-[var(--shadow-apple)]">
      <p className="text-[12px] font-semibold text-[var(--fg)] uppercase tracking-wide">Novo Lead</p>
      <div>
        <label className={labelCls}>Nome *</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: João Silva" className={inputCls} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@lead.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Valor estimado</label>
          <input type="number" value={form.estimated_value} onChange={e => setForm({ ...form, estimated_value: e.target.value })} placeholder="8000" className={inputCls} />
        </div>
      </div>
      <button type="submit" disabled={saving || !form.name.trim()} className={`${btnCls} w-full bg-[var(--info)] text-white hover:opacity-90 disabled:opacity-40`}>
        {saving ? <><Loader2 size={14} className="animate-spin" /> Criando...</> : "Registrar lead"}
      </button>
    </form>
  );
}
