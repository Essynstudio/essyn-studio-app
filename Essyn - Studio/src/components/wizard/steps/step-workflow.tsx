"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckSquare, Clock, Calendar, Image, Lock, Globe, KeyRound,
  Download, X, Plus, ChevronDown, ChevronUp,
  HardDrive, UserCircle, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useWizard } from "../wizard-context";
import { INPUT_CLS, LABEL_CLS, GHOST_BTN, SECONDARY_CTA, COMPACT_SECONDARY_CTA, SELECT_CLS } from "@/lib/design-tokens";
import { springContentIn, springSnappy } from "@/lib/motion-tokens";
import type { WizardWorkflow, WorkflowModelStep } from "@/lib/types";
import { formatBusinessDeadline } from "@/lib/business-days";

interface StepWorkflowProps {
  studioId: string;
  teamMembers: { id: string; name: string; role: string; avatar_url: string | null }[];
}

/* ── Workflow presets ──────────────────────────────── */
interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
  steps: WorkflowModelStep[];
}

const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    id: "casamento",
    name: "Casamento",
    description: "Backup → Seleção → Prévia → Edição → Revisão → Entrega",
    steps: [
      { name: "Backup dos cartões", sort_order: 0, sla_days: 1 },
      { name: "Seleção de fotos", sort_order: 1, sla_days: 3 },
      { name: "Prévia (30-50 fotos)", sort_order: 2, sla_days: 7 },
      { name: "Edição completa", sort_order: 3, sla_days: 30 },
      { name: "Revisão e ajustes", sort_order: 4, sla_days: 35 },
      { name: "Exportação e entrega", sort_order: 5, sla_days: 40 },
    ],
  },
  {
    id: "pre-wedding",
    name: "Pré-Wedding / Ensaio",
    description: "Backup → Seleção → Edição → Revisão → Entrega",
    steps: [
      { name: "Backup dos cartões", sort_order: 0, sla_days: 1 },
      { name: "Seleção de fotos", sort_order: 1, sla_days: 2 },
      { name: "Edição completa", sort_order: 2, sla_days: 10 },
      { name: "Revisão e ajustes", sort_order: 3, sla_days: 12 },
      { name: "Exportação e entrega", sort_order: 4, sla_days: 14 },
    ],
  },
  {
    id: "corporativo",
    name: "Corporativo / Evento",
    description: "Backup → Seleção → Edição → Entrega",
    steps: [
      { name: "Backup", sort_order: 0, sla_days: 1 },
      { name: "Seleção de fotos", sort_order: 1, sla_days: 2 },
      { name: "Edição e tratamento", sort_order: 2, sla_days: 5 },
      { name: "Entrega final", sort_order: 3, sla_days: 7 },
    ],
  },
  {
    id: "aniversario",
    name: "Aniversário / Batizado",
    description: "Backup → Seleção → Prévia → Edição → Entrega",
    steps: [
      { name: "Backup dos cartões", sort_order: 0, sla_days: 1 },
      { name: "Seleção de fotos", sort_order: 1, sla_days: 3 },
      { name: "Prévia (10-20 fotos)", sort_order: 2, sla_days: 5 },
      { name: "Edição completa", sort_order: 3, sla_days: 15 },
      { name: "Entrega final", sort_order: 4, sla_days: 20 },
    ],
  },
  {
    id: "custom",
    name: "Personalizado",
    description: "Comece do zero com etapas personalizadas",
    steps: [
      { name: "", sort_order: 0, sla_days: 7 },
    ],
  },
];

function generateId() {
  return crypto.randomUUID();
}

function createWorkflowFromPreset(preset: WorkflowPreset): WizardWorkflow {
  return {
    id: generateId(),
    name: preset.id === "custom" ? "" : preset.name,
    model_id: preset.id,
    steps: preset.steps.map((s) => ({ ...s })),
    editor_id: "",
    editor_name: "",
    backup_location: "",
  };
}

/* ── Step Labels for display ──────────────────────── */
const STEP_STATUS_COLORS: Record<number, string> = {
  0: "var(--fg-muted)",
  1: "var(--info)",
  2: "var(--warning)",
  3: "var(--accent)",
  4: "var(--success)",
};

