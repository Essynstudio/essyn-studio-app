import { useState, useMemo, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  DollarSign,
  Edit3,
  Eye,
  FileText,
  Hash,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Play,
  Plus,
  Search,
  Smartphone,
  Trash2,
  Zap,
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
type ActiveTab = "workflows" | "cobranca" | "mensagens";
type WorkflowCategoria = "casamento" | "ensaio" | "corporativo" | "album";
type CobrancaTipo = "parcelamento" | "desconto" | "lembrete" | "recorrente";
type MensagemCanal = "whatsapp" | "email" | "sms";
type MensagemTipo = "confirmacao" | "lembrete" | "agradecimento" | "followup" | "cobranca" | "entrega" | "convite" | "orcamento";

interface WorkflowTemplate {
  id: string;
  nome: string;
  categoria: WorkflowCategoria;
  descricao: string;
  etapas: number;
  duracaoDias: number;
  usos: number;
  ativo: boolean;
  cor: string;
}

interface CobrancaTemplate {
  id: string;
  nome: string;
  tipo: CobrancaTipo;
  descricao: string;
  parcelas: number;
  desconto: number;
  usos: number;
  ativo: boolean;
  gatilhoAutomatico: boolean;
}

interface MensagemTemplate {
  id: string;
  nome: string;
  canal: MensagemCanal;
  tipo: MensagemTipo;
  descricao: string;
  conteudo: string;
  variaveis: string[];
  usos: number;
  ativo: boolean;
}

/* ═══════════════════════════════════════════════════ */
/*  CONFIG MAPS                                       */
/* ═══════════════════════════════════════════════════ */

const workflowCatConfig: Record<WorkflowCategoria, { label: string; color: string; bg: string; icon: ReactNode }> = {
  casamento: { label: "Casamento", color: "#FF2D55", bg: "#FFEBEF", icon: <Zap className="w-4 h-4" /> },
  ensaio: { label: "Ensaio", color: "#AF52DE", bg: "#F5EEFA", icon: <Zap className="w-4 h-4" /> },
  corporativo: { label: "Corporativo", color: "#007AFF", bg: "#EDF4FF", icon: <Zap className="w-4 h-4" /> },
  album: { label: "Álbum", color: "#FF9500", bg: "#FFF4E6", icon: <Zap className="w-4 h-4" /> },
};

const cobrancaTipoConfig: Record<CobrancaTipo, { label: string; color: string; bg: string; icon: ReactNode }> = {
  parcelamento: { label: "Parcelamento", color: "#007AFF", bg: "#EDF4FF", icon: <DollarSign className="w-4 h-4" /> },
  desconto: { label: "Desconto", color: "#34C759", bg: "#E8F8ED", icon: <DollarSign className="w-4 h-4" /> },
  lembrete: { label: "Lembrete", color: "#FF9500", bg: "#FFF4E6", icon: <DollarSign className="w-4 h-4" /> },
  recorrente: { label: "Recorrente", color: "#5856D6", bg: "#F0EFFC", icon: <DollarSign className="w-4 h-4" /> },
};

const canalConfig: Record<MensagemCanal, { label: string; color: string; bg: string; icon: ReactNode }> = {
  whatsapp: { label: "WhatsApp", color: "#25D366", bg: "#E6F9ED", icon: <Smartphone className="w-4 h-4" /> },
  email: { label: "E-mail", color: "#007AFF", bg: "#EDF4FF", icon: <Mail className="w-4 h-4" /> },
  sms: { label: "SMS", color: "#FF9500", bg: "#FFF4E6", icon: <Phone className="w-4 h-4" /> },
};

const msgTipoConfig: Record<MensagemTipo, { label: string; color: string }> = {
  confirmacao: { label: "Confirmação", color: "#34C759" },
  lembrete: { label: "Lembrete", color: "#FF9500" },
  agradecimento: { label: "Agradecimento", color: "#AF52DE" },
  followup: { label: "Follow-up", color: "#007AFF" },
  cobranca: { label: "Cobrança", color: "#FF3B30" },
  entrega: { label: "Entrega", color: "#5AC8FA" },
  convite: { label: "Convite", color: "#FF2D55" },
  orcamento: { label: "Orçamento", color: "#FFCC00" },
};

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                         */
/* ═══════════════════════════════════════════════════ */

const initialWorkflows: WorkflowTemplate[] = [
  { id: "wf1", nome: "Cobertura de Casamento Completa", categoria: "casamento", descricao: "Fluxo completo: reunião → ensaio → cobertura → edição → entrega → álbum", etapas: 8, duracaoDias: 45, usos: 24, ativo: true, cor: "#FF2D55" },
  { id: "wf2", nome: "Ensaio Fotográfico Padrão", categoria: "ensaio", descricao: "Agendamento → produção → ensaio → seleção → edição → entrega digital", etapas: 6, duracaoDias: 14, usos: 18, ativo: true, cor: "#AF52DE" },
  { id: "wf3", nome: "Evento Corporativo Express", categoria: "corporativo", descricao: "Briefing → cobertura → edição rápida → entrega HD em 48h", etapas: 4, duracaoDias: 5, usos: 9, ativo: true, cor: "#007AFF" },
  { id: "wf4", nome: "Produção de Álbum Fine Art", categoria: "album", descricao: "Seleção de fotos → diagramação → revisão → impressão → entrega", etapas: 5, duracaoDias: 30, usos: 12, ativo: true, cor: "#FF9500" },
];

const initialCobrancas: CobrancaTemplate[] = [
  { id: "cb1", nome: "Parcelamento Padrão 3x", tipo: "parcelamento", descricao: "Entrada 40% + 2 parcelas de 30% — sem juros", parcelas: 3, desconto: 0, usos: 32, ativo: true, gatilhoAutomatico: true },
  { id: "cb2", nome: "Desconto à Vista 10%", tipo: "desconto", descricao: "Pagamento integral via PIX com 10% de desconto", parcelas: 1, desconto: 10, usos: 15, ativo: true, gatilhoAutomatico: false },
  { id: "cb3", nome: "Lembrete de Vencimento", tipo: "lembrete", descricao: "Envia lembrete automático 3, 1 e 0 dias antes do vencimento", parcelas: 0, desconto: 0, usos: 48, ativo: true, gatilhoAutomatico: true },
];

const initialMensagens: MensagemTemplate[] = [
  { id: "msg1", nome: "Confirmação de Agendamento", canal: "whatsapp", tipo: "confirmacao", descricao: "Confirma data, horário e local do ensaio/evento", conteudo: "Olá {{nome}}! Confirmamos seu {{tipo_evento}} para o dia {{data}} às {{horario}}. Local: {{local}}. Qualquer dúvida, estamos à disposição!", variaveis: ["nome", "tipo_evento", "data", "horario", "local"], usos: 45, ativo: true },
  { id: "msg2", nome: "Lembrete 48h Antes", canal: "whatsapp", tipo: "lembrete", descricao: "Lembrete automático 2 dias antes do evento", conteudo: "Oi {{nome}}! Lembrando que seu {{tipo_evento}} é daqui a 2 dias ({{data}}). Preparamos tudo com carinho para você!", variaveis: ["nome", "tipo_evento", "data"], usos: 38, ativo: true },
  { id: "msg3", nome: "Agradecimento Pós-Evento", canal: "email", tipo: "agradecimento", descricao: "E-mail de agradecimento enviado após o evento", conteudo: "Prezado(a) {{nome}},\n\nFoi uma alegria imenensa participar do seu {{tipo_evento}}. As fotos estão sendo editadas com muito carinho e serão entregues até {{data_entrega}}.\n\nAbraços,\n{{fotografo}}", variaveis: ["nome", "tipo_evento", "data_entrega", "fotografo"], usos: 22, ativo: true },
  { id: "msg4", nome: "Follow-up de Orçamento", canal: "whatsapp", tipo: "followup", descricao: "Segue-up para orçamentos enviados sem resposta", conteudo: "Olá {{nome}}! Tudo bem? Enviei o orçamento para {{tipo_evento}} há alguns dias. Gostaria de saber se ficou alguma dúvida. Posso ajudar?", variaveis: ["nome", "tipo_evento"], usos: 28, ativo: true },
  { id: "msg5", nome: "Lembrete de Pagamento", canal: "sms", tipo: "cobranca", descricao: "SMS lembrando parcela próxima ao vencimento", conteudo: "ESSYN Studio: Olá {{nome}}, sua parcela de R${{valor}} vence em {{data_vencimento}}. PIX: {{chave_pix}}", variaveis: ["nome", "valor", "data_vencimento", "chave_pix"], usos: 19, ativo: true },
  { id: "msg6", nome: "Galeria Pronta", canal: "email", tipo: "entrega", descricao: "Notifica que a galeria de provas está disponível", conteudo: "Prezado(a) {{nome}},\n\nSua galeria de {{tipo_evento}} está pronta! Acesse pelo link:\n{{link_galeria}}\n\nSenha: {{senha}}\nPrazo para seleção: {{prazo}} dias.", variaveis: ["nome", "tipo_evento", "link_galeria", "senha", "prazo"], usos: 35, ativo: true },
  { id: "msg7", nome: "Convite para Indicação", canal: "whatsapp", tipo: "convite", descricao: "Programa de indicação para clientes satisfeitos", conteudo: "Oi {{nome}}! Que bom que adorou as fotos! Sabia que indicando um amigo você ganha {{desconto}}% no próximo ensaio? Basta compartilhar este link: {{link_indicacao}}", variaveis: ["nome", "desconto", "link_indicacao"], usos: 8, ativo: true },
  { id: "msg8", nome: "Proposta de Orçamento", canal: "email", tipo: "orcamento", descricao: "E-mail formal com proposta de orçamento detalhada", conteudo: "Prezado(a) {{nome}},\n\nSegue a proposta para {{tipo_evento}} em {{data}}.\n\nPacote: {{pacote}}\nInvestimento: R$ {{valor}}\nCondições: {{condicoes}}\n\nVálido até {{validade}}.", variaveis: ["nome", "tipo_evento", "data", "pacote", "valor", "condicoes", "validade"], usos: 14, ativo: false },
];

/* ═══════════════════════════════════════════════════ */
/*  SHARED FORM PRIMITIVES                            */
/* ═══════════════════════════════════════════════════ */

const inputCls = "h-10 px-3.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all";
const labelCls = "text-[11px] text-[#C7C7CC]";
const selectCls = "h-10 px-3 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all cursor-pointer appearance-none";
const textareaCls = "px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] bg-white text-[13px] text-[#636366] placeholder:text-[#C7C7CC] outline-none focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#E5E5EA] transition-all resize-none";

/* ── Toggle Row ── */
function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F5F5F7] last:border-b-0">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
        <span className="text-[13px] text-[#636366]" style={{ fontWeight: 500 }}>{label}</span>
        {description && <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>{description}</span>}
      </div>
      <button onClick={() => onChange(!checked)} className={"relative w-[44px] h-[26px] rounded-full transition-all cursor-pointer shrink-0 " + (checked ? "bg-[#34C759]" : "bg-[#E5E5EA]")}>
        <span className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all" style={{ left: checked ? 21 : 3, boxShadow: "0 1px 3px #C7C7CC" }} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  DROPDOWN MENU                                     */
