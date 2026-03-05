import { useState, useMemo, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  Eye,
  FileText,
  Layers,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
  Archive,
  PenTool,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { createPortal } from "react-dom";

import { TagPill } from "../ui/tag-pill";
import { AppleModal } from "../ui/apple-modal";
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from "../ui/apple-kit";

import { springStiff, withDelay } from "../../lib/motion-tokens";
const spring = springStiff;
const springStagger = (i: number) => withDelay(springStiff, i * 0.04);

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type ContractStatus = "ativo" | "rascunho" | "arquivado";
type ContractType = "casamento" | "aniversario" | "corporativo" | "ensaio" | "personalizado";
type DocTemplateType = "orcamento" | "recibo" | "termos" | "autorizacao" | "entrega" | "briefing";

interface ContractTemplate {
  id: string;
  name: string;
  type: ContractType;
  status: ContractStatus;
  clausesCount: number;
  lastUpdated: string;
  description: string;
  hasDigitalSignature: boolean;
}

interface DocTemplate {
  id: string;
  name: string;
  type: DocTemplateType;
  fieldsCount: number;
  lastUpdated: string;
  description: string;
  usageCount: number;
}

/* ═══════════════════════════════════════════════════ */
/*  CONFIG MAPS                                       */
/* ═══════════════════════════════════════════════════ */

const contractTypeConfig: Record<ContractType, { label: string; color: string; bg: string }> = {
  casamento: { label: "Casamento", color: "#FF2D55", bg: "#FFEBEF" },
  aniversario: { label: "Aniversário", color: "#FF9500", bg: "#FFF4E6" },
  corporativo: { label: "Corporativo", color: "#007AFF", bg: "#EDF4FF" },
  ensaio: { label: "Ensaio", color: "#AF52DE", bg: "#F5EDFA" },
  personalizado: { label: "Personalizado", color: "#636366", bg: "#F2F2F7" },
};

const contractStatusConfig: Record<ContractStatus, { label: string; variant: "success" | "warning" | "neutral" }> = {
  ativo: { label: "Ativo", variant: "success" },
  rascunho: { label: "Rascunho", variant: "warning" },
  arquivado: { label: "Arquivado", variant: "neutral" },
};

const docTypeConfig: Record<DocTemplateType, { label: string; color: string; bg: string }> = {
  orcamento: { label: "Orçamento", color: "#34C759", bg: "#E8F8ED" },
  recibo: { label: "Recibo", color: "#007AFF", bg: "#EDF4FF" },
  termos: { label: "Termos de Uso", color: "#FF9500", bg: "#FFF4E6" },
  autorizacao: { label: "Autorização", color: "#AF52DE", bg: "#F5EDFA" },
  entrega: { label: "Entrega", color: "#5AC8FA", bg: "#EAF7FE" },
  briefing: { label: "Briefing", color: "#FF2D55", bg: "#FFEBEF" },
};

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                         */
/* ═══════════════════════════════════════════════════ */

const initialContracts: ContractTemplate[] = [
  {
    id: "ct1",
    name: "Contrato de Casamento — Completo",
    type: "casamento",
    status: "ativo",
    clausesCount: 14,
    lastUpdated: "2026-01-20",
    description: "Contrato padrão para cobertura completa de casamento: cerimônia, recepção, making-of e ensaio pré-wedding",
    hasDigitalSignature: true,
  },
  {
    id: "ct2",
    name: "Contrato de Aniversário / Debutante",
    type: "aniversario",
    status: "ativo",
    clausesCount: 10,
    lastUpdated: "2025-11-05",
    description: "Cobertura fotográfica de festas de aniversário e formaturas com entrega de galeria digital",
    hasDigitalSignature: true,
  },
  {
    id: "ct3",
    name: "Contrato Corporativo — Evento",
    type: "corporativo",
    status: "ativo",
    clausesCount: 12,
    lastUpdated: "2025-09-18",
    description: "Cobertura de eventos corporativos, convenções, lançamentos e confraternizações",
    hasDigitalSignature: true,
  },
  {
    id: "ct4",
    name: "Contrato de Ensaio Fotográfico",
    type: "ensaio",
    status: "rascunho",
    clausesCount: 8,
    lastUpdated: "2026-02-10",
    description: "Ensaios pessoais, gestante, newborn, família e books profissionais",
    hasDigitalSignature: false,
  },
  {
    id: "ct5",
    name: "Mini Ensaio — Modelo Simplificado",
    type: "ensaio",
    status: "rascunho",
    clausesCount: 5,
    lastUpdated: "2026-02-28",
    description: "Sessão rápida de 30 minutos com 15 fotos editadas — ideal para datas comemorativas",
    hasDigitalSignature: false,
  },
];

const initialDocTemplates: DocTemplate[] = [
  {
    id: "dt1",
    name: "Orçamento Detalhado",
    type: "orcamento",
    fieldsCount: 18,
    lastUpdated: "2026-01-15",
    description: "Proposta comercial com pacotes, adicionais, condições de pagamento e cronograma",
    usageCount: 47,
  },
  {
    id: "dt2",
    name: "Recibo de Pagamento",
    type: "recibo",
    fieldsCount: 12,
    lastUpdated: "2025-12-20",
    description: "Comprovante de recebimento com dados fiscais, parcela, método e valor",
    usageCount: 83,
  },
  {
    id: "dt3",
    name: "Termos de Uso — Galeria",
    type: "termos",
    fieldsCount: 8,
    lastUpdated: "2025-10-05",
    description: "Termos e condições para acesso e download de fotos pela galeria do cliente",
    usageCount: 32,
  },
  {
    id: "dt4",
    name: "Autorização de Uso de Imagem",
    type: "autorizacao",
    fieldsCount: 10,
    lastUpdated: "2025-08-12",
    description: "Cessão de direitos de uso de imagem para portfólio, redes sociais e marketing",
    usageCount: 56,
  },
  {
    id: "dt5",
    name: "Termo de Entrega Final",
    type: "entrega",
    fieldsCount: 9,
    lastUpdated: "2025-11-28",
    description: "Confirmação de entrega de álbum, galeria digital e materiais impressos",
    usageCount: 29,
  },
  {
    id: "dt6",
    name: "Briefing de Evento",
    type: "briefing",
    fieldsCount: 22,
    lastUpdated: "2026-02-01",
    description: "Questionário de pré-produção: cronograma, locais, contatos, preferências e observações",
    usageCount: 41,
  },
];

/* ═══════════════════════════════════════════════════ */
/*  VIEW STATES                                       */
/* ═══════════════════════════════════════════════════ */

function LoadingState() {
  return <WidgetSkeleton rows={5} delay={0.06} />;
}

function EmptyState({ onCreate, label }: { onCreate: () => void; label: string }) {
  return (
    <WidgetCard delay={0.06}>
      <WidgetEmptyState
        icon={<FileText className="w-5 h-5" />}
        message={"Nenhum " + label + " cadastrado — crie o primeiro modelo"}
        cta={"Criar " + label}
        onCta={onCreate}
      />
    </WidgetCard>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <WidgetCard delay={0.06}>
      <WidgetErrorState message="Erro ao carregar documentos" onRetry={onRetry} />
    </WidgetCard>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  SHARED FORM PRIMITIVES                            */
/* ═══════════════════════════════════════════════════ */

const inputCls = "h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all";
const labelCls = "text-[11px] text-[#C7C7CC]";
const selectCls = "h-10 px-3 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all cursor-pointer appearance-none";
const textareaCls = "px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all resize-none";

/* ═══════════════════════════════════════════════════ */
/*  CONTRACT FORM MODAL                               */
/* ═══════════════════════════════════════════════════ */

function ContractFormModal({
  open,
  onClose,
  onSave,
  contract,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (c: ContractTemplate) => void;
  contract?: ContractTemplate | null;
}) {
  const isEdit = !!contract;
  const [name, setName] = useState(contract?.name ?? "");
  const [type, setType] = useState<ContractType>(contract?.type ?? "casamento");
  const [status, setStatus] = useState<ContractStatus>(contract?.status ?? "rascunho");
  const [description, setDescription] = useState(contract?.description ?? "");
  const [clausesCount, setClausesCount] = useState(contract?.clausesCount?.toString() ?? "8");
  const [hasDigitalSignature, setHasDigitalSignature] = useState(contract?.hasDigitalSignature ?? false);

  /* ── Clause editor ── */
  const defaultClauses = [
    "Objeto do contrato",
    "Escopo dos serviços",
    "Cronograma e datas",
    "Valores e forma de pagamento",
    "Cancelamento e reembolso",
    "Direitos autorais e uso de imagem",
    "Entrega do material",
    "Responsabilidades das partes",
    "Força maior",
    "Foro e jurisdição",
  ];
  const [clauses, setClauses] = useState<string[]>(
    contract
      ? defaultClauses.slice(0, contract.clausesCount)
      : defaultClauses.slice(0, 8)
  );
  const [newClause, setNewClause] = useState("");

  const addClause = () => {
    const trimmed = newClause.trim();
    if (!trimmed) return;
    setClauses((prev) => [...prev, trimmed]);
    setNewClause("");
  };

  const removeClause = (idx: number) => {
    setClauses((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Campo obrigatório", { description: "O nome do contrato é obrigatório" });
      return;
    }
    onSave({
      id: contract?.id ?? "ct-" + Date.now(),
      name: name.trim(),
      type,
      status,
      clausesCount: clauses.length,
      lastUpdated: new Date().toISOString().split("T")[0],
      description: description.trim(),
      hasDigitalSignature,
    });
    onClose();
  };

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Contrato" : "Novo Modelo de Contrato"}
      subtitle={isEdit ? "Atualize o modelo de contrato" : "Crie um novo template reutilizável"}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
            <Check className="w-3.5 h-3.5" />
            {isEdit ? "Salvar alterações" : "Criar contrato"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Nome + Tipo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className={labelCls} style={{ fontWeight: 500 }}>Nome do contrato *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Contrato de Casamento — Completo" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as ContractType)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(contractTypeConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status + Assinatura digital */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ContractStatus)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(contractStatusConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Assinatura digital</label>
            <button
              onClick={() => setHasDigitalSignature(!hasDigitalSignature)}
              className={"h-10 flex items-center gap-2 px-3.5 rounded-xl border transition-all cursor-pointer " + (
                hasDigitalSignature
                  ? "border-[#34C759] bg-[#E8F8ED]"
                  : "border-[#E5E5EA] bg-white"
              )}
            >
              <PenTool className="w-3.5 h-3.5" style={{ color: hasDigitalSignature ? "#34C759" : "#C7C7CC" }} />
              <span className="text-[13px]" style={{ fontWeight: 400, color: hasDigitalSignature ? "#34C759" : "#C7C7CC" }}>
                {hasDigitalSignature ? "Habilitada" : "Desabilitada"}
              </span>
            </button>
          </div>
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o escopo e uso deste modelo..." rows={2} className={textareaCls} style={{ fontWeight: 400 }} />
        </div>

        {/* Cláusulas */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className={labelCls} style={{ fontWeight: 500 }}>
              Cláusulas ({clauses.length})
            </label>
          </div>

          <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
            {clauses.map((clause, i) => (
              <div key={i} className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAFAFA] border border-[#F2F2F7] hover:border-[#E5E5EA] transition-colors">
                <span className="w-5 h-5 rounded-md bg-[#F2F2F7] flex items-center justify-center shrink-0">
                  <span className="text-[9px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 600 }}>{i + 1}</span>
                </span>
                <span className="text-[12px] text-[#636366] flex-1 truncate" style={{ fontWeight: 400 }}>{clause}</span>
                <button
                  onClick={() => removeClause(i)}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[#D1D1D6] hover:text-[#FF3B30] hover:bg-[#FBF5F4] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Add clause */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newClause}
              onChange={(e) => setNewClause(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addClause()}
              placeholder="Nova cláusula..."
              className={"flex-1 " + inputCls}
              style={{ fontWeight: 400 }}
            />
            <button
              onClick={addClause}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E5E5EA] bg-white text-[12px] text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer shrink-0"
              style={{ fontWeight: 500 }}
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  DOC TEMPLATE FORM MODAL                           */
/* ═══════════════════════════════════════════════════ */

function DocTemplateFormModal({
  open,
  onClose,
  onSave,
  template,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (d: DocTemplate) => void;
  template?: DocTemplate | null;
}) {
  const isEdit = !!template;
  const [name, setName] = useState(template?.name ?? "");
  const [type, setType] = useState<DocTemplateType>(template?.type ?? "orcamento");
  const [description, setDescription] = useState(template?.description ?? "");
  const [fieldsCount, setFieldsCount] = useState(template?.fieldsCount?.toString() ?? "10");

  /* ── Field editor ── */
  const defaultFields = [
    "Nome do cliente",
    "CPF / CNPJ",
    "Endereço",
    "Telefone / WhatsApp",
    "E-mail",
    "Data do evento",
    "Local do evento",
    "Pacote contratado",
    "Valor total",
    "Condições de pagamento",
  ];
  const [fields, setFields] = useState<string[]>(
    template
      ? defaultFields.slice(0, Math.min(template.fieldsCount, defaultFields.length))
      : defaultFields.slice(0, 10)
  );
  const [newField, setNewField] = useState("");

  const addField = () => {
    const trimmed = newField.trim();
    if (!trimmed) return;
    setFields((prev) => [...prev, trimmed]);
    setNewField("");
  };

  const removeField = (idx: number) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Campo obrigatório", { description: "O nome do modelo é obrigatório" });
      return;
    }
    onSave({
      id: template?.id ?? "dt-" + Date.now(),
      name: name.trim(),
      type,
      fieldsCount: fields.length,
      lastUpdated: new Date().toISOString().split("T")[0],
      description: description.trim(),
      usageCount: template?.usageCount ?? 0,
    });
    onClose();
  };

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar Modelo" : "Novo Modelo de Documento"}
      subtitle={isEdit ? "Atualize os campos e informações" : "Crie um template reutilizável para documentos"}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
            <Check className="w-3.5 h-3.5" />
            {isEdit ? "Salvar alterações" : "Criar modelo"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Nome + Tipo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className={labelCls} style={{ fontWeight: 500 }}>Nome do modelo *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Orçamento Detalhado" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as DocTemplateType)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(docTypeConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o uso deste modelo..." rows={2} className={textareaCls} style={{ fontWeight: 400 }} />
        </div>

        {/* Campos */}
        <div className="flex flex-col gap-2">
          <label className={labelCls} style={{ fontWeight: 500 }}>
            Campos do modelo ({fields.length})
          </label>

          <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
            {fields.map((field, i) => (
              <div key={i} className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAFAFA] border border-[#F2F2F7] hover:border-[#E5E5EA] transition-colors">
                <span className="w-5 h-5 rounded-md bg-[#F2F2F7] flex items-center justify-center shrink-0">
                  <span className="text-[9px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 600 }}>{i + 1}</span>
                </span>
                <span className="text-[12px] text-[#636366] flex-1 truncate" style={{ fontWeight: 400 }}>{field}</span>
                <button
                  onClick={() => removeField(i)}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[#D1D1D6] hover:text-[#FF3B30] hover:bg-[#FBF5F4] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addField()}
              placeholder="Novo campo..."
              className={"flex-1 " + inputCls}
              style={{ fontWeight: 400 }}
            />
            <button
              onClick={addField}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E5E5EA] bg-white text-[12px] text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366] transition-all cursor-pointer shrink-0"
              style={{ fontWeight: 500 }}
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PREVIEW MODAL                                     */
/* ═══════════════════════════════════════════════════ */

function PreviewModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Pré-visualização do modelo"
      size="lg"
      footer={
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>
          Fechar
        </button>
      }
    >
      {children}
    </AppleModal>
  );
}

function ContractPreview({ contract }: { contract: ContractTemplate }) {
  const typeConf = contractTypeConfig[contract.type];
  const statusConf = contractStatusConfig[contract.status];

  const defaultClauses = [
    "Objeto do contrato",
    "Escopo dos serviços",
    "Cronograma e datas",
    "Valores e forma de pagamento",
    "Cancelamento e reembolso",
    "Direitos autorais e uso de imagem",
    "Entrega do material",
    "Responsabilidades das partes",
    "Força maior",
    "Foro e jurisdição",
    "Atrasos e penalidades",
    "Adicionais e extras",
    "Confidencialidade",
    "Disposições gerais",
  ];
  const clauses = defaultClauses.slice(0, contract.clausesCount);

  return (
    <div className="flex flex-col gap-5">
      {/* Header info */}
      <div className="flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5EA]">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: typeConf.bg }}>
          <FileText className="w-5 h-5" style={{ color: typeConf.color }} />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{contract.name}</span>
          <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{contract.description}</span>
          <div className="flex items-center gap-2 mt-1">
            <TagPill variant={statusConf.variant} size="xs">{statusConf.label}</TagPill>
            <TagPill variant="neutral" size="xs">{typeConf.label}</TagPill>
            {contract.hasDigitalSignature && (
              <TagPill variant="success" size="xs">Assinatura digital</TagPill>
            )}
          </div>
        </div>
      </div>

      {/* Clauses */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] mb-1" style={{ fontWeight: 600 }}>
          Cláusulas ({clauses.length})
        </span>
        {clauses.map((clause, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border-b border-[#F5F5F7] last:border-b-0">
            <span className="w-6 h-6 rounded-md bg-[#F2F2F7] flex items-center justify-center shrink-0">
              <span className="text-[10px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 600 }}>{i + 1}</span>
            </span>
            <span className="text-[13px] text-[#636366]" style={{ fontWeight: 400 }}>{clause}</span>
          </div>
        ))}
      </div>

      {/* Footer meta */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F2F2F7]">
        <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
          Última atualização: {new Date(contract.lastUpdated).toLocaleDateString("pt-BR")}
        </span>
        <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
          ID: {contract.id}
        </span>
      </div>
    </div>
  );
}

function DocTemplatePreview({ template }: { template: DocTemplate }) {
  const typeConf = docTypeConfig[template.type];

  const defaultFields = [
    "Nome do cliente", "CPF / CNPJ", "Endereço", "Telefone / WhatsApp",
    "E-mail", "Data do evento", "Local do evento", "Pacote contratado",
    "Valor total", "Condições de pagamento", "Observações", "Prazo de entrega",
    "Desconto aplicado", "Assinatura", "Testemunha 1", "Testemunha 2",
    "Número da NF", "Data de emissão", "Método de pagamento", "Parcela atual",
    "Horário início", "Horário fim",
  ];
  const fields = defaultFields.slice(0, template.fieldsCount);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4 p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5EA]">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: typeConf.bg }}>
          <Layers className="w-5 h-5" style={{ color: typeConf.color }} />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{template.name}</span>
          <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{template.description}</span>
          <div className="flex items-center gap-2 mt-1">
            <TagPill variant="neutral" size="xs">{typeConf.label}</TagPill>
            <TagPill variant="info" size="xs">{template.usageCount}× usado</TagPill>
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] mb-1" style={{ fontWeight: 600 }}>
          Campos do formulário ({fields.length})
        </span>
        <div className="grid grid-cols-2 gap-2">
          {fields.map((field, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAFAFA] border border-[#F2F2F7]">
              <span className="w-5 h-5 rounded-md bg-[#F2F2F7] flex items-center justify-center shrink-0">
                <span className="text-[9px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 600 }}>{i + 1}</span>
              </span>
              <span className="text-[12px] text-[#636366] truncate" style={{ fontWeight: 400 }}>{field}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F2F2F7]">
        <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
          Última atualização: {new Date(template.lastUpdated).toLocaleDateString("pt-BR")}
        </span>
        <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
          ID: {template.id}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  CONTRACT ROW                                      */
/* ═══════════════════════════════════════════════════ */

function ContractRow({
  item,
  index,
  onEdit,
  onDelete,
  onPreview,
  onDuplicate,
  onArchive,
}: {
  item: ContractTemplate;
  index: number;
  onEdit: (c: ContractTemplate) => void;
  onDelete: (id: string) => void;
  onPreview: (c: ContractTemplate) => void;
  onDuplicate: (c: ContractTemplate) => void;
  onArchive: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const typeConf = contractTypeConfig[item.type];
  const statusConf = contractStatusConfig[item.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={springStagger(index)}
      className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: typeConf.bg }}>
        <FileText className="w-4 h-4" style={{ color: typeConf.color }} />
      </div>

      {/* Name + description */}
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{item.name}</span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>{item.description}</span>
      </div>

      {/* Type */}
      <TagPill variant="neutral" size="xs">{typeConf.label}</TagPill>

      {/* Status */}
      <TagPill variant={statusConf.variant} size="xs">{statusConf.label}</TagPill>

      {/* Clauses count */}
      <span className="text-[11px] text-[#8E8E93] tabular-nums w-16 text-center shrink-0" style={{ fontWeight: 500 }}>
        {item.clausesCount} cláus.
      </span>

      {/* Signature badge */}
      <span className="w-16 text-center shrink-0">
        {item.hasDigitalSignature ? (
          <PenTool className="w-3.5 h-3.5 text-[#34C759] mx-auto" />
        ) : (
          <span className="text-[11px] text-[#D1D1D6]">—</span>
        )}
      </span>

      {/* Updated */}
      <span className="text-[11px] text-[#C7C7CC] tabular-nums w-20 text-right shrink-0" style={{ fontWeight: 400 }}>
        {new Date(item.lastUpdated).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
      </span>

      {/* Actions */}
      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            {createPortal(<div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} />, document.body)}
            <div className="absolute right-0 top-8 z-[9999] w-48 bg-white rounded-xl border border-[#E5E5EA] p-1" style={{ boxShadow: "0 4px 16px #E5E5EA" }}>
              <button onClick={() => { setMenuOpen(false); onPreview(item); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left" style={{ fontWeight: 400 }}>
                <Eye className="w-3.5 h-3.5 text-[#C7C7CC]" />
                Pré-visualizar
              </button>
              <button onClick={() => { setMenuOpen(false); onEdit(item); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left" style={{ fontWeight: 400 }}>
                <Edit3 className="w-3.5 h-3.5 text-[#C7C7CC]" />
                Editar
              </button>
              <button onClick={() => { setMenuOpen(false); onDuplicate(item); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left" style={{ fontWeight: 400 }}>
                <Copy className="w-3.5 h-3.5 text-[#C7C7CC]" />
                Duplicar
              </button>
              {item.status !== "arquivado" && (
                <button onClick={() => { setMenuOpen(false); onArchive(item.id); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left" style={{ fontWeight: 400 }}>
                  <Archive className="w-3.5 h-3.5 text-[#C7C7CC]" />
                  Arquivar
                </button>
              )}
              <button onClick={() => { setMenuOpen(false); onDelete(item.id); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#FF3B30] hover:bg-[#FBF5F4] transition-colors cursor-pointer text-left" style={{ fontWeight: 400 }}>
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  DOC TEMPLATE ROW                                  */
/* ═══════════════════════════════════════════════════ */

function DocTemplateRow({
  item,
  index,
  onEdit,
  onDelete,
  onPreview,
  onDuplicate,
}: {
  item: DocTemplate;
  index: number;
  onEdit: (d: DocTemplate) => void;
  onDelete: (id: string) => void;
  onPreview: (d: DocTemplate) => void;
  onDuplicate: (d: DocTemplate) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const typeConf = docTypeConfig[item.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={springStagger(index)}
      className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: typeConf.bg }}>
        <Layers className="w-4 h-4" style={{ color: typeConf.color }} />
      </div>

      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{item.name}</span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>{item.description}</span>
      </div>

      <TagPill variant="neutral" size="xs">{typeConf.label}</TagPill>

      <span className="text-[11px] text-[#8E8E93] tabular-nums w-16 text-center shrink-0" style={{ fontWeight: 500 }}>
        {item.fieldsCount} campos
      </span>

      <span className="text-[11px] text-[#AEAEB2] tabular-nums w-16 text-center shrink-0" style={{ fontWeight: 400 }}>
        {item.usageCount}× usado
      </span>

      <span className="text-[11px] text-[#C7C7CC] tabular-nums w-20 text-right shrink-0" style={{ fontWeight: 400 }}>
        {new Date(item.lastUpdated).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
      </span>

      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            {createPortal(<div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} />, document.body)}
            <div className="absolute right-0 top-8 z-[9999] w-48 bg-white rounded-xl border border-[#E5E5EA] p-1" style={{ boxShadow: "0 4px 16px #E5E5EA" }}>
              <button onClick={() => { setMenuOpen(false); onPreview(item); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left" style={{ fontWeight: 400 }}>
                <Eye className="w-3.5 h-3.5 text-[#C7C7CC]" />
                Pré-visualizar
              </button>
              <button onClick={() => { setMenuOpen(false); onEdit(item); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left" style={{ fontWeight: 400 }}>
                <Edit3 className="w-3.5 h-3.5 text-[#C7C7CC]" />
                Editar
              </button>
              <button onClick={() => { setMenuOpen(false); onDuplicate(item); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#8E8E93] hover:bg-[#F5F5F7] transition-colors cursor-pointer text-left" style={{ fontWeight: 400 }}>
                <Copy className="w-3.5 h-3.5 text-[#C7C7CC]" />
                Duplicar
              </button>
              <button onClick={() => { setMenuOpen(false); onDelete(item.id); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#FF3B30] hover:bg-[#FBF5F4] transition-colors cursor-pointer text-left" style={{ fontWeight: 400 }}>
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN EXPORT                                       */
/* ═══════════════════════════════════════════════════ */

type ActiveTab = "contratos" | "modelos";

interface DocumentosContentProps {
  onBack: () => void;
}

export function DocumentosContent({ onBack }: DocumentosContentProps) {
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [activeTab, setActiveTab] = useState<ActiveTab>("contratos");
  const [contracts, setContracts] = useState<ContractTemplate[]>(initialContracts);
  const [docTemplates, setDocTemplates] = useState<DocTemplate[]>(initialDocTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<ContractStatus | "all">("all");

  /* ── Modal states ── */
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractTemplate | null>(null);
  const [docFormOpen, setDocFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocTemplate | null>(null);
  const [previewContract, setPreviewContract] = useState<ContractTemplate | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocTemplate | null>(null);

  /* ── Derived ── */
  const q = searchQuery.trim().toLowerCase();

  const filteredContracts = useMemo(() => {
    let list = contracts;
    if (filterStatus !== "all") {
      list = list.filter((c) => c.status === filterStatus);
    }
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          contractTypeConfig[c.type].label.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contracts, filterStatus, q]);

  const filteredDocs = useMemo(() => {
    if (!q) return docTemplates;
    return docTemplates.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        docTypeConfig[d.type].label.toLowerCase().includes(q)
    );
  }, [docTemplates, q]);

  const activeContracts = contracts.filter((c) => c.status === "ativo").length;
  const totalClauses = contracts.reduce((s, c) => s + c.clausesCount, 0);
  const totalUsage = docTemplates.reduce((s, d) => s + d.usageCount, 0);

  /* ── Contract handlers ── */
  const handleSaveContract = (c: ContractTemplate) => {
    const exists = contracts.find((x) => x.id === c.id);
    if (exists) {
      setContracts((prev) => prev.map((x) => (x.id === c.id ? c : x)));
      toast.success("Contrato atualizado", { description: c.name, duration: 3000 });
    } else {
      setContracts((prev) => [c, ...prev]);
      toast.success("Contrato criado", { description: c.name + " foi adicionado", duration: 3000 });
    }
    setEditingContract(null);
  };

  const handleDeleteContract = (id: string) => {
    const item = contracts.find((c) => c.id === id);
    setContracts((prev) => prev.filter((c) => c.id !== id));
    if (item) toast("Contrato excluído", { description: item.name, duration: 3000 });
  };

  const handleDuplicateContract = (c: ContractTemplate) => {
    const dup: ContractTemplate = {
      ...c,
      id: "ct-" + Date.now(),
      name: c.name + " (cópia)",
      status: "rascunho",
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    setContracts((prev) => [dup, ...prev]);
    toast.success("Contrato duplicado", { description: dup.name, duration: 3000 });
  };

  const handleArchiveContract = (id: string) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "arquivado" as ContractStatus, lastUpdated: new Date().toISOString().split("T")[0] } : c))
    );
    const item = contracts.find((c) => c.id === id);
    if (item) toast("Contrato arquivado", { description: item.name, duration: 3000 });
  };

  /* ── Doc template handlers ── */
  const handleSaveDoc = (d: DocTemplate) => {
    const exists = docTemplates.find((x) => x.id === d.id);
    if (exists) {
      setDocTemplates((prev) => prev.map((x) => (x.id === d.id ? d : x)));
      toast.success("Modelo atualizado", { description: d.name, duration: 3000 });
    } else {
      setDocTemplates((prev) => [d, ...prev]);
      toast.success("Modelo criado", { description: d.name + " foi adicionado", duration: 3000 });
    }
    setEditingDoc(null);
  };

  const handleDeleteDoc = (id: string) => {
    const item = docTemplates.find((d) => d.id === id);
    setDocTemplates((prev) => prev.filter((d) => d.id !== id));
    if (item) toast("Modelo excluído", { description: item.name, duration: 3000 });
  };

  const handleDuplicateDoc = (d: DocTemplate) => {
    const dup: DocTemplate = {
      ...d,
      id: "dt-" + Date.now(),
      name: d.name + " (cópia)",
      usageCount: 0,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    setDocTemplates((prev) => [dup, ...prev]);
    toast.success("Modelo duplicado", { description: dup.name, duration: 3000 });
  };

  const openNewContract = () => { setEditingContract(null); setContractFormOpen(true); };
  const openEditContract = (c: ContractTemplate) => { setEditingContract(c); setContractFormOpen(true); };
  const openNewDoc = () => { setEditingDoc(null); setDocFormOpen(true); };
  const openEditDoc = (d: DocTemplate) => { setEditingDoc(d); setDocFormOpen(true); };

  /* ── Status counts ── */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of contracts) counts[c.status] = (counts[c.status] || 0) + 1;
    return counts;
  }, [contracts]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-[28px] text-[#1D1D1F] tracking-[-0.025em]" style={{ fontWeight: 700 }}>
              Documentos
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Dev state toggles */}
            <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
              {(["ready", "loading", "empty", "error"] as ViewState[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setViewState(s)}
                  className={"px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-[0.06em] transition-all cursor-pointer " + (
                    viewState === s ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]" : "text-[#C7C7CC] hover:text-[#8E8E93]"
                  )}
                  style={{ fontWeight: 500 }}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={activeTab === "contratos" ? openNewContract : openNewDoc}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[12px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer"
              style={{ fontWeight: 500, boxShadow: "0 1px 2px #E5E5EA" }}
            >
              <Plus className="w-3.5 h-3.5" />
              {activeTab === "contratos" ? "Novo contrato" : "Novo modelo"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-11">
          <span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
            Contratos, termos e modelos de documentos
          </span>
          {viewState === "ready" && (
            <>
              <span className="w-px h-3 bg-[#E5E5EA]" />
              <span className="text-[12px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                {contracts.length} contratos · {docTemplates.length} modelos
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {viewState === "loading" ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring}>
            <LoadingState />
          </motion.div>
        ) : viewState === "empty" ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <EmptyState onCreate={activeTab === "contratos" ? openNewContract : openNewDoc} label={activeTab === "contratos" ? "contrato" : "modelo"} />
          </motion.div>
        ) : viewState === "error" ? (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <ErrorState onRetry={() => setViewState("ready")} />
          </motion.div>
        ) : (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring} className="flex flex-col gap-4">

            {/* ── KPI row ── */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Contratos", value: String(contracts.length), sub: activeContracts + " ativos" },
                { label: "Total de cláusulas", value: String(totalClauses), sub: "em todos os contratos" },
                { label: "Modelos", value: String(docTemplates.length), sub: "templates disponíveis" },
                { label: "Usos totais", value: String(totalUsage), sub: "documentos gerados" },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springStagger(i)}
                  className="flex flex-col gap-1 px-4 py-3.5 bg-white rounded-2xl border border-[#E5E5EA]"
                  style={{ boxShadow: "0 1px 3px #F2F2F7" }}
                >
                  <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>{kpi.label}</span>
                  <span className="text-[18px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 700 }}>{kpi.value}</span>
                  <span className="text-[11px] text-[#C7C7CC] tabular-nums" style={{ fontWeight: 400 }}>{kpi.sub}</span>
                </motion.div>
              ))}
            </div>

            {/* ── Tab bar ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
                {([
                  { key: "contratos" as ActiveTab, label: "Contratos", count: contracts.length },
                  { key: "modelos" as ActiveTab, label: "Modelos", count: docTemplates.length },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={"flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer " + (
                      activeTab === tab.key ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]" : "text-[#C7C7CC] hover:text-[#8E8E93]"
                    )}
                    style={{ fontWeight: 500 }}
                  >
                    {tab.label}
                    <span className="text-[10px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>{tab.count}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Status filter (contracts only) */}
                {activeTab === "contratos" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFilterStatus("all")}
                      className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (
                        filterStatus === "all" ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]"
                      )}
                      style={{ fontWeight: 500 }}
                    >
                      Todos
                    </button>
                    {Object.entries(contractStatusConfig).map(([k, v]) => (
                      statusCounts[k] ? (
                        <button
                          key={k}
                          onClick={() => setFilterStatus(k as ContractStatus)}
                          className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (
                            filterStatus === k ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]"
                          )}
                          style={{ fontWeight: 500 }}
                        >
                          {v.label} ({statusCounts[k]})
                        </button>
                      ) : null
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-3.5 h-3.5 text-[#C7C7CC] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeTab === "contratos" ? "Buscar contrato..." : "Buscar modelo..."}
                    className="w-[200px] h-[34px] pl-8 pr-3 text-[13px] text-[#636366] placeholder:text-[#C7C7CC] bg-[#F5F5F7] outline-none focus:w-[260px] focus:bg-[#EDEDF0] transition-all"
                    style={{ fontWeight: 400, borderRadius: 10 }}
                  />
                </div>
              </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden" style={{ boxShadow: "0 1px 3px #F2F2F7" }}>
              {activeTab === "contratos" ? (
                <>
                  <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
                    <span className="w-9 shrink-0" />
                    <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Contrato</span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[80px] text-center" style={{ fontWeight: 600 }}>Tipo</span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[72px] text-center" style={{ fontWeight: 600 }}>Status</span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-16 text-center" style={{ fontWeight: 600 }}>Cláus.</span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-16 text-center" style={{ fontWeight: 600 }}>Assin.</span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-20 text-right" style={{ fontWeight: 600 }}>Atualiz.</span>
                    <span className="w-7 shrink-0" />
                  </div>

                  <AnimatePresence>
                    {filteredContracts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <FileText className="w-5 h-5 text-[#D1D1D6]" />
                        <span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                          {q ? "Nenhum resultado para \"" + searchQuery + "\"" : "Nenhum contrato neste filtro"}
                        </span>
                      </div>
                    ) : (
                      filteredContracts.map((item, i) => (
                        <ContractRow
                          key={item.id}
                          item={item}
                          index={i}
                          onEdit={openEditContract}
                          onDelete={handleDeleteContract}
                          onPreview={(c) => setPreviewContract(c)}
                          onDuplicate={handleDuplicateContract}
                          onArchive={handleArchiveContract}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
                    <span className="w-9 shrink-0" />
                    <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Modelo</span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[80px] text-center" style={{ fontWeight: 600 }}>Tipo</span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-16 text-center" style={{ fontWeight: 600 }}>Campos</span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-16 text-center" style={{ fontWeight: 600 }}>Usos</span>
                    <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-20 text-right" style={{ fontWeight: 600 }}>Atualiz.</span>
                    <span className="w-7 shrink-0" />
                  </div>

                  <AnimatePresence>
                    {filteredDocs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Layers className="w-5 h-5 text-[#D1D1D6]" />
                        <span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                          {q ? "Nenhum resultado para \"" + searchQuery + "\"" : "Nenhum modelo cadastrado"}
                        </span>
                      </div>
                    ) : (
                      filteredDocs.map((item, i) => (
                        <DocTemplateRow
                          key={item.id}
                          item={item}
                          index={i}
                          onEdit={openEditDoc}
                          onDelete={handleDeleteDoc}
                          onPreview={(d) => setPreviewDoc(d)}
                          onDuplicate={handleDuplicateDoc}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-[#E5E5EA] shrink-0" style={{ boxShadow: "0 1px 3px #F2F2F7" }}>
              <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                <span className="text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>
                  {activeTab === "contratos" ? filteredContracts.length : filteredDocs.length}
                </span>{" "}
                {activeTab === "contratos" ? "contratos" : "modelos"}
                {filterStatus !== "all" && activeTab === "contratos" && (
                  <span className="text-[#C7C7CC]"> · filtro: {contractStatusConfig[filterStatus].label}</span>
                )}
              </span>
              {activeTab === "contratos" && (
                <span className="text-[11px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                  {activeContracts} ativos · {totalClauses} cláusulas total
                </span>
              )}
              {activeTab === "modelos" && (
                <span className="text-[11px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                  {totalUsage} documentos gerados no total
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <ContractFormModal
        open={contractFormOpen}
        onClose={() => { setContractFormOpen(false); setEditingContract(null); }}
        onSave={handleSaveContract}
        contract={editingContract}
      />
      <DocTemplateFormModal
        open={docFormOpen}
        onClose={() => { setDocFormOpen(false); setEditingDoc(null); }}
        onSave={handleSaveDoc}
        template={editingDoc}
      />
      <PreviewModal
        open={!!previewContract}
        onClose={() => setPreviewContract(null)}
        title={previewContract?.name ?? ""}
      >
        {previewContract && <ContractPreview contract={previewContract} />}
      </PreviewModal>
      <PreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.name ?? ""}
      >
        {previewDoc && <DocTemplatePreview template={previewDoc} />}
      </PreviewModal>
    </div>
  );
}