export function StepWorkflow({ studioId, teamMembers }: StepWorkflowProps) {
  const { form, updateForm } = useWizard();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const workflows = form.workflows;

  const updateWorkflows = (updated: WizardWorkflow[]) => {
    updateForm({ workflows: updated });
  };

  const addFromPreset = (preset: WorkflowPreset) => {
    const wf = createWorkflowFromPreset(preset);
    const updated = [...workflows, wf];
    updateWorkflows(updated);
    setExpandedId(wf.id);
    setShowPresets(false);
  };

  const removeWorkflow = (id: string) => {
    updateWorkflows(workflows.filter((w) => w.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateWorkflow = (id: string, partial: Partial<WizardWorkflow>) => {
    updateWorkflows(
      workflows.map((w) => (w.id === id ? { ...w, ...partial } : w))
    );
  };

  const updateStepSla = (wfId: string, stepIdx: number, slaDays: number) => {
    const wf = workflows.find((w) => w.id === wfId);
    if (!wf) return;
    const newSteps = wf.steps.map((s, i) =>
      i === stepIdx ? { ...s, sla_days: slaDays } : s
    );
    updateWorkflow(wfId, { steps: newSteps });
  };

  const updateStepName = (wfId: string, stepIdx: number, name: string) => {
    const wf = workflows.find((w) => w.id === wfId);
    if (!wf) return;
    const newSteps = wf.steps.map((s, i) =>
      i === stepIdx ? { ...s, name } : s
    );
    updateWorkflow(wfId, { steps: newSteps });
  };

  const addStep = (wfId: string) => {
    const wf = workflows.find((w) => w.id === wfId);
    if (!wf) return;
    const newStep: WorkflowModelStep = {
      name: "",
      sort_order: wf.steps.length,
      sla_days: 7,
    };
    updateWorkflow(wfId, { steps: [...wf.steps, newStep] });
  };

  const removeStep = (wfId: string, stepIdx: number) => {
    const wf = workflows.find((w) => w.id === wfId);
    if (!wf || wf.steps.length <= 1) return;
    const newSteps = wf.steps
      .filter((_, i) => i !== stepIdx)
      .map((s, i) => ({ ...s, sort_order: i }));
    updateWorkflow(wfId, { steps: newSteps });
  };

  const deliveryDate = useMemo(() => formatBusinessDeadline(form.event_date, form.delivery_deadline_days), [form.event_date, form.delivery_deadline_days]);
  const galleryDeadlineDate = useMemo(() => formatBusinessDeadline(form.event_date, form.gallery_delivery_days), [form.event_date, form.gallery_delivery_days]);

  return (
    <motion.div {...springContentIn} className="space-y-6">

      {/* ── Workflows ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={LABEL_CLS + " !mb-0"}>
            <CheckSquare size={13} className="inline mr-1.5 -mt-0.5" />
            Workflows de produção
          </label>
          {workflows.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className={COMPACT_SECONDARY_CTA}
            >
              <Plus size={12} /> Adicionar mais
            </button>
          )}
        </div>

        {/* Preset picker — overlay when adding more */}
        <AnimatePresence>
          {showPresets && workflows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={springSnappy}
              className="overflow-hidden mb-3"
            >
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-[var(--info)] bg-[var(--info-subtle)]">
                <p className="col-span-2 text-[11px] font-medium text-[var(--info)] mb-1">
                  Escolha um modelo ou comece do zero
                </p>
                {WORKFLOW_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => addFromPreset(preset)}
                    className="text-left p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--info)] hover:shadow-sm transition-all"
                  >
                    <p className="text-[12px] font-semibold text-[var(--fg)]">{preset.name}</p>
                    <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{preset.description}</p>
                    {preset.id !== "custom" && (
                      <p className="text-[10px] text-[var(--fg-muted)] mt-1">{preset.steps.length} etapas</p>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Default preset grid — shown when no workflows exist */}
        {workflows.length === 0 && (
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--card)]">
            <p className="col-span-2 text-[11px] font-medium text-[var(--fg-muted)] mb-1">
              Escolha um modelo ou comece do zero
            </p>
            {WORKFLOW_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => addFromPreset(preset)}
                className="text-left p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:shadow-sm transition-all"
              >
                <p className="text-[12px] font-semibold text-[var(--fg)]">{preset.name}</p>
                <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{preset.description}</p>
                {preset.id !== "custom" && (
                  <p className="text-[10px] text-[var(--fg-muted)] mt-1">{preset.steps.length} etapas</p>
                )}
              </button>
            ))}
          </div>
        )}

        {workflows.length > 0 ? (
          <div className="space-y-3">
            {workflows.map((wf, wfIdx) => {
              const isExpanded = expandedId === wf.id;
              return (
                <motion.div
                  key={wf.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springSnappy}
                  className={`rounded-xl border overflow-hidden transition-colors ${
                    isExpanded
                      ? "border-[var(--info)] bg-[var(--card)]"
                      : "border-[var(--border-subtle)] bg-[var(--card)]"
                  }`}
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  {/* ── Workflow header ────────── */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : wf.id)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: "var(--info)" }}
                      >
                        {wfIdx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--fg)] truncate">
                          {wf.name || "Workflow sem nome"}
                        </p>
                        <p className="text-[10px] text-[var(--fg-muted)]">
                          {wf.steps.length} etapas
                          {wf.editor_name && ` · ${wf.editor_name}`}
                          {wf.editor_id && !wf.editor_name && (() => {
                            const m = teamMembers.find((t) => t.id === wf.editor_id);
                            return m ? ` · ${m.name}` : "";
                          })()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeWorkflow(wf.id);
                      }}
                      className={`${GHOST_BTN} !p-1.5 text-[var(--error)]`}
                      title="Remover workflow"
                    >
                      <Trash2 size={13} />
                    </button>

                    {isExpanded ? (
                      <ChevronUp size={16} className="text-[var(--fg-muted)] flex-shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-[var(--fg-muted)] flex-shrink-0" />
                    )}
                  </div>

                  {/* ── Workflow expanded body ────── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={springSnappy}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4 border-t border-[var(--border-subtle)] pt-3">
                          {/* Name */}
                          <div>
                            <label className={LABEL_CLS}>Nome do workflow *</label>
                            <input
                              type="text"
                              placeholder="Ex: Edição Casamento, Edição Pré-Wedding..."
                              value={wf.name}
                              onChange={(e) => updateWorkflow(wf.id, { name: e.target.value })}
                              className={INPUT_CLS}
                            />
                          </div>

                          {/* Editor + Backup row */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={LABEL_CLS}>
                                <UserCircle size={10} className="inline mr-1 -mt-0.5" />
                                Editor responsável
                              </label>
                              <select
                                value={wf.editor_id}
                                onChange={(e) => {
                                  const member = teamMembers.find((m) => m.id === e.target.value);
                                  updateWorkflow(wf.id, {
                                    editor_id: e.target.value,
                                    editor_name: member?.name || "",
                                  });
                                }}
                                className={SELECT_CLS}
                              >
                                <option value="">Selecionar...</option>
                                {teamMembers.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.role})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={LABEL_CLS}>
                                <HardDrive size={10} className="inline mr-1 -mt-0.5" />
                                Local do backup
                              </label>
                              <input
                                type="text"
                                placeholder="Definir depois do evento"
                                value={wf.backup_location}
                                onChange={(e) => updateWorkflow(wf.id, { backup_location: e.target.value })}
                                className={INPUT_CLS}
                              />
                              <p className="text-[10px] text-[var(--fg-muted)] mt-1">
                                Você receberá um lembrete após a data do evento.
                              </p>
                            </div>
                          </div>

                          {/* Steps */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className={LABEL_CLS + " !mb-0"}>Etapas</label>
                              <button
                                type="button"
                                onClick={() => addStep(wf.id)}
                                className={`${GHOST_BTN} !h-6 !px-2 !text-[10px]`}
                              >
                                <Plus size={10} /> Etapa
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {wf.steps.map((step, stepIdx) => (
                                <div
                                  key={stepIdx}
                                  className="flex items-center gap-2 group/step"
                                >
                                  {/* Step number */}
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 border-2"
                                    style={{
                                      borderColor: STEP_STATUS_COLORS[stepIdx] || "var(--fg-muted)",
                                      color: STEP_STATUS_COLORS[stepIdx] || "var(--fg-muted)",
                                    }}
                                  >
                                    {stepIdx + 1}
                                  </div>

                                  {/* Step name */}
                                  <input
                                    type="text"
                                    value={step.name}
                                    onChange={(e) => updateStepName(wf.id, stepIdx, e.target.value)}
                                    placeholder="Nome da etapa"
                                    className={`${INPUT_CLS} flex-1 !h-8 !text-[12px]`}
                                  />

                                  {/* Remove */}
                                  {wf.steps.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeStep(wf.id, stepIdx)}
                                      className={`${GHOST_BTN} !p-1 opacity-0 group-hover/step:opacity-100 transition-opacity`}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* ── Delivery deadline ───────────────────────────── */}
      <div>
        <label className={LABEL_CLS}>
          <Calendar size={13} className="inline mr-1.5 -mt-0.5" />
          Prazo de entrega das fotos (dias úteis após o evento)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            value={form.delivery_deadline_days}
            onChange={(e) => updateForm({ delivery_deadline_days: parseInt(e.target.value) || 0 })}
            className={`${INPUT_CLS} !w-28`}
          />
          {deliveryDate && (
            <span className="text-[11px] text-[var(--fg-muted)]">
              Entrega estimada: <strong className="text-[var(--fg)]">{deliveryDate}</strong>
            </span>
          )}
        </div>
      </div>

      {/* ── Gallery auto-creation ───────────────────────── */}
      <div>
        <label className={LABEL_CLS}>
          <Image size={13} className="inline mr-1.5 -mt-0.5" />
          Galeria de fotos
        </label>

        <button
          type="button"
          onClick={() => updateForm({ gallery_auto_create: !form.gallery_auto_create })}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left mb-3 ${
            form.gallery_auto_create
              ? "border-[var(--info)] bg-[var(--info-subtle)]"
              : "border-[var(--border)] hover:bg-[var(--card-hover)]"
          }`}
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors"
            style={{
              borderColor: form.gallery_auto_create ? "var(--info)" : "var(--border)",
              backgroundColor: form.gallery_auto_create ? "var(--info)" : "transparent",
            }}
          >
            {form.gallery_auto_create && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[var(--fg)]">Criar galeria automaticamente</p>
            <p className="text-[11px] text-[var(--fg-muted)]">A galeria será criada após a data do evento, pronta para upload de fotos.</p>
          </div>
        </button>

        {form.gallery_auto_create && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springSnappy}
            className="space-y-3 pl-1"
          >
            <div>
              <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 block">Privacidade</label>
              <div className="flex gap-2">
                {([
                  { value: "privado" as const, icon: Lock, label: "Privada" },
                  { value: "senha" as const, icon: KeyRound, label: "Com Senha" },
                  { value: "publico" as const, icon: Globe, label: "Pública" },
                ] as const).map((opt) => {
                  const Icon = opt.icon;
                  const isActive = form.gallery_privacy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateForm({ gallery_privacy: opt.value })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors ${
                        isActive
                          ? "border-[var(--info)] bg-[var(--info-subtle)] text-[var(--info)]"
                          : "border-[var(--border)] text-[var(--fg-muted)] hover:bg-[var(--card-hover)]"
                      }`}
                    >
                      <Icon size={12} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateForm({ gallery_download_enabled: !form.gallery_download_enabled })}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left w-full ${
                form.gallery_download_enabled
                  ? "border-[var(--info)] bg-[var(--info-subtle)]"
                  : "border-[var(--border)] hover:bg-[var(--card-hover)]"
              }`}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors"
                style={{
                  borderColor: form.gallery_download_enabled ? "var(--info)" : "var(--border)",
                  backgroundColor: form.gallery_download_enabled ? "var(--info)" : "transparent",
                }}
              >
                {form.gallery_download_enabled && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--fg)]">
                  <Download size={12} className="inline mr-1 -mt-0.5" />
                  Permitir downloads
                </p>
                <p className="text-[11px] text-[var(--fg-muted)]">Clientes poderão baixar as fotos da galeria.</p>
              </div>
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
