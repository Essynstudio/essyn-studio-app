/**
 * AutomacoesPage — Workflow Automations
 *
 * Visual rule builder for photographers:
 * - Trigger → Condition → Action flow
 * - Pre-built automation templates
 * - Active/inactive toggles with filter bar
 * - Execution log with detail view
 * - Rule editing drawer
 * - Delete confirmation
 * - Manual "Run now" action
 *
 * Apple Premium design, zero transparency rule.
 */
import { useState, useMemo, useCallback, type ReactNode } from "react";
import {
  Zap, Plus, Search, ChevronRight, Play, Pause,
  Mail, Bell, Image, ShoppingBag, Camera,
  CheckCircle2, Clock, AlertTriangle,
  X, ToggleLeft, ToggleRight,
  ArrowRight, Settings, Calendar,
  Trash2, Copy, RefreshCw, MoreHorizontal,
  Pencil, History, ExternalLink, Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { springDefault, springStiff, withDelay } from "../lib/motion-tokens";
import { OnboardingBanner } from "../components/ui/OnboardingTooltip";
import { useNavigate } from "react-router";
import {
  WidgetCard, HeaderWidget, AppleDrawer, ConfirmDialog,
} from "../components/ui/apple-kit";
import { TagPill } from "../components/ui/tag-pill";
import { DashboardKpiGrid } from "../components/ui/dashboard-kpi-grid";
import { useShellConfig } from "../components/ui/ShellContext";

/* ═══════════════════════════════════════════════════ */
/*  TYPES & DATA                                       */
/* ═══════════════════════════════════════════════════ */

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: { type: string; label: string; icon: ReactNode };
  condition?: { label: string };
  action: {
    type: string;
    label: string;
    icon: ReactNode;
    emailTemplate?: string;
  };
  active: boolean;
  executions: number;
  lastRun?: string;
  createdAt: string;
  category?: string;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  triggerLabel: string;
  actionLabel: string;
  triggerIcon: ReactNode;
  actionIcon: ReactNode;
  category: string;
  popular?: boolean;
}

interface LogEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  time: string;
  status: "success" | "error" | "skipped";
  detail: string;
  duration?: string;
}

