import { useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Camera,
  Clock,
  AlertCircle,
  Image,
  Plus,
  RefreshCw,
  StickyNote,
  CircleCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Layers,
  Play,
  Pause,
  LoaderCircle,
  Eye,
  CalendarClock,
  MoreHorizontal,
  Heart,
  Droplet,
  ImagePlus,
  Globe,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springContentIn, springCollapse, springPopoverIn, springFadeIn } from "../../lib/motion-tokens";
import { toast } from "sonner";
import type { Projeto } from "./projetosData";
import { AlertBanner } from "../ui/alert-banner";
import { DrawerCard, TabStateWrapper, TabEmpty, type TabState } from "./drawer-primitives";
import { useDk } from "../../lib/useDarkColors";
import {
  addTrabalho as addTrabalhoToStore,
  equipe as prodEquipe,
  modelosServico as prodModelosServico,
  getTrabalhosByProject,
  setEtapaStatus as setEtapaStatusInStore,
  advanceEtapa as advanceEtapaInStore,
  type TrabalhoTipo,
  type TrabalhoProducao,
  type EtapaStatus,
} from "../producao/productionStore";
import {
  ProductionStageBadge,
  type ProductionStage,
  type ProductionStageState,
  stageStateConfig,
} from "../ui/production-stage-badge";
import { WorkflowProgressPill } from "../ui/workflow-progress-pill";

/* ── Helpers: map store EtapaStatus ↔ ProductionStageState ── */

const etapaToStageState: Record<EtapaStatus, ProductionStageState> = {
  concluida: "concluido",
  atual: "em_andamento",
  aguardando: "aguardando_cliente",
  pendente: "nao_iniciado",
  atrasada: "atrasado",
};

const stageStateToEtapa: Record<ProductionStageState, EtapaStatus> = {
  concluido: "concluida",
  em_andamento: "atual",
  aguardando_cliente: "aguardando",
  nao_iniciado: "pendente",
  atrasado: "atrasada",
};

function mapEtapaNomeToStage(nome: string): ProductionStage {
  const n = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("backup")) return "backup";
  if (n.includes("previa")) return "previa";
  if (n.includes("selec")) return "selecao";
  if (n.includes("entreg")) return "entregue";
  return "edicao";
}

/* ── Production types ── */

type ServicoStatus = "em_andamento" | "aguardando_cliente" | "concluido" | "atrasado" | "nao_iniciado";

function deriveServicoStatus(t: TrabalhoProducao): ServicoStatus {
  if (t.status === "finalizado") return "concluido";
  if (t.etapas.some((e) => e.status === "atrasada") || t.diasRestantes < 0) return "atrasado";
  if (t.aguardandoCliente) return "aguardando_cliente";
  if (t.status === "novo" && t.progresso === 0) return "nao_iniciado";
  return "em_andamento";
}

const servicoStatusConfig: Record<
  ServicoStatus,
  { bg: string; text: string; border: string; label: string; icon: ReactNode }
> = {
  em_andamento: {
    bg: "bg-[#F2F2F7]", text: "text-[#8E8E93]", border: "border-[#E5E5EA]",
    label: "Em andamento", icon: <Play className="w-2.5 h-2.5" />,
  },
  aguardando_cliente: {
    bg: "bg-[#FAFAFA]", text: "text-[#007AFF]", border: "border-[#E5E5EA]",
    label: "Aguardando cliente", icon: <Pause className="w-2.5 h-2.5" />,
  },
  concluido: {
    bg: "bg-[#FAFAFA]", text: "text-[#34C759]", border: "border-[#E5E5EA]",
    label: "Concluído", icon: <CircleCheck className="w-2.5 h-2.5" />,
  },
  atrasado: {
    bg: "bg-[#FBF5F4]", text: "text-[#FF3B30]", border: "border-[#F2DDD9]",
    label: "Atrasado", icon: <AlertCircle className="w-2.5 h-2.5" />,
  },
  nao_iniciado: {
    bg: "bg-[#F2F2F7]", text: "text-[#AEAEB2]", border: "border-[#E5E5EA]",
    label: "Não iniciado", icon: <Clock className="w-2.5 h-2.5" />,
  },
};

/* ── Adicionar Serviço modal ── */