/* ═══════════════════════════════════════════════════ */

function ActionMenu({ open, onClose, actions }: { open: boolean; onClose: () => void; actions: { label: string; icon: ReactNode; danger?: boolean; onClick: () => void }[] }) {
  if (!open) return null;
  return (
    <>
      {createPortal(<div className="fixed inset-0 z-[9998]" onClick={onClose} />, document.body)}
      <div className="absolute right-0 top-8 z-[9999] w-48 bg-white rounded-xl border border-[#E5E5EA] p-1" style={{ boxShadow: "0 4px 16px #E5E5EA" }}>
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => { onClose(); a.onClick(); }}
            className={"w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors cursor-pointer text-left " + (
              a.danger ? "text-[#FF3B30] hover:bg-[#FBF5F4]" : "text-[#8E8E93] hover:bg-[#F5F5F7]"
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
/*  WORKFLOW FORM MODAL                               */
/* ═══════════════════════════════════════════════════ */

function WorkflowFormModal({ open, onClose, onSave, item }: { open: boolean; onClose: () => void; onSave: (w: WorkflowTemplate) => void; item?: WorkflowTemplate | null }) {
  const isEdit = !!item;
  const [nome, setNome] = useState(item?.nome ?? "");
  const [categoria, setCategoria] = useState<WorkflowCategoria>(item?.categoria ?? "casamento");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [etapas, setEtapas] = useState(item?.etapas?.toString() ?? "4");
  const [duracaoDias, setDuracaoDias] = useState(item?.duracaoDias?.toString() ?? "14");
  const [cor, setCor] = useState(item?.cor ?? "#007AFF");
  const [ativo, setAtivo] = useState(item?.ativo ?? true);

  const handleSubmit = () => {
    if (!nome.trim()) { toast.error("Campo obrigatório", { description: "O nome do workflow é obrigatório" }); return; }
    onSave({
      id: item?.id ?? "wf-" + Date.now(),
      nome: nome.trim(),
      categoria,
      descricao: descricao.trim(),
      etapas: parseInt(etapas) || 4,
      duracaoDias: parseInt(duracaoDias) || 14,
      usos: item?.usos ?? 0,
      ativo,
      cor,
    });
    onClose();
  };

  return (
    <AppleModal open={open} onClose={onClose} title={isEdit ? "Editar Workflow" : "Novo Workflow"} subtitle={isEdit ? "Atualize etapas e duração" : "Crie um fluxo de produção reutilizável"} size="md" footer={
      <>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
        <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}><Check className="w-3.5 h-3.5" />{isEdit ? "Salvar" : "Criar workflow"}</button>
      </>
    }>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Nome *</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Cobertura de Casamento Completa" className={inputCls} style={{ fontWeight: 400 }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as WorkflowCategoria)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(workflowCatConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Cor</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-[#E5E5EA] shrink-0 cursor-pointer relative overflow-hidden" style={{ backgroundColor: cor }}>
                <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="absolute inset-0 w-full h-full cursor-pointer" style={{ opacity: 0 }} />
              </div>
              <input type="text" value={cor} onChange={(e) => setCor(e.target.value)} className={"flex-1 " + inputCls} style={{ fontWeight: 400, fontFamily: "monospace" }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Etapas</label>
            <input type="number" value={etapas} onChange={(e) => setEtapas(e.target.value)} min={1} className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Duração (dias)</label>
            <input type="number" value={duracaoDias} onChange={(e) => setDuracaoDias(e.target.value)} min={1} className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Status</label>
            <button onClick={() => setAtivo(!ativo)} className={"h-10 flex items-center gap-2 px-3.5 rounded-xl border transition-all cursor-pointer " + (ativo ? "border-[#34C759] bg-[#E8F8ED]" : "border-[#E5E5EA] bg-white")}>
              <span className={"w-2 h-2 rounded-full shrink-0 " + (ativo ? "bg-[#34C759]" : "bg-[#D1D1D6]")} />
              <span className="text-[13px]" style={{ fontWeight: 400, color: ativo ? "#34C759" : "#C7C7CC" }}>{ativo ? "Ativo" : "Inativo"}</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Descrição</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva as etapas deste workflow..." rows={2} className={textareaCls} style={{ fontWeight: 400 }} />
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  COBRANÇA FORM MODAL                               */
/* ═══════════════════════════════════════════════════ */

function CobrancaFormModal({ open, onClose, onSave, item }: { open: boolean; onClose: () => void; onSave: (c: CobrancaTemplate) => void; item?: CobrancaTemplate | null }) {
  const isEdit = !!item;
  const [nome, setNome] = useState(item?.nome ?? "");
  const [tipo, setTipo] = useState<CobrancaTipo>(item?.tipo ?? "parcelamento");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [parcelas, setParcelas] = useState(item?.parcelas?.toString() ?? "3");
  const [desconto, setDesconto] = useState(item?.desconto?.toString() ?? "0");
  const [ativo, setAtivo] = useState(item?.ativo ?? true);
  const [gatilho, setGatilho] = useState(item?.gatilhoAutomatico ?? false);

  const handleSubmit = () => {
    if (!nome.trim()) { toast.error("Campo obrigatório", { description: "O nome do template é obrigatório" }); return; }
    onSave({
      id: item?.id ?? "cb-" + Date.now(),
      nome: nome.trim(),
      tipo,
      descricao: descricao.trim(),
      parcelas: parseInt(parcelas) || 0,
      desconto: parseFloat(desconto) || 0,
      usos: item?.usos ?? 0,
      ativo,
      gatilhoAutomatico: gatilho,
    });
    onClose();
  };

  return (
    <AppleModal open={open} onClose={onClose} title={isEdit ? "Editar Template" : "Novo Template de Cobrança"} subtitle={isEdit ? "Atualize condições e gatilhos" : "Crie um modelo de cobrança reutilizável"} size="md" footer={
      <>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
        <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}><Check className="w-3.5 h-3.5" />{isEdit ? "Salvar" : "Criar template"}</button>
      </>
    }>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Nome *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Parcelamento 3x" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as CobrancaTipo)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(cobrancaTipoConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Parcelas</label>
            <input type="number" value={parcelas} onChange={(e) => setParcelas(e.target.value)} min={0} className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Desconto (%)</label>
            <input type="number" value={desconto} onChange={(e) => setDesconto(e.target.value)} step="0.5" min={0} max={100} className={inputCls} style={{ fontWeight: 400 }} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Descrição</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva as condições deste template..." rows={2} className={textareaCls} style={{ fontWeight: 400 }} />
        </div>
        <div className="px-1">
          <ToggleRow label="Gatilho automático" description="Quando ativo, o template é aplicado automaticamente" checked={gatilho} onChange={setGatilho} />
          <ToggleRow label="Template ativo" description="Templates inativos não aparecem para seleção" checked={ativo} onChange={setAtivo} />
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MENSAGEM FORM MODAL                               */
/* ═══════════════════════════════════════════════════ */

function MensagemFormModal({ open, onClose, onSave, item }: { open: boolean; onClose: () => void; onSave: (m: MensagemTemplate) => void; item?: MensagemTemplate | null }) {
  const isEdit = !!item;
  const [nome, setNome] = useState(item?.nome ?? "");
  const [canal, setCanal] = useState<MensagemCanal>(item?.canal ?? "whatsapp");
  const [tipo, setTipo] = useState<MensagemTipo>(item?.tipo ?? "confirmacao");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [conteudo, setConteudo] = useState(item?.conteudo ?? "");
  const [ativo, setAtivo] = useState(item?.ativo ?? true);

  const extractVars = (text: string) => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
  };

  const handleSubmit = () => {
    if (!nome.trim()) { toast.error("Campo obrigatório", { description: "O nome do template é obrigatório" }); return; }
    if (!conteudo.trim()) { toast.error("Campo obrigatório", { description: "O conteúdo da mensagem é obrigatório" }); return; }
    onSave({
      id: item?.id ?? "msg-" + Date.now(),
      nome: nome.trim(),
      canal,
      tipo,
      descricao: descricao.trim(),
      conteudo: conteudo.trim(),
      variaveis: extractVars(conteudo),
      usos: item?.usos ?? 0,
      ativo,
    });
    onClose();
  };

  return (
    <AppleModal open={open} onClose={onClose} title={isEdit ? "Editar Mensagem" : "Nova Mensagem"} subtitle={isEdit ? "Atualize conteúdo e canal" : "Crie um template de mensagem reutilizável"} size="lg" footer={
      <>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
        <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}><Check className="w-3.5 h-3.5" />{isEdit ? "Salvar" : "Criar mensagem"}</button>
      </>
    }>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Nome *</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Confirmação de Agendamento" className={inputCls} style={{ fontWeight: 400 }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Canal</label>
            <select value={canal} onChange={(e) => setCanal(e.target.value as MensagemCanal)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(canalConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as MensagemTipo)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(msgTipoConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Descrição</label>
          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Breve descrição do uso deste template" className={inputCls} style={{ fontWeight: 400 }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className={labelCls} style={{ fontWeight: 500 }}>Conteúdo *</label>
            <span className="text-[10px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>Use {"{{variavel}}"} para campos dinâmicos</span>
          </div>
          <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder={"Olá {{nome}}, confirmamos seu {{tipo_evento}}..."} rows={5} className={textareaCls} style={{ fontWeight: 400 }} />
          {conteudo && extractVars(conteudo).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Variáveis:</span>
              {extractVars(conteudo).map((v) => (
                <span key={v} className="px-1.5 py-0.5 rounded bg-[#F2F2F7] text-[10px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{`{{${v}}}`}</span>
              ))}
            </div>
          )}
        </div>
        <div className="px-1">
          <ToggleRow label="Template ativo" description="Templates inativos não são sugeridos automaticamente" checked={ativo} onChange={setAtivo} />
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PREVIEW MODAL                                     */
/* ═══════════════════════════════════════════════════ */

function MensagemPreviewModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: MensagemTemplate | null }) {
  if (!item) return null;
  const ch = canalConfig[item.canal];
  return (
    <AppleModal open={open} onClose={onClose} title="Pré-visualização" subtitle={item.nome} size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: ch.bg, color: ch.color }}>{ch.icon}</div>
          <div className="flex flex-col gap-0">
            <span className="text-[13px] text-[#636366]" style={{ fontWeight: 500 }}>{ch.label}</span>
            <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>{msgTipoConfig[item.tipo].label}</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
          <pre className="text-[13px] text-[#636366] whitespace-pre-wrap break-words" style={{ fontWeight: 400, fontFamily: "Inter, sans-serif" }}>{item.conteudo}</pre>
        </div>
        {item.variaveis.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Variáveis dinâmicas ({item.variaveis.length})</span>
            <div className="flex flex-wrap gap-1.5">
              {item.variaveis.map((v) => (
                <span key={v} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F2F2F7] border border-[#E5E5EA] text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
                  <Hash className="w-3 h-3 text-[#C7C7CC]" />{v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  TABLE ROWS                                        */
/* ═══════════════════════════════════════════════════ */

function WorkflowRow({ item, index, onEdit, onDelete, onDuplicate }: { item: WorkflowTemplate; index: number; onEdit: (w: WorkflowTemplate) => void; onDelete: (id: string) => void; onDuplicate: (w: WorkflowTemplate) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cat = workflowCatConfig[item.categoria];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springStagger(index)} className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{item.nome}</span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>{item.descricao}</span>
      </div>
      <TagPill variant={item.categoria === "casamento" ? "danger" : item.categoria === "ensaio" ? "purple" : item.categoria === "corporativo" ? "info" : item.categoria === "album" ? "warning" : "success"} size="xs">{cat.label}</TagPill>
      <span className="text-[11px] text-[#8E8E93] tabular-nums w-16 text-center shrink-0" style={{ fontWeight: 500 }}>{item.etapas} etapas</span>
      <span className="text-[11px] text-[#AEAEB2] tabular-nums w-14 text-center shrink-0" style={{ fontWeight: 400 }}>{item.duracaoDias}d</span>
      <span className="text-[11px] text-[#C7C7CC] tabular-nums w-14 text-center shrink-0" style={{ fontWeight: 400 }}>{item.usos} usos</span>
      <span className="w-10 text-center shrink-0">
        <span className={"w-2 h-2 rounded-full inline-block " + (item.ativo ? "bg-[#34C759]" : "bg-[#D1D1D6]")} />
      </span>
      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <ActionMenu open={menuOpen} onClose={() => setMenuOpen(false)} actions={[
          { label: "Editar", icon: <Edit3 className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onEdit(item) },
          { label: "Duplicar", icon: <Copy className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onDuplicate(item) },
          { label: "Excluir", icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => onDelete(item.id) },
        ]} />
      </div>
    </motion.div>
  );
}

function CobrancaRow({ item, index, onEdit, onDelete, onDuplicate, onToggle }: { item: CobrancaTemplate; index: number; onEdit: (c: CobrancaTemplate) => void; onDelete: (id: string) => void; onDuplicate: (c: CobrancaTemplate) => void; onToggle: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tc = cobrancaTipoConfig[item.tipo];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springStagger(index)} className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: tc.bg, color: tc.color }}>
        {tc.icon}
      </div>
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{item.nome}</span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>{item.descricao}</span>
      </div>
      <TagPill variant={item.tipo === "parcelamento" ? "info" : item.tipo === "desconto" ? "success" : item.tipo === "lembrete" ? "warning" : "purple"} size="xs">{tc.label}</TagPill>
      <span className="text-[11px] text-[#8E8E93] tabular-nums w-14 text-center shrink-0" style={{ fontWeight: 500 }}>{item.parcelas > 0 ? item.parcelas + "x" : "—"}</span>
      <span className="text-[11px] text-[#AEAEB2] tabular-nums w-14 text-center shrink-0" style={{ fontWeight: 400 }}>{item.desconto > 0 ? item.desconto + "%" : "—"}</span>
      <span className="text-[11px] text-[#C7C7CC] tabular-nums w-14 text-center shrink-0" style={{ fontWeight: 400 }}>{item.usos} usos</span>
      {item.gatilhoAutomatico && (
        <TagPill variant="gold" size="xs">Auto</TagPill>
      )}
      <button onClick={() => onToggle(item.id)} className={"relative w-[38px] h-[22px] rounded-full transition-all cursor-pointer shrink-0 " + (item.ativo ? "bg-[#34C759]" : "bg-[#E5E5EA]")}>
        <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ left: item.ativo ? 18 : 2, boxShadow: "0 1px 3px #C7C7CC" }} />
      </button>
      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <ActionMenu open={menuOpen} onClose={() => setMenuOpen(false)} actions={[
          { label: "Editar", icon: <Edit3 className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onEdit(item) },
          { label: "Duplicar", icon: <Copy className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onDuplicate(item) },
          { label: "Excluir", icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => onDelete(item.id) },
        ]} />
      </div>
    </motion.div>
  );
}

function MensagemRow({ item, index, onEdit, onDelete, onDuplicate, onToggle, onPreview }: { item: MensagemTemplate; index: number; onEdit: (m: MensagemTemplate) => void; onDelete: (id: string) => void; onDuplicate: (m: MensagemTemplate) => void; onToggle: (id: string) => void; onPreview: (m: MensagemTemplate) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ch = canalConfig[item.canal];
  const mt = msgTipoConfig[item.tipo];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springStagger(index)} className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ch.bg, color: ch.color }}>
        {ch.icon}
      </div>
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{item.nome}</span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>{item.descricao}</span>
      </div>
      <TagPill variant={item.canal === "whatsapp" ? "success" : item.canal === "email" ? "info" : "warning"} size="xs">{ch.label}</TagPill>
      <span className="text-[11px] tabular-nums w-20 text-center shrink-0" style={{ fontWeight: 500, color: mt.color }}>{mt.label}</span>
      <span className="text-[11px] text-[#AEAEB2] tabular-nums w-10 text-center shrink-0" style={{ fontWeight: 400 }}>{item.variaveis.length} var</span>
      <span className="text-[11px] text-[#C7C7CC] tabular-nums w-14 text-center shrink-0" style={{ fontWeight: 400 }}>{item.usos} usos</span>
      <button onClick={() => onPreview(item)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer opacity-0 group-hover:opacity-100 shrink-0" title="Pré-visualizar">
        <Eye className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onToggle(item.id)} className={"relative w-[38px] h-[22px] rounded-full transition-all cursor-pointer shrink-0 " + (item.ativo ? "bg-[#34C759]" : "bg-[#E5E5EA]")}>
        <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ left: item.ativo ? 18 : 2, boxShadow: "0 1px 3px #C7C7CC" }} />
      </button>
      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <ActionMenu open={menuOpen} onClose={() => setMenuOpen(false)} actions={[
          { label: "Editar", icon: <Edit3 className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onEdit(item) },
          { label: "Duplicar", icon: <Copy className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onDuplicate(item) },
          { label: "Excluir", icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => onDelete(item.id) },
        ]} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN EXPORT                                       */
/* ═══════════════════════════════════════════════════ */

interface TemplatesConfigContentProps {
  onBack: () => void;
}

export function TemplatesConfigContent({ onBack }: TemplatesConfigContentProps) {
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [activeTab, setActiveTab] = useState<ActiveTab>("workflows");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCat, setFilterCat] = useState<WorkflowCategoria | "all">("all");
  const [filterCanal, setFilterCanal] = useState<MensagemCanal | "all">("all");

  /* ── Data ── */
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>(initialWorkflows);
  const [cobrancas, setCobrancas] = useState<CobrancaTemplate[]>(initialCobrancas);
  const [mensagens, setMensagens] = useState<MensagemTemplate[]>(initialMensagens);

  /* ── Modals ── */
  const [wfFormOpen, setWfFormOpen] = useState(false);
  const [editingWf, setEditingWf] = useState<WorkflowTemplate | null>(null);
  const [cbFormOpen, setCbFormOpen] = useState(false);
  const [editingCb, setEditingCb] = useState<CobrancaTemplate | null>(null);
  const [msgFormOpen, setMsgFormOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<MensagemTemplate | null>(null);
  const [previewMsg, setPreviewMsg] = useState<MensagemTemplate | null>(null);

  /* ── Search ── */
  const q = searchQuery.trim().toLowerCase();

  const filteredWorkflows = useMemo(() => {
    let list = workflows;
    if (filterCat !== "all") list = list.filter((w) => w.categoria === filterCat);
    if (q) list = list.filter((w) => w.nome.toLowerCase().includes(q) || w.descricao.toLowerCase().includes(q));
    return list;
  }, [workflows, filterCat, q]);

  const filteredCobrancas = useMemo(() => {
    if (!q) return cobrancas;
    return cobrancas.filter((c) => c.nome.toLowerCase().includes(q) || c.descricao.toLowerCase().includes(q));
  }, [cobrancas, q]);

  const filteredMensagens = useMemo(() => {
    let list = mensagens;
    if (filterCanal !== "all") list = list.filter((m) => m.canal === filterCanal);
    if (q) list = list.filter((m) => m.nome.toLowerCase().includes(q) || m.descricao.toLowerCase().includes(q) || canalConfig[m.canal].label.toLowerCase().includes(q));
    return list;
  }, [mensagens, filterCanal, q]);

  /* ── KPI derived ── */
  const totalEtapas = workflows.reduce((s, w) => s + w.etapas, 0);
  const wfAtivos = workflows.filter((w) => w.ativo).length;
  const totalUsosWf = workflows.reduce((s, w) => s + w.usos, 0);
  const cbAtivos = cobrancas.filter((c) => c.ativo).length;
  const cbAutomatic = cobrancas.filter((c) => c.gatilhoAutomatico).length;
  const totalUsosCb = cobrancas.reduce((s, c) => s + c.usos, 0);
  const msgAtivos = mensagens.filter((m) => m.ativo).length;
  const totalUsosMsg = mensagens.reduce((s, m) => s + m.usos, 0);
  const totalVars = [...new Set(mensagens.flatMap((m) => m.variaveis))].length;

  /* ── CRUD Workflows ── */
  const handleSaveWf = (w: WorkflowTemplate) => {
    const exists = workflows.find((x) => x.id === w.id);
    if (exists) { setWorkflows((prev) => prev.map((x) => x.id === w.id ? w : x)); toast.success("Workflow atualizado", { description: w.nome, duration: 3000 }); }
    else { setWorkflows((prev) => [w, ...prev]); toast.success("Workflow criado", { description: w.nome, duration: 3000 }); }
    setEditingWf(null);
  };
  const handleDeleteWf = (id: string) => { const item = workflows.find((w) => w.id === id); setWorkflows((prev) => prev.filter((w) => w.id !== id)); if (item) toast("Workflow excluído", { description: item.nome, duration: 3000 }); };
  const handleDuplicateWf = (w: WorkflowTemplate) => { const dup = { ...w, id: "wf-" + Date.now(), nome: w.nome + " (cópia)", usos: 0 }; setWorkflows((prev) => [dup, ...prev]); toast.success("Workflow duplicado", { description: dup.nome, duration: 3000 }); };

  /* ── CRUD Cobrancas ── */
  const handleSaveCb = (c: CobrancaTemplate) => {
    const exists = cobrancas.find((x) => x.id === c.id);
    if (exists) { setCobrancas((prev) => prev.map((x) => x.id === c.id ? c : x)); toast.success("Template atualizado", { description: c.nome, duration: 3000 }); }
    else { setCobrancas((prev) => [c, ...prev]); toast.success("Template criado", { description: c.nome, duration: 3000 }); }
    setEditingCb(null);
  };
  const handleDeleteCb = (id: string) => { const item = cobrancas.find((c) => c.id === id); setCobrancas((prev) => prev.filter((c) => c.id !== id)); if (item) toast("Template excluído", { description: item.nome, duration: 3000 }); };
  const handleDuplicateCb = (c: CobrancaTemplate) => { const dup = { ...c, id: "cb-" + Date.now(), nome: c.nome + " (cópia)", usos: 0 }; setCobrancas((prev) => [dup, ...prev]); toast.success("Template duplicado", { description: dup.nome, duration: 3000 }); };
  const handleToggleCb = (id: string) => { setCobrancas((prev) => prev.map((c) => c.id === id ? { ...c, ativo: !c.ativo } : c)); };

  /* ── CRUD Mensagens ── */
  const handleSaveMsg = (m: MensagemTemplate) => {
    const exists = mensagens.find((x) => x.id === m.id);
    if (exists) { setMensagens((prev) => prev.map((x) => x.id === m.id ? m : x)); toast.success("Mensagem atualizada", { description: m.nome, duration: 3000 }); }
    else { setMensagens((prev) => [m, ...prev]); toast.success("Mensagem criada", { description: m.nome, duration: 3000 }); }
    setEditingMsg(null);
  };
  const handleDeleteMsg = (id: string) => { const item = mensagens.find((m) => m.id === id); setMensagens((prev) => prev.filter((m) => m.id !== id)); if (item) toast("Mensagem excluída", { description: item.nome, duration: 3000 }); };
  const handleDuplicateMsg = (m: MensagemTemplate) => { const dup = { ...m, id: "msg-" + Date.now(), nome: m.nome + " (cópia)", usos: 0 }; setMensagens((prev) => [dup, ...prev]); toast.success("Mensagem duplicada", { description: dup.nome, duration: 3000 }); };
  const handleToggleMsg = (id: string) => { setMensagens((prev) => prev.map((m) => m.id === id ? { ...m, ativo: !m.ativo } : m)); };

  /* ── Open modal helpers ── */
  const openNew = () => {
    if (activeTab === "workflows") { setEditingWf(null); setWfFormOpen(true); }
    else if (activeTab === "cobranca") { setEditingCb(null); setCbFormOpen(true); }
    else { setEditingMsg(null); setMsgFormOpen(true); }
  };

  const newLabel = activeTab === "workflows" ? "Novo workflow" : activeTab === "cobranca" ? "Novo template" : "Nova mensagem";

  /* ── Tab config ── */
  const tabs: { key: ActiveTab; label: string; count: number }[] = [
    { key: "workflows", label: "Workflows", count: workflows.length },
    { key: "cobranca", label: "Cobrança", count: cobrancas.length },
    { key: "mensagens", label: "Mensagens", count: mensagens.length },
  ];

  /* ── KPI for active tab ── */
  const kpis = activeTab === "workflows" ? [
    { label: "Workflows", value: String(workflows.length), sub: wfAtivos + " ativos" },
    { label: "Total etapas", value: String(totalEtapas), sub: "em todos os templates" },
    { label: "Usos", value: String(totalUsosWf), sub: "projetos usando templates" },
    { label: "Duração média", value: Math.round(workflows.reduce((s, w) => s + w.duracaoDias, 0) / Math.max(workflows.length, 1)) + "d", sub: "por workflow" },
  ] : activeTab === "cobranca" ? [
    { label: "Templates", value: String(cobrancas.length), sub: cbAtivos + " ativos" },
    { label: "Automáticos", value: String(cbAutomatic), sub: "com gatilho auto" },
    { label: "Usos", value: String(totalUsosCb), sub: "cobranças usando templates" },
    { label: "Desc. médio", value: (cobrancas.filter((c) => c.desconto > 0).reduce((s, c) => s + c.desconto, 0) / Math.max(cobrancas.filter((c) => c.desconto > 0).length, 1)).toFixed(0) + "%", sub: "nos templates com desconto" },
  ] : [
    { label: "Mensagens", value: String(mensagens.length), sub: msgAtivos + " ativas" },
    { label: "Envios", value: String(totalUsosMsg), sub: "mensagens enviadas" },
    { label: "Canais", value: String([...new Set(mensagens.map((m) => m.canal))].length), sub: "WhatsApp, Email, SMS" },
    { label: "Variáveis", value: String(totalVars), sub: "campos dinâmicos únicos" },
  ];

  /* ── Category filter counts ── */
  const catCounts = useMemo(() => {
    const m: Partial<Record<WorkflowCategoria, number>> = {};
    for (const w of workflows) m[w.categoria] = (m[w.categoria] ?? 0) + 1;
    return m;
  }, [workflows]);

  const canalCounts = useMemo(() => {
    const m: Partial<Record<MensagemCanal, number>> = {};
    for (const msg of mensagens) m[msg.canal] = (m[msg.canal] ?? 0) + 1;
    return m;
  }, [mensagens]);

  /* ── Table headers per tab ── */
  const renderTableHeader = () => {
    if (activeTab === "workflows") {
      return (
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
          <span className="w-3 shrink-0" />
          <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Workflow</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[80px] text-center" style={{ fontWeight: 600 }}>Categoria</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-16 text-center" style={{ fontWeight: 600 }}>Etapas</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-14 text-center" style={{ fontWeight: 600 }}>Duração</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-14 text-center" style={{ fontWeight: 600 }}>Usos</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-10 text-center" style={{ fontWeight: 600 }}>Status</span>
          <span className="w-7 shrink-0" />
        </div>
      );
    }
    if (activeTab === "cobranca") {
      return (
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
          <span className="w-9 shrink-0" />
          <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Template</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[80px] text-center" style={{ fontWeight: 600 }}>Tipo</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-14 text-center" style={{ fontWeight: 600 }}>Parcelas</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-14 text-center" style={{ fontWeight: 600 }}>Desc.</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-14 text-center" style={{ fontWeight: 600 }}>Usos</span>
          <span className="w-[52px] shrink-0" />
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[38px] text-center" style={{ fontWeight: 600 }}>Ativo</span>
          <span className="w-7 shrink-0" />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
        <span className="w-9 shrink-0" />
        <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Mensagem</span>
        <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[80px] text-center" style={{ fontWeight: 600 }}>Canal</span>
        <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-20 text-center" style={{ fontWeight: 600 }}>Tipo</span>
        <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-10 text-center" style={{ fontWeight: 600 }}>Vars</span>
        <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-14 text-center" style={{ fontWeight: 600 }}>Usos</span>
        <span className="w-7 shrink-0" />
        <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[38px] text-center" style={{ fontWeight: 600 }}>Ativo</span>
        <span className="w-7 shrink-0" />
      </div>
    );
  };

  const renderEmptyTable = () => {
    const icon = activeTab === "workflows" ? <Zap className="w-5 h-5 text-[#D1D1D6]" /> : activeTab === "cobranca" ? <DollarSign className="w-5 h-5 text-[#D1D1D6]" /> : <MessageSquare className="w-5 h-5 text-[#D1D1D6]" />;
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        {icon}
        <span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{q ? "Nenhum resultado para \"" + searchQuery + "\"" : "Nenhum item cadastrado"}</span>
      </div>
    );
  };

  const renderRows = () => {
    if (activeTab === "workflows") {
      if (filteredWorkflows.length === 0) return renderEmptyTable();
      return filteredWorkflows.map((item, i) => (
        <WorkflowRow key={item.id} item={item} index={i} onEdit={(w) => { setEditingWf(w); setWfFormOpen(true); }} onDelete={handleDeleteWf} onDuplicate={handleDuplicateWf} />
      ));
    }
    if (activeTab === "cobranca") {
      if (filteredCobrancas.length === 0) return renderEmptyTable();
      return filteredCobrancas.map((item, i) => (
        <CobrancaRow key={item.id} item={item} index={i} onEdit={(c) => { setEditingCb(c); setCbFormOpen(true); }} onDelete={handleDeleteCb} onDuplicate={handleDuplicateCb} onToggle={handleToggleCb} />
      ));
    }
    if (filteredMensagens.length === 0) return renderEmptyTable();
    return filteredMensagens.map((item, i) => (
      <MensagemRow key={item.id} item={item} index={i} onEdit={(m) => { setEditingMsg(m); setMsgFormOpen(true); }} onDelete={handleDeleteMsg} onDuplicate={handleDuplicateMsg} onToggle={handleToggleMsg} onPreview={setPreviewMsg} />
    ));
  };

  const filteredCount = activeTab === "workflows" ? filteredWorkflows.length : activeTab === "cobranca" ? filteredCobrancas.length : filteredMensagens.length;

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-[28px] text-[#1D1D1F] tracking-[-0.025em]" style={{ fontWeight: 700 }}>Templates</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
              {(["ready", "loading", "empty", "error"] as ViewState[]).map((s) => (
                <button key={s} onClick={() => setViewState(s)} className={"px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-[0.06em] transition-all cursor-pointer " + (viewState === s ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>{s}</button>
              ))}
            </div>
            <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[12px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500, boxShadow: "0 1px 2px #E5E5EA" }}>
              <Plus className="w-3.5 h-3.5" />{newLabel}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-11">
          <span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Workflows, modelos de cobrança e mensagens reutilizáveis</span>
          {viewState === "ready" && (
            <>
              <span className="w-px h-3 bg-[#E5E5EA]" />
              <span className="text-[12px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>{workflows.length} workflows · {cobrancas.length} templates · {mensagens.length} mensagens</span>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {viewState === "loading" ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring}><WidgetSkeleton rows={5} delay={0.06} /></motion.div>
        ) : viewState === "empty" ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <WidgetCard delay={0.06}><WidgetEmptyState icon={<Zap className="w-5 h-5" />} message="Nenhum template configurado — comece criando um workflow" cta="Criar workflow" onCta={() => { setViewState("ready"); setWfFormOpen(true); }} /></WidgetCard>
          </motion.div>
        ) : viewState === "error" ? (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <WidgetCard delay={0.06}><WidgetErrorState message="Erro ao carregar templates" onRetry={() => setViewState("ready")} /></WidgetCard>
          </motion.div>
        ) : (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring} className="flex flex-col gap-4">

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3">
              {kpis.map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springStagger(i)} className="flex flex-col gap-1 px-4 py-3.5 bg-white rounded-2xl border border-[#E5E5EA]" style={{ boxShadow: "0 1px 3px #F2F2F7" }}>
                  <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>{kpi.label}</span>
                  <span className="text-[18px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 700 }}>{kpi.value}</span>
                  <span className="text-[11px] text-[#C7C7CC] tabular-nums" style={{ fontWeight: 400 }}>{kpi.sub}</span>
                </motion.div>
              ))}
            </div>

            {/* Tab bar + filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-xl p-0.5">
                {tabs.map((tab) => (
                  <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchQuery(""); setFilterCat("all"); setFilterCanal("all"); }} className={"flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer " + (activeTab === tab.key ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>
                    {tab.label}
                    <span className="text-[10px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>{tab.count}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Category filter (workflows only) */}
                {activeTab === "workflows" && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setFilterCat("all")} className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (filterCat === "all" ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>Todos</button>
                    {Object.entries(workflowCatConfig).map(([k, v]) => (
                      <button key={k} onClick={() => setFilterCat(k as WorkflowCategoria)} className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (filterCat === k ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>{v.label} ({catCounts[k as WorkflowCategoria] ?? 0})</button>
                    ))}
                  </div>
                )}
                {/* Canal filter (mensagens only) */}
                {activeTab === "mensagens" && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setFilterCanal("all")} className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (filterCanal === "all" ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>Todos</button>
                    {Object.entries(canalConfig).map(([k, v]) => (
                      <button key={k} onClick={() => setFilterCanal(k as MensagemCanal)} className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (filterCanal === k ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>{v.label} ({canalCounts[k as MensagemCanal] ?? 0})</button>
                    ))}
                  </div>
                )}
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-3.5 h-3.5 text-[#C7C7CC] pointer-events-none" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={"Buscar " + tabs.find((t) => t.key === activeTab)?.label.toLowerCase() + "..."} className="w-[200px] h-[34px] pl-8 pr-3 text-[13px] text-[#636366] placeholder:text-[#C7C7CC] bg-[#F5F5F7] outline-none focus:w-[260px] focus:bg-[#EDEDF0] transition-all" style={{ fontWeight: 400, borderRadius: 10 }} />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden" style={{ boxShadow: "0 1px 3px #F2F2F7" }}>
              {renderTableHeader()}
              <AnimatePresence>
                {renderRows()}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-[#E5E5EA] shrink-0" style={{ boxShadow: "0 1px 3px #F2F2F7" }}>
              <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                <span className="text-[#8E8E93] tabular-nums" style={{ fontWeight: 500 }}>{filteredCount}</span>{" "}{tabs.find((t) => t.key === activeTab)?.label.toLowerCase()}
                {activeTab === "workflows" && filterCat !== "all" && <span className="text-[#C7C7CC]"> · filtro: {workflowCatConfig[filterCat].label}</span>}
                {activeTab === "mensagens" && filterCanal !== "all" && <span className="text-[#C7C7CC]"> · filtro: {canalConfig[filterCanal].label}</span>}
              </span>
              <span className="text-[11px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                {activeTab === "workflows" && wfAtivos + " ativos · " + totalEtapas + " etapas · " + totalUsosWf + " usos"}
                {activeTab === "cobranca" && cbAtivos + " ativos · " + cbAutomatic + " automáticos · " + totalUsosCb + " usos"}
                {activeTab === "mensagens" && msgAtivos + " ativas · " + totalUsosMsg + " envios · " + totalVars + " variáveis"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <WorkflowFormModal open={wfFormOpen} onClose={() => { setWfFormOpen(false); setEditingWf(null); }} onSave={handleSaveWf} item={editingWf} />
      <CobrancaFormModal open={cbFormOpen} onClose={() => { setCbFormOpen(false); setEditingCb(null); }} onSave={handleSaveCb} item={editingCb} />
      <MensagemFormModal open={msgFormOpen} onClose={() => { setMsgFormOpen(false); setEditingMsg(null); }} onSave={handleSaveMsg} item={editingMsg} />
      <MensagemPreviewModal open={!!previewMsg} onClose={() => setPreviewMsg(null)} item={previewMsg} />
    </div>
  );
}
