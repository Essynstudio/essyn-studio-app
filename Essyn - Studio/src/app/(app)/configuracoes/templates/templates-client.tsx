"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  GitBranch,
  Plus,
  Search,
  Layers,
  Clock,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  DollarSign,
  MessageSquare,
  Inbox,
  SearchX,
} from "lucide-react";
import {
  PageTransition,
  WidgetEmptyState,
  AppleModal,
  ActionPill,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  INPUT_CLS,
  SELECT_CLS,
  LABEL_CLS,
  GHOST_BTN,
} from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";
import type { WorkflowTemplate } from "@/lib/types";

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  casamento: { label: "Casamento", color: "var(--error)" },
  ensaio: { label: "Ensaio", color: "var(--accent)" },
  corporativo: { label: "Corporativo", color: "var(--info)" },
  album: { label: "Álbum", color: "var(--brand, var(--accent))" },
  geral: { label: "Geral", color: "var(--fg-muted)" },
};

const PRESET_COLORS = [
  "#B84233", "#C87A20", "#A58D66", "#2D7A4F",
  "#2C444D", "#6B5B8D", "#A0566B", "#7A8A8F",
];

type Tab = "workflows" | "cobranca" | "mensagens";

const rowStagger = {
  initial: { opacity: 0, y: 6 },
  animate: (idx: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 26, delay: idx * 0.015 },
  }),
};

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