const modelosServico = [
  { id: "casamento", nome: "Casamento — Edição Completa", descricao: "Backup, prévia, seleção, edição e entrega de fotos do casamento", etapas: 5, slaDias: 30, icon: <Heart className="w-4 h-4" /> },
  { id: "pre-wedding", nome: "Pré-Wedding", descricao: "Tratamento do ensaio pré-casamento com prévia e entrega", etapas: 4, slaDias: 15, icon: <Camera className="w-4 h-4" /> },
  { id: "15anos", nome: "15 Anos — Edição", descricao: "Backup, seleção, edição e entrega da festa", etapas: 4, slaDias: 21, icon: <Camera className="w-4 h-4" /> },
  { id: "album", nome: "Álbum / Fotolivro", descricao: "Seleção, diagramação, revisão cliente e impressão", etapas: 4, slaDias: 45, icon: <Layers className="w-4 h-4" /> },
  { id: "ensaio", nome: "Ensaio Externo", descricao: "Tratamento de ensaio individual ou externo", etapas: 3, slaDias: 14, icon: <Eye className="w-4 h-4" /> },
  { id: "tratamento", nome: "Tratamento de Retratos", descricao: "Seleção, tratamento e revisão de retratos individuais", etapas: 4, slaDias: 15, icon: <Droplet className="w-4 h-4" /> },
  { id: "impressao", nome: "Impressão Fine Art", descricao: "Seleção, acabamento, impressão e entrega de quadros", etapas: 4, slaDias: 30, icon: <Image className="w-4 h-4" /> },
  { id: "formatura", nome: "Formatura — Edição", descricao: "Edição e entrega de fotos da cerimônia e festa", etapas: 5, slaDias: 30, icon: <Camera className="w-4 h-4" /> },
  { id: "batizado", nome: "Batizado / Religioso", descricao: "Tratamento de fotos da cerimônia religiosa e recepção", etapas: 4, slaDias: 21, icon: <Camera className="w-4 h-4" /> },
  { id: "corporativo", nome: "Corporativo / Institucional", descricao: "Edição de fotos para uso corporativo", etapas: 4, slaDias: 14, icon: <Globe className="w-4 h-4" /> },
  { id: "making-of", nome: "Making Of / Bastidores", descricao: "Tratamento e edição de fotos dos bastidores", etapas: 5, slaDias: 45, icon: <ImagePlus className="w-4 h-4" /> },
  { id: "drone", nome: "Drone / Aérea", descricao: "Backup, edição, color grading e entrega de fotos aéreas", etapas: 4, slaDias: 14, icon: <Camera className="w-4 h-4" /> },
  { id: "same-day-edit", nome: "Same Day Edit", descricao: "Edição rápida no mesmo dia do evento para projeção", etapas: 4, slaDias: 1, icon: <Play className="w-4 h-4" /> },
  { id: "diagramacao", nome: "Diagramação / Layout", descricao: "Seleção, diagramação e revisão de layout editorial", etapas: 4, slaDias: 30, icon: <Layers className="w-4 h-4" /> },
  { id: "entrega-digital", nome: "Entrega Digital", descricao: "Upload, galeria online e ativação do link de entrega", etapas: 4, slaDias: 7, icon: <Globe className="w-4 h-4" /> },
];

const templateBases = [
  { id: "padrao", label: "Padrão (5 etapas)" },
  { id: "album", label: "Álbum (4 etapas)" },
  { id: "ensaio", label: "Ensaio (3 etapas)" },
  { id: "vazio", label: "Em branco" },
];

const templateEtapas: Record<string, string[]> = {
  padrao: ["Backup", "Prévia", "Seleção", "Edição", "Entregue"],
  album: ["Seleção", "Diagramação", "Revisão cliente", "Impressão"],
  ensaio: ["Backup", "Edição", "Entregue"],
  vazio: [],
};

