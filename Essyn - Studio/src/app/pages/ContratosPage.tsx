/**
 * ContratosPage — Contract & Document Management
 *
 * Features:
 * - Template library (Casamento, Corporativo, Ensaio, Álbum)
 * - Contract list with status (rascunho, enviado, assinado, expirado)
 * - Preview modal with A4 document layout
 * - Digital signature mock (canvas draw pad)
 * - Edit drawer for contract details
 * - Create contract form (from template or blank)
 * - Delete confirmation, duplicate, copy link, resend
 * - Status filter tabs + search
 * - ESC close on all modals, role="dialog"
 *
 * Apple Premium design, zero transparency rule.
 */
import { useState, useMemo, useRef, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  FileText, Plus, Search, Eye, Send, Check,
  X, Download, Copy, Pen, Clock,
  Briefcase, Heart, Camera, ChevronRight,
  Calendar, User, AlertTriangle,
  CheckCircle2, MoreHorizontal, Pencil,
  Trash2, Link2, RefreshCw, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { springDefault } from "../lib/motion-tokens";
import { OnboardingBanner } from "../components/ui/OnboardingTooltip";
import {
  WidgetCard, HeaderWidget, AppleDrawer, ConfirmDialog,
} from "../components/ui/apple-kit";
import { TagPill } from "../components/ui/tag-pill";
import { DashboardKpiGrid } from "../components/ui/dashboard-kpi-grid";
import { useShellConfig } from "../components/ui/ShellContext";
import { useAppStore } from "../lib/appStore";

/* ═══════════════════════════════════════════════════ */
/*  TYPES & DATA                                       */
/* ═══════════════════════════════════════════════════ */

type ContractStatus = "rascunho" | "enviado" | "assinado" | "expirado";

interface Contract {
  id: string;
  title: string;
  client: string;
  projectId?: string;
  template: string;
  status: ContractStatus;
  value: number;
  eventDate?: string;
  createdAt: string;
  signedAt?: string;
  expiresAt?: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  category: string;
  clauses: number;
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bg: string; icon: ReactNode; variant: "neutral" | "success" | "warning" | "danger" }> = {
  rascunho: { label: "Rascunho", color: "#8E8E93", bg: "#F2F2F7", icon: <Pen className="w-3.5 h-3.5" />, variant: "neutral" },
  enviado:  { label: "Enviado",  color: "#FF9500", bg: "#FFF4E6", icon: <Send className="w-3.5 h-3.5" />, variant: "warning" },
  assinado: { label: "Assinado", color: "#34C759", bg: "#E6F9ED", icon: <CheckCircle2 className="w-3.5 h-3.5" />, variant: "success" },
  expirado: { label: "Expirado", color: "#FF3B30", bg: "#FBF5F4", icon: <AlertTriangle className="w-3.5 h-3.5" />, variant: "danger" },
};

const TEMPLATES: ContractTemplate[] = [
  { id: "tmpl-1", name: "Casamento", description: "Contrato completo para cobertura de casamento com ensaio pré-wedding, cerimônia e festa", icon: <Heart className="w-5 h-5" />, category: "Eventos", clauses: 12 },
  { id: "tmpl-2", name: "Corporativo", description: "Cobertura de eventos empresariais, conferências e lançamentos de produto", icon: <Briefcase className="w-5 h-5" />, category: "Eventos", clauses: 10 },
  { id: "tmpl-3", name: "Ensaio Fotográfico", description: "Ensaio individual, casal, família ou gestante em locação ou estúdio", icon: <Camera className="w-5 h-5" />, category: "Sessões", clauses: 8 },
  { id: "tmpl-4", name: "Álbum & Impressões", description: "Termo de encomenda para produtos impressos com prazos de entrega", icon: <FileText className="w-5 h-5" />, category: "Produtos", clauses: 6 },
];

const INITIAL_CONTRACTS: Contract[] = [
  { id: "ctr-1", title: "Casamento Ana & Diego — Contrato Principal", client: "Ana Clara & Diego", projectId: "p1", template: "Casamento", status: "assinado", value: 15000, eventDate: "2026-08-12", createdAt: "2026-01-10", signedAt: "2026-01-15" },
  { id: "ctr-2", title: "Ensaio Gestante Luísa — Contrato", client: "Luísa Carvalho", projectId: "p2", template: "Ensaio Fotográfico", status: "enviado", value: 2400, eventDate: "2026-03-08", createdAt: "2026-02-01", expiresAt: "2026-03-01" },
  { id: "ctr-3", title: "Corp TechBrasil — Evento Anual", client: "TechBrasil SA", projectId: "p3", template: "Corporativo", status: "rascunho", value: 8500, eventDate: "2026-04-15", createdAt: "2026-02-10" },
  { id: "ctr-4", title: "Casamento Mariana & Rafael — Proposta", client: "Mariana & Rafael", template: "Casamento", status: "enviado", value: 12500, eventDate: "2026-07-18", createdAt: "2026-02-12", expiresAt: "2026-03-12" },
  { id: "ctr-5", title: "Ensaio Família Santos — Contrato", client: "Carlos Santos", template: "Ensaio Fotográfico", status: "assinado", value: 3200, createdAt: "2026-01-20", signedAt: "2026-01-22" },
  { id: "ctr-6", title: "Álbum Premium — Ana & Diego", client: "Ana Clara & Diego", projectId: "p1", template: "Álbum & Impressões", status: "expirado", value: 1800, createdAt: "2025-12-01", expiresAt: "2026-01-01" },
];

type TabFilter = "todos" | "rascunho" | "enviado" | "assinado" | "expirado";

/* ═══════════════════════════════════════════════════ */
/*  HELPERS                                            */
/* ═══════════════════════════════════════════════════ */

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

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
      {createPortal(<div className="fixed inset-0 z-[9997]" onClick={onClose} />, document.body)}
      <div
        className="absolute right-0 top-8 z-[9998] w-52 bg-white rounded-xl border border-[#E5E5EA] p-1"
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
/*  EDIT DRAWER                                        */
/* ═══════════════════════════════════════════════════ */

function ContractEditDrawer({
  open,
  onClose,
  contract,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  contract: Contract | null;
  onSave: (updated: Contract) => void;
}) {
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [value, setValue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [templateName, setTemplateName] = useState("");

  const contractId = contract?.id ?? "";
  useMemo(() => {
    if (!contract) return;
    setTitle(contract.title);
    setClient(contract.client);
    setValue(contract.value.toString());
    setEventDate(contract.eventDate ?? "");
    setTemplateName(contract.template);
  }, [contractId]);

  if (!contract) return null;

  const isNew = contract.id.startsWith("new-");

  const handleSave = () => {
    const updated: Contract = {
      ...contract,
      title: title.trim() || contract.title,
      client: client.trim() || contract.client,
      value: Number(value) || 0,
      eventDate: eventDate || undefined,
      template: templateName || contract.template,
    };
    onSave(updated);
    onClose();
    toast.success(isNew ? "Contrato criado!" : "Contrato atualizado!", { description: updated.title, duration: 3000 });
  };

  const inputCls = "w-full h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none focus:border-[#007AFF] transition-colors";
  const labelCls = "text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]";

  return (
    <AppleDrawer
      open={open}
      onClose={onClose}
      title={isNew ? "Novo Contrato" : "Editar Contrato"}
      subtitle={isNew ? `Template: ${templateName}` : `Criado em ${contract.createdAt}`}
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
            disabled={!title.trim() || !client.trim()}
            className={"flex items-center gap-1.5 px-5 py-2 rounded-xl text-[12px] text-white active:scale-[0.98] transition-all cursor-pointer " + (
              title.trim() && client.trim() ? "bg-[#007AFF] hover:bg-[#0066D6]" : "bg-[#C7C7CC] cursor-not-allowed"
            )}
            style={{ fontWeight: 600 }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isNew ? "Criar Contrato" : "Salvar Alterações"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 px-5 py-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Título do contrato</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Casamento Ana & Diego" className={inputCls} style={{ fontWeight: 400 }} />
        </div>

        {/* Client */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Cliente</label>
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nome do cliente" className={inputCls} style={{ fontWeight: 400 }} />
        </div>

        {/* Value */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Valor (R$)</label>
          <input value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))} placeholder="0" className={inputCls} style={{ fontWeight: 400 }} type="text" inputMode="numeric" />
        </div>

        {/* Event Date */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Data do evento (opcional)</label>
          <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} type="date" className={inputCls} style={{ fontWeight: 400 }} />
        </div>

        {/* Template */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 600 }}>Template</label>
          <div className="relative">
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] outline-none focus:border-[#007AFF] transition-colors cursor-pointer appearance-none"
              style={{ fontWeight: 400 }}
            >
              {TEMPLATES.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C7C7CC] rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* Status info (edit only) */}
        {!isNew && (
          <>
            <div className="h-px bg-[#F2F2F7]" />
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ fontWeight: 600 }}>Informações</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Status", value: STATUS_CONFIG[contract.status].label },
                  { label: "Valor", value: fmtCurrency(contract.value) },
                  { label: "Criado em", value: contract.createdAt },
                  { label: contract.signedAt ? "Assinado em" : contract.expiresAt ? "Expira em" : "Evento", value: contract.signedAt ?? contract.expiresAt ?? contract.eventDate ?? "—" },
                ].map(s => (
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
/*  CONTRACT PREVIEW MODAL                             */
/* ═══════════════════════════════════════════════════ */

function ContractPreviewModal({
  contract,
  onClose,
  onSend,
  onSign,
  onEdit,
}: {
  contract: Contract;
  onClose: () => void;
  onSend: () => void;
  onSign: () => void;
  onEdit: () => void;
}) {
  const sc = STATUS_CONFIG[contract.status];

  // ESC close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const clauses = [
    { title: "1. Objeto do Contrato", text: `O presente contrato tem como objeto a prestação de serviços de fotografia profissional para ${contract.client}, conforme especificações descritas neste instrumento.` },
    { title: "2. Valor e Pagamento", text: `O valor total dos serviços é de ${fmtCurrency(contract.value)}, a ser pago conforme condições acordadas entre as partes, podendo ser dividido em até 3 parcelas.` },
    { title: "3. Data do Evento", text: contract.eventDate ? `O evento está agendado para ${contract.eventDate}. Em caso de cancelamento, aplica-se multa de 30% sobre o valor total.` : "Data a ser definida entre as partes com antecedência mínima de 15 dias." },
    { title: "4. Entrega do Material", text: "As fotos editadas serão entregues em até 30 dias úteis após o evento, através de galeria digital privada com acesso por senha." },
    { title: "5. Direitos de Uso", text: "O fotógrafo reserva-se o direito de utilizar as imagens para portfolio e divulgação, salvo solicitação expressa em contrário por parte do contratante." },
    { title: "6. Disposições Gerais", text: "Este contrato é regido pelas leis brasileiras. Quaisquer disputas serão resolvidas no foro da comarca do fotógrafo." },
  ];

  return createPortal(
    <>
      <motion.div
        key="preview-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={springDefault}
        className="fixed inset-0 z-[9998] bg-[#1D1D1F]"
        onClick={onClose}
      />
      <motion.div
        key="preview-modal"
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 30 }}
        transition={springDefault}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: "0 1px 3px #E5E5EA, 0 16px 64px #D1D1D6" }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={`Contrato: ${contract.title}`}
        >
          {/* Toolbar */}
          <div className="sticky top-0 flex items-center justify-between px-5 py-3 border-b border-[#F2F2F7] bg-[#FAFAFA] z-10 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#636366]" />
              <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
                Pré-visualização
              </span>
              <TagPill variant={sc.variant} size="xs">{sc.label}</TagPill>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onEdit}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] text-[11px] text-[#636366] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
                title="Editar contrato"
              >
                <Pencil className="w-3 h-3" />
                Editar
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(`https://essyn.studio/contratos/${contract.id}`); toast.success("Link copiado!"); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] text-[11px] text-[#636366] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
                title="Copiar link"
              >
                <Link2 className="w-3 h-3" />
                Link
              </button>
              <button
                onClick={() => toast.success("Download iniciado!", { description: `${contract.title}.pdf` })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] text-[11px] text-[#636366] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
                title="Download PDF"
              >
                <Download className="w-3 h-3" />
                PDF
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document Body */}
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-[22px] text-[#1D1D1F] tracking-tight" style={{ fontWeight: 700 }}>ESSYN</h1>
                <p className="text-[10px] text-[#8E8E93] mt-0.5" style={{ fontWeight: 500 }}>Fotografia Profissional</p>
              </div>
              <div className="text-right">
                <p className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>CONTRATO</p>
                <p className="text-[11px] text-[#007AFF]" style={{ fontWeight: 600 }}>{contract.id.toUpperCase()}</p>
              </div>
            </div>

            <div className="h-px bg-[#E5E5EA] mb-4" />

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-[9px] text-[#8E8E93] mb-1" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  CONTRATADO
                </p>
                <p className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>ESSYN Fotografia LTDA</p>
                <p className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>CNPJ: 12.345.678/0001-90</p>
              </div>
              <div>
                <p className="text-[9px] text-[#8E8E93] mb-1" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  CONTRATANTE
                </p>
                <p className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{contract.client}</p>
                <p className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                  Template: {contract.template}
                </p>
              </div>
            </div>

            {/* Contract details */}
            <div className="bg-[#F5F5F7] rounded-xl p-3 mb-5 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[9px] text-[#8E8E93]" style={{ fontWeight: 600 }}>VALOR</p>
                <p className="text-[14px] text-[#007AFF] tabular-nums" style={{ fontWeight: 700 }}>{fmtCurrency(contract.value)}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#8E8E93]" style={{ fontWeight: 600 }}>EVENTO</p>
                <p className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{contract.eventDate || "—"}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#8E8E93]" style={{ fontWeight: 600 }}>CRIADO</p>
                <p className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{contract.createdAt}</p>
              </div>
            </div>

            {/* Clauses */}
            <div className="flex flex-col gap-4 mb-6">
              {clauses.map((clause) => (
                <div key={clause.title}>
                  <p className="text-[12px] text-[#1D1D1F] mb-1" style={{ fontWeight: 600 }}>{clause.title}</p>
                  <p className="text-[11px] text-[#636366]" style={{ fontWeight: 400, lineHeight: "1.6" }}>{clause.text}</p>
                </div>
              ))}
            </div>

            {/* Signature area */}
            <div className="border-t border-[#E5E5EA] pt-4 mt-4">
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-16 border-b border-[#E5E5EA]" />
                  <p className="text-[10px] text-[#8E8E93]" style={{ fontWeight: 500 }}>ESSYN Fotografia</p>
                  <p className="text-[9px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Contratado</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-16 border-b border-[#E5E5EA] flex items-end justify-center pb-1">
                    {contract.status === "assinado" && (
                      <span className="text-[14px] text-[#34C759] italic" style={{ fontWeight: 600 }}>
                        Assinado digitalmente
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8E8E93]" style={{ fontWeight: 500 }}>{contract.client}</p>
                  <p className="text-[9px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Contratante</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4">
              <p className="text-[9px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>
                Documento gerado pelo ESSYN · essyn.studio
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 px-5 py-4 border-t border-[#F2F2F7]">
            {contract.status === "rascunho" && (
              <button
                onClick={onSend}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <Send className="w-3.5 h-3.5" />
                Enviar ao Cliente
              </button>
            )}
            {contract.status === "enviado" && (
              <button
                onClick={onSign}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#34C759] text-white text-[13px] hover:bg-[#2DA44E] active:scale-[0.98] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <Pen className="w-3.5 h-3.5" />
                Simular Assinatura
              </button>
            )}
            {contract.status === "expirado" && (
              <button
                onClick={() => { onClose(); toast.info("Dica: Duplique este contrato e reenvie com novas datas."); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF9500] text-white text-[13px] hover:bg-[#E68600] active:scale-[0.98] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Renovar Contrato
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#636366] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  SIGNATURE MODAL                                    */
/* ═══════════════════════════════════════════════════ */

function SignatureModal({
  contract,
  onClose,
  onComplete,
}: {
  contract: Contract;
  onClose: () => void;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1D1D1F";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // ESC close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const startDraw = (x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    setIsDrawing(true);
    setHasDrawn(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  return createPortal(
    <>
      <motion.div
        key="sig-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={springDefault}
        className="fixed inset-0 z-[10000] bg-[#1D1D1F]"
        onClick={onClose}
      />
      <motion.div
        key="sig-modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={springDefault}
        className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-[420px] overflow-hidden"
          style={{ boxShadow: "0 1px 3px #E5E5EA, 0 16px 64px #D1D1D6" }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Assinatura Digital"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
            <div>
              <h3 className="text-[15px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Assinatura Digital</h3>
              <p className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{contract.client}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas */}
          <div className="px-5 py-4">
            <p className="text-[11px] text-[#8E8E93] mb-3" style={{ fontWeight: 500 }}>
              Desenhe sua assinatura abaixo:
            </p>
            <div className="border border-[#E5E5EA] rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={360}
                height={140}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={(e) => { const p = getPos(e); startDraw(p.x, p.y); }}
                onMouseMove={(e) => { const p = getPos(e); draw(p.x, p.y); }}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={(e) => { e.preventDefault(); const p = getTouchPos(e); startDraw(p.x, p.y); }}
                onTouchMove={(e) => { e.preventDefault(); const p = getTouchPos(e); draw(p.x, p.y); }}
                onTouchEnd={stopDraw}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={clearCanvas}
                className="text-[11px] text-[#AEAEB2] hover:text-[#FF3B30] transition-colors cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                Limpar
              </button>
              <span className="text-[9px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>
                Use o mouse ou toque para assinar
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 px-5 py-4 border-t border-[#F2F2F7]">
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#636366] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              Cancelar
            </button>
            <button
              onClick={onComplete}
              disabled={!hasDrawn}
              className={"flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer " + (
                hasDrawn
                  ? "bg-[#34C759] text-white hover:bg-[#2DA44E] active:scale-[0.98]"
                  : "bg-[#F2F2F7] text-[#C7C7CC] cursor-not-allowed"
              )}
              style={{ fontWeight: 500 }}
            >
              <Check className="w-3.5 h-3.5" />
              Confirmar Assinatura
            </button>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  NEW CONTRACT MODAL                                 */
/* ═══════════════════════════════════════════════════ */

function NewContractModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (template: ContractTemplate) => void;
}) {
  const [searchTmpl, setSearchTmpl] = useState("");

  // ESC close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!searchTmpl.trim()) return TEMPLATES;
    const q = searchTmpl.toLowerCase();
    return TEMPLATES.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [searchTmpl]);

  return createPortal(
    <>
      <motion.div
        key="new-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={springDefault}
        className="fixed inset-0 z-[9998] bg-[#1D1D1F]"
        onClick={onClose}
      />
      <motion.div
        key="new-modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={springDefault}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-[440px] overflow-hidden flex flex-col max-h-[80vh]"
          style={{ boxShadow: "0 1px 3px #E5E5EA, 0 16px 64px #D1D1D6" }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Novo Contrato"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7] shrink-0">
            <div>
              <h3 className="text-[15px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Novo Contrato</h3>
              <p className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Escolha um template para começar</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-2 border-b border-[#F2F2F7] shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] focus-within:border-[#007AFF] transition-all">
              <Search className="w-3.5 h-3.5 text-[#C7C7CC] shrink-0" />
              <input
                value={searchTmpl}
                onChange={(e) => setSearchTmpl(e.target.value)}
                placeholder="Buscar template..."
                className="flex-1 text-[12px] text-[#1D1D1F] bg-transparent outline-none placeholder:text-[#C7C7CC]"
                style={{ fontWeight: 400 }}
                autoFocus
              />
              {searchTmpl && (
                <button onClick={() => setSearchTmpl("")} className="text-[#C7C7CC] hover:text-[#8E8E93] cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Templates */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Search className="w-5 h-5 text-[#D1D1D6]" />
                <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Nenhum template encontrado</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => onCreate(tmpl)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#F2F2F7] hover:border-[#D1D1D6] hover:bg-[#FAFAFA] transition-all cursor-pointer text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#8E8E93] group-hover:text-[#007AFF] group-hover:bg-[#EDF4FF] transition-colors shrink-0">
                      {tmpl.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{tmpl.name}</p>
                      <p className="text-[10px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>{tmpl.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>{tmpl.category} · {tmpl.clauses} cláusulas</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#D1D1D6] group-hover:text-[#007AFF] transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#F2F2F7] shrink-0">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center py-2.5 rounded-xl border border-[#E5E5EA] text-[13px] text-[#636366] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PAGE                                               */
/* ═══════════════════════════════════════════════════ */

export function ContratosPage() {
  const { projects } = useAppStore();
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [activeTab, setActiveTab] = useState<TabFilter>("todos");
  const [search, setSearch] = useState("");
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [signContract, setSignContract] = useState<Contract | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useShellConfig({
    breadcrumb: { section: "Gestão", page: "Contratos" },
  });

  /* ── Derived ── */
  const stats = useMemo(() => ({
    total: contracts.length,
    rascunho: contracts.filter((c) => c.status === "rascunho").length,
    enviado: contracts.filter((c) => c.status === "enviado").length,
    assinado: contracts.filter((c) => c.status === "assinado").length,
    expirado: contracts.filter((c) => c.status === "expirado").length,
    valorTotal: contracts.filter((c) => c.status === "assinado").reduce((s, c) => s + c.value, 0),
  }), [contracts]);

  const filteredContracts = useMemo(() => {
    let result = [...contracts];
    if (activeTab !== "todos") result = result.filter((c) => c.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q) || c.client.toLowerCase().includes(q) || c.template.toLowerCase().includes(q));
    }
    return result;
  }, [contracts, activeTab, search]);

  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: "todos", label: "Todos", count: stats.total },
    { id: "rascunho", label: "Rascunhos", count: stats.rascunho },
    { id: "enviado", label: "Enviados", count: stats.enviado },
    { id: "assinado", label: "Assinados", count: stats.assinado },
    { id: "expirado", label: "Expirados", count: stats.expirado },
  ];

  /* ── Actions ── */
  const handleSendContract = useCallback((contract: Contract) => {
    setContracts((prev) => prev.map((c) => c.id === contract.id ? { ...c, status: "enviado" as ContractStatus, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] } : c));
    setPreviewContract(null);
    toast.success("Contrato enviado!", { description: `Para: ${contract.client}`, duration: 3000 });
  }, []);

  const handleResendContract = useCallback((contract: Contract) => {
    setContracts((prev) => prev.map((c) => c.id === contract.id ? { ...c, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] } : c));
    toast.success("Contrato reenviado!", { description: `Para: ${contract.client}`, duration: 3000 });
  }, []);

  const handleSignComplete = useCallback((contract: Contract) => {
    setContracts((prev) => prev.map((c) => c.id === contract.id ? { ...c, status: "assinado" as ContractStatus, signedAt: new Date().toISOString().split("T")[0] } : c));
    setSignContract(null);
    toast.success("Contrato assinado!", { description: contract.title, duration: 3000 });
  }, []);

  const handleCreateFromTemplate = useCallback((template: ContractTemplate) => {
    const newContract: Contract = {
      id: `new-${Date.now()}`,
      title: `${template.name} — Novo Contrato`,
      client: "",
      template: template.name,
      status: "rascunho",
      value: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setShowNewModal(false);
    setEditingContract(newContract);
  }, []);

  const handleSaveContract = useCallback((updated: Contract) => {
    if (updated.id.startsWith("new-")) {
      const withId = { ...updated, id: `ctr-${Date.now()}` };
      setContracts((prev) => [withId, ...prev]);
    } else {
      setContracts((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    }
  }, []);

  const handleDuplicate = useCallback((contract: Contract) => {
    const dup: Contract = {
      ...contract,
      id: `ctr-${Date.now()}`,
      title: `${contract.title} (cópia)`,
      status: "rascunho",
      signedAt: undefined,
      expiresAt: undefined,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setContracts((prev) => [dup, ...prev]);
    toast.success("Contrato duplicado!", { description: dup.title, duration: 3000 });
  }, []);

  const handleDelete = useCallback((contract: Contract) => {
    setContracts((prev) => prev.filter((c) => c.id !== contract.id));
    setDeleteTarget(null);
    toast.success("Contrato removido", { description: contract.title, duration: 3000 });
  }, []);

  const handleCopyLink = useCallback((contract: Contract) => {
    navigator.clipboard.writeText(`https://essyn.studio/contratos/${contract.id}`);
    toast.success("Link copiado!", { description: "Link do contrato copiado para a área de transferência", duration: 2000 });
  }, []);

  /* ── KPIs ── */
  const kpis = {
    projetos: { label: "Total", value: String(stats.total), sub: "contratos" },
    aReceber: { label: "Aguardando", value: String(stats.enviado), sub: "assinatura" },
    producao: { label: "Assinados", value: String(stats.assinado), sub: "confirmados" },
    compromissos: { label: "Valor Assinado", value: fmtCurrency(stats.valorTotal), sub: "em contratos ativos" },
  };

  /* ── Build row actions ── */
  const getRowActions = (contract: Contract) => {
    const actions: { label: string; icon: ReactNode; danger?: boolean; onClick: () => void }[] = [
      { label: "Visualizar", icon: <Eye className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => setPreviewContract(contract) },
      { label: "Editar", icon: <Pencil className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => setEditingContract(contract) },
      { label: "Copiar link", icon: <Link2 className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => handleCopyLink(contract) },
      { label: "Duplicar", icon: <Copy className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => handleDuplicate(contract) },
    ];
    if (contract.status === "rascunho") {
      actions.push({ label: "Enviar ao cliente", icon: <Send className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => handleSendContract(contract) });
    }
    if (contract.status === "enviado") {
      actions.push({ label: "Reenviar", icon: <RefreshCw className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => handleResendContract(contract) });
      actions.push({ label: "Simular assinatura", icon: <Pen className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => setSignContract(contract) });
    }
    if (contract.status === "assinado") {
      actions.push({ label: "Download PDF", icon: <Download className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => toast.success("Download iniciado!", { description: `${contract.title}.pdf` }) });
    }
    actions.push({ label: "Remover", icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => setDeleteTarget(contract) });
    return actions;
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ── Onboarding ── */}
      <OnboardingBanner
        id="contratos-intro"
        title="Contratos Digitais"
        message="Crie contratos a partir de templates, envie para assinatura digital e acompanhe o status em tempo real."
      />

      {/* Header */}
      <HeaderWidget
        greeting="Contratos & Documentos"
        userName=""
        contextLine={`${stats.total} contratos · ${stats.assinado} assinados · ${fmtCurrency(stats.valorTotal)} em contratos ativos`}
        quickActions={[
          { label: "Novo Contrato", icon: <Plus className="w-4 h-4" />, onClick: () => setShowNewModal(true) },
        ]}
        showSearch
        searchPlaceholder="Buscar contrato..."
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

      {/* Templates */}
      <WidgetCard title="Templates" count={TEMPLATES.length} delay={0.04}>
        <div className="flex overflow-x-auto no-scrollbar gap-3 px-5 py-3">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleCreateFromTemplate(tmpl)}
              className="shrink-0 w-[200px] rounded-xl border border-[#F2F2F7] bg-white overflow-hidden hover:border-[#D1D1D6] transition-colors cursor-pointer text-left group"
            >
              <div className="h-16 bg-[#F5F5F7] flex items-center justify-center text-[#C7C7CC] group-hover:text-[#007AFF] transition-colors">
                {tmpl.icon}
              </div>
              <div className="p-3 flex flex-col gap-1">
                <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{tmpl.name}</span>
                <span className="text-[10px] text-[#AEAEB2] line-clamp-2" style={{ fontWeight: 400, lineHeight: "1.4" }}>
                  {tmpl.description}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <TagPill variant="neutral" size="xs">{tmpl.category}</TagPill>
                  <span className="text-[9px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>
                    {tmpl.clauses} cláusulas
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </WidgetCard>

      {/* Contract List */}
      <WidgetCard title="Contratos" count={filteredContracts.length} delay={0.06}>
        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-[#F2F2F7] overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={"shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer " + (
                activeTab === tab.id
                  ? "bg-[#1D1D1F] text-white"
                  : "text-[#AEAEB2] hover:text-[#636366] hover:bg-[#FAFAFA]"
              )}
              style={{
                fontWeight: 500,
                ...(activeTab === tab.id ? { boxShadow: "0 1px 3px #C7C7CC" } : {}),
              }}
            >
              {tab.label}
              <span className={"text-[10px] tabular-nums " + (activeTab === tab.id ? "text-[#8E8E93]" : "text-[#D1D1D6]")} style={{ fontWeight: 600 }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          <AnimatePresence mode="popLayout">
            {filteredContracts.length > 0 ? (
              filteredContracts.map((contract, idx) => {
                const sc = STATUS_CONFIG[contract.status];
                const project = contract.projectId ? projects.find((p) => p.id === contract.projectId) : null;
                return (
                  <motion.div
                    key={contract.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ ...springDefault, delay: idx * 0.02 }}
                  >
                    {idx > 0 && <div className="mx-5 h-px bg-[#F2F2F7]" />}
                    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors group">
                      {/* Status icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
                        style={{ backgroundColor: sc.bg, color: sc.color }}
                        onClick={() => setPreviewContract(contract)}
                        title="Visualizar contrato"
                      >
                        {sc.icon}
                      </div>

                      {/* Info */}
                      <div
                        className="flex-1 min-w-0 flex flex-col gap-0.5 cursor-pointer"
                        onClick={() => setPreviewContract(contract)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>
                            {contract.title}
                          </span>
                          <TagPill variant={sc.variant} size="xs">{sc.label}</TagPill>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>
                            {contract.client}
                          </span>
                          {project && (
                            <>
                              <span className="text-[11px] text-[#D1D1D6]">·</span>
                              <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{project.nome}</span>
                            </>
                          )}
                          {contract.eventDate && (
                            <>
                              <span className="text-[11px] text-[#D1D1D6]">·</span>
                              <span className="flex items-center gap-0.5 text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                                <Calendar className="w-2.5 h-2.5" />
                                {contract.eventDate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Value */}
                      <span className="text-[14px] text-[#1D1D1F] tabular-nums shrink-0" style={{ fontWeight: 600 }}>
                        {fmtCurrency(contract.value)}
                      </span>

                      {/* Quick actions (hover) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setPreviewContract(contract)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#636366] hover:bg-[#F5F5F7] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Visualizar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {contract.status === "rascunho" && (
                          <button
                            onClick={() => handleSendContract(contract)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#007AFF] hover:bg-[#EDF4FF] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Enviar ao cliente"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {contract.status === "enviado" && (
                          <button
                            onClick={() => setSignContract(contract)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#34C759] hover:bg-[#E6F9ED] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Simular assinatura"
                          >
                            <Pen className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* More menu */}
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === contract.id ? null : contract.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Mais ações"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <ActionMenu
                            open={menuOpenId === contract.id}
                            onClose={() => setMenuOpenId(null)}
                            actions={getRowActions(contract)}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springDefault}
                className="flex flex-col items-center justify-center py-16 gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F2F2F7] flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#D1D1D6]" />
                </div>
                <p className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                  {search ? "Nenhum contrato encontrado para a busca" : "Nenhum contrato nesta categoria"}
                </p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-[12px] hover:bg-[#0066D6] transition-all cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar primeiro contrato
                </button>
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
          <span className="text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>{stats.total}</span> contratos
          {activeTab !== "todos" && <span className="text-[#C7C7CC]"> · filtro: {tabs.find(t => t.id === activeTab)?.label}</span>}
        </span>
        <span className="text-[11px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
          {stats.rascunho} rascunhos · {stats.enviado} enviados · {stats.assinado} assinados · {stats.expirado} expirados
        </span>
      </div>

      {/* ── Preview Modal ── */}
      <AnimatePresence>
        {previewContract && (
          <ContractPreviewModal
            contract={previewContract}
            onClose={() => setPreviewContract(null)}
            onSend={() => handleSendContract(previewContract)}
            onSign={() => { setPreviewContract(null); setSignContract(previewContract); }}
            onEdit={() => { setPreviewContract(null); setEditingContract(previewContract); }}
          />
        )}
      </AnimatePresence>

      {/* ── Signature Modal ── */}
      <AnimatePresence>
        {signContract && (
          <SignatureModal
            contract={signContract}
            onClose={() => setSignContract(null)}
            onComplete={() => handleSignComplete(signContract)}
          />
        )}
      </AnimatePresence>

      {/* ── New Contract Modal ── */}
      <AnimatePresence>
        {showNewModal && (
          <NewContractModal
            onClose={() => setShowNewModal(false)}
            onCreate={handleCreateFromTemplate}
          />
        )}
      </AnimatePresence>

      {/* ── Edit Drawer ── */}
      <ContractEditDrawer
        open={!!editingContract}
        onClose={() => setEditingContract(null)}
        contract={editingContract}
        onSave={handleSaveContract}
      />

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Remover Contrato"
        description={`Tem certeza que deseja remover "${deleteTarget?.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
