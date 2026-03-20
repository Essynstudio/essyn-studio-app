"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Image,
  ShoppingBag,
  CalendarDays,
  FileText,
  Heart,
  Plus,
  Pencil,
  Eye,
  Mail,
  Trash2,
  Loader2,
  Variable,
} from "lucide-react";
import {
  PageTransition,
  HeaderWidget,
  WidgetCard,
  AppleModal,
  WidgetEmptyState,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  COMPACT_SECONDARY_CTA,
  INPUT_CLS,
  LABEL_CLS,
} from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  studio_id?: string;
  title: string;
  subject: string;
  body: string;
  template_key?: string | null;
  is_active?: boolean;
}

// Default templates seeded for new studios
const DEFAULT_TEMPLATES: Omit<EmailTemplate, "id" | "studio_id">[] = [
  {
    title: "Galeria Pronta",
    subject: "Sua galeria está pronta! 📸",
    body: "Olá {nome},\n\nSua galeria do evento {evento} está pronta! Acesse pelo link abaixo para visualizar e selecionar suas fotos favoritas.\n\n{link_galeria}\n\nQualquer dúvida, estamos à disposição.\n\nAbraços,\n{estudio}",
    template_key: "galeria-pronta",
  },
  {
    title: "Confirmação de Pedido",
    subject: "Pedido confirmado - #{numero_pedido}",
    body: "Olá {nome},\n\nSeu pedido #{numero_pedido} foi confirmado com sucesso!\n\nDetalhes:\n{detalhes_pedido}\n\nPrevisão de entrega: {prazo}\n\nObrigado pela confiança!\n\n{estudio}",
    template_key: "confirmacao-pedido",
  },
  {
    title: "Lembrete de Evento",
    subject: "Lembrete: seu evento é em {dias} dias!",
    body: "Olá {nome},\n\nSeu evento {tipo_evento} está chegando! Aqui estão os detalhes:\n\nData: {data}\nLocal: {local}\nHorário: {horario}\n\nNos encontramos lá!\n\n{estudio}",
    template_key: "lembrete-evento",
  },
  {
    title: "Contrato Enviado",
    subject: "Contrato para assinatura — {evento}",
    body: "Olá {nome},\n\nEnviamos o contrato referente ao serviço de {tipo_servico} para o evento {evento}.\n\nPor favor, revise os termos e assine digitalmente pelo link abaixo:\n\n{link_contrato}\n\nEm caso de dúvidas, estamos à disposição.\n\n{estudio}",
    template_key: "contrato-enviado",
  },
  {
    title: "Boas-vindas",
    subject: "Bem-vindo(a) ao {estudio}!",
    body: "Olá {nome},\n\nÉ um prazer enorme ter você como cliente! Estamos muito animados para registrar os melhores momentos do seu {tipo_evento}.\n\nNos próximos dias entraremos em contato para alinhar todos os detalhes.\n\nSeja muito bem-vindo(a)!\n\nCom carinho,\n{estudio}",
    template_key: "boas-vindas",
  },
];

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "galeria-pronta": Image,
  "confirmacao-pedido": ShoppingBag,
  "lembrete-evento": CalendarDays,
  "contrato-enviado": FileText,
  "boas-vindas": Heart,
};

const VARIABLES = [
  { var: "{nome}", desc: "Nome do cliente" },
  { var: "{evento}", desc: "Nome/tipo do evento" },
  { var: "{data}", desc: "Data do evento" },
  { var: "{local}", desc: "Local do evento" },
  { var: "{horario}", desc: "Horário do evento" },
  { var: "{estudio}", desc: "Nome do estúdio" },
  { var: "{link_galeria}", desc: "Link da galeria" },
  { var: "{link_contrato}", desc: "Link do contrato" },
  { var: "{numero_pedido}", desc: "Número do pedido" },
  { var: "{prazo}", desc: "Prazo de entrega" },
  { var: "{tipo_servico}", desc: "Tipo de serviço" },
  { var: "{tipo_evento}", desc: "Tipo de evento" },
  { var: "{dias}", desc: "Dias até o evento" },
  { var: "{detalhes_pedido}", desc: "Detalhes do pedido" },
];