const TRIGGER_OPTIONS = [
  { type: "order_status", label: "Pedido muda de status", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  { type: "gallery_published", label: "Galeria publicada", icon: <Image className="w-3.5 h-3.5" /> },
  { type: "payment_received", label: "Pagamento recebido", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { type: "lead_created", label: "Novo lead criado", icon: <Bell className="w-3.5 h-3.5" /> },
  { type: "event_tomorrow", label: "Evento amanhã", icon: <Calendar className="w-3.5 h-3.5" /> },
  { type: "contract_signed", label: "Contrato assinado", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
];

const ACTION_OPTIONS = [
  { type: "send_email", label: "Enviar e-mail", icon: <Mail className="w-3.5 h-3.5" /> },
  { type: "send_notification", label: "Enviar notificação", icon: <Bell className="w-3.5 h-3.5" /> },
  { type: "create_task", label: "Criar tarefa", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { type: "update_status", label: "Atualizar status", icon: <Settings className="w-3.5 h-3.5" /> },
  { type: "send_whatsapp", label: "Enviar WhatsApp", icon: <Mail className="w-3.5 h-3.5" /> },
];

const EMAIL_TEMPLATES = [
  "Confirmação de Pedido", "Galeria Pronta", "Lembrete de Evento",
  "Boas-Vindas", "Contrato Assinado", "Obrigado",
];

const TEMPLATES: AutomationTemplate[] = [
  {
    id: "at-1",
    name: "Pedido Pago → Email de Confirmação",
    description: "Quando um pedido é marcado como pago, envia automaticamente e-mail de confirmação ao cliente com detalhes do pedido",
    triggerLabel: "Pedido → Pago",
    actionLabel: "Enviar e-mail",
    triggerIcon: <ShoppingBag className="w-4 h-4" />,
    actionIcon: <Mail className="w-4 h-4" />,
    category: "Pedidos",
    popular: true,
  },
  {
    id: "at-2",
    name: "Galeria Publicada → Notificar Cliente",
    description: "Quando uma galeria é publicada, envia link de acesso com senha ao cliente automaticamente",
    triggerLabel: "Galeria publicada",
    actionLabel: "Enviar e-mail",
    triggerIcon: <Image className="w-4 h-4" />,
    actionIcon: <Mail className="w-4 h-4" />,
    category: "Galerias",
    popular: true,
  },
  {
    id: "at-3",
    name: "Evento Amanhã → Lembrete",
    description: "No dia anterior ao evento, envia lembrete automático ao cliente com checklist de preparação",
    triggerLabel: "Evento amanhã",
    actionLabel: "Enviar e-mail",
    triggerIcon: <Calendar className="w-4 h-4" />,
    actionIcon: <Mail className="w-4 h-4" />,
    category: "Agenda",
  },
  {
    id: "at-4",
    name: "Novo Lead → Notificação Push",
    description: "Quando um novo lead chega pelo formulário, envia notificação push imediata para não perder oportunidades",
    triggerLabel: "Novo lead",
    actionLabel: "Notificação push",
    triggerIcon: <Bell className="w-4 h-4" />,
    actionIcon: <Bell className="w-4 h-4" />,
    category: "CRM",
  },
  {
    id: "at-5",
    name: "Pagamento Recebido → Avançar Produção",
    description: "Quando o pagamento do sinal é confirmado, move o projeto automaticamente para fase de captação",
    triggerLabel: "Pagamento recebido",
    actionLabel: "Avançar produção",
    triggerIcon: <CheckCircle2 className="w-4 h-4" />,
    actionIcon: <Camera className="w-4 h-4" />,
    category: "Produção",
  },
  {
    id: "at-6",
    name: "Contrato Assinado → Criar Projeto",
    description: "Quando o contrato digital é assinado, cria automaticamente o projeto e as parcelas financeiras",
    triggerLabel: "Contrato assinado",
    actionLabel: "Criar projeto",
    triggerIcon: <CheckCircle2 className="w-4 h-4" />,
    actionIcon: <Settings className="w-4 h-4" />,
    category: "Contratos",
  },
];

const INITIAL_RULES: AutomationRule[] = [
  {
    id: "rule-1",
    name: "Pedido Pago → Email de Confirmação",
    description: "Envia e-mail de confirmação quando pedido é pago",
    trigger: { type: "order_status", label: "Pedido → Pago", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    condition: { label: "Status = Pago" },
    action: { type: "send_email", label: "Enviar e-mail de confirmação", icon: <Mail className="w-3.5 h-3.5" />, emailTemplate: "Confirmação de Pedido" },
    active: true,
    executions: 23,
    lastRun: "há 2 horas",
    createdAt: "2026-01-15",
    category: "Pedidos",
  },
  {
    id: "rule-2",
    name: "Galeria Publicada → Notificar Cliente",
    description: "Envia link de acesso quando galeria é publicada",
    trigger: { type: "gallery_published", label: "Galeria publicada", icon: <Image className="w-3.5 h-3.5" /> },
    action: { type: "send_email", label: "Enviar link com senha", icon: <Mail className="w-3.5 h-3.5" />, emailTemplate: "Galeria Pronta" },
    active: true,
    executions: 8,
    lastRun: "ontem",
    createdAt: "2026-01-20",
    category: "Galerias",
  },
  {
    id: "rule-3",
    name: "Evento Amanhã → Lembrete Cliente",
    description: "Lembrete automático no dia anterior ao evento",
    trigger: { type: "event_tomorrow", label: "Evento amanhã", icon: <Calendar className="w-3.5 h-3.5" /> },
    action: { type: "send_email", label: "Enviar lembrete", icon: <Mail className="w-3.5 h-3.5" />, emailTemplate: "Lembrete de Evento" },
    active: true,
    executions: 12,
    lastRun: "há 1 dia",
    createdAt: "2026-02-01",
    category: "Agenda",
  },
  {
    id: "rule-4",
    name: "Novo Lead → Notificação Push",
    description: "Notificação imediata quando novo lead chega",
    trigger: { type: "lead_created", label: "Novo lead", icon: <Bell className="w-3.5 h-3.5" /> },
    action: { type: "send_notification", label: "Notificação push", icon: <Bell className="w-3.5 h-3.5" /> },
    active: false,
    executions: 45,
    lastRun: "há 3 dias",
    createdAt: "2026-01-10",
    category: "CRM",
  },
  {
    id: "rule-5",
    name: "Pagamento Recebido → Avançar Produção",
    description: "Move projeto para captação quando sinal é pago",
    trigger: { type: "payment_received", label: "Pagamento recebido", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    condition: { label: "Tipo = Sinal" },
    action: { type: "update_status", label: "Mover para captação", icon: <Camera className="w-3.5 h-3.5" /> },
    active: true,
    executions: 6,
    lastRun: "há 5 dias",
    createdAt: "2026-02-05",
    category: "Produção",
  },
];

const INITIAL_LOGS: LogEntry[] = [
  { id: "log-1", ruleId: "rule-1", ruleName: "Pedido Pago → Email", time: "há 2 horas", status: "success", detail: "Pedido #102 · Ana Clara & Diego", duration: "1.2s" },
  { id: "log-2", ruleId: "rule-2", ruleName: "Galeria Publicada → Notificar", time: "ontem às 14:32", status: "success", detail: "Galeria: Casamento Ana & Diego", duration: "0.8s" },
  { id: "log-3", ruleId: "rule-3", ruleName: "Evento Amanhã → Lembrete", time: "ontem às 08:00", status: "success", detail: "Ensaio Gestante Luísa — 08/03", duration: "1.5s" },
  { id: "log-4", ruleId: "rule-4", ruleName: "Novo Lead → Push", time: "há 3 dias", status: "skipped", detail: "Automação pausada — regra inativa", duration: "—" },
  { id: "log-5", ruleId: "rule-5", ruleName: "Pagamento → Avançar", time: "há 5 dias", status: "success", detail: "Projeto: Ensaio Gestante Luísa → Seleção", duration: "2.1s" },
  { id: "log-6", ruleId: "rule-1", ruleName: "Pedido Pago → Email", time: "há 1 semana", status: "error", detail: "Falha no envio — SMTP timeout após 30s", duration: "30s" },
  { id: "log-7", ruleId: "rule-2", ruleName: "Galeria Publicada → Notificar", time: "há 1 semana", status: "success", detail: "Galeria: Ensaio Família Santos", duration: "0.9s" },
  { id: "log-8", ruleId: "rule-3", ruleName: "Evento Amanhã → Lembrete", time: "há 2 semanas", status: "success", detail: "Casamento Ana & Diego — 12/08", duration: "1.1s" },
];

const STATUS_CFG = {
  success: { icon: <CheckCircle2 className="w-3 h-3" />, color: "#34C759", bg: "#E6F9ED", label: "OK", variant: "success" as const },
  error: { icon: <AlertTriangle className="w-3 h-3" />, color: "#FF3B30", bg: "#FBF5F4", label: "Erro", variant: "danger" as const },
  skipped: { icon: <Pause className="w-3 h-3" />, color: "#FF9500", bg: "#FFF4E6", label: "Ignorado", variant: "warning" as const },
};

/* ═══════════════════════════════════════════════════ */
/*  ACTION MENU                                        */
/* ═══════════════════════════════════════════════════ */

function ActionMenu({ open, onClose, actions }: {
  open: boolean;
  onClose: () => void;
  actions: { label: string; icon: ReactNode; danger?: boolean; onClick: () => void }[];
}) {
  if (!open) return null;
  return (
    <>
      {createPortal(<div className="fixed inset-0 z-[9998]" onClick={onClose} />, document.body)}
      <div
        className="absolute right-0 top-8 z-[9999] w-52 bg-white rounded-xl border border-[#E5E5EA] p-1"
        style={{ boxShadow: "0 4px 16px #E5E5EA" }}
      >
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => { onClose(); a.onClick(); }}
            className={"w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors cursor-pointer text-left " + (
              a.danger ? "text-[#FF3B30] hover:bg-[#FBF5F4]" : "text-[#636366] hover:bg-[#F5F5F7]"
            )}
            style={{ fontWeight: 400 }}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  iOS TOGGLE                                         */
/* ═══════════════════════════════════════════════════ */

function IosToggle({ checked, onChange, size = "md" }: { checked: boolean; onChange: (v: boolean) => void; size?: "sm" | "md" }) {
  const w = size === "sm" ? 36 : 44;
  const h = size === "sm" ? 22 : 26;
  const dot = size === "sm" ? 16 : 20;
  const pad = 3;
  return (
    <button
      onClick={() => onChange(!checked)}
      className={"relative rounded-full transition-all cursor-pointer shrink-0 " + (checked ? "bg-[#34C759]" : "bg-[#E5E5EA]")}
      style={{ width: w, height: h }}
    >
      <span
        className="absolute rounded-full bg-white transition-all"
        style={{
          width: dot,
          height: dot,
          top: pad,
          left: checked ? w - dot - pad : pad,
          boxShadow: "0 1px 3px #C7C7CC",
        }}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  RULE EDIT DRAWER                                   */
/* ═══════════════════════════════════════════════════ */

function RuleEditDrawer({
  open,
  onClose,
  rule,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  rule: AutomationRule | null;
  onSave: (updated: AutomationRule) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerIdx, setTriggerIdx] = useState(0);
  const [actionIdx, setActionIdx] = useState(0);
  const [conditionLabel, setConditionLabel] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Sync form when rule changes
  const ruleId = rule?.id ?? "";
  useMemo(() => {
    if (!rule) return;
    setName(rule.name);
    setDescription(rule.description);
    setTriggerIdx(Math.max(0, TRIGGER_OPTIONS.findIndex(t => t.type === rule.trigger.type)));
    setActionIdx(Math.max(0, ACTION_OPTIONS.findIndex(a => a.type === rule.action.type)));
    setConditionLabel(rule.condition?.label ?? "");
    setEmailTemplate(rule.action.emailTemplate ?? "");
    setIsActive(rule.active);
  }, [ruleId]);

  if (!rule) return null;

  const selectedTrigger = TRIGGER_OPTIONS[triggerIdx] ?? TRIGGER_OPTIONS[0];
  const selectedAction = ACTION_OPTIONS[actionIdx] ?? ACTION_OPTIONS[0];

  const handleSave = () => {
    const updated: AutomationRule = {
      ...rule,
      name: name.trim() || rule.name,
      description: description.trim() || rule.description,
      trigger: { type: selectedTrigger.type, label: selectedTrigger.label, icon: selectedTrigger.icon },
      condition: conditionLabel.trim() ? { label: conditionLabel.trim() } : undefined,
      action: {
        type: selectedAction.type,
        label: selectedAction.label,
        icon: selectedAction.icon,
        emailTemplate: emailTemplate || undefined,
      },
      active: isActive,
    };
    onSave(updated);
    onClose();
    toast.success("Automação atualizada", { description: updated.name, duration: 3000 });
  };

  const inputCls = "w-full h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none focus:border-[#007AFF] transition-colors";
  const selectCls = "w-full h-10 px-3 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] outline-none focus:border-[#007AFF] transition-colors cursor-pointer appearance-none";
  const labelCls = "text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]";

  return (
    <AppleDrawer
      open={open}
      onClose={onClose}
      title={rule.id.startsWith("new-") ? "Nova Automação" : "Editar Automação"}
      subtitle={rule.id.startsWith("new-") ? "Configure trigger, condição e ação" : `Criada em ${rule.createdAt}`}
      width="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 600 }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {rule.id.startsWith("new-") ? "Criar Automação" : "Salvar Alterações"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 px-5 py-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Nome da automação</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Pedido Pago → Email"
            className={inputCls}
            style={{ fontWeight: 400 }}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o que essa automação faz..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none focus:border-[#007AFF] transition-colors resize-none"
            style={{ fontWeight: 400, minHeight: 72 }}
          />
        </div>

        {/* Separator */}
        <div className="h-px bg-[#F2F2F7]" />

        {/* Visual flow preview */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Fluxo</label>
          <div className="flex items-center gap-2 py-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EDF4FF] border border-[#D6E4F7]">
              <span className="text-[#007AFF]">{selectedTrigger.icon}</span>
              <span className="text-[11px] text-[#007AFF]" style={{ fontWeight: 600 }}>{selectedTrigger.label}</span>
            </div>
            {conditionLabel.trim() && (
              <>
                <ArrowRight className="w-3.5 h-3.5 text-[#D1D1D6] shrink-0" />
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFF4E6] border border-[#F2E2C6]">
                  <span className="text-[11px] text-[#FF9500]" style={{ fontWeight: 600 }}>{conditionLabel}</span>
                </div>
              </>
            )}
            <ArrowRight className="w-3.5 h-3.5 text-[#D1D1D6] shrink-0" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E6F9ED] border border-[#C8EDCF]">
              <span className="text-[#34C759]">{selectedAction.icon}</span>
              <span className="text-[11px] text-[#34C759]" style={{ fontWeight: 600 }}>{selectedAction.label}</span>
            </div>
          </div>
        </div>

        {/* Trigger */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Gatilho (Trigger)</label>
          <div className="relative">
            <select value={triggerIdx} onChange={(e) => setTriggerIdx(Number(e.target.value))} className={selectCls} style={{ fontWeight: 400 }}>
              {TRIGGER_OPTIONS.map((t, i) => (
                <option key={t.type} value={i}>{t.label}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C7C7CC] rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* Condition */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Condição (opcional)</label>
          <input
            value={conditionLabel}
            onChange={(e) => setConditionLabel(e.target.value)}
            placeholder="Ex: Status = Pago, Tipo = Sinal"
            className={inputCls}
            style={{ fontWeight: 400 }}
          />
          <span className="text-[10px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>
            Deixe em branco para executar sem condição
          </span>
        </div>

        {/* Action */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Ação</label>
          <div className="relative">
            <select value={actionIdx} onChange={(e) => setActionIdx(Number(e.target.value))} className={selectCls} style={{ fontWeight: 400 }}>
              {ACTION_OPTIONS.map((a, i) => (
                <option key={a.type} value={i}>{a.label}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C7C7CC] rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* Email template (if action is send_email) */}
        {selectedAction.type === "send_email" && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 600 }}>Template de email</label>
            <div className="relative">
              <select value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} className={selectCls} style={{ fontWeight: 400 }}>
                <option value="">Nenhum template</option>
                {EMAIL_TEMPLATES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C7C7CC] rotate-90 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="h-px bg-[#F2F2F7]" />

        {/* Active toggle */}
        <div className="flex items-center justify-between py-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-[#636366]" style={{ fontWeight: 500 }}>Status da automação</span>
            <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
              {isActive ? "Automação ativa — executará quando o trigger ocorrer" : "Automação pausada — não será executada"}
            </span>
          </div>
          <IosToggle checked={isActive} onChange={setIsActive} />
        </div>

        {/* Stats (edit mode only) */}
        {!rule.id.startsWith("new-") && (
          <>
            <div className="h-px bg-[#F2F2F7]" />
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ fontWeight: 600 }}>Estatísticas</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Execuções", value: String(rule.executions) },
                  { label: "Última", value: rule.lastRun ?? "—" },
                  { label: "Criada em", value: rule.createdAt },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl bg-[#F5F5F7]">
                    <span className="text-[14px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 600 }}>{s.value}</span>
                    <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppleDrawer>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  LOG DETAIL DRAWER                                  */
/* ═══════════════════════════════════════════════════ */

function LogDetailDrawer({
  open,
  onClose,
  log,
  onRetry,
}: {
  open: boolean;
  onClose: () => void;
  log: LogEntry | null;
  onRetry: (log: LogEntry) => void;
}) {
  if (!log) return null;
  const cfg = STATUS_CFG[log.status];

  return (
    <AppleDrawer
      open={open}
      onClose={onClose}
      title="Detalhe da Execução"
      subtitle={log.time}
      width="sm"
      footer={
        <div className="flex items-center justify-between w-full">
          {log.status === "error" ? (
            <button
              onClick={() => { onRetry(log); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] transition-all cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retentar
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 px-5 py-4">
        {/* Status badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
            {cfg.icon}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{log.ruleName}</span>
            <TagPill variant={cfg.variant} size="xs">{cfg.label}</TagPill>
          </div>
        </div>

        <div className="h-px bg-[#F2F2F7]" />

        {/* Details table */}
        <div className="flex flex-col gap-0">
          {[
            { label: "Regra", value: log.ruleName },
            { label: "Data/Hora", value: log.time },
            { label: "Detalhe", value: log.detail },
            { label: "Duração", value: log.duration ?? "—" },
            { label: "Status", value: cfg.label },
          ].map((row, i) => (
            <div key={row.label} className={"flex items-start justify-between py-2.5 " + (i > 0 ? "border-t border-[#F5F5F7]" : "")}>
              <span className="text-[12px] text-[#AEAEB2] shrink-0 w-24" style={{ fontWeight: 500 }}>{row.label}</span>
              <span className="text-[12px] text-[#636366] text-right flex-1" style={{ fontWeight: 400 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Error-specific info */}
        {log.status === "error" && (
          <>
            <div className="h-px bg-[#F2F2F7]" />
            <div className="flex flex-col gap-1.5 px-3.5 py-3 rounded-xl bg-[#FBF5F4] border border-[#F2DDD9]">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF3B30]" />
                <span className="text-[12px] text-[#FF3B30]" style={{ fontWeight: 600 }}>Falha na execução</span>
              </div>
              <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400, lineHeight: "1.5" }}>
                {log.detail}. Pode retentar manualmente ou aguardar a próxima execução automática.
              </span>
            </div>
          </>
        )}
      </div>
    </AppleDrawer>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  TEMPLATE PICKER MODAL                              */
/* ═══════════════════════════════════════════════════ */

function TemplatePickerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (template: AutomationTemplate) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return TEMPLATES;
    const q = search.toLowerCase();
    return TEMPLATES.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [search]);

  return createPortal(
    <>
      <motion.div
        key="tmpl-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={springDefault}
        className="fixed inset-0 z-[9998] bg-[#1D1D1F]"
        onClick={onClose}
      />
      <motion.div
        key="tmpl-modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={springDefault}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-[520px] max-h-[80vh] overflow-hidden flex flex-col"
          style={{ boxShadow: "0 16px 64px #D1D1D6" }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Nova Automação"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7] shrink-0">
            <div>
              <h3 className="text-[15px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
                Nova Automação
              </h3>
              <p className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                Escolha um template para começar
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-2.5 border-b border-[#F2F2F7] shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] focus-within:border-[#007AFF] transition-all">
              <Search className="w-3.5 h-3.5 text-[#C7C7CC] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar template..."
                className="flex-1 text-[12px] text-[#1D1D1F] bg-transparent outline-none placeholder:text-[#C7C7CC]"
                style={{ fontWeight: 400 }}
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-[#C7C7CC] hover:text-[#8E8E93] cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Templates */}
          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Search className="w-5 h-5 text-[#D1D1D6]" />
                <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Nenhum template encontrado</span>
              </div>
            ) : (
              filtered.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => onCreate(tmpl)}
                  className="flex items-start gap-3 p-4 rounded-xl border border-[#F2F2F7] hover:border-[#D1D1D6] hover:bg-[#FAFAFA] transition-all cursor-pointer text-left group"
                >
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
                        {tmpl.name}
                      </span>
                      {tmpl.popular && (
                        <TagPill variant="gold" size="xs">Popular</TagPill>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8E8E93] line-clamp-2" style={{ fontWeight: 400, lineHeight: "1.5" }}>
                      {tmpl.description}
                    </p>
                    {/* Flow pills */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EDF4FF]">
                        <span className="text-[#007AFF]">{tmpl.triggerIcon}</span>
                        <span className="text-[9px] text-[#007AFF]" style={{ fontWeight: 600 }}>{tmpl.triggerLabel}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-[#D1D1D6]" />
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E6F9ED]">
                        <span className="text-[#34C759]">{tmpl.actionIcon}</span>
                        <span className="text-[9px] text-[#34C759]" style={{ fontWeight: 600 }}>{tmpl.actionLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-[#F2F2F7] text-[9px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>{tmpl.category}</span>
                    <ChevronRight className="w-4 h-4 text-[#D1D1D6] group-hover:text-[#007AFF] transition-colors" />
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#F2F2F7] shrink-0 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E5EA] text-[12px] text-[#636366] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              Cancelar
            </button>
            <span className="text-[10px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>
              {filtered.length} templates disponíveis
            </span>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  INLINE TEMPLATE PICKER                             */
/* ═══════════════════════════════════════════════════ */

function InlineTemplatePicker({
  currentTemplate,
  onSelect,
  onClose,
  onNavigateTemplates,
}: {
  currentTemplate: string;
  onSelect: (tmpl: string) => void;
  onClose: () => void;
  onNavigateTemplates: () => void;
}) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9997]" onClick={onClose} />
      <div
        className="fixed z-[9998] w-56 rounded-xl border border-[#E5E5EA] bg-white py-1 overflow-hidden"
        style={{
          boxShadow: "0 4px 16px #E5E5EA",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-1.5 border-b border-[#F2F2F7]">
          <span className="text-[9px] uppercase tracking-[0.08em] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
            Trocar template
          </span>
        </div>
        {EMAIL_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl}
            onClick={() => onSelect(tmpl)}
            className={"w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer " + (
              tmpl === currentTemplate ? "bg-[#EDF4FF] text-[#007AFF]" : "text-[#636366] hover:bg-[#F5F5F7]"
            )}
            style={{ fontWeight: tmpl === currentTemplate ? 600 : 400 }}
          >
            {tmpl === currentTemplate ? `${tmpl} ✓` : tmpl}
          </button>
        ))}
        <div className="h-px bg-[#F2F2F7] my-0.5" />
        <button
          onClick={onNavigateTemplates}
          className="w-full text-left px-3 py-2 text-[11px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
          style={{ fontWeight: 500 }}
        >
          Abrir Editor de Templates →
        </button>
      </div>
    </>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PAGE                                               */
/* ═══════════════════════════════════════════════════ */

type StatusFilter = "all" | "active" | "paused";
type LogFilter = "all" | "success" | "error" | "skipped";

export function AutomacoesPage() {
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [viewingLog, setViewingLog] = useState<LogEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AutomationRule | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [templatePickerRuleId, setTemplatePickerRuleId] = useState<string | null>(null);
  const navigate = useNavigate();

  useShellConfig({
    breadcrumb: { section: "Sistema", page: "Automações" },
  });

  /* ── Derived ── */
  const activeRules = rules.filter((r) => r.active).length;
  const pausedRules = rules.length - activeRules;
  const totalExecutions = rules.reduce((s, r) => s + r.executions, 0);
  const successRate = logs.length > 0
    ? Math.round((logs.filter(l => l.status === "success").length / logs.length) * 100)
    : 0;

  /* ── Filtered rules ── */
  const filteredRules = useMemo(() => {
    let list = rules;
    if (statusFilter === "active") list = list.filter((r) => r.active);
    else if (statusFilter === "paused") list = list.filter((r) => !r.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    return list;
  }, [rules, search, statusFilter]);

  /* ── Filtered logs ── */
  const filteredLogs = useMemo(() => {
    if (logFilter === "all") return logs;
    return logs.filter((l) => l.status === logFilter);
  }, [logs, logFilter]);

  /* ── Actions ── */
  const toggleRule = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const next = !r.active;
      toast.success(next ? "Automação ativada" : "Automação pausada", { description: r.name, duration: 3000 });
      return { ...r, active: next };
    }));
  }, []);

  const deleteRule = useCallback((rule: AutomationRule) => {
    setRules((prev) => prev.filter((r) => r.id !== rule.id));
    setDeleteTarget(null);
    toast.success("Automação removida", { description: rule.name, duration: 3000 });
  }, []);

  const duplicateRule = useCallback((rule: AutomationRule) => {
    const dup: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (cópia)`,
      active: false,
      executions: 0,
      lastRun: undefined,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setRules((prev) => [dup, ...prev]);
    toast.success("Automação duplicada", { description: dup.name, duration: 3000 });
  }, []);

  const runNow = useCallback((rule: AutomationRule) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      time: "agora",
      status: "success",
      detail: `Execução manual — ${rule.action.label}`,
      duration: `${(Math.random() * 2 + 0.5).toFixed(1)}s`,
    };
    setLogs((prev) => [newLog, ...prev]);
    setRules((prev) => prev.map(r => r.id === rule.id ? { ...r, executions: r.executions + 1, lastRun: "agora" } : r));
    toast.success("Automação executada", { description: rule.name, duration: 3000 });
  }, []);

  const createFromTemplate = useCallback((template: AutomationTemplate) => {
    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: template.name,
      description: template.description,
      trigger: { type: "custom", label: template.triggerLabel, icon: template.triggerIcon },
      action: { type: "custom", label: template.actionLabel, icon: template.actionIcon },
      active: true,
      executions: 0,
      createdAt: new Date().toISOString().split("T")[0],
      category: template.category,
    };
    setRules((prev) => [newRule, ...prev]);
    setShowTemplates(false);
    toast.success("Automação criada!", { description: template.name, duration: 3000 });
  }, []);

  const createCustom = useCallback(() => {
    const blank: AutomationRule = {
      id: `new-${Date.now()}`,
      name: "",
      description: "",
      trigger: { type: TRIGGER_OPTIONS[0].type, label: TRIGGER_OPTIONS[0].label, icon: TRIGGER_OPTIONS[0].icon },
      action: { type: ACTION_OPTIONS[0].type, label: ACTION_OPTIONS[0].label, icon: ACTION_OPTIONS[0].icon },
      active: true,
      executions: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setEditingRule(blank);
  }, []);

  const saveRule = useCallback((updated: AutomationRule) => {
    if (updated.id.startsWith("new-")) {
      const withId = { ...updated, id: `rule-${Date.now()}` };
      setRules((prev) => [withId, ...prev]);
    } else {
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
  }, []);

  const retryLog = useCallback((log: LogEntry) => {
    setLogs((prev) => prev.map(l => l.id === log.id ? { ...l, status: "success" as const, detail: "Reexecução manual — sucesso", time: "agora" } : l));
    toast.success("Reexecução bem-sucedida", { description: log.ruleName, duration: 3000 });
  }, []);

  const changeEmailTemplate = useCallback((ruleId: string, tmpl: string) => {
    setRules((prev) => prev.map((r) =>
      r.id === ruleId ? { ...r, action: { ...r.action, emailTemplate: tmpl } } : r
    ));
    setTemplatePickerRuleId(null);
    toast.success("Template alterado", { description: tmpl, duration: 2000 });
  }, []);

  /* ── KPIs ── */
  const kpis = {
    projetos: { label: "Total", value: String(rules.length), sub: "automações" },
    aReceber: { label: "Ativas", value: String(activeRules), sub: "em execução" },
    producao: { label: "Execuções", value: String(totalExecutions), sub: "realizadas" },
    compromissos: { label: "Taxa de Sucesso", value: `${successRate}%`, sub: "dos logs" },
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ── Onboarding ── */}
      <OnboardingBanner
        id="automacoes-intro"
        title="Automações de Workflow"
        message="Configure regras que executam ações automaticamente — enviar emails, criar tarefas, notificar equipa — sem intervenção manual."
      />

      {/* Header */}
      <HeaderWidget
        greeting="Automações"
        userName=""
        contextLine={`${activeRules} ativa${activeRules !== 1 ? "s" : ""} · ${totalExecutions} execuções totais`}
        quickActions={[
          { label: "Nova Automação", icon: <Plus className="w-4 h-4" />, onClick: () => setShowTemplates(true) },
          { label: "Criar do Zero", icon: <Pencil className="w-4 h-4" />, onClick: createCustom },
        ]}
        showSearch
        searchPlaceholder="Buscar automações..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <div className="mx-5 h-px bg-[#F2F2F7]" />
        <DashboardKpiGrid
          flat
          projetos={kpis.projetos}
          aReceber={kpis.aReceber}
          producao={kpis.producao}
          compromissos={kpis.compromissos}
        />
      </HeaderWidget>

      {/* ── Status filter bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
          {([
            { key: "all" as StatusFilter, label: "Todas", count: rules.length },
            { key: "active" as StatusFilter, label: "Ativas", count: activeRules },
            { key: "paused" as StatusFilter, label: "Pausadas", count: pausedRules },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={"flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer " + (
                statusFilter === f.key ? "bg-white text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]"
              )}
              style={{
                fontWeight: 500,
                ...(statusFilter === f.key ? { boxShadow: "0 1px 3px #F2F2F7" } : {}),
              }}
            >
              {f.label}
              <span className="text-[10px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>{f.count}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-[12px] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer"
          style={{ fontWeight: 600 }}
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Automação
        </button>
      </div>

      {/* ── Rules List ── */}
      <WidgetCard title="Regras de Automação" count={filteredRules.length} delay={0.04}>
        <div className="flex flex-col">
          <AnimatePresence mode="popLayout">
            {filteredRules.length > 0 ? (
              filteredRules.map((rule, idx) => (
                <motion.div
                  key={rule.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ ...springDefault, delay: idx * 0.02 }}
                >
                  {idx > 0 && <div className="mx-5 h-px bg-[#F2F2F7]" />}
                  <div className="flex items-center gap-3 px-5 py-4 hover:bg-[#FAFAFA] transition-colors group">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className="shrink-0 cursor-pointer"
                      title={rule.active ? "Pausar" : "Ativar"}
                    >
                      {rule.active ? (
                        <ToggleRight className="w-6 h-6 text-[#34C759]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-[#D1D1D6]" />
                      )}
                    </button>

                    {/* Flow visual */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setEditingRule(rule)}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={"text-[13px] " + (rule.active ? "text-[#1D1D1F]" : "text-[#AEAEB2]")} style={{ fontWeight: 500 }}>
                          {rule.name}
                        </span>
                        <TagPill variant={rule.active ? "success" : "neutral"} size="xs">
                          {rule.active ? "Ativa" : "Pausada"}
                        </TagPill>
                      </div>
                      {/* Trigger → Condition → Action flow */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#EDF4FF]">
                          <span className="text-[#007AFF]">{rule.trigger.icon}</span>
                          <span className="text-[10px] text-[#007AFF]" style={{ fontWeight: 600 }}>
                            {rule.trigger.label}
                          </span>
                        </div>
                        {rule.condition && (
                          <>
                            <ArrowRight className="w-3 h-3 text-[#D1D1D6] shrink-0" />
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFF4E6]">
                              <span className="text-[10px] text-[#FF9500]" style={{ fontWeight: 600 }}>
                                {rule.condition.label}
                              </span>
                            </div>
                          </>
                        )}
                        <ArrowRight className="w-3 h-3 text-[#D1D1D6] shrink-0" />
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#E6F9ED]">
                          <span className="text-[#34C759]">{rule.action.icon}</span>
                          <span className="text-[10px] text-[#34C759]" style={{ fontWeight: 600 }}>
                            {rule.action.label}
                          </span>
                        </div>
                      </div>
                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                          {rule.executions} execuções
                        </span>
                        {rule.lastRun && (
                          <span className="flex items-center gap-0.5 text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                            <Clock className="w-2.5 h-2.5" />
                            Última: {rule.lastRun}
                          </span>
                        )}
                        {rule.action.emailTemplate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplatePickerRuleId(templatePickerRuleId === rule.id ? null : rule.id);
                            }}
                            className="flex items-center gap-0.5 text-[10px] text-[#007AFF] hover:text-[#0066D6] transition-colors cursor-pointer"
                            style={{ fontWeight: 500 }}
                          >
                            <Mail className="w-2.5 h-2.5" />
                            {rule.action.emailTemplate}
                            <ChevronRight className={"w-2.5 h-2.5 transition-transform " + (templatePickerRuleId === rule.id ? "rotate-90" : "")} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => runNow(rule)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#34C759] hover:bg-[#E6F9ED] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Executar agora"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === rule.id ? null : rule.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Mais ações"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <ActionMenu
                          open={menuOpenId === rule.id}
                          onClose={() => setMenuOpenId(null)}
                          actions={[
                            { label: "Editar", icon: <Pencil className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => setEditingRule(rule) },
                            { label: "Duplicar", icon: <Copy className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => duplicateRule(rule) },
                            { label: "Executar agora", icon: <Play className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => runNow(rule) },
                            { label: "Remover", icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => setDeleteTarget(rule) },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springDefault}
                className="flex flex-col items-center justify-center py-16 gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F2F2F7] flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#D1D1D6]" />
                </div>
                <p className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                  {search ? "Nenhuma automação encontrada" : "Nenhuma automação nesta categoria"}
                </p>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-[12px] hover:bg-[#0066D6] transition-all cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar primeira automação
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </WidgetCard>

      {/* ── Execution Log ── */}
      <WidgetCard title="Registro de Execução" count={filteredLogs.length} delay={0.06}>
        {/* Log filter */}
        <div className="px-5 py-2.5 border-b border-[#F2F2F7] flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-lg p-0.5">
            {([
              { key: "all" as LogFilter, label: "Todos" },
              { key: "success" as LogFilter, label: "Sucesso" },
              { key: "error" as LogFilter, label: "Erros" },
              { key: "skipped" as LogFilter, label: "Ignorados" },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setLogFilter(f.key)}
                className={"px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer " + (
                  logFilter === f.key ? "bg-white text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]"
                )}
                style={{
                  fontWeight: 500,
                  ...(logFilter === f.key ? { boxShadow: "0 1px 2px #F2F2F7" } : {}),
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-[#D1D1D6] tabular-nums" style={{ fontWeight: 400 }}>
            {logs.filter(l => l.status === "success").length} sucesso · {logs.filter(l => l.status === "error").length} erros
          </span>
        </div>

        <div className="flex flex-col">
          <AnimatePresence mode="popLayout">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => {
                const cfg = STATUS_CFG[log.status];
                return (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ ...springDefault, delay: idx * 0.015 }}
                  >
                    {idx > 0 && <div className="mx-5 h-px bg-[#F2F2F7]" />}
                    <div
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
                      onClick={() => setViewingLog(log)}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>
                          {log.ruleName}
                        </p>
                        <p className="text-[10px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>
                          {log.detail}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {log.duration && (
                          <span className="text-[9px] text-[#D1D1D6] tabular-nums" style={{ fontWeight: 400 }}>
                            {log.duration}
                          </span>
                        )}
                        <span className="text-[10px] text-[#C7C7CC] shrink-0" style={{ fontWeight: 400 }}>
                          {log.time}
                        </span>
                        <TagPill variant={cfg.variant} size="xs">{cfg.label}</TagPill>
                        {log.status === "error" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); retryLog(log); }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#007AFF] hover:bg-[#EDF4FF] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Retentar"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-[#D1D1D6] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                key="log-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={springDefault}
                className="flex flex-col items-center justify-center py-12 gap-2"
              >
                <History className="w-5 h-5 text-[#D1D1D6]" />
                <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                  Nenhum log nesta categoria
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </WidgetCard>

      {/* ── Footer ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-[#E5E5EA]"
        style={{ boxShadow: "0 1px 3px #F2F2F7" }}
      >
        <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
          <span className="text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>{rules.length}</span> automações
          {statusFilter !== "all" && <span className="text-[#C7C7CC]"> · filtro: {statusFilter === "active" ? "ativas" : "pausadas"}</span>}
        </span>
        <span className="text-[11px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
          {activeRules} ativas · {pausedRules} pausadas · {totalExecutions} execuções · {successRate}% sucesso
        </span>
      </div>

      {/* ── Template Picker Modal ── */}
      <AnimatePresence>
        {showTemplates && (
          <TemplatePickerModal
            onClose={() => setShowTemplates(false)}
            onCreate={createFromTemplate}
          />
        )}
      </AnimatePresence>

      {/* ── Rule Edit Drawer ── */}
      <RuleEditDrawer
        open={!!editingRule}
        onClose={() => setEditingRule(null)}
        rule={editingRule}
        onSave={saveRule}
      />

      {/* ── Log Detail Drawer ── */}
      <LogDetailDrawer
        open={!!viewingLog}
        onClose={() => setViewingLog(null)}
        log={viewingLog}
        onRetry={retryLog}
      />

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Remover Automação"
        description={`Tem certeza que deseja remover "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) deleteRule(deleteTarget); }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Inline Template Picker (per-rule) ── */}
      {templatePickerRuleId && (() => {
        const rule = rules.find(r => r.id === templatePickerRuleId);
        if (!rule?.action.emailTemplate) return null;
        return (
          <InlineTemplatePicker
            currentTemplate={rule.action.emailTemplate}
            onSelect={(tmpl) => changeEmailTemplate(rule.id, tmpl)}
            onClose={() => setTemplatePickerRuleId(null)}
            onNavigateTemplates={() => { setTemplatePickerRuleId(null); navigate("/email-templates"); }}
          />
        );
      })()}
    </div>
  );
}