function AdicionarServicoModal({ open, onClose, projeto }: { open: boolean; onClose: () => void; projeto?: Projeto }) {
  const [tab, setTab] = useState<"modelos" | "personalizado">("modelos");
  const [selectedModelo, setSelectedModelo] = useState<string | null>(null);
  const [customNome, setCustomNome] = useState("");
  const [customSLA, setCustomSLA] = useState("30");
  const [customTemplateBase, setCustomTemplateBase] = useState("padrao");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [depServico, setDepServico] = useState("");
  const [customResponsavel, setCustomResponsavel] = useState("");
  const etapasNomes = templateEtapas[customTemplateBase] || templateEtapas.padrao;
  const [etapasToggle, setEtapasToggle] = useState<boolean[]>(etapasNomes.map(() => true));

  useEffect(() => {
    if (open) {
      setTab("modelos"); setSelectedModelo(null); setCustomNome(""); setCustomSLA("30");
      setCustomTemplateBase("padrao"); setAdvancedOpen(false); setCreating(false);
      setDepServico(""); setCustomResponsavel(""); setEtapasToggle(templateEtapas.padrao.map(() => true));
    }
  }, [open]);

  useEffect(() => {
    const nomes = templateEtapas[customTemplateBase] || [];
    setEtapasToggle(nomes.map(() => true));
  }, [customTemplateBase]);

  if (!open) return null;

  const canCreate = tab === "modelos" ? !!selectedModelo : customNome.trim().length > 0;

  function handleCreate() {
    if (!canCreate) return;
    setCreating(true);
    if (projeto) {
      const TODAY_CONST = "2026-02-23";
      const fmtD = (iso: string) => {
        const d = new Date(iso + "T12:00:00");
        const M = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
        return `${String(d.getDate()).padStart(2, "0")} ${M[d.getMonth()]} ${d.getFullYear()}`;
      };
      if (tab === "modelos" && selectedModelo) {
        const modelo = prodModelosServico.find((m) => m.id === selectedModelo);
        if (modelo) {
          const pd = new Date(TODAY_CONST + "T12:00:00");
          pd.setDate(pd.getDate() + modelo.slaDias);
          const pISO = pd.toISOString().slice(0, 10);
          addTrabalhoToStore({
            projeto: projeto.nome, projetoId: projeto.id, cliente: projeto.cliente,
            titulo: modelo.nome, tipo: modelo.tipo, status: "novo",
            responsavel: prodEquipe[0], prioridade: "normal",
            prazo: fmtD(pISO), prazoISO: pISO, itens: undefined,
            etapas: modelo.etapas.map((n, i) => ({ nome: n, status: (i === 0 ? "atual" : "pendente") as "atual" | "pendente" })),
            aguardandoCliente: false, slaDias: modelo.slaDias,
          });
        }
      } else if (tab === "personalizado" && customNome.trim()) {
        const sla = parseInt(customSLA) || 30;
        const pd = new Date(TODAY_CONST + "T12:00:00");
        pd.setDate(pd.getDate() + sla);
        const pISO = pd.toISOString().slice(0, 10);
        const activeEtapas = etapasNomes.filter((_: string, i: number) => etapasToggle[i]);
        const selectedResp = customResponsavel
          ? prodEquipe.find((m) => m.iniciais === customResponsavel) || prodEquipe[0]
          : prodEquipe[0];
        addTrabalhoToStore({
          projeto: projeto.nome, projetoId: projeto.id, cliente: projeto.cliente,
          titulo: customNome.trim(), tipo: "edicao" as TrabalhoTipo, status: "novo",
          responsavel: selectedResp, prioridade: "normal",
          prazo: fmtD(pISO), prazoISO: pISO, itens: undefined,
          etapas: activeEtapas.map((n: string, i: number) => ({ nome: n, status: (i === 0 ? "atual" : "pendente") as "atual" | "pendente" })),
          aguardandoCliente: false, slaDias: sla,
        });
      }
    }
    setTimeout(() => {
      toast.success("Serviço adicionado com sucesso");
      onClose();
    }, 1200);
  }

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={creating ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-[480px] mx-4 flex flex-col max-h-[calc(100vh-120px)] overflow-hidden" style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F2F2F7]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1D1D1F] flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" />
            </div>
            <h3 className="text-[15px] text-[#48484A]" style={{ fontWeight: 600 }}>Adicionar serviço</h3>
          </div>
          <button onClick={onClose} disabled={creating} className="p-1.5 rounded-lg hover:bg-[#F2F2F7] text-[#C7C7CC] transition-colors cursor-pointer disabled:opacity-30">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="shrink-0 px-6 pt-4 pb-0">
          <div className="flex items-center gap-0 bg-[#F2F2F7] rounded-xl p-0.5">
            {([{ id: "modelos" as const, label: "Modelos" }, { id: "personalizado" as const, label: "Personalizado" }]).map((t) => (
              <button
                key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer ${tab === t.id ? "bg-white text-[#636366]" : "text-[#AEAEB2] hover:text-[#8E8E93]"}`}
                style={{ boxShadow: tab === t.id ? "0 1px 3px #E5E5EA" : undefined, fontWeight: tab === t.id ? 500 : 400 }}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          <AnimatePresence mode="wait">
          {tab === "modelos" ? (
            <motion.div key="modal-modelos" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={springContentIn}>
            <div className="flex flex-col gap-2">
              {modelosServico.map((m) => {
                const selected = selectedModelo === m.id;
                return (
                  <button key={m.id} onClick={() => setSelectedModelo(selected ? null : m.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left ${selected ? "border-[#D1D1D6] bg-[#F8F8FA] ring-1 ring-[#F2F2F7]" : "border-[#E5E5EA] hover:border-[#D1D1D6] hover:bg-[#FAFAFA]"}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-[#1D1D1F] text-white" : "bg-[#F2F2F7] text-[#D1D1D6]"}`}>{m.icon}</div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className={`text-[13px] ${selected ? "text-[#48484A]" : "text-[#636366]"}`} style={{ fontWeight: 500 }}>{m.nome}</span>
                      <span className="text-[11px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>{m.descricao}</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-[#D1D1D6] numeric" style={{ fontWeight: 500 }}>{m.etapas} etapas</span>
                        <span className="text-[10px] text-[#D1D1D6] numeric" style={{ fontWeight: 500 }}>SLA {m.slaDias}d</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selected ? "border-[#1D1D1F] bg-[#1D1D1F]" : "border-[#D1D1D6]"}`}>
                      {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            </motion.div>
          ) : (
            <motion.div key="modal-personalizado" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={springContentIn}>
            <div className="flex flex-col gap-4">
              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Nome do serviço <span className="text-[#FF3B30]">*</span></label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5EA] focus-within:border-[#D1D1D6] focus-within:ring-2 focus-within:ring-[#F2F2F7] transition-all">
                  <input type="text" value={customNome} onChange={(e) => setCustomNome(e.target.value)} placeholder='Ex.: "Edição Ensaio Pré-Wedding"' autoFocus
                    className="flex-1 bg-transparent text-[13px] text-[#636366] placeholder:text-[#D1D1D6] outline-none min-w-0" style={{ fontWeight: 400 }} />
                </div>
              </div>

              {/* Template base */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Template base</label>
                <div className="relative">
                  <select value={customTemplateBase} onChange={(e) => setCustomTemplateBase(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border border-[#E5E5EA] text-[13px] text-[#636366] bg-white focus:border-[#D1D1D6] focus:ring-2 focus:ring-[#F2F2F7] transition-all outline-none cursor-pointer" style={{ fontWeight: 400 }}>
                    {templateBases.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#D1D1D6] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Etapas do fluxo */}
              {etapasNomes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Etapas do fluxo</label>
                  <div className="rounded-xl border border-[#E5E5EA] overflow-hidden">
                    {etapasNomes.map((nome, i) => (
                      <div key={`${customTemplateBase}-${nome}`} className="flex items-center gap-3 px-3.5 py-2.5 border-b border-[#F2F2F7] last:border-b-0">
                        <button onClick={() => { const next = [...etapasToggle]; next[i] = !next[i]; setEtapasToggle(next); }}
                          className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer ${etapasToggle[i] ? "bg-[#1D1D1F] border-[#1D1D1F]" : "border-[#D1D1D6]"}`}>
                          {etapasToggle[i] && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </button>
                        <span className={`text-[13px] flex-1 ${etapasToggle[i] ? "text-[#636366]" : "text-[#D1D1D6] line-through decoration-[#F2F2F7]"}`} style={{ fontWeight: etapasToggle[i] ? 450 : 400 }}>{nome}</span>
                        <span className="text-[10px] text-[#D1D1D6] numeric" style={{ fontWeight: 500 }}>{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {etapasNomes.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#E5E5EA] bg-[#FAFAFA] py-6 flex flex-col items-center gap-2">
                  <span className="text-[12px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>Template em branco — defina etapas manualmente</span>
                </div>
              )}

              {/* Avançado */}
              <div className="flex flex-col gap-0">
                <div className="h-px bg-[#F2F2F7]" />
                <button onClick={() => setAdvancedOpen(!advancedOpen)} className="flex items-center justify-between py-2.5 cursor-pointer group">
                  <span className="text-[12px] text-[#AEAEB2] group-hover:text-[#8E8E93] transition-colors" style={{ fontWeight: 500 }}>Avançado</span>
                  {advancedOpen ? <ChevronUp className="w-3 h-3 text-[#D1D1D6]" /> : <ChevronDown className="w-3 h-3 text-[#D1D1D6]" />}
                </button>
                {advancedOpen && (
                  <div className="flex flex-col gap-4 pb-1">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Prazo SLA</label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5EA] focus-within:border-[#D1D1D6] transition-all w-[100px]">
                          <input type="number" min={1} max={365} value={customSLA} onChange={(e) => setCustomSLA(e.target.value)}
                            className="flex-1 bg-transparent text-[13px] text-[#636366] outline-none min-w-0 numeric" style={{ fontWeight: 400 }} />
                        </div>
                        <span className="text-[12px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>dias após o evento</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Responsável</label>
                      <div className="relative">
                        <select value={customResponsavel} onChange={(e) => setCustomResponsavel(e.target.value)}
                          className="w-full appearance-none px-3 py-2 pl-8 pr-8 rounded-xl border border-[#E5E5EA] text-[13px] text-[#636366] bg-white focus:border-[#D1D1D6] focus:ring-2 focus:ring-[#F2F2F7] transition-all outline-none cursor-pointer" style={{ fontWeight: 400 }}>
                          <option value="">Selecionar da equipe...</option>
                          {prodEquipe.map((m) => (<option key={m.iniciais} value={m.iniciais}>{m.nome}</option>))}
                        </select>
                        <User className="w-3 h-3 text-[#D1D1D6] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <ChevronDown className="w-3 h-3 text-[#D1D1D6] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Dependência</label>
                      <div className="relative">
                        <select value={depServico} onChange={(e) => setDepServico(e.target.value)}
                          className="w-full appearance-none px-3 py-2 pr-8 rounded-xl border border-[#E5E5EA] text-[13px] text-[#636366] bg-white focus:border-[#D1D1D6] focus:ring-2 focus:ring-[#F2F2F7] transition-all outline-none cursor-pointer" style={{ fontWeight: 400 }}>
                          <option value="">Nenhuma — inicia imediatamente</option>
                          {projeto && getTrabalhosByProject(projeto.id).map((t) => (
                            <option key={t.id} value={t.id}>Após: {t.titulo}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-[#D1D1D6] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <span className="text-[10px] text-[#D1D1D6]" style={{ fontWeight: 400 }}>
                        Este serviço só inicia após o serviço selecionado ser concluído.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F2F2F7]">
          <button onClick={onClose} disabled={creating} className="px-4 py-2 rounded-xl text-[13px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer disabled:opacity-30" style={{ fontWeight: 500 }}>Cancelar</button>
          <button onClick={handleCreate} disabled={!canCreate || creating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066DD] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontWeight: 500, boxShadow: "0 1px 2px #E5E5EA" }}>
            {creating ? (<><LoaderCircle className="w-3.5 h-3.5 animate-spin" />Criando...</>) : (<><Plus className="w-3.5 h-3.5" />Adicionar</>)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Service row — uses ProductionStageBadge + WorkflowProgressPill ── */

function ServicoRowNew({
  trabalho,
  expanded,
  onToggle,
  onChangeEtapaStatus,
  onAdvanceEtapa,
}: {
  trabalho: TrabalhoProducao;
  expanded: boolean;
  onToggle: () => void;
  onChangeEtapaStatus: (trabalhoId: string, etapaIdx: number, newStatus: EtapaStatus) => void;
  onAdvanceEtapa: (trabalhoId: string) => void;
}) {
  const srvStatus = deriveServicoStatus(trabalho);
  const sc = servicoStatusConfig[srvStatus];
  const done = trabalho.etapas.filter((e) => e.status === "concluida").length;
  const total = trabalho.etapas.length;
  const isLate = srvStatus === "atrasado";
  const [statusMenuIdx, setStatusMenuIdx] = useState<number | null>(null);

  const currentEtapa = trabalho.etapas.find(
    (e) => e.status === "atual" || e.status === "aguardando" || e.status === "atrasada"
  );
  const currentStage: ProductionStage = currentEtapa
    ? mapEtapaNomeToStage(currentEtapa.nome)
    : done >= total ? "entregue" : "backup";
  const currentStageState: ProductionStageState = currentEtapa
    ? etapaToStageState[currentEtapa.status]
    : done >= total ? "concluido" : "nao_iniciado";

  const statusOptions: { value: EtapaStatus; label: string; color: string }[] = [
    { value: "pendente", label: "Não iniciado", color: "text-[#AEAEB2]" },
    { value: "atual", label: "Em andamento", color: "text-[#8E8E93]" },
    { value: "aguardando", label: "Aguardando cliente", color: "text-[#AF52DE]" },
    { value: "concluida", label: "Concluído", color: "text-[#34C759]" },
    { value: "atrasada", label: "Atrasado", color: "text-[#FF3B30]" },
  ];

  const overflowActions: { label: string; icon: ReactNode }[] = [
    { label: "Voltar etapa", icon: <RefreshCw className="w-3 h-3" /> },
    { label: "Reatribuir", icon: <User className="w-3 h-3" /> },
    { label: "Alterar prazo", icon: <CalendarClock className="w-3 h-3" /> },
    { label: "Adicionar nota", icon: <StickyNote className="w-3 h-3" /> },
  ];

  const dk = useDk();

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: dk.hairline }}>
      <button onClick={onToggle} className="flex items-center gap-3 px-4 py-3 w-full text-left transition-colors cursor-pointer group"
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.textSecondary }}>{trabalho.titulo}</span>
            <ProductionStageBadge stage={currentStage} state={currentStageState} size="sm" showIcon showDot />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <WorkflowProgressPill current={done} total={total} slaDays={trabalho.diasRestantes} variant="compact" isLate={isLate} />
            <span className="w-px h-2.5" style={{ backgroundColor: dk.hairline }} />
            <span className={`inline-flex items-center gap-1 text-[10px] ${sc.text}`} style={{ fontWeight: 500 }}>{sc.icon}{sc.label}</span>
            {trabalho.itens && (<><span className="w-px h-2.5" style={{ backgroundColor: dk.hairline }} /><span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>{trabalho.itens}</span></>)}
          </div>
        </div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: dk.bgMuted }} title={trabalho.responsavel.nome}>
          <span className="text-[8px]" style={{ fontWeight: 600, color: dk.textMuted }}>{trabalho.responsavel.iniciais}</span>
        </div>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-all" style={{ fontWeight: 500, backgroundColor: expanded ? dk.bgMuted : "transparent", color: expanded ? dk.textTertiary : dk.textSubtle }}>
          {expanded ? "Fechar" : "Abrir"}
          <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div key={`stepper-${trabalho.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={springCollapse} className="overflow-hidden">
            <div className="px-4 pb-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: dk.textDisabled }}>Workflow · {done}/{total} etapas</span>
                {srvStatus !== "concluido" && (
                  <button onClick={() => onAdvanceEtapa(trabalho.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] active:scale-[0.97] transition-all cursor-pointer" style={{ fontWeight: 500, backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F", color: dk.isDark ? "#1D1D1F" : "#FFFFFF", boxShadow: dk.shadowCard }}>
                    <Play className="w-2.5 h-2.5" />Avançar
                  </button>
                )}
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}>
                {trabalho.etapas.map((etapa, i) => {
                  const isLast = i === trabalho.etapas.length - 1;
                  const stageState = etapaToStageState[etapa.status];
                  const stage = mapEtapaNomeToStage(etapa.nome);
                  const isMenuOpen = statusMenuIdx === i;

                  return (
                    <div key={`${trabalho.id}-etapa-${i}`} className="flex gap-0 relative">
                      <div className="flex flex-col items-center pl-3.5 py-0 shrink-0 w-[32px]">
                        {i > 0 && (<div className="w-px flex-1 min-h-[8px]" style={{ backgroundColor: (etapa.status === "concluida" || trabalho.etapas[i - 1]?.status === "concluida") ? (dk.isDark ? "#204A28" : "#D4EDDB") : dk.border }} />)}
                        {i === 0 && <div className="flex-1 min-h-[8px]" />}
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: etapa.status === "pendente" ? "transparent" : dk.bgMuted,
                            border: etapa.status === "pendente" ? `1px solid ${dk.border}` : undefined,
                            boxShadow: (etapa.status === "atual" || etapa.status === "aguardando" || etapa.status === "atrasada") ? `0 0 0 2px ${dk.border}` : undefined,
                          }}>
                          {etapa.status === "concluida" ? (<CircleCheck className="w-3 h-3 text-[#34C759]" />)
                          : etapa.status === "atual" ? (<Play className="w-2.5 h-2.5 text-[#8E8E93]" />)
                          : etapa.status === "aguardando" ? (<Pause className="w-2.5 h-2.5 text-[#AF52DE]" />)
                          : etapa.status === "atrasada" ? (<AlertCircle className="w-3 h-3 text-[#FF3B30]" />)
                          : (<span className="text-[8px] numeric" style={{ fontWeight: 600, color: dk.textDisabled }}>{i + 1}</span>)}
                        </div>
                        {!isLast && (<div className="w-px flex-1 min-h-[8px]" style={{ backgroundColor: etapa.status === "concluida" ? (dk.isDark ? "#204A28" : "#D4EDDB") : dk.border }} />)}
                        {isLast && <div className="flex-1 min-h-[8px]" />}
                      </div>
                      <div className={`flex items-center gap-2.5 py-2.5 pr-3.5 flex-1 min-w-0 ${isLast ? "" : "border-b"}`} style={{ borderColor: isLast ? undefined : dk.border }}>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px]"
                              style={{
                                fontWeight: (etapa.status === "atual" || etapa.status === "aguardando" || etapa.status === "atrasada") ? 500 : 400,
                                color: etapa.status === "concluida" ? dk.textMuted
                                  : etapa.status === "atual" ? dk.textSecondary
                                  : etapa.status === "aguardando" ? "#AF52DE"
                                  : etapa.status === "atrasada" ? "#FF3B30"
                                  : dk.textSubtle,
                              }}>
                              {etapa.nome}
                            </span>
                            <ProductionStageBadge stage={stage} state={stageState} size="sm" />
                          </div>
                          {etapa.responsavel && <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>{etapa.responsavel}</span>}
                        </div>
                        {etapa.data && (
                          <span className="text-[10px] numeric shrink-0"
                            style={{
                              fontWeight: 500,
                              color: etapa.status === "atual" ? dk.textTertiary
                                : etapa.status === "aguardando" ? "#AF52DE"
                                : etapa.status === "atrasada" ? "#FF3B30"
                                : dk.textDisabled,
                            }}>{etapa.data}</span>
                        )}
                        {etapa.status === "pendente" && !etapa.data && <span className="text-[10px] shrink-0" style={{ fontWeight: 400, color: dk.isDark ? "#3C3C43" : "#E5E5EA" }}>—</span>}
                        <div className="relative shrink-0">
                          <button onClick={() => setStatusMenuIdx(isMenuOpen ? null : i)} className="p-1 rounded-md transition-all cursor-pointer" style={{ backgroundColor: isMenuOpen ? dk.bgMuted : "transparent", color: dk.textDisabled }} title="Ações da etapa">
                            <MoreHorizontal className="w-3 h-3" />
                          </button>
                          <AnimatePresence>
                            {isMenuOpen && (
                              <motion.div key={`status-menu-${i}`} initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={springPopoverIn}
                                className="absolute right-0 top-full mt-1 z-30 w-[190px] rounded-xl border py-1 overflow-hidden"
                                style={{ borderColor: dk.border, backgroundColor: dk.bg, boxShadow: dk.shadowModal }}>
                                <div className="px-3 py-1.5 border-b" style={{ borderColor: dk.hairline }}>
                                  <span className="text-[9px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textDisabled }}>Alterar status</span>
                                </div>
                                {statusOptions.map((opt) => (
                                  <button key={opt.value} onClick={() => { onChangeEtapaStatus(trabalho.id, i, opt.value); setStatusMenuIdx(null); }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors cursor-pointer"
                                    style={{ fontWeight: etapa.status === opt.value ? 500 : 400, backgroundColor: etapa.status === opt.value ? dk.bgMuted : "transparent", color: etapa.status === opt.value ? dk.textSecondary : dk.textMuted }}
                                    onMouseEnter={(e) => { if (etapa.status !== opt.value) e.currentTarget.style.backgroundColor = dk.bgHover; }}
                                    onMouseLeave={(e) => { if (etapa.status !== opt.value) e.currentTarget.style.backgroundColor = "transparent"; }}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stageStateConfig[etapaToStageState[opt.value]].dot}`} />
                                    {opt.label}
                                    {etapa.status === opt.value && <Check className="w-3 h-3 ml-auto" style={{ color: dk.textSubtle }} />}
                                  </button>
                                ))}
                                <div className="h-px my-1" style={{ backgroundColor: dk.hairline }} />
                                <div className="px-3 py-1 border-b" style={{ borderColor: dk.hairline }}>
                                  <span className="text-[9px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textDisabled }}>Ações</span>
                                </div>
                                {overflowActions.map((act) => (
                                  <button key={act.label} onClick={() => { toast(act.label, { description: `${etapa.nome} — ${trabalho.titulo}` }); setStatusMenuIdx(null); }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors cursor-pointer"
                                    style={{ fontWeight: 400, color: dk.textMuted }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                    <span style={{ color: dk.textDisabled }}>{act.icon}</span>{act.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {isMenuOpen && (createPortal(<div className="fixed inset-0 z-[9998]" onClick={() => setStatusMenuIdx(null)} />, document.body))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>Prazo: {trabalho.prazo}</span>
                <span className="text-[10px] numeric" style={{ fontWeight: 400, color: dk.textDisabled }}>SLA D+{trabalho.slaDias}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main TabProducao ── */

export function TabProducao({
  projeto,
  tabState,
}: {
  projeto: Projeto;
  tabState: TabState;
}) {
  const dk = useDk();
  const [trabalhos, setTrabalhos] = useState<TrabalhoProducao[]>(() => getTrabalhosByProject(projeto.id));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const refresh = () => setTrabalhos(getTrabalhosByProject(projeto.id));

  useEffect(() => {
    setTrabalhos(getTrabalhosByProject(projeto.id));
    setExpandedId(null);
    setShowEmpty(false);
  }, [projeto.id]);

  const hasServices = trabalhos.length > 0;
  const ativos = trabalhos.filter((t) => t.status !== "finalizado" && !(t.status === "novo" && t.progresso === 0)).length;
  const atrasados = trabalhos.filter((t) => t.status !== "finalizado" && (t.diasRestantes < 0 || t.etapas.some((e) => e.status === "atrasada"))).length;
  const concluidos = trabalhos.filter((t) => t.status === "finalizado").length;
  const naoIniciados = trabalhos.filter((t) => t.status === "novo" && t.progresso === 0).length;
  const aguardando = trabalhos.filter((t) => t.aguardandoCliente).length;

  const prazoFinal = trabalhos.length > 0
    ? trabalhos.reduce((latest, t) => t.prazoISO > latest ? t.prazoISO : latest, trabalhos[0].prazoISO)
    : projeto.prazoEntrega;
  const prazoFinalLabel = trabalhos.length > 0
    ? trabalhos.find((t) => t.prazoISO === prazoFinal)?.prazo || projeto.prazoEntrega
    : projeto.prazoEntrega;

  const leadResp = trabalhos.length > 0 ? trabalhos[0].responsavel : projeto.equipe[0]
    ? { nome: projeto.equipe[0].nome, iniciais: projeto.equipe[0].iniciais }
    : { nome: "—", iniciais: "—" };

  function handleChangeEtapaStatus(trabalhoId: string, etapaIdx: number, newStatus: EtapaStatus) {
    setEtapaStatusInStore(trabalhoId, etapaIdx, newStatus);
    refresh();
    const statusLabels: Record<EtapaStatus, string> = {
      concluida: "Concluído", atual: "Em andamento", aguardando: "Aguardando cliente", pendente: "Não iniciado", atrasada: "Atrasado",
    };
    toast.success(`Etapa atualizada para "${statusLabels[newStatus]}"`);
  }

  function handleAdvanceEtapa(trabalhoId: string) {
    advanceEtapaInStore(trabalhoId);
    refresh();
    toast.success("Etapa avançada com sucesso");
  }

  function handleAddClose() {
    setShowAddModal(false);
    setTimeout(refresh, 200);
  }

  return (
    <TabStateWrapper state={tabState}>
      {hasServices && (
        <div className="flex items-center justify-end mb-1">
          <button onClick={() => setShowEmpty(!showEmpty)} className="text-[10px] underline underline-offset-2 cursor-pointer transition-colors" style={{ fontWeight: 400, color: dk.textSubtle }}>
            {showEmpty ? "Ver com dados" : "Ver estado vazio"}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
      {!hasServices || showEmpty ? (
        <motion.div key="producao-empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={springFadeIn}>
        <TabEmpty
          icon={<Camera className="w-6 h-6 text-[#F2F2F7]" />}
          title="Nenhum serviço de produção"
          description="Adicione serviços como edição de fotos, álbum ou tratamento para acompanhar o progresso."
          ctaLabel="Adicionar serviço"
          ctaIcon={<Layers className="w-3.5 h-3.5" />}
          onCta={() => { setShowEmpty(false); setShowAddModal(true); }}
        />
        </motion.div>
      ) : (
        <motion.div key="producao-ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={springFadeIn}>
        <div className="flex flex-col gap-5">
          {atrasados > 0 && (<AlertBanner variant="danger" title={`${atrasados} serviço${atrasados > 1 ? "s" : ""} atrasado${atrasados > 1 ? "s" : ""}`} desc="Verifique prazos e redistribua tarefas se necessário." compact />)}
          {aguardando > 0 && atrasados === 0 && (<AlertBanner variant="warning" title={`${aguardando} serviço${aguardando > 1 ? "s" : ""} aguardando cliente`} desc="Solicite a aprovação ou revisão do cliente." compact />)}

          <DrawerCard title="Resumo da produção">
            <div className="grid grid-cols-4" style={{ borderColor: dk.hairline }}>
              <div className="flex flex-col items-center gap-1 py-3.5" style={{ borderRight: `1px solid ${dk.hairline}` }}>
                <span className="text-[18px] numeric" style={{ fontWeight: 600, color: dk.textSecondary }}>{ativos}</span>
                <span className="text-[9px] text-center" style={{ fontWeight: 500, color: dk.textSubtle }}>Ativos</span>
              </div>
              <div className="flex flex-col items-center gap-1 py-3.5" style={{ borderRight: `1px solid ${dk.hairline}` }}>
                <span className="text-[12px] numeric text-center px-1" style={{ fontWeight: 500, color: dk.textTertiary }}>{prazoFinalLabel}</span>
                <span className="text-[9px] text-center" style={{ fontWeight: 500, color: dk.textSubtle }}>Prazo final</span>
              </div>
              <div className="flex flex-col items-center gap-1 py-3.5" style={{ borderRight: `1px solid ${dk.hairline}` }}>
                <span className="text-[18px] numeric" style={{ fontWeight: 600, color: atrasados > 0 ? "#FF3B30" : dk.textDisabled }}>{atrasados}</span>
                <span className="text-[9px] text-center" style={{ fontWeight: 500, color: dk.textSubtle }}>Atrasos</span>
              </div>
              <div className="flex flex-col items-center gap-1 py-3.5 px-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
                  <span className="text-[8px]" style={{ fontWeight: 600, color: dk.textMuted }}>{leadResp.iniciais}</span>
                </div>
                <span className="text-[9px] text-center truncate w-full" style={{ fontWeight: 500, color: dk.textSubtle }} title={leadResp.nome}>Resp.</span>
              </div>
            </div>
            <div className="px-4 pb-3.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textSubtle }}>Progresso geral</span>
                <span className="text-[11px] numeric" style={{ fontWeight: 500, color: dk.textMuted }}>{concluidos}/{trabalhos.length} concluídos</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: dk.bgMuted }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${trabalhos.length > 0 ? (concluidos / trabalhos.length) * 100 : 0}%`, backgroundColor: concluidos === trabalhos.length ? "#34C759" : dk.textDisabled }} />
              </div>
            </div>
            {naoIniciados > 0 && (
              <div className="px-4 pb-3 flex items-center gap-3">
                <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
                  <Clock className="w-2.5 h-2.5 inline-block mr-0.5 -mt-px" />
                  {naoIniciados} não iniciado{naoIniciados > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </DrawerCard>

          <DrawerCard title="Serviços" count={trabalhos.length}
            extra={<button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 text-[11px] transition-colors cursor-pointer" style={{ fontWeight: 500, color: dk.textSubtle }}><Plus className="w-3 h-3" />Adicionar</button>}>
            {trabalhos.map((t) => (
              <ServicoRowNew key={t.id} trabalho={t} expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
                onChangeEtapaStatus={handleChangeEtapaStatus} onAdvanceEtapa={handleAdvanceEtapa} />
            ))}
          </DrawerCard>
        </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AdicionarServicoModal open={showAddModal} onClose={handleAddClose} projeto={projeto} />
    </TabStateWrapper>
  );
}