export function EmailTemplatesClient({ studioId }: { studioId: string }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_templates")
      .select("*")
      .eq("studio_id", studioId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      setTemplates(data);
    } else {
      // Seed defaults for new studios
      const seeds = DEFAULT_TEMPLATES.map((t) => ({ ...t, studio_id: studioId, is_active: true }));
      const { data: seeded, error: seedError } = await supabase
        .from("email_templates")
        .insert(seeds)
        .select();
      if (seedError) toast.error("Erro ao carregar modelos padrão.");
      setTemplates(seeded || []);
    }
    setLoading(false);
  }, [studioId, supabase]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  async function handleDelete(template: EmailTemplate) {
    setDeleting(true);
    const { error } = await supabase
      .from("email_templates")
      .update({ is_active: false })
      .eq("id", template.id);
    if (error) {
      toast.error("Erro ao remover template.");
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      setDeleteTarget(null);
      toast.success("Template removido.");
    }
    setDeleting(false);
  }

  const TemplateIcon = (key?: string | null) => {
    const Icon = (key && TEMPLATE_ICONS[key]) || Mail;
    return Icon;
  };

  return (
    <PageTransition>
      <HeaderWidget
        title="Modelos de Email"
        subtitle="Personalize os emails enviados automaticamente para seus clientes"
      >
        <button onClick={() => setShowNewForm(true)} className={PRIMARY_CTA}>
          <Plus size={16} />
          Novo modelo
        </button>
      </HeaderWidget>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[var(--fg-muted)]" />
        </div>
      ) : templates.length === 0 ? (
        <WidgetCard hover={false}>
          <WidgetEmptyState
            icon={Mail}
            title="Nenhum modelo de email"
            description="Crie modelos para enviar aos clientes automaticamente."
            action={
              <button onClick={() => setShowNewForm(true)} className={PRIMARY_CTA}>
                <Plus size={16} /> Novo modelo
              </button>
            }
          />
        </WidgetCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template, i) => {
            const Icon = TemplateIcon(template.template_key);
            return (
              <motion.div
                key={template.id}
                {...springContentIn}
                transition={{ ...springContentIn.transition, delay: i * 0.04 }}
              >
                <WidgetCard className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
                      <Icon size={17} className="text-[var(--accent)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-semibold text-[var(--fg)] leading-snug">
                        {template.title}
                      </h3>
                      <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 truncate">
                        {template.subject}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--fg-secondary)] mb-4 flex-1 line-clamp-2 whitespace-pre-line leading-relaxed">
                    {template.body.split("\n")[0]}
                  </p>

                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => setEditTemplate(template)}
                      className={COMPACT_SECONDARY_CTA}
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className={COMPACT_SECONDARY_CTA}
                    >
                      <Eye size={12} />
                      Preview
                    </button>
                    <button
                      onClick={() => setDeleteTarget(template)}
                      className="ml-auto h-7 w-7 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:text-[var(--error)] hover:bg-[color-mix(in_srgb,var(--error)_8%,transparent)] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </WidgetCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Variables reference card */}
      <div className="bg-[var(--card)] rounded-2xl p-5 mt-2" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Variable size={14} className="text-[var(--fg-muted)]" />
          <h3 className="text-[13px] font-medium text-[var(--fg)]">Variáveis disponíveis</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {VARIABLES.map((v) => (
            <div key={v.var} className="flex items-start gap-2">
              <code className="text-[10px] font-mono bg-[var(--bg-muted)] px-1.5 py-0.5 rounded text-[var(--accent)] shrink-0">
                {v.var}
              </code>
              <span className="text-[10px] text-[var(--fg-muted)] leading-tight">{v.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      <AppleModal
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate?.title || ""}
        maxWidth="max-w-lg"
      >
        {previewTemplate && (
          <div className="p-6 space-y-4">
            <div>
              <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wider mb-1">Assunto</p>
              <p className="text-[13px] font-medium text-[var(--fg)]">{previewTemplate.subject}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wider mb-1">Corpo</p>
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)]">
                <p className="text-[13px] text-[var(--fg)] whitespace-pre-wrap leading-relaxed">
                  {previewTemplate.body}
                </p>
              </div>
            </div>
          </div>
        )}
      </AppleModal>

      {/* Delete Confirm Modal */}
      <AppleModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover modelo"
      >
        {deleteTarget && (
          <div className="p-6 space-y-4">
            <p className="text-[13px] text-[var(--fg-secondary)]">
              Tem certeza que deseja remover o modelo <strong>{deleteTarget.title}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setDeleteTarget(null)} className={SECONDARY_CTA}>
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="h-9 px-4 rounded-xl text-[13px] font-medium bg-[var(--error)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Remover
              </button>
            </div>
          </div>
        )}
      </AppleModal>

      {/* Edit Modal */}
      <TemplateFormModal
        open={!!editTemplate}
        template={editTemplate || undefined}
        studioId={studioId}
        onClose={() => setEditTemplate(null)}
        onSave={(updated) => {
          setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          setEditTemplate(null);
        }}
      />

      {/* New Modal */}
      <TemplateFormModal
        open={showNewForm}
        studioId={studioId}
        onClose={() => setShowNewForm(false)}
        onSave={(created) => {
          setTemplates((prev) => [...prev, created]);
          setShowNewForm(false);
        }}
      />
    </PageTransition>
  );
}

