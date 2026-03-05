import { useState, useMemo, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Edit3,
  FolderTree,
  MoreHorizontal,
  Plus,
  Repeat,
  Search,
  Tag,
  Trash2,
  Copy,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Landmark,
  QrCode,
  Banknote,
  FileText,
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
type ActiveTab = "categorias" | "centros" | "metodos" | "conciliacao";
type CategoriaType = "receita" | "despesa";
type CentroCustoStatus = "ativo" | "inativo";
type MetodoTipo = "pix" | "boleto" | "cartao_credito" | "cartao_debito" | "transferencia" | "dinheiro";
type ConciliacaoRuleType = "auto_match" | "alerta" | "notificacao" | "bloqueio";

interface Categoria {
  id: string;
  nome: string;
  tipo: CategoriaType;
  cor: string;
  descricao: string;
  lancamentos: number;
  ativa: boolean;
}

interface CentroCusto {
  id: string;
  nome: string;
  responsavel: string;
  descricao: string;
  status: CentroCustoStatus;
  lancamentos: number;
  orcamento: number;
  gasto: number;
}

interface MetodoPagamento {
  id: string;
  nome: string;
  tipo: MetodoTipo;
  taxa: number;
  prazoRecebimento: number;
  ativo: boolean;
  descricao: string;
  bandeiras?: string;
}

interface ConciliacaoRule {
  id: string;
  nome: string;
  tipo: ConciliacaoRuleType;
  descricao: string;
  ativa: boolean;
  parametro: string;
}

/* ═══════════════════════════════════════════════════ */
/*  CONFIG MAPS                                       */
/* ═══════════════════════════════════════════════════ */

const tipoConfig: Record<CategoriaType, { label: string; color: string; bg: string; icon: ReactNode }> = {
  receita: { label: "Receita", color: "#34C759", bg: "#E8F8ED", icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
  despesa: { label: "Despesa", color: "#FF3B30", bg: "#FFEBEF", icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
};

const metodoTipoConfig: Record<MetodoTipo, { label: string; color: string; bg: string; icon: ReactNode }> = {
  pix: { label: "PIX", color: "#00BFAE", bg: "#E6FAF8", icon: <QrCode className="w-4 h-4" /> },
  boleto: { label: "Boleto", color: "#FF9500", bg: "#FFF4E6", icon: <FileText className="w-4 h-4" /> },
  cartao_credito: { label: "Cartão Crédito", color: "#007AFF", bg: "#EDF4FF", icon: <CreditCard className="w-4 h-4" /> },
  cartao_debito: { label: "Cartão Débito", color: "#5856D6", bg: "#F0EFFC", icon: <CreditCard className="w-4 h-4" /> },
  transferencia: { label: "Transferência", color: "#636366", bg: "#F2F2F7", icon: <Landmark className="w-4 h-4" /> },
  dinheiro: { label: "Dinheiro", color: "#34C759", bg: "#E8F8ED", icon: <Banknote className="w-4 h-4" /> },
};

const ruleTypeConfig: Record<ConciliacaoRuleType, { label: string; color: string; bg: string }> = {
  auto_match: { label: "Auto-match", color: "#34C759", bg: "#E8F8ED" },
  alerta: { label: "Alerta", color: "#FF9500", bg: "#FFF4E6" },
  notificacao: { label: "Notificação", color: "#007AFF", bg: "#EDF4FF" },
  bloqueio: { label: "Bloqueio", color: "#FF3B30", bg: "#FFEBEF" },
};

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                         */
/* ═══════════════════════════════════════════════════ */

const initialCategorias: Categoria[] = [
  { id: "cat1", nome: "Cobertura de Casamento", tipo: "receita", cor: "#FF2D55", descricao: "Receita de contratos de casamento", lancamentos: 28, ativa: true },
  { id: "cat2", nome: "Ensaio Fotográfico", tipo: "receita", cor: "#AF52DE", descricao: "Ensaios pessoais, gestante, newborn", lancamentos: 15, ativa: true },
  { id: "cat3", nome: "Evento Corporativo", tipo: "receita", cor: "#007AFF", descricao: "Cobertura de eventos empresariais", lancamentos: 8, ativa: true },
  { id: "cat4", nome: "Álbum e Impressões", tipo: "receita", cor: "#FF9500", descricao: "Venda de álbuns, fine art e impressões", lancamentos: 12, ativa: true },
  { id: "cat5", nome: "Edição Extra", tipo: "receita", cor: "#5AC8FA", descricao: "Serviços adicionais de pós-produção", lancamentos: 6, ativa: true },
  { id: "cat6", nome: "Workshop / Mentoria", tipo: "receita", cor: "#FFCC00", descricao: "Cursos, workshops e consultorias", lancamentos: 3, ativa: true },
  { id: "cat7", nome: "Equipamento", tipo: "despesa", cor: "#1D1D1F", descricao: "Compra e manutenção de câmeras e lentes", lancamentos: 12, ativa: true },
  { id: "cat8", nome: "Equipe / 2º Fotógrafo", tipo: "despesa", cor: "#007AFF", descricao: "Pagamento de assistentes e segundo shooter", lancamentos: 8, ativa: true },
  { id: "cat9", nome: "Locação de Estúdio", tipo: "despesa", cor: "#7C3AED", descricao: "Aluguel de estúdio e locações externas", lancamentos: 5, ativa: true },
  { id: "cat10", nome: "Software / Assinaturas", tipo: "despesa", cor: "#34C759", descricao: "Lightroom, Capture One, CRM, cloud storage", lancamentos: 9, ativa: true },
  { id: "cat11", nome: "Transporte", tipo: "despesa", cor: "#FF3B30", descricao: "Combustível, pedágio, estacionamento, Uber", lancamentos: 14, ativa: true },
  { id: "cat12", nome: "Marketing", tipo: "despesa", cor: "#0891B2", descricao: "Ads, Google, Instagram, materiais gráficos", lancamentos: 4, ativa: true },
  { id: "cat13", nome: "Impostos e Taxas", tipo: "despesa", cor: "#8E8E93", descricao: "DAS, ISS, taxas de plataforma e gateway", lancamentos: 6, ativa: true },
  { id: "cat14", nome: "Escritório / Coworking", tipo: "despesa", cor: "#636366", descricao: "Aluguel, internet, energia, material de escritório", lancamentos: 3, ativa: false },
];

const initialCentros: CentroCusto[] = [
  { id: "cc1", nome: "Operação Estúdio", responsavel: "Carlos Mendes", descricao: "Despesas fixas e operacionais do estúdio", status: "ativo", lancamentos: 34, orcamento: 8000, gasto: 5200 },
  { id: "cc2", nome: "Produção de Eventos", responsavel: "Ana Costa", descricao: "Custos diretos de cobertura de eventos", status: "ativo", lancamentos: 22, orcamento: 12000, gasto: 9800 },
  { id: "cc3", nome: "Marketing Digital", responsavel: "Lucas Silva", descricao: "Investimentos em marketing e publicidade", status: "ativo", lancamentos: 11, orcamento: 3000, gasto: 2100 },
  { id: "cc4", nome: "Educação e Treinamento", responsavel: "Carlos Mendes", descricao: "Workshops, cursos, certificações e livros", status: "inativo", lancamentos: 5, orcamento: 2000, gasto: 800 },
];

const initialMetodos: MetodoPagamento[] = [
  { id: "mp1", nome: "PIX", tipo: "pix", taxa: 0, prazoRecebimento: 0, ativo: true, descricao: "Transferência instantânea via chave PIX" },
  { id: "mp2", nome: "Boleto Bancário", tipo: "boleto", taxa: 2.50, prazoRecebimento: 2, ativo: true, descricao: "Boleto com compensação em até 2 dias úteis" },
  { id: "mp3", nome: "Cartão de Crédito", tipo: "cartao_credito", taxa: 4.99, prazoRecebimento: 30, ativo: true, descricao: "Visa, Mastercard, Elo — até 12x", bandeiras: "Visa, Mastercard, Elo, Amex" },
  { id: "mp4", nome: "Cartão de Débito", tipo: "cartao_debito", taxa: 1.99, prazoRecebimento: 1, ativo: true, descricao: "Débito à vista com recebimento em D+1" },
  { id: "mp5", nome: "Transferência Bancária", tipo: "transferencia", taxa: 0, prazoRecebimento: 1, ativo: true, descricao: "TED/DOC para conta corrente do estúdio" },
];

const initialRegras: ConciliacaoRule[] = [
  { id: "r1", nome: "Match automático por valor + data", tipo: "auto_match", descricao: "Quando valor e data coincidem com parcela pendente, concilia automaticamente", ativa: true, parametro: "Tolerância: ±R$ 0,50 / ±1 dia" },
  { id: "r2", nome: "Match por descrição do extrato", tipo: "auto_match", descricao: "Usa palavras-chave na descrição do extrato para identificar o cliente", ativa: true, parametro: "Mín. 3 palavras coincidentes" },
  { id: "r3", nome: "Alerta de pagamento duplicado", tipo: "alerta", descricao: "Dispara alerta quando dois pagamentos idênticos são detectados em 48h", ativa: true, parametro: "Janela: 48 horas" },
  { id: "r4", nome: "Alerta de valor divergente", tipo: "alerta", descricao: "Notifica quando valor recebido difere do esperado em mais de 5%", ativa: true, parametro: "Tolerância: 5%" },
  { id: "r5", nome: "Notificação de inadimplência", tipo: "notificacao", descricao: "Envia notificação quando parcela está vencida há mais de 15 dias sem match", ativa: true, parametro: "Prazo: 15 dias" },
  { id: "r6", nome: "Bloqueio de conciliação manual", tipo: "bloqueio", descricao: "Bloqueia conciliação manual para valores acima de R$ 5.000 sem aprovação do admin", ativa: false, parametro: "Limite: R$ 5.000" },
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
/*  DROPDOWN MENU (reusable)                          */
/* ═══════════════════════════════════════════════════ */

function ActionMenu({
  open,
  onClose,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  actions: { label: string; icon: ReactNode; danger?: boolean; onClick: () => void }[];
}) {
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
/*  CATEGORIA FORM MODAL                              */
/* ═══════════════════════════════════════════════════ */

function CategoriaFormModal({ open, onClose, onSave, item }: { open: boolean; onClose: () => void; onSave: (c: Categoria) => void; item?: Categoria | null }) {
  const isEdit = !!item;
  const [nome, setNome] = useState(item?.nome ?? "");
  const [tipo, setTipo] = useState<CategoriaType>(item?.tipo ?? "receita");
  const [cor, setCor] = useState(item?.cor ?? "#007AFF");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [ativa, setAtiva] = useState(item?.ativa ?? true);

  const handleSubmit = () => {
    if (!nome.trim()) { toast.error("Campo obrigatório", { description: "O nome da categoria é obrigatório" }); return; }
    onSave({ id: item?.id ?? "cat-" + Date.now(), nome: nome.trim(), tipo, cor, descricao: descricao.trim(), lancamentos: item?.lancamentos ?? 0, ativa });
    onClose();
  };

  return (
    <AppleModal open={open} onClose={onClose} title={isEdit ? "Editar Categoria" : "Nova Categoria"} subtitle={isEdit ? "Atualize nome, tipo e cor" : "Crie uma nova categoria financeira"} size="md" footer={
      <>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
        <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}><Check className="w-3.5 h-3.5" />{isEdit ? "Salvar" : "Criar categoria"}</button>
      </>
    }>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Nome *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Cobertura de Casamento" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as CategoriaType)} className={selectCls} style={{ fontWeight: 400 }}>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Cor</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-[#E5E5EA] shrink-0 cursor-pointer relative overflow-hidden" style={{ backgroundColor: cor }}>
                <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="absolute inset-0 w-full h-full cursor-pointer" style={{ opacity: 0 }} />
              </div>
              <input type="text" value={cor} onChange={(e) => setCor(e.target.value)} className={"flex-1 " + inputCls} style={{ fontWeight: 400, fontFamily: "monospace" }} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Status</label>
            <button onClick={() => setAtiva(!ativa)} className={"h-10 flex items-center gap-2 px-3.5 rounded-xl border transition-all cursor-pointer " + (ativa ? "border-[#34C759] bg-[#E8F8ED]" : "border-[#E5E5EA] bg-white")}>
              <span className={"w-2 h-2 rounded-full shrink-0 " + (ativa ? "bg-[#34C759]" : "bg-[#D1D1D6]")} />
              <span className="text-[13px]" style={{ fontWeight: 400, color: ativa ? "#34C759" : "#C7C7CC" }}>{ativa ? "Ativa" : "Inativa"}</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Descrição</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o uso desta categoria..." rows={2} className={textareaCls} style={{ fontWeight: 400 }} />
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  CENTRO DE CUSTO FORM MODAL                        */
/* ═══════════════════════════════════════════════════ */

function CentroCustoFormModal({ open, onClose, onSave, item }: { open: boolean; onClose: () => void; onSave: (c: CentroCusto) => void; item?: CentroCusto | null }) {
  const isEdit = !!item;
  const [nome, setNome] = useState(item?.nome ?? "");
  const [responsavel, setResponsavel] = useState(item?.responsavel ?? "");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [status, setStatus] = useState<CentroCustoStatus>(item?.status ?? "ativo");
  const [orcamento, setOrcamento] = useState(item?.orcamento?.toString() ?? "0");

  const handleSubmit = () => {
    if (!nome.trim()) { toast.error("Campo obrigatório", { description: "O nome do centro de custo é obrigatório" }); return; }
    onSave({ id: item?.id ?? "cc-" + Date.now(), nome: nome.trim(), responsavel: responsavel.trim(), descricao: descricao.trim(), status, lancamentos: item?.lancamentos ?? 0, orcamento: parseInt(orcamento) || 0, gasto: item?.gasto ?? 0 });
    onClose();
  };

  return (
    <AppleModal open={open} onClose={onClose} title={isEdit ? "Editar Centro de Custo" : "Novo Centro de Custo"} subtitle={isEdit ? "Atualize nome, responsável e orçamento" : "Agrupe lançamentos por projeto, equipe ou operação"} size="md" footer={
      <>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
        <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}><Check className="w-3.5 h-3.5" />{isEdit ? "Salvar" : "Criar centro"}</button>
      </>
    }>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Nome *</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Operação Estúdio" className={inputCls} style={{ fontWeight: 400 }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Responsável</label>
            <input type="text" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome do responsável" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Orçamento mensal (R$)</label>
            <input type="number" value={orcamento} onChange={(e) => setOrcamento(e.target.value)} placeholder="0" min={0} className={inputCls} style={{ fontWeight: 400 }} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Status</label>
          <div className="flex gap-2">
            {(["ativo", "inativo"] as CentroCustoStatus[]).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={"flex-1 h-10 rounded-xl border transition-all cursor-pointer text-[13px] " + (status === s ? "border-[#007AFF] bg-[#EDF4FF]" : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]")} style={{ fontWeight: 500, color: status === s ? "#007AFF" : "#8E8E93" }}>
                {s === "ativo" ? "Ativo" : "Inativo"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Descrição</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva a finalidade deste centro..." rows={2} className={textareaCls} style={{ fontWeight: 400 }} />
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MÉTODO DE PAGAMENTO FORM MODAL                    */
/* ═══════════════════════════════════════════════════ */

function MetodoFormModal({ open, onClose, onSave, item }: { open: boolean; onClose: () => void; onSave: (m: MetodoPagamento) => void; item?: MetodoPagamento | null }) {
  const isEdit = !!item;
  const [nome, setNome] = useState(item?.nome ?? "");
  const [tipo, setTipo] = useState<MetodoTipo>(item?.tipo ?? "pix");
  const [taxa, setTaxa] = useState(item?.taxa?.toString() ?? "0");
  const [prazo, setPrazo] = useState(item?.prazoRecebimento?.toString() ?? "0");
  const [ativo, setAtivo] = useState(item?.ativo ?? true);
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [bandeiras, setBandeiras] = useState(item?.bandeiras ?? "");

  const handleSubmit = () => {
    if (!nome.trim()) { toast.error("Campo obrigatório", { description: "O nome do método é obrigatório" }); return; }
    onSave({ id: item?.id ?? "mp-" + Date.now(), nome: nome.trim(), tipo, taxa: parseFloat(taxa) || 0, prazoRecebimento: parseInt(prazo) || 0, ativo, descricao: descricao.trim(), bandeiras: bandeiras.trim() || undefined });
    onClose();
  };

  return (
    <AppleModal open={open} onClose={onClose} title={isEdit ? "Editar Método" : "Novo Método de Pagamento"} subtitle={isEdit ? "Atualize taxa, prazo e configurações" : "Adicione uma nova forma de recebimento"} size="md" footer={
      <>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
        <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}><Check className="w-3.5 h-3.5" />{isEdit ? "Salvar" : "Criar método"}</button>
      </>
    }>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Nome *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: PIX" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as MetodoTipo)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(metodoTipoConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Taxa (%)</label>
            <input type="number" value={taxa} onChange={(e) => setTaxa(e.target.value)} step="0.01" min="0" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Prazo recebim. (dias)</label>
            <input type="number" value={prazo} onChange={(e) => setPrazo(e.target.value)} min="0" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Status</label>
            <button onClick={() => setAtivo(!ativo)} className={"h-10 flex items-center gap-2 px-3.5 rounded-xl border transition-all cursor-pointer " + (ativo ? "border-[#34C759] bg-[#E8F8ED]" : "border-[#E5E5EA] bg-white")}>
              <span className={"w-2 h-2 rounded-full shrink-0 " + (ativo ? "bg-[#34C759]" : "bg-[#D1D1D6]")} />
              <span className="text-[13px]" style={{ fontWeight: 400, color: ativo ? "#34C759" : "#C7C7CC" }}>{ativo ? "Ativo" : "Inativo"}</span>
            </button>
          </div>
        </div>
        {(tipo === "cartao_credito" || tipo === "cartao_debito") && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Bandeiras aceitas</label>
            <input type="text" value={bandeiras} onChange={(e) => setBandeiras(e.target.value)} placeholder="Visa, Mastercard, Elo, Amex" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Descrição</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes sobre este método..." rows={2} className={textareaCls} style={{ fontWeight: 400 }} />
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  REGRA CONCILIAÇÃO FORM MODAL                      */
/* ═══════════════════════════════════════════════════ */

function RegraFormModal({ open, onClose, onSave, item }: { open: boolean; onClose: () => void; onSave: (r: ConciliacaoRule) => void; item?: ConciliacaoRule | null }) {
  const isEdit = !!item;
  const [nome, setNome] = useState(item?.nome ?? "");
  const [tipo, setTipo] = useState<ConciliacaoRuleType>(item?.tipo ?? "auto_match");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [parametro, setParametro] = useState(item?.parametro ?? "");
  const [ativa, setAtiva] = useState(item?.ativa ?? true);

  const handleSubmit = () => {
    if (!nome.trim()) { toast.error("Campo obrigatório", { description: "O nome da regra é obrigatório" }); return; }
    onSave({ id: item?.id ?? "r-" + Date.now(), nome: nome.trim(), tipo, descricao: descricao.trim(), parametro: parametro.trim(), ativa });
    onClose();
  };

  return (
    <AppleModal open={open} onClose={onClose} title={isEdit ? "Editar Regra" : "Nova Regra de Conciliação"} subtitle={isEdit ? "Atualize parâmetros e condições" : "Automatize o match entre extrato e lançamentos"} size="md" footer={
      <>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-[#8E8E93] border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] transition-all cursor-pointer" style={{ fontWeight: 500 }}>Cancelar</button>
        <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer" style={{ fontWeight: 500 }}><Check className="w-3.5 h-3.5" />{isEdit ? "Salvar" : "Criar regra"}</button>
      </>
    }>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Nome da regra *</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Match automático por valor + data" className={inputCls} style={{ fontWeight: 400 }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as ConciliacaoRuleType)} className={selectCls} style={{ fontWeight: 400 }}>
              {Object.entries(ruleTypeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ fontWeight: 500 }}>Parâmetro</label>
            <input type="text" value={parametro} onChange={(e) => setParametro(e.target.value)} placeholder="Ex: Tolerância: ±R$ 0,50" className={inputCls} style={{ fontWeight: 400 }} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls} style={{ fontWeight: 500 }}>Descrição</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o comportamento desta regra..." rows={2} className={textareaCls} style={{ fontWeight: 400 }} />
        </div>
        <div className="px-1">
          <ToggleRow label="Regra ativa" description="Quando ativa, esta regra é executada automaticamente" checked={ativa} onChange={setAtiva} />
        </div>
      </div>
    </AppleModal>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  TABLE ROWS                                        */
/* ═══════════════════════════════════════════════════ */

function CategoriaRow({ item, index, onEdit, onDelete, onDuplicate }: { item: Categoria; index: number; onEdit: (c: Categoria) => void; onDelete: (id: string) => void; onDuplicate: (c: Categoria) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tConf = tipoConfig[item.tipo];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springStagger(index)} className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{item.nome}</span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>{item.descricao}</span>
      </div>
      <TagPill variant={item.tipo === "receita" ? "success" : "danger"} size="xs">{tConf.label}</TagPill>
      <span className="text-[11px] text-[#8E8E93] tabular-nums w-20 text-center shrink-0" style={{ fontWeight: 500 }}>{item.lancamentos} lançam.</span>
      <span className="w-14 text-center shrink-0">
        <span className={"w-2 h-2 rounded-full inline-block " + (item.ativa ? "bg-[#34C759]" : "bg-[#D1D1D6]")} />
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

function CentroRow({ item, index, onEdit, onDelete }: { item: CentroCusto; index: number; onEdit: (c: CentroCusto) => void; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pctUsado = item.orcamento > 0 ? Math.round((item.gasto / item.orcamento) * 100) : 0;
  const barColor = pctUsado > 90 ? "#FF3B30" : pctUsado > 70 ? "#FF9500" : "#34C759";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springStagger(index)} className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors">
      <div className="w-9 h-9 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
        <FolderTree className="w-4 h-4 text-[#8E8E93]" />
      </div>
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{item.nome}</span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>{item.responsavel} · {item.descricao}</span>
      </div>
      <TagPill variant={item.status === "ativo" ? "success" : "neutral"} size="xs">{item.status === "ativo" ? "Ativo" : "Inativo"}</TagPill>
      <span className="text-[11px] text-[#8E8E93] tabular-nums w-20 text-center shrink-0" style={{ fontWeight: 500 }}>{item.lancamentos} lançam.</span>
      {/* Budget bar */}
      <div className="flex flex-col gap-0.5 w-24 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 500 }}>R$ {(item.gasto / 1000).toFixed(1)}k</span>
          <span className="text-[9px] text-[#C7C7CC] tabular-nums" style={{ fontWeight: 400 }}>/ R$ {(item.orcamento / 1000).toFixed(0)}k</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#F2F2F7] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: Math.min(pctUsado, 100) + "%", backgroundColor: barColor }} />
        </div>
      </div>
      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <ActionMenu open={menuOpen} onClose={() => setMenuOpen(false)} actions={[
          { label: "Editar", icon: <Edit3 className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onEdit(item) },
          { label: "Excluir", icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => onDelete(item.id) },
        ]} />
      </div>
    </motion.div>
  );
}

function MetodoRow({ item, index, onEdit, onDelete, onToggle }: { item: MetodoPagamento; index: number; onEdit: (m: MetodoPagamento) => void; onDelete: (id: string) => void; onToggle: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mConf = metodoTipoConfig[item.tipo];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springStagger(index)} className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: mConf.bg, color: mConf.color }}>
        {mConf.icon}
      </div>
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{item.nome}</span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>{item.descricao}</span>
      </div>
      <TagPill variant="neutral" size="xs">{mConf.label}</TagPill>
      <span className="text-[11px] text-[#8E8E93] tabular-nums w-14 text-center shrink-0" style={{ fontWeight: 500 }}>
        {item.taxa > 0 ? item.taxa.toFixed(2) + "%" : "Grátis"}
      </span>
      <span className="text-[11px] text-[#C7C7CC] tabular-nums w-12 text-center shrink-0" style={{ fontWeight: 400 }}>
        D+{item.prazoRecebimento}
      </span>
      {/* Active toggle */}
      <button onClick={() => onToggle(item.id)} className={"relative w-[38px] h-[22px] rounded-full transition-all cursor-pointer shrink-0 " + (item.ativo ? "bg-[#34C759]" : "bg-[#E5E5EA]")}>
        <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ left: item.ativo ? 18 : 2, boxShadow: "0 1px 3px #C7C7CC" }} />
      </button>
      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <ActionMenu open={menuOpen} onClose={() => setMenuOpen(false)} actions={[
          { label: "Editar", icon: <Edit3 className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onEdit(item) },
          { label: "Excluir", icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => onDelete(item.id) },
        ]} />
      </div>
    </motion.div>
  );
}

function RegraRow({ item, index, onEdit, onDelete, onToggle }: { item: ConciliacaoRule; index: number; onEdit: (r: ConciliacaoRule) => void; onDelete: (id: string) => void; onToggle: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rConf = ruleTypeConfig[item.tipo];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springStagger(index)} className="group flex items-center gap-4 px-4 py-3.5 border-b border-[#F5F5F7] last:border-b-0 hover:bg-[#FAFAFA] transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: rConf.bg }}>
        <Zap className="w-4 h-4" style={{ color: rConf.color }} />
      </div>
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[13px] text-[#636366] truncate" style={{ fontWeight: 500 }}>{item.nome}</span>
        <span className="text-[11px] text-[#C7C7CC] truncate" style={{ fontWeight: 400 }}>{item.descricao}</span>
      </div>
      <TagPill variant={item.tipo === "auto_match" ? "success" : item.tipo === "alerta" ? "warning" : item.tipo === "bloqueio" ? "danger" : "info"} size="xs">{rConf.label}</TagPill>
      <span className="text-[11px] text-[#AEAEB2] w-36 text-center shrink-0 truncate" style={{ fontWeight: 400 }}>{item.parametro}</span>
      <button onClick={() => onToggle(item.id)} className={"relative w-[38px] h-[22px] rounded-full transition-all cursor-pointer shrink-0 " + (item.ativa ? "bg-[#34C759]" : "bg-[#E5E5EA]")}>
        <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ left: item.ativa ? 18 : 2, boxShadow: "0 1px 3px #C7C7CC" }} />
      </button>
      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <ActionMenu open={menuOpen} onClose={() => setMenuOpen(false)} actions={[
          { label: "Editar", icon: <Edit3 className="w-3.5 h-3.5 text-[#C7C7CC]" />, onClick: () => onEdit(item) },
          { label: "Excluir", icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => onDelete(item.id) },
        ]} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN EXPORT                                       */
/* ═══════════════════════════════════════════════════ */

interface FinanceiroConfigContentProps {
  onBack: () => void;
}

export function FinanceiroConfigContent({ onBack }: FinanceiroConfigContentProps) {
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [activeTab, setActiveTab] = useState<ActiveTab>("categorias");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<CategoriaType | "all">("all");

  /* ── Data ── */
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias);
  const [centros, setCentros] = useState<CentroCusto[]>(initialCentros);
  const [metodos, setMetodos] = useState<MetodoPagamento[]>(initialMetodos);
  const [regras, setRegras] = useState<ConciliacaoRule[]>(initialRegras);

  /* ── Modals ── */
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [ccFormOpen, setCcFormOpen] = useState(false);
  const [editingCc, setEditingCc] = useState<CentroCusto | null>(null);
  const [metFormOpen, setMetFormOpen] = useState(false);
  const [editingMet, setEditingMet] = useState<MetodoPagamento | null>(null);
  const [regFormOpen, setRegFormOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<ConciliacaoRule | null>(null);

  /* ── Search ── */
  const q = searchQuery.trim().toLowerCase();

  const filteredCats = useMemo(() => {
    let list = categorias;
    if (filterTipo !== "all") list = list.filter((c) => c.tipo === filterTipo);
    if (q) list = list.filter((c) => c.nome.toLowerCase().includes(q) || c.descricao.toLowerCase().includes(q));
    return list;
  }, [categorias, filterTipo, q]);

  const filteredCentros = useMemo(() => {
    if (!q) return centros;
    return centros.filter((c) => c.nome.toLowerCase().includes(q) || c.responsavel.toLowerCase().includes(q) || c.descricao.toLowerCase().includes(q));
  }, [centros, q]);

  const filteredMetodos = useMemo(() => {
    if (!q) return metodos;
    return metodos.filter((m) => m.nome.toLowerCase().includes(q) || m.descricao.toLowerCase().includes(q) || metodoTipoConfig[m.tipo].label.toLowerCase().includes(q));
  }, [metodos, q]);

  const filteredRegras = useMemo(() => {
    if (!q) return regras;
    return regras.filter((r) => r.nome.toLowerCase().includes(q) || r.descricao.toLowerCase().includes(q));
  }, [regras, q]);

  /* ── KPI derived ── */
  const totalReceitas = categorias.filter((c) => c.tipo === "receita").length;
  const totalDespesas = categorias.filter((c) => c.tipo === "despesa").length;
  const totalLancamentos = categorias.reduce((s, c) => s + c.lancamentos, 0);
  const centrosAtivos = centros.filter((c) => c.status === "ativo").length;
  const totalOrcamento = centros.reduce((s, c) => s + c.orcamento, 0);
  const totalGasto = centros.reduce((s, c) => s + c.gasto, 0);
  const metodosAtivos = metodos.filter((m) => m.ativo).length;
  const regrasAtivas = regras.filter((r) => r.ativa).length;

  /* ── CRUD Categorias ── */
  const handleSaveCat = (c: Categoria) => {
    const exists = categorias.find((x) => x.id === c.id);
    if (exists) { setCategorias((prev) => prev.map((x) => x.id === c.id ? c : x)); toast.success("Categoria atualizada", { description: c.nome, duration: 3000 }); }
    else { setCategorias((prev) => [c, ...prev]); toast.success("Categoria criada", { description: c.nome, duration: 3000 }); }
    setEditingCat(null);
  };
  const handleDeleteCat = (id: string) => { const item = categorias.find((c) => c.id === id); setCategorias((prev) => prev.filter((c) => c.id !== id)); if (item) toast("Categoria excluída", { description: item.nome, duration: 3000 }); };
  const handleDuplicateCat = (c: Categoria) => { const dup = { ...c, id: "cat-" + Date.now(), nome: c.nome + " (cópia)", lancamentos: 0 }; setCategorias((prev) => [dup, ...prev]); toast.success("Categoria duplicada", { description: dup.nome, duration: 3000 }); };

  /* ── CRUD Centros ── */
  const handleSaveCc = (c: CentroCusto) => {
    const exists = centros.find((x) => x.id === c.id);
    if (exists) { setCentros((prev) => prev.map((x) => x.id === c.id ? c : x)); toast.success("Centro atualizado", { description: c.nome, duration: 3000 }); }
    else { setCentros((prev) => [c, ...prev]); toast.success("Centro criado", { description: c.nome, duration: 3000 }); }
    setEditingCc(null);
  };
  const handleDeleteCc = (id: string) => { const item = centros.find((c) => c.id === id); setCentros((prev) => prev.filter((c) => c.id !== id)); if (item) toast("Centro excluído", { description: item.nome, duration: 3000 }); };

  /* ── CRUD Métodos ── */
  const handleSaveMet = (m: MetodoPagamento) => {
    const exists = metodos.find((x) => x.id === m.id);
    if (exists) { setMetodos((prev) => prev.map((x) => x.id === m.id ? m : x)); toast.success("Método atualizado", { description: m.nome, duration: 3000 }); }
    else { setMetodos((prev) => [m, ...prev]); toast.success("Método criado", { description: m.nome, duration: 3000 }); }
    setEditingMet(null);
  };
  const handleDeleteMet = (id: string) => { const item = metodos.find((m) => m.id === id); setMetodos((prev) => prev.filter((m) => m.id !== id)); if (item) toast("Método excluído", { description: item.nome, duration: 3000 }); };
  const handleToggleMet = (id: string) => { setMetodos((prev) => prev.map((m) => m.id === id ? { ...m, ativo: !m.ativo } : m)); };

  /* ── CRUD Regras ── */
  const handleSaveReg = (r: ConciliacaoRule) => {
    const exists = regras.find((x) => x.id === r.id);
    if (exists) { setRegras((prev) => prev.map((x) => x.id === r.id ? r : x)); toast.success("Regra atualizada", { description: r.nome, duration: 3000 }); }
    else { setRegras((prev) => [r, ...prev]); toast.success("Regra criada", { description: r.nome, duration: 3000 }); }
    setEditingReg(null);
  };
  const handleDeleteReg = (id: string) => { const item = regras.find((r) => r.id === id); setRegras((prev) => prev.filter((r) => r.id !== id)); if (item) toast("Regra excluída", { description: item.nome, duration: 3000 }); };
  const handleToggleReg = (id: string) => { setRegras((prev) => prev.map((r) => r.id === id ? { ...r, ativa: !r.ativa } : r)); };

  /* ── Open modal helpers ── */
  const openNew = () => {
    if (activeTab === "categorias") { setEditingCat(null); setCatFormOpen(true); }
    else if (activeTab === "centros") { setEditingCc(null); setCcFormOpen(true); }
    else if (activeTab === "metodos") { setEditingMet(null); setMetFormOpen(true); }
    else { setEditingReg(null); setRegFormOpen(true); }
  };

  const newLabel = activeTab === "categorias" ? "Nova categoria" : activeTab === "centros" ? "Novo centro" : activeTab === "metodos" ? "Novo método" : "Nova regra";

  /* ── Tab config ── */
  const tabs: { key: ActiveTab; label: string; count: number }[] = [
    { key: "categorias", label: "Categorias", count: categorias.length },
    { key: "centros", label: "Centros de Custo", count: centros.length },
    { key: "metodos", label: "Métodos Pgto.", count: metodos.length },
    { key: "conciliacao", label: "Conciliação", count: regras.length },
  ];

  /* ── KPI for active tab ── */
  const kpis = activeTab === "categorias" ? [
    { label: "Categorias", value: String(categorias.length), sub: totalReceitas + " receitas · " + totalDespesas + " despesas" },
    { label: "Ativas", value: String(categorias.filter((c) => c.ativa).length), sub: "em uso atualmente" },
    { label: "Lançamentos", value: String(totalLancamentos), sub: "classificados no total" },
    { label: "Cobertura", value: Math.round((categorias.filter((c) => c.ativa && c.lancamentos > 0).length / Math.max(categorias.length, 1)) * 100) + "%", sub: "categorias com lançamentos" },
  ] : activeTab === "centros" ? [
    { label: "Centros", value: String(centros.length), sub: centrosAtivos + " ativos" },
    { label: "Orçamento total", value: "R$ " + (totalOrcamento / 1000).toFixed(0) + "k", sub: "soma mensal" },
    { label: "Gasto total", value: "R$ " + (totalGasto / 1000).toFixed(1) + "k", sub: Math.round((totalGasto / Math.max(totalOrcamento, 1)) * 100) + "% do orçamento" },
    { label: "Lançamentos", value: String(centros.reduce((s, c) => s + c.lancamentos, 0)), sub: "distribuídos entre centros" },
  ] : activeTab === "metodos" ? [
    { label: "Métodos", value: String(metodos.length), sub: metodosAtivos + " ativos" },
    { label: "Taxa média", value: (metodos.filter((m) => m.ativo).reduce((s, m) => s + m.taxa, 0) / Math.max(metodosAtivos, 1)).toFixed(2) + "%", sub: "dos métodos ativos" },
    { label: "Sem taxa", value: String(metodos.filter((m) => m.taxa === 0).length), sub: "métodos gratuitos" },
    { label: "Prazo médio", value: "D+" + Math.round(metodos.filter((m) => m.ativo).reduce((s, m) => s + m.prazoRecebimento, 0) / Math.max(metodosAtivos, 1)), sub: "para recebimento" },
  ] : [
    { label: "Regras", value: String(regras.length), sub: regrasAtivas + " ativas" },
    { label: "Auto-match", value: String(regras.filter((r) => r.tipo === "auto_match").length), sub: "conciliação automática" },
    { label: "Alertas", value: String(regras.filter((r) => r.tipo === "alerta" || r.tipo === "notificacao").length), sub: "monitoramento ativo" },
    { label: "Bloqueios", value: String(regras.filter((r) => r.tipo === "bloqueio").length), sub: "regras de segurança" },
  ];

  /* ── Table headers per tab ── */
  const renderTableHeader = () => {
    if (activeTab === "categorias") {
      return (
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
          <span className="w-3 shrink-0" />
          <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Categoria</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[72px] text-center" style={{ fontWeight: 600 }}>Tipo</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-20 text-center" style={{ fontWeight: 600 }}>Lançam.</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-14 text-center" style={{ fontWeight: 600 }}>Status</span>
          <span className="w-7 shrink-0" />
        </div>
      );
    }
    if (activeTab === "centros") {
      return (
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
          <span className="w-9 shrink-0" />
          <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Centro de custo</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[72px] text-center" style={{ fontWeight: 600 }}>Status</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-20 text-center" style={{ fontWeight: 600 }}>Lançam.</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-24 text-center" style={{ fontWeight: 600 }}>Orçamento</span>
          <span className="w-7 shrink-0" />
        </div>
      );
    }
    if (activeTab === "metodos") {
      return (
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
          <span className="w-9 shrink-0" />
          <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Método</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[80px] text-center" style={{ fontWeight: 600 }}>Tipo</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-14 text-center" style={{ fontWeight: 600 }}>Taxa</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-12 text-center" style={{ fontWeight: 600 }}>Prazo</span>
          <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[38px] text-center" style={{ fontWeight: 600 }}>Ativo</span>
          <span className="w-7 shrink-0" />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA]">
        <span className="w-9 shrink-0" />
        <span className="flex-1 text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Regra</span>
        <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[80px] text-center" style={{ fontWeight: 600 }}>Tipo</span>
        <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-36 text-center" style={{ fontWeight: 600 }}>Parâmetro</span>
        <span className="text-[11px] text-[#AEAEB2] uppercase tracking-[0.06em] w-[38px] text-center" style={{ fontWeight: 600 }}>Ativa</span>
        <span className="w-7 shrink-0" />
      </div>
    );
  };

  const renderEmptyTable = () => {
    const icon = activeTab === "categorias" ? <Tag className="w-5 h-5 text-[#D1D1D6]" /> : activeTab === "centros" ? <FolderTree className="w-5 h-5 text-[#D1D1D6]" /> : activeTab === "metodos" ? <CreditCard className="w-5 h-5 text-[#D1D1D6]" /> : <Repeat className="w-5 h-5 text-[#D1D1D6]" />;
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        {icon}
        <span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{q ? "Nenhum resultado para \"" + searchQuery + "\"" : "Nenhum item cadastrado"}</span>
      </div>
    );
  };

  const renderRows = () => {
    if (activeTab === "categorias") {
      if (filteredCats.length === 0) return renderEmptyTable();
      return filteredCats.map((item, i) => (
        <CategoriaRow key={item.id} item={item} index={i} onEdit={(c) => { setEditingCat(c); setCatFormOpen(true); }} onDelete={handleDeleteCat} onDuplicate={handleDuplicateCat} />
      ));
    }
    if (activeTab === "centros") {
      if (filteredCentros.length === 0) return renderEmptyTable();
      return filteredCentros.map((item, i) => (
        <CentroRow key={item.id} item={item} index={i} onEdit={(c) => { setEditingCc(c); setCcFormOpen(true); }} onDelete={handleDeleteCc} />
      ));
    }
    if (activeTab === "metodos") {
      if (filteredMetodos.length === 0) return renderEmptyTable();
      return filteredMetodos.map((item, i) => (
        <MetodoRow key={item.id} item={item} index={i} onEdit={(m) => { setEditingMet(m); setMetFormOpen(true); }} onDelete={handleDeleteMet} onToggle={handleToggleMet} />
      ));
    }
    if (filteredRegras.length === 0) return renderEmptyTable();
    return filteredRegras.map((item, i) => (
      <RegraRow key={item.id} item={item} index={i} onEdit={(r) => { setEditingReg(r); setRegFormOpen(true); }} onDelete={handleDeleteReg} onToggle={handleToggleReg} />
    ));
  };

  const filteredCount = activeTab === "categorias" ? filteredCats.length : activeTab === "centros" ? filteredCentros.length : activeTab === "metodos" ? filteredMetodos.length : filteredRegras.length;

  /* ── Tipo filter counts ── */
  const tipoCounts = useMemo(() => {
    const r = categorias.filter((c) => c.tipo === "receita").length;
    const d = categorias.filter((c) => c.tipo === "despesa").length;
    return { receita: r, despesa: d };
  }, [categorias]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-[28px] text-[#1D1D1F] tracking-[-0.025em]" style={{ fontWeight: 700 }}>Financeiro</h1>
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
          <span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Categorias, centros de custo, métodos de pagamento e conciliação</span>
          {viewState === "ready" && (
            <>
              <span className="w-px h-3 bg-[#E5E5EA]" />
              <span className="text-[12px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>{categorias.length} categorias · {metodos.length} métodos · {regras.length} regras</span>
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
            <WidgetCard delay={0.06}><WidgetEmptyState icon={<DollarSign className="w-5 h-5" />} message="Nenhuma configuração financeira — comece criando categorias" cta="Criar categoria" onCta={() => { setViewState("ready"); setCatFormOpen(true); }} /></WidgetCard>
          </motion.div>
        ) : viewState === "error" ? (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <WidgetCard delay={0.06}><WidgetErrorState message="Erro ao carregar configurações financeiras" onRetry={() => setViewState("ready")} /></WidgetCard>
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
                  <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchQuery(""); setFilterTipo("all"); }} className={"flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer " + (activeTab === tab.key ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>
                    {tab.label}
                    <span className="text-[10px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>{tab.count}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Type filter (categorias only) */}
                {activeTab === "categorias" && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setFilterTipo("all")} className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (filterTipo === "all" ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>Todos</button>
                    <button onClick={() => setFilterTipo("receita")} className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (filterTipo === "receita" ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>Receitas ({tipoCounts.receita})</button>
                    <button onClick={() => setFilterTipo("despesa")} className={"px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer " + (filterTipo === "despesa" ? "bg-[#E5E5EA] text-[#636366]" : "text-[#C7C7CC] hover:text-[#8E8E93]")} style={{ fontWeight: 500 }}>Despesas ({tipoCounts.despesa})</button>
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
                {activeTab === "categorias" && filterTipo !== "all" && <span className="text-[#C7C7CC]"> · filtro: {tipoConfig[filterTipo].label}</span>}
              </span>
              <span className="text-[11px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 400 }}>
                {activeTab === "categorias" && totalReceitas + " receitas · " + totalDespesas + " despesas · " + totalLancamentos + " lançamentos"}
                {activeTab === "centros" && centrosAtivos + " ativos · R$ " + (totalGasto / 1000).toFixed(1) + "k de R$ " + (totalOrcamento / 1000).toFixed(0) + "k orçados"}
                {activeTab === "metodos" && metodosAtivos + " ativos · taxa média " + (metodos.filter((m) => m.ativo).reduce((s, m) => s + m.taxa, 0) / Math.max(metodosAtivos, 1)).toFixed(2) + "%"}
                {activeTab === "conciliacao" && regrasAtivas + " ativas de " + regras.length + " regras"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <CategoriaFormModal open={catFormOpen} onClose={() => { setCatFormOpen(false); setEditingCat(null); }} onSave={handleSaveCat} item={editingCat} />
      <CentroCustoFormModal open={ccFormOpen} onClose={() => { setCcFormOpen(false); setEditingCc(null); }} onSave={handleSaveCc} item={editingCc} />
      <MetodoFormModal open={metFormOpen} onClose={() => { setMetFormOpen(false); setEditingMet(null); }} onSave={handleSaveMet} item={editingMet} />
      <RegraFormModal open={regFormOpen} onClose={() => { setRegFormOpen(false); setEditingReg(null); }} onSave={handleSaveReg} item={editingReg} />
    </div>
  );
}