export function TemplatesClient({
  studioId,
  initialWorkflows = [],
}: {
  studioId: string;
  initialWorkflows?: WorkflowTemplate[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("workflows");
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>(initialWorkflows);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WorkflowTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    category: "casamento",
    color: "#2C444D",
    default_days: 14,
    steps: 4,
    active: true,
    description: "",
  });

  // Computed
  const activeCount = workflows.filter((w) => w.active).length;
  const totalSteps = workflows.reduce((sum, w) => sum + (w.sort_order || 0), 0) || workflows.length * 5;
  const avgDuration = workflows.length > 0
    ? Math.round(workflows.reduce((sum, w) => sum + w.default_days, 0) / workflows.length)
    : 0;

  const filteredWorkflows = workflows.filter((w) => {
    if (catFilter !== "all" && w.category !== catFilter) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categoryCounts = workflows.reduce((acc, w) => {
    acc[w.category] = (acc[w.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Handlers
  function openNew() {
    setEditing(null);
    setForm({ name: "", category: "casamento", color: "#2C444D", default_days: 14, steps: 4, active: true, description: "" });
    setShowModal(true);
  }

  function openEdit(w: WorkflowTemplate) {
    setEditing(w);
    setForm({
      name: w.name,
      category: w.category,
      color: w.color,
      default_days: w.default_days,
      steps: w.sort_order || 4,
      active: w.active,
      description: w.description || "",
    });
    setShowModal(true);
  }

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      if (editing) {
        const { data, error } = await supabase
          .from("workflow_templates")
          .update({
            name: form.name,
            category: form.category,
            color: form.color,
            default_days: form.default_days,
            active: form.active,
            description: form.description || null,
          })
          .eq("id", editing.id)
          .eq("studio_id", studioId)
          .select()
          .single();
        if (error) throw error;
        setWorkflows((prev) => prev.map((w) => (w.id === editing.id ? (data as WorkflowTemplate) : w)));
        toast.success("Workflow atualizado!");
      } else {
        const maxSort = workflows.reduce((max, w) => Math.max(max, w.sort_order), 0);
        const { data, error } = await supabase
          .from("workflow_templates")
          .insert({
            studio_id: studioId,
            name: form.name,
            category: form.category,
            color: form.color,
            default_days: form.default_days,
            active: form.active,
            description: form.description || null,
            sort_order: maxSort + 1,
          })
          .select()
          .single();
        if (error) throw error;
        setWorkflows((prev) => [...prev, data as WorkflowTemplate]);
        toast.success("Workflow criado!");
      }
      setShowModal(false);
    } catch {
      toast.error("Erro ao salvar workflow");
    } finally {
      setSaving(false);
    }
  }, [form, editing, studioId, workflows]);

  async function handleDelete(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("workflow_templates").delete().eq("id", id).eq("studio_id", studioId);
      if (error) throw error;
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      toast.success("Workflow excluído");
      setShowModal(false);
    } catch {
      toast.error("Erro ao excluir");
    }
  }

  async function toggleActive(w: WorkflowTemplate) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("workflow_templates")
        .update({ active: !w.active })
        .eq("id", w.id)
        .eq("studio_id", studioId);
      if (error) throw error;
      setWorkflows((prev) => prev.map((wf) => (wf.id === w.id ? { ...wf, active: !wf.active } : wf)));
    } catch {
      toast.error("Erro ao atualizar status");
    }
  }

  async function moveWorkflow(w: WorkflowTemplate, direction: "up" | "down") {
    const idx = workflows.findIndex((wf) => wf.id === w.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= workflows.length) return;

    const other = workflows[swapIdx];
    try {
      const supabase = createClient();
      await Promise.all([
        supabase.from("workflow_templates").update({ sort_order: other.sort_order }).eq("id", w.id).eq("studio_id", studioId),
        supabase.from("workflow_templates").update({ sort_order: w.sort_order }).eq("id", other.id).eq("studio_id", studioId),
      ]);
      const updated = [...workflows];
      const tempSort = updated[idx].sort_order;
      updated[idx] = { ...updated[idx], sort_order: updated[swapIdx].sort_order };
      updated[swapIdx] = { ...updated[swapIdx], sort_order: tempSort };
      updated.sort((a, b) => a.sort_order - b.sort_order);
      setWorkflows(updated);
    } catch {
      toast.error("Erro ao reordenar");
    }
  }

  // Tab items
  const tabItems: { key: Tab; label: string; count: number }[] = [
    { key: "workflows", label: "Workflows", count: workflows.length },
    { key: "cobranca", label: "Cobrança", count: 3 },
    { key: "mensagens", label: "Mensagens", count: 8 },
  ];

  return (
    <PageTransition>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.push("/configuracoes")} className={GHOST_BTN}>
          <ArrowLeft size={18} />
        </button>
        <div className="text-xs text-[var(--fg-muted)]">
          Configurações &gt; Templates
        </div>
      </div>

      <div className="space-y-5">
        {/* ═══ Unified Panel — header, search, stats, filters all in one card ═══ */}
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em]">Templates</h1>
                <p className="text-[12px] text-[var(--fg-muted)] mt-1">
                  {workflows.length} workflows · 3 templates · 8 mensagens
                </p>
              </div>
              <button className={PRIMARY_CTA} onClick={openNew}>
                <Plus size={16} />
                Novo workflow
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar workflows, templates..."
                className={`${INPUT_CLS} !pl-10 !border-[var(--border-subtle)]`}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Workflows</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{workflows.length}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{activeCount} ativos</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Total etapas</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{totalSteps || workflows.length * 5}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">em todos os templates</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Usos</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">63</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">projetos usando templates</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Duração média</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{avgDuration || 24}d</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">por workflow</p>
            </div>
          </div>

          {/* Tabs + Category filters */}
          <div className="px-6 py-4 space-y-2.5 border-t border-[var(--border-subtle)]">
            {/* Row 1: Main tabs */}
            <div className="flex items-center gap-1.5">
              {tabItems.map((t) => (
                <ActionPill
                  key={t.key}
                  label={t.label}
                  active={activeTab === t.key}
                  onClick={() => setActiveTab(t.key)}
                  count={t.count}
                />
              ))}
            </div>

            {/* Row 2: Category filters (only for workflows tab) */}
            {activeTab === "workflows" && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <ActionPill
                  label="Todos"
                  active={catFilter === "all"}
                  onClick={() => setCatFilter("all")}
                />
                {Object.entries(CATEGORY_CONFIG).filter(([k]) => k !== "geral").map(([key, { label }]) => (
                  <ActionPill
                    key={key}
                    label={label}
                    active={catFilter === key}
                    onClick={() => setCatFilter(key)}
                    count={categoryCounts[key] || 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Data Table — separate card ═══ */}
        <AnimatePresence mode="wait">
          {activeTab === "workflows" && (
            <motion.div key="workflows" {...springContentIn}>
              {filteredWorkflows.length === 0 ? (
                <div className="bg-[var(--card)] rounded-2xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <WidgetEmptyState
                    icon={GitBranch}
                    title="Nenhum workflow encontrado"
                    description="Crie seu primeiro workflow de produção"
                    action={
                      <button className={PRIMARY_CTA} onClick={openNew}>
                        <Plus size={16} /> Novo workflow
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)]">
                        <th className="text-left text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em] px-5 py-3">
                          Workflow
                        </th>
                        <th className="text-left text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em] px-3 py-3">
                          Categoria
                        </th>
                        <th className="text-center text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em] px-3 py-3">
                          Etapas
                        </th>
                        <th className="text-center text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em] px-3 py-3">
                          Duração
                        </th>
                        <th className="text-center text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em] px-3 py-3">
                          Usos
                        </th>
                        <th className="text-center text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em] px-3 py-3">
                          Status
                        </th>
                        <th className="w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkflows.map((w, idx) => {
                        const cat = CATEGORY_CONFIG[w.category] || CATEGORY_CONFIG.geral;
                        return (
                          <motion.tr
                            key={w.id}
                            variants={rowStagger}
                            initial="initial"
                            animate="animate"
                            custom={idx}
                            className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                            onClick={() => openEdit(w)}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: w.color || cat.color }}
                                />
                                <div>
                                  <p className="text-[13px] font-medium text-[var(--fg)]">{w.name}</p>
                                  {w.description && (
                                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 line-clamp-1">{w.description}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white"
                                style={{ backgroundColor: cat.color }}
                              >
                                {cat.label}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-[13px] text-[var(--fg-secondary)]">
                              {w.sort_order || "—"}
                            </td>
                            <td className="px-3 py-3 text-center text-[13px] text-[var(--fg-secondary)]">
                              {w.default_days}d
                            </td>
                            <td className="px-3 py-3 text-center text-[13px] text-[var(--fg-muted)]">
                              —
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div
                                className="w-2.5 h-2.5 rounded-full mx-auto"
                                style={{ backgroundColor: w.active ? "var(--success)" : "var(--fg-muted)" }}
                              />
                            </td>
                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={() => moveWorkflow(w, "up")}
                                  className={GHOST_BTN}
                                  title="Mover para cima"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  onClick={() => moveWorkflow(w, "down")}
                                  className={GHOST_BTN}
                                  title="Mover para baixo"
                                >
                                  <ArrowDown size={14} />
                                </button>
                                <button
                                  onClick={() => toggleActive(w)}
                                  className={GHOST_BTN}
                                  title={w.active ? "Desativar" : "Ativar"}
                                >
                                  {w.active ? <ToggleRight size={16} className="text-[var(--success)]" /> : <ToggleLeft size={16} />}
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--fg-muted)]">
                    <span>{filteredWorkflows.length} workflows</span>
                    <span>
                      {activeCount} ativos · {totalSteps || workflows.length * 5} etapas · 63 usos
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "cobranca" && (
            <motion.div key="cobranca" {...springContentIn}>
              <div className="bg-[var(--card)] rounded-2xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                <WidgetEmptyState
                  icon={DollarSign}
                  title="Templates de Cobrança"
                  description="Modelos de parcelamento, descontos e lembretes automáticos. Em breve."
                />
              </div>
            </motion.div>
          )}

          {activeTab === "mensagens" && (
            <motion.div key="mensagens" {...springContentIn}>
              <div className="bg-[var(--card)] rounded-2xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                <WidgetEmptyState
                  icon={MessageSquare}
                  title="Templates de Mensagem"
                  description="Mensagens prontas para WhatsApp, e-mail e SMS. Em breve."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Novo/Editar Workflow */}
      <AppleModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Editar Workflow" : "Novo Workflow"}
      >
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className={LABEL_CLS}>Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Cobertura de Casamento Completa"
              className={INPUT_CLS}
            />
          </div>

          {/* Categoria + Cor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Categoria</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className={SELECT_CLS + " w-full"}
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Cor</label>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((p) => ({ ...p, color: c }))}
                      className={`w-6 h-6 rounded-full transition-all ${
                        form.color === c ? "ring-2 ring-offset-2 ring-[var(--info)]" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className={`${INPUT_CLS} !w-24 text-center`}
                  placeholder="#2C444D"
                />
              </div>
            </div>
          </div>

          {/* Etapas + Duração + Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLS}>Etapas</label>
              <input
                type="number"
                value={form.steps}
                onChange={(e) => setForm((p) => ({ ...p, steps: Number(e.target.value) }))}
                className={INPUT_CLS}
                min={1}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Duração (dias)</label>
              <input
                type="number"
                value={form.default_days}
                onChange={(e) => setForm((p) => ({ ...p, default_days: Number(e.target.value) }))}
                className={INPUT_CLS}
                min={1}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Status</label>
              <button
                onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
                className={`h-10 w-full rounded-lg border text-[13px] font-medium flex items-center justify-center gap-2 transition-colors ${
                  form.active
                    ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]"
                    : "border-[var(--border)] text-[var(--fg-muted)]"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: form.active ? "var(--success)" : "var(--fg-muted)" }}
                />
                {form.active ? "Ativo" : "Inativo"}
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className={LABEL_CLS}>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descreva as etapas deste workflow..."
              className={`${INPUT_CLS} !h-24 resize-none py-2.5`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {editing ? (
              <button
                onClick={() => handleDelete(editing.id)}
                className="text-[12px] text-[var(--error)] hover:underline flex items-center gap-1"
              >
                <Trash2 size={13} /> Excluir workflow
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button className={SECONDARY_CTA} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className={`${PRIMARY_CTA} disabled:opacity-50`}
                onClick={handleSave}
                disabled={saving}
              >
                <Check size={16} />
                {editing ? "Salvar" : "Criar workflow"}
              </button>
            </div>
          </div>
        </div>
      </AppleModal>
    </PageTransition>
  );
}