/* ═══════════ Form Modal ═══════════ */

function TemplateFormModal({
  open,
  template,
  studioId,
  onClose,
  onSave,
}: {
  open: boolean;
  template?: EmailTemplate;
  studioId: string;
  onClose: () => void;
  onSave: (template: EmailTemplate) => void;
}) {
  const isEditing = !!template;
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", body: "" });

  useEffect(() => {
    if (open) {
      setForm({
        title: template?.title || "",
        subject: template?.subject || "",
        body: template?.body || "",
      });
    }
  }, [open, template]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim()) return;
    setLoading(true);

    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      body: form.body.trim(),
    };

    if (isEditing && template) {
      const { data, error } = await supabase
        .from("email_templates")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", template.id)
        .select()
        .single();
      if (error) { toast.error("Erro ao salvar modelo."); setLoading(false); return; }
      if (data) onSave(data);
      toast.success("Modelo atualizado!");
    } else {
      const { data, error } = await supabase
        .from("email_templates")
        .insert({ ...payload, studio_id: studioId, is_active: true })
        .select()
        .single();
      if (error) { toast.error("Erro ao criar modelo."); setLoading(false); return; }
      if (data) onSave(data);
      toast.success("Modelo criado!");
    }

    setLoading(false);
  }

  const insertVariable = (fieldKey: "subject" | "body", variable: string) => {
    setForm((prev) => ({ ...prev, [fieldKey]: prev[fieldKey] + variable }));
  };

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar modelo" : "Novo modelo de email"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        <div>
          <label className={LABEL_CLS}>Nome do modelo *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Confirmação de reserva"
            required
            autoFocus
            className={INPUT_CLS}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={LABEL_CLS}>Assunto *</label>
            <VariableDropdown onInsert={(v) => insertVariable("subject", v)} />
          </div>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Ex: Sua galeria está pronta, {nome}!"
            required
            className={INPUT_CLS}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={LABEL_CLS}>Corpo do email</label>
            <VariableDropdown onInsert={(v) => insertVariable("body", v)} />
          </div>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={8}
            placeholder={"Olá {nome},\n\nEscreva seu email aqui...\n\n{estudio}"}
            className={INPUT_CLS + " !h-auto py-3 resize-none font-mono text-[12px]"}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={SECONDARY_CTA}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !form.title.trim() || !form.subject.trim()}
            className={PRIMARY_CTA}
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Salvando...</>
            ) : isEditing ? "Salvar alterações" : "Criar modelo"}
          </button>
        </div>
      </form>
    </AppleModal>
  );
}

function VariableDropdown({ onInsert }: { onInsert: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] font-medium text-[var(--info)] hover:opacity-80 transition-opacity"
      >
        <Variable size={10} />
        Inserir variável
      </button>
      {open && (
        <div
          className="absolute right-0 top-5 z-50 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg p-2 w-52 max-h-52 overflow-y-auto"
          onBlur={() => setOpen(false)}
        >
          {VARIABLES.map((v) => (
            <button
              key={v.var}
              type="button"
              onClick={() => { onInsert(v.var); setOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--card-hover)] transition-colors text-left"
            >
              <code className="text-[10px] font-mono text-[var(--accent)] shrink-0">{v.var}</code>
              <span className="text-[10px] text-[var(--fg-muted)] truncate">{v.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
