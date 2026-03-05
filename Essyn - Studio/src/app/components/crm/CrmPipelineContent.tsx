import { useState, useMemo, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  DollarSign,
  FileText,
  Flame,
  Heart,
  ListFilter,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  StickyNote,
  Trash2,
  TrendingUp,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

/* ── Primitives from 02_Components (SET 13 — CRM) ── */
import { PipelineStageHeader } from "../ui/pipeline-stage-header";
import { LeadStageBadge, type LeadStage, leadStageConfig } from "../ui/lead-stage-badge";
import { NextActionPill, type NextActionVariant } from "../ui/next-action-pill";
import { LeadSourceTag } from "../ui/lead-source-tag";
import { LeadCard, type LeadCardData } from "../ui/lead-card";
import {
  ActivityTimelineItem,
  type CrmActivityData,
} from "../ui/activity-timeline-item";
import { FilterChip } from "../ui/filter-chip";
import { TagPill } from "../ui/tag-pill";
import { useDk } from "../../lib/useDarkColors";

/* ── Apple Premium KIT ── */
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetErrorState,
  WidgetHairline,
  HeaderWidget,
  MetricsSkeleton,
} from "../ui/apple-kit";
import { InlineBanner } from "../ui/inline-banner";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";

/* ── Deep-link helpers (P31) ── */
import {
  navigateFromCrmToProject,
  getProjectForLead,
  LEAD_PROJECT_MAP,
} from "../../lib/navigation";
import { projetos } from "../projetos/projetosData";

/* ═══════════════════════════════════════════════════ */
/*  CRM Pipeline Content — [ACTIVE] Screen            */
/*                                                     */
/*  7-stage Kanban pipeline consuming SET 13 CRM       */
/*  primitives. Full interaction:                      */
/*  • Click card → Lead Drawer overlay (right)         */
/*  • Drag → visual stage change (simplified)          */
/*  • Mark "Ganho" → Criar Projeto modal               */
/*  • Deep link → /projetos + drawer                   */
/*  • States: ready / loading / empty / error           */
/*  • FilterChips: Hoje | Atrasados | Sem prox ação    */
/*    | Alto valor | Indicação                          */
/*  CTA primário: SEMPRE preto (#1D1D1F)              */
/* ═══════════════════════════════════════════════════ */

type ViewState = "ready" | "loading" | "empty" | "error";
type DrawerTab = "resumo" | "atividades" | "proposta" | "tarefas" | "notas";

import { springSidebar, springOverlay, springDrawerIn, springContentIn } from "../../lib/motion-tokens";
import { C, GHOST_BTN, FOCUS_RING, HAIRLINE } from "../../lib/apple-style";
import { useAppStore, type LeadStage as AppLeadStage } from "../../lib/appStore";
import { useIsMobile } from "../ui/use-mobile";
const spring = springSidebar;
const pipelineStages: LeadStage[] = [
  "novo", "contato", "reuniao", "proposta", "negociacao", "ganho", "perdido",
];
const drawerTabs: { key: DrawerTab; label: string }[] = [
  { key: "resumo", label: "Resumo" },
  { key: "atividades", label: "Atividades" },
  { key: "proposta", label: "Proposta" },
  { key: "tarefas", label: "Tarefas" },
  { key: "notas", label: "Notas" },
];

/* ── Extended lead data for drawer ── */
interface FullLead extends LeadCardData {
  email: string;
  telefone: string;
  dataEvento?: string;
  local?: string;
  convidados?: string;
  proximaAcaoTexto: string;
  notas?: string;
  atividades: CrmActivityData[];
  tarefas: { id: string; text: string; due: string; done: boolean }[];
  notasList: { id: string; text: string; author: string; time: string }[];
  /** Linked project ID (set when lead is converted via "Criar Projeto") */
  projetoId?: string;
}

/* ═══════════════════════════════════════════════════ */
/*  MOCK DATA                                          */
/* ═══════════════════════════════════════════════════ */

const mockLeads: FullLead[] = [
  {
    id: "l1", nome: "Mariana & Rafael", tipo: "casamento", valor: "R$ 12.500",
    proximaAcao: "hoje", proximaAcaoLabel: "23 Fev", origem: "instagram",
    stage: "negociacao", tags: ["Premium", "Álbum 30×40"],
    email: "mariana.r@email.com", telefone: "(31) 99876-5432",
    dataEvento: "18 Jul 2026", local: "Fazenda Solar, Inhaúma — MG", convidados: "200",
    proximaAcaoTexto: "Enviar contrato final",
    notas: "Casal viu portfolio no Instagram. Querem cerimônia + festa completa, álbum 30×40.",
    atividades: [
      { id: "a1", type: "call", text: "Reunião presencial no estúdio — aprovaram proposta premium", timestamp: "há 1 dia" },
      { id: "a1b", type: "message", text: "WhatsApp: noiva enviou referências de decoração e paleta de cores", timestamp: "há 3 dias", detail: "4 imagens anexadas" },
      { id: "a2", type: "email", text: "Proposta R$ 12.500 enviada (Pacote Premium + Álbum)", timestamp: "há 4 dias" },
      { id: "a1c", type: "task", text: "Preparar contrato customizado — Pacote Premium", timestamp: "há 5 dias" },
      { id: "a3", type: "call", text: "Ligação de follow-up — agendada reunião presencial", timestamp: "há 1 sem" },
      { id: "a4", type: "note", text: "Lead quente. Casal muito animado com o portfolio.", timestamp: "há 2 sem" },
      { id: "a1d", type: "message", text: "WhatsApp: casal confirmou interesse no pacote premium", timestamp: "há 2 sem" },
    ],
    tarefas: [
      { id: "t1", text: "Enviar contrato para assinatura", due: "23 Fev", done: false },
      { id: "t2", text: "Agendar reunião de briefing", due: "28 Fev", done: false },
      { id: "t3", text: "Enviar portfólio Premium", due: "15 Fev", done: true },
      { id: "t5", text: "Coletar briefing de decoração", due: "01 Mar", done: false },
    ],
    notasList: [
      { id: "n1", text: "Noiva prefere fotos em luz natural, evitar flash. Paleta pastel. Referências de casamento ao ar livre.", author: "Marina R.", time: "há 1 dia" },
      { id: "n2", text: "Casal quer making-of fotográfico (bastidores) para redes sociais.", author: "Rafael S.", time: "há 4 dias" },
    ],
  },
  {
    id: "l2", nome: "Fernanda Alves — Gestante", tipo: "ensaio", valor: "R$ 2.800",
    proximaAcao: "amanha", proximaAcaoLabel: "24 Fev", origem: "indicacao",
    stage: "proposta", tags: ["30 fotos"],
    email: "fer.alves@email.com", telefone: "(11) 98765-1234",
    dataEvento: "15 Mar 2026", convidados: undefined,
    proximaAcaoTexto: "Aguardar retorno da proposta",
    atividades: [
      { id: "a5", type: "email", text: "Proposta R$ 2.800 enviada (Ensaio + 30 fotos tratadas)", timestamp: "há 2 dias" },
      { id: "a6", type: "email", text: "E-mail com portfolio de ensaios gestantes", timestamp: "há 5 dias" },
    ],
    tarefas: [], notasList: [],
  },
  {
    id: "l3", nome: "Carla & Bruno", tipo: "casamento", valor: "R$ 9.800",
    proximaAcao: "amanha", proximaAcaoLabel: "24 Fev", origem: "site",
    stage: "reuniao", tags: ["Set 2026"],
    email: "carla.b@email.com", telefone: "(21) 97654-3210",
    dataEvento: "05 Set 2026",
    proximaAcaoTexto: "Confirmar reunião via WhatsApp",
    atividades: [
      { id: "a7", type: "email", text: "Respondido com opções de pacotes e disponibilidade", timestamp: "há 3 dias" },
      { id: "a8", type: "task", text: "Lead criado via formulário do site", timestamp: "há 8 dias" },
    ],
    tarefas: [
      { id: "t4", text: "Confirmar reunião via WhatsApp", due: "24 Fev", done: false },
    ],
    notasList: [],
  },
  {
    id: "l4", nome: "Ricardo Souza — Corp", tipo: "corporativo", valor: "R$ 6.500",
    proximaAcao: "hoje", proximaAcaoLabel: "23 Fev", origem: "indicacao",
    stage: "contato",
    email: "ricardo.s@techco.com", telefone: "(11) 91234-5678",
    dataEvento: "20 Abr 2026",
    proximaAcaoTexto: "Ligar para entender briefing",
    atividades: [
      { id: "a9", type: "note", text: "Indicado pelo cliente TechCo Brasil. Quer cobertura de evento corporativo.", timestamp: "há 4 dias" },
    ],
    tarefas: [], notasList: [],
  },
  {
    id: "l5", nome: "Amanda Torres — 15 Anos", tipo: "aniversario", valor: "R$ 5.200",
    proximaAcao: "atrasado", proximaAcaoLabel: "20 Fev", origem: "instagram",
    stage: "contato", tags: ["Festa"],
    email: "amanda.t@email.com", telefone: "(31) 99111-2233",
    dataEvento: "10 Mai 2026",
    proximaAcaoTexto: "Enviar portfolio de 15 anos",
    atividades: [
      { id: "a10", type: "task", text: "Lead criado via DM do Instagram", timestamp: "há 3 dias" },
    ],
    tarefas: [], notasList: [],
  },
  {
    id: "l6", nome: "Juliana Prado — Newborn", tipo: "ensaio", valor: "R$ 1.800",
    proximaAcao: "atrasado", proximaAcaoLabel: "21 Fev", origem: "anuncio",
    stage: "novo",
    email: "ju.prado@email.com", telefone: "(31) 98222-4455",
    proximaAcaoTexto: "Responder mensagem",
    atividades: [
      { id: "a11", type: "task", text: "Lead criado via WhatsApp", timestamp: "há 1 dia" },
    ],
    tarefas: [], notasList: [],
  },
  {
    id: "l7", nome: "Paulo & Letícia", tipo: "casamento", valor: "R$ 11.000",
    proximaAcao: "hoje", proximaAcaoLabel: "23 Fev", origem: "outros",
    stage: "novo", tags: ["Nov 2026"],
    email: "paulo.let@email.com", telefone: "(11) 99333-7788",
    dataEvento: "22 Nov 2026",
    proximaAcaoTexto: "Enviar e-mail de boas-vindas",
    atividades: [
      { id: "a12", type: "note", text: "Casal conheceu o estúdio na Expo Noivas 2026. Pegaram cartão.", timestamp: "hoje" },
    ],
    tarefas: [], notasList: [],
  },
  {
    id: "l8", nome: "Beatriz Mendes — Batizado", tipo: "batizado", valor: "R$ 3.200",
    proximaAcao: "amanha", proximaAcaoLabel: "24 Fev", origem: "indicacao",
    stage: "proposta",
    email: "bia.mendes@email.com", telefone: "(21) 98444-5566",
    dataEvento: "28 Mar 2026",
    proximaAcaoTexto: "Ligar para follow-up",
    atividades: [
      { id: "a13", type: "email", text: "Proposta R$ 3.200 enviada (Batizado + Mini álbum)", timestamp: "há 5 dias" },
      { id: "a14", type: "call", text: "Videocall — definiu preferências de estilo", timestamp: "há 1 sem" },
    ],
    tarefas: [], notasList: [],
  },
  {
    id: "l9", nome: "Marcos Oliveira — Startup", tipo: "corporativo", valor: "R$ 4.500",
    proximaAcao: "sem_data", origem: "site",
    stage: "novo",
    email: "marcos.o@startup.io", telefone: "(11) 91555-6677",
    proximaAcaoTexto: "Qualificar lead",
    atividades: [
      { id: "a15", type: "task", text: "Lead criado via formulário do site", timestamp: "hoje" },
    ],
    tarefas: [], notasList: [],
  },
  {
    id: "l10", nome: "Ana Clara & Diego", tipo: "casamento", valor: "R$ 15.000",
    proximaAcao: "amanha", proximaAcaoLabel: "24 Fev", origem: "indicacao",
    stage: "ganho", tags: ["Platinum", "Álbum", "Drone"],
    email: "anaclara.d@email.com", telefone: "(31) 97666-8899",
    dataEvento: "12 Ago 2026", local: "Villa Borghese, BH", convidados: "250",
    proximaAcaoTexto: "Agendar reunião de briefing",
    notas: "Contrato assinado. Pacote Platinum com ensaio pré-wedding + cerimônia + festa + álbum.",
    projetoId: "proj-001",
    atividades: [
      { id: "a16", type: "task", text: "Contrato assinado — projeto criado automaticamente", timestamp: "há 2 dias" },
      { id: "a17", type: "email", text: "Contrato final enviado para assinatura", timestamp: "há 5 dias" },
      { id: "a18", type: "call", text: "2ª reunião — fechamento de valores e pacote", timestamp: "há 1 sem" },
    ],
    tarefas: [], notasList: [],
  },
  {
    id: "l11", nome: "Gabriela Rocha — Família", tipo: "ensaio", valor: "R$ 2.200",
    proximaAcao: "sem_data", origem: "instagram",
    stage: "perdido",
    email: "gabi.rocha@email.com", telefone: "(21) 98777-1122",
    proximaAcaoTexto: "—",
    notas: "Achou o valor alto. Possivelmente re-abordar em 6 meses.",
    atividades: [
      { id: "a19", type: "note", text: "Lead perdido — budget insuficiente.", timestamp: "há 3 sem" },
      { id: "a20", type: "email", text: "Proposta R$ 2.200 enviada", timestamp: "há 1 mês" },
    ],
    tarefas: [], notasList: [],
  },
  {
    id: "l12", nome: "Thiago Ferreira — Corp", tipo: "corporativo", valor: "R$ 7.800",
    proximaAcao: "hoje", proximaAcaoLabel: "23 Fev", origem: "site",
    stage: "negociacao", tags: ["Drone"],
    email: "thiago.f@empresa.com", telefone: "(11) 92888-3344",
    dataEvento: "15 Jun 2026",
    proximaAcaoTexto: "Enviar proposta revisada",
    atividades: [
      { id: "a21", type: "call", text: "Reunião com equipe de marketing — ajustes na proposta", timestamp: "há 2 dias" },
      { id: "a22", type: "email", text: "Proposta R$ 7.800 enviada (Cobertura completa + drone)", timestamp: "há 1 sem" },
    ],
    tarefas: [], notasList: [],
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function parseValor(v: string): number {
  return parseInt(v.replace(/[^\d]/g, ""), 10) || 0;
}

/* ── Modelo de serviço para modal Criar Projeto ── */
const modelosServico = [
  { id: "m1", nome: "Casamento Premium", etapas: 5, slaDias: 30, desc: "Cobertura completa com drone + álbum" },
  { id: "m2", nome: "Casamento Essencial", etapas: 4, slaDias: 21, desc: "Cobertura do evento + tratamento digital" },
  { id: "m3", nome: "Ensaio Padrão", etapas: 3, slaDias: 14, desc: "Sessão de 2h + 30 fotos tratadas" },
  { id: "m4", nome: "Corporativo", etapas: 3, slaDias: 10, desc: "Cobertura de evento + galeria web" },
];

/* ═══════════════════════════════════════════════════ */
/*  SUB-COMPONENTS                                     */
/* ═══════════════════════════════════════════════════ */

/* ── Info Row ── */
function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  const dk = useDk();
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="shrink-0" style={{ color: dk.textDisabled }}>{icon}</span>
      <span className="text-[11px] w-[80px] shrink-0" style={{ fontWeight: 400, color: dk.textMuted }}>{label}</span>
      <span className="text-[12px] flex-1 truncate" style={{ fontWeight: 500, color: dk.textTertiary }}>{value}</span>
    </div>
  );
}

/* ── Tab Empty State ── */
function TabEmpty({ icon, title, desc, ctaLabel }: { icon: ReactNode; title: string; desc: string; ctaLabel: string }) {
  const dk = useDk();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>{icon}</div>
      <div className="flex flex-col items-center gap-0.5 max-w-[260px]">
        <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textTertiary }}>{title}</span>
        <span className="text-[11px] text-center" style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSubtle }}>{desc}</span>
      </div>
      <button onClick={() => toast(ctaLabel, { description: "Funcionalidade em desenvolvimento" })} className="mt-1 flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] rounded-xl text-white hover:bg-[#48484A] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500, backgroundColor: dk.textPrimary }}>
        <Plus className="w-3 h-3" />{ctaLabel}
      </button>
    </div>
  );
}

/* ── Copyable Contact Row ── */
function ContactRow({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  const dk = useDk();
  return (
    <div className="flex items-center gap-3 py-2 group">
      <span className="shrink-0" style={{ color: dk.textDisabled }}>{icon}</span>
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <span className="text-[12px] truncate" style={{ fontWeight: 500, color: "#8E8E93" }}>{value}</span>
        <span className="text-[9px] uppercase tracking-[0.06em]" style={{ fontWeight: 500, color: dk.textSubtle }}>{label}</span>
      </div>
      <button
        onClick={() => { navigator.clipboard.writeText(value); toast.success("Copiado!", { description: value, duration: 1500 }); }}
        className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        style={{ color: dk.border }}
      >
        <Copy className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ── "…" dropdown menu for drawer header ── */
function DrawerMenu({ open, onClose, lead, onMoveToGanho, onMoveTo }: {
  open: boolean;
  onClose: () => void;
  lead: FullLead;
  onMoveToGanho: () => void;
  onMoveTo: (stage: LeadStage) => void;
}) {
  const [moveSubOpen, setMoveSubOpen] = useState(false);
  const dk = useDk();

  if (!open) return null;

  return (
    <>
      {createPortal(<div className="fixed inset-0 z-[9998]" onClick={() => { onClose(); setMoveSubOpen(false); }} />, document.body)}
      <motion.div
        initial={{ opacity: 0, y: -4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.97 }}
        transition={spring}
        className="absolute right-14 top-[52px] w-[200px] rounded-xl z-[9999] overflow-hidden"
        style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadow }}
      >
        {/* Move to stage */}
        <div className="relative">
          <button
            onClick={() => setMoveSubOpen(!moveSubOpen)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[12px] text-[#8E8E93] transition-colors cursor-pointer text-left ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F2F2F7]"}`}
            style={{ fontWeight: 400 }}
          >
            <span className="flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5" style={{ color: dk.textDisabled }} /> Mover para...</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${moveSubOpen ? "rotate-180" : ""}`} style={{ color: dk.textSubtle }} />
          </button>
          <AnimatePresence>
            {moveSubOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={spring}
                className="overflow-hidden" style={{ borderTop: `1px solid ${dk.border}` }}
              >
                <div className="py-1 px-1">
                  {pipelineStages.filter((s) => s !== lead.stage).map((s) => (
                    <button
                      key={s}
                      onClick={() => { onMoveTo(s); onClose(); setMoveSubOpen(false); }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-[#AEAEB2] transition-colors cursor-pointer text-left ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F2F2F7]"}`}
                      style={{ fontWeight: 400 }}
                    >
                      <LeadStageBadge stage={s} size="sm" showDot />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px" style={{ backgroundColor: dk.border }} />

        {lead.stage !== "ganho" && lead.stage !== "perdido" && (
          <button
            onClick={() => { onMoveToGanho(); onClose(); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#34C759] transition-colors cursor-pointer text-left ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F2F2F7]"}`}
            style={{ fontWeight: 500 }}
          >
            <Award className="w-3.5 h-3.5" /> Marcar como Ganho
          </button>
        )}

        <button
          onClick={() => { toast("Editar lead", { description: "Modal de edição" }); onClose(); }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#8E8E93] transition-colors cursor-pointer text-left ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F2F2F7]"}`}
          style={{ fontWeight: 400 }}
        >
          <Pencil className="w-3.5 h-3.5" style={{ color: dk.textDisabled }} /> Editar lead
        </button>

        <div className="h-px" style={{ backgroundColor: dk.border }} />

        <button
          onClick={() => { toast.error("Lead excluído (mock)"); onClose(); }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#E07070] transition-colors cursor-pointer text-left ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F2F2F7]"}`}
          style={{ fontWeight: 400 }}
        >
          <Trash2 className="w-3.5 h-3.5" /> Excluir lead
        </button>
      </motion.div>
    </>
  );
}

/* ── Activity filter type ── */
type ActivityFilter = "todas" | "mensagens" | "ligacoes" | "tarefas";

/* ══════════════════════════════════════════════════════ */
/*  MESSAGE TEMPLATES + MODALS (P30)                     */
/* ══════════════════════════════════════════════════════ */

type MsgChannel = "whatsapp" | "email" | "copiar";
type AcaoTipo = "reuniao" | "ligacao" | "whatsapp";

interface MsgTemplate { id: string; label: string; body: string }

const msgTemplates: MsgTemplate[] = [
  { id: "primeiro_contato", label: "Primeiro contato", body: "Olá {nome}, tudo bem?\n\nSou a Marina do estúdio ESSYN. Vi que você tem interesse em cobertura fotográfica para o seu evento.\n\nGostaria de entender melhor o que precisa — podemos agendar uma conversa rápida?\n\nAbraço!" },
  { id: "confirmacao_reuniao", label: "Confirmação reunião", body: "Oi {nome}!\n\nConfirmando nossa reunião no dia {data}.\n\nSe precisar remarcar, é só me avisar.\n\nAté lá!" },
  { id: "proposta_enviada", label: "Proposta enviada", body: "Oi {nome}!\n\nSegue a proposta no valor de {valor} conforme conversamos.\n\nVocê pode visualizar todos os detalhes aqui: {link}\n\nQualquer dúvida, estou à disposição!" },
  { id: "follow_up", label: "Follow-up", body: "Oi {nome}, tudo bem?\n\nPassando para saber se teve a chance de analisar a proposta que enviei.\n\nFico à disposição para esclarecer qualquer dúvida!\n\nAbraço." },
];

const channelCfg: Record<MsgChannel, { label: string; icon: ReactNode; color: string }> = {
  whatsapp: { label: "WhatsApp", icon: <Send className="w-3.5 h-3.5" />, color: "text-[#34C759]" },
  email: { label: "E-mail", icon: <Mail className="w-3.5 h-3.5" />, color: "text-[#007AFF]" },
  copiar: { label: "Copiar texto", icon: <Copy className="w-3.5 h-3.5" />, color: "text-[#AEAEB2]" },
};

const acaoTipoCfg: Record<AcaoTipo, { label: string; icon: ReactNode }> = {
  reuniao: { label: "Reunião", icon: <Users className="w-3.5 h-3.5" /> },
  ligacao: { label: "Ligação", icon: <Phone className="w-3.5 h-3.5" /> },
  whatsapp: { label: "WhatsApp", icon: <Send className="w-3.5 h-3.5" /> },
};

function interpolateVars(tpl: string, lead: FullLead): string {
  return tpl
    .replace(/\{nome\}/g, lead.nome)
    .replace(/\{data\}/g, lead.dataEvento || "a definir")
    .replace(/\{valor\}/g, lead.valor)
    .replace(/\{link\}/g, "https://essyn.app/p/proposta-mock");
}

/* ── Modal: Enviar Mensagem ── */
function EnviarMensagemModal({ lead, initialChannel, onClose, onSent }: {
  lead: FullLead; initialChannel: MsgChannel; onClose: () => void;
  onSent: (channel: MsgChannel, text: string) => void;
}) {
  const dk = useDk();
  const [channel, setChannel] = useState<MsgChannel>(initialChannel);
  const [selTpl, setSelTpl] = useState(msgTemplates[0].id);
  const [body, setBody] = useState(interpolateVars(msgTemplates[0].body, lead));
  const [tplOpen, setTplOpen] = useState(false);

  const pickTemplate = (id: string) => {
    setSelTpl(id);
    const t = msgTemplates.find((x) => x.id === id);
    if (t) setBody(interpolateVars(t.body, lead));
    setTplOpen(false);
  };

  return (
    <>
      <motion.div key="msg-bk" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} transition={springOverlay}
        className="fixed inset-0 bg-[#1D1D1F] z-[60]" onClick={onClose} />
      <motion.div key="msg-p" initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={spring} className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-[500px] rounded-2xl overflow-hidden pointer-events-auto" style={{ backgroundColor: dk.bg, boxShadow: dk.shadowModal, border: `1px solid ${dk.border}` }} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: `1px solid ${dk.border}` }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px]" style={{ fontWeight: 600, color: dk.textSecondary }}>Enviar mensagem</span>
              <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>para {lead.nome}</span>
            </div>
            <button onClick={onClose} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${dk.isDark ? "text-[#636366] hover:text-[#8E8E93] hover:bg-[#2C2C2E]" : "text-[#C7C7CC] hover:text-[#AEAEB2] hover:bg-[#F2F2F7]"}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4">
            {/* Channel */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Canal</span>
              <div className="flex gap-1.5">
                {(["whatsapp", "email", "copiar"] as MsgChannel[]).map((ch) => {
                  const c = channelCfg[ch];
                  return (
                    <button key={ch} onClick={() => setChannel(ch)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] transition-all cursor-pointer"
                      style={{ fontWeight: channel === ch ? 500 : 400, backgroundColor: channel === ch ? dk.bgActive : "transparent", borderColor: channel === ch ? (dk.isDark ? "#48484A" : "#D1D1D6") : dk.border, color: channel === ch ? dk.textSecondary : "#AEAEB2" }}>
                      <span className={channel === ch ? c.color : ""} style={channel === ch ? undefined : { color: dk.textSubtle }}>{c.icon}</span>{c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Template</span>
              <div className="relative">
                <button onClick={() => setTplOpen(!tplOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[12px] text-[#8E8E93] transition-all cursor-pointer" style={{ fontWeight: 400, borderColor: dk.border, backgroundColor: dk.bg }}>
                  <span className="truncate">{msgTemplates.find((t) => t.id === selTpl)?.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${tplOpen ? "rotate-180" : ""}`} style={{ color: dk.textSubtle }} />
                </button>
                <AnimatePresence>
                  {tplOpen && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={spring}
                      className="absolute left-0 right-0 top-full mt-1 rounded-xl z-10 overflow-hidden" style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}`, boxShadow: dk.shadow }}>
                      {msgTemplates.map((t) => (
                        <button key={t.id} onClick={() => pickTemplate(t.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left transition-colors cursor-pointer ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F2F2F7]"}`}
                          style={{ fontWeight: selTpl === t.id ? 500 : 400, backgroundColor: selTpl === t.id ? dk.bgActive : "transparent", color: selTpl === t.id ? dk.textSecondary : "#AEAEB2" }}>
                          {selTpl === t.id && <Check className="w-3 h-3 text-[#AEAEB2] shrink-0" />}{t.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Message body */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Mensagem</span>
                <div className="flex items-center gap-1">
                  {["{nome}", "{data}", "{valor}", "{link}"].map((v) => (
                    <button key={v} onClick={() => setBody((p) => p + " " + v)}
                      className="px-1.5 py-0.5 rounded-md border text-[9px] text-[#8E8E93] transition-colors cursor-pointer" style={{ fontWeight: 500, backgroundColor: dk.bgMuted, borderColor: dk.border }}>{v}</button>
                  ))}
                </div>
              </div>
              <textarea value={body} onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-[12px] text-[#8E8E93] outline-none transition-colors resize-none"
                style={{ borderColor: dk.border, backgroundColor: dk.bg, color: "#8E8E93", fontWeight: 400, lineHeight: 1.6, minHeight: 140 }} rows={6} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderTop: `1px solid ${dk.border}`, backgroundColor: dk.bgSub }}>
            <button onClick={onClose} className={`px-3 py-1.5 rounded-xl text-[12px] text-[#AEAEB2] hover:text-[#8E8E93] transition-all cursor-pointer ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F2F2F7]"}`} style={{ fontWeight: 500 }}>Cancelar</button>
            <div className="flex items-center gap-2">
              <button onClick={() => { onSent(channel, body); onClose(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] text-[#AEAEB2] hover:text-[#8E8E93] transition-all cursor-pointer" style={{ fontWeight: 500, borderColor: dk.border }}>
                <Check className="w-3 h-3" />Marcar como enviado
              </button>
              <button onClick={() => { navigator.clipboard.writeText(body); toast.success("Texto copiado!", { duration: 1500 }); }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-[12px] hover:bg-[#48484A] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500, backgroundColor: dk.textPrimary }}>
                <Copy className="w-3 h-3" />Copiar
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ── Modal: Agendar Próxima Ação ── */
function AgendarProximaAcaoModal({ lead, onClose, onSave }: {
  lead: FullLead; onClose: () => void;
  onSave: (tipo: AcaoTipo, data: string, descricao: string) => void;
}) {
  const dk = useDk();
  const [tipo, setTipo] = useState<AcaoTipo>("reuniao");
  const [data, setData] = useState("2026-02-25");
  const [descricao, setDescricao] = useState("");

  return (
    <>
      <motion.div key="acao-bk" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} transition={springOverlay}
        className="fixed inset-0 bg-[#1D1D1F] z-[60]" onClick={onClose} />
      <motion.div key="acao-p" initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={spring} className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-[400px] rounded-2xl overflow-hidden pointer-events-auto" style={{ backgroundColor: dk.bg, boxShadow: dk.shadowModal, border: `1px solid ${dk.border}` }} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: `1px solid ${dk.border}` }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px]" style={{ fontWeight: 600, color: dk.textSecondary }}>Agendar próxima ação</span>
              <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{lead.nome}</span>
            </div>
            <button onClick={onClose} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${dk.isDark ? "text-[#636366] hover:text-[#8E8E93] hover:bg-[#2C2C2E]" : "text-[#C7C7CC] hover:text-[#AEAEB2] hover:bg-[#F2F2F7]"}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4">
            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Tipo</span>
              <div className="flex gap-1.5">
                {(["reuniao", "ligacao", "whatsapp"] as AcaoTipo[]).map((t) => {
                  const c = acaoTipoCfg[t];
                  return (
                    <button key={t} onClick={() => setTipo(t)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] transition-all cursor-pointer"
                      style={{ fontWeight: tipo === t ? 500 : 400, backgroundColor: tipo === t ? dk.bgActive : "transparent", borderColor: tipo === t ? (dk.isDark ? "#48484A" : "#D1D1D6") : dk.border, color: tipo === t ? dk.textSecondary : "#AEAEB2" }}>
                      <span style={{ color: tipo === t ? "#AEAEB2" : dk.textDisabled }}>{c.icon}</span>{c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Data</span>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-[12px] text-[#8E8E93] outline-none transition-colors cursor-pointer" style={{ fontWeight: 400, borderColor: dk.border, backgroundColor: dk.bg }} />
            </div>

            {/* Descrição */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textSubtle }}>Descrição (opcional)</span>
              <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)}
                placeholder={`${acaoTipoCfg[tipo].label} com ${lead.nome}`}
                className="w-full px-3 py-2 rounded-xl border text-[12px] text-[#8E8E93] outline-none transition-colors" style={{ fontWeight: 400, borderColor: dk.border, backgroundColor: dk.bg }} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5" style={{ borderTop: `1px solid ${dk.border}`, backgroundColor: dk.bgSub }}>
            <button onClick={onClose} className={`px-3 py-1.5 rounded-xl text-[12px] text-[#AEAEB2] hover:text-[#8E8E93] transition-all cursor-pointer ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F2F2F7]"}`} style={{ fontWeight: 500 }}>Cancelar</button>
            <button onClick={() => { if (!data) { toast.error("Selecione uma data"); return; } onSave(tipo, data, descricao || `${acaoTipoCfg[tipo].label} com ${lead.nome}`); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-[12px] hover:bg-[#48484A] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500, backgroundColor: dk.textPrimary }}>
              <Calendar className="w-3 h-3" />Salvar
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ── Quick Add Note (inline in Atividades tab) ── */
function QuickAddNote({ onAdd }: { onAdd: (text: string) => void }) {
  const dk = useDk();
  const [text, setText] = useState("");
  const submit = () => { if (text.trim()) { onAdd(text.trim()); setText(""); } };
  return (
    <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${dk.border}` }}>
      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ borderColor: dk.border, backgroundColor: dk.bg }}>
        <StickyNote className="w-3 h-3" style={{ color: dk.textDisabled }} />
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Adicionar nota rápida..." className="flex-1 text-[11px] text-[#8E8E93] bg-transparent outline-none" style={{ fontWeight: 400 }} />
      </div>
      <button onClick={submit} className="px-3 py-1.5 rounded-xl text-white text-[11px] hover:bg-[#48484A] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500, backgroundColor: dk.textPrimary }}>
        Adicionar nota
      </button>
    </div>
  );
}

/* ── Lead Drawer (Hub) ── */
function LeadDrawerOverlay({
  lead,
  onClose,
  onMoveToGanho,
  onMoveTo,
  onViewProject,
}: {
  lead: FullLead;
  onClose: () => void;
  onMoveToGanho: (lead: FullLead) => void;
  onMoveTo: (lead: FullLead, stage: LeadStage) => void;
  /** P31: navigate to linked project */
  onViewProject?: (lead: FullLead, tab?: "cadastro" | "financeiro") => void;
}) {
  const dk = useDk();
  const [activeTab, setActiveTab] = useState<DrawerTab>("resumo");
  const [localTasks, setLocalTasks] = useState(lead.tarefas);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("todas");
  const [newTaskText, setNewTaskText] = useState("");
  /* P30 — message + schedule modals */
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgChannel, setMsgChannel] = useState<MsgChannel>("whatsapp");
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [localActivities, setLocalActivities] = useState<CrmActivityData[]>(lead.atividades);
  const [localProximaAcao, setLocalProximaAcao] = useState<{ texto: string; variant: NextActionVariant; label?: string }>({ texto: lead.proximaAcaoTexto, variant: lead.proximaAcao, label: lead.proximaAcaoLabel });

  const toggleTask = (id: string) => {
    setLocalTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setLocalTasks((prev) => [
      ...prev,
      { id: `t-new-${Date.now()}`, text: newTaskText.trim(), due: "01 Mar", done: false },
    ]);
    setNewTaskText("");
    toast.success("Tarefa criada");
  };

  /* P30 — on message sent → add activity */
  const handleMsgSent = (ch: MsgChannel, text: string) => {
    const chLabel = channelCfg[ch].label;
    const preview = text.length > 60 ? text.slice(0, 60) + "…" : text;
    const newAct: CrmActivityData = {
      id: `act-${Date.now()}`,
      type: ch === "email" ? "email" : "message",
      text: `${chLabel} enviado: ${preview}`,
      timestamp: "agora",
    };
    setLocalActivities((prev) => [newAct, ...prev]);
    toast.success(`${chLabel} enviado`, { description: lead.nome, duration: 2000 });
  };

  /* P30 — on schedule saved → add activity + update pill */
  const handleAgendarSave = (tipo: AcaoTipo, dataStr: string, desc: string) => {
    const d = new Date(dataStr);
    const formatted = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    const variant: NextActionVariant = diff < 0 ? "atrasado" : diff === 0 ? "hoje" : "amanha";
    setLocalProximaAcao({ texto: desc, variant, label: formatted });
    const newAct: CrmActivityData = {
      id: `act-${Date.now()}`,
      type: tipo === "ligacao" ? "call" : tipo === "reuniao" ? "call" : "message",
      text: `Próxima ação agendada: ${desc} — ${formatted}`,
      timestamp: "agora",
    };
    setLocalActivities((prev) => [newAct, ...prev]);
    toast.success("Próxima ação agendada", { description: `${acaoTipoCfg[tipo].label} em ${formatted}` });
  };

  const openMsgModal = (ch: MsgChannel) => { setMsgChannel(ch); setShowMsgModal(true); };

  /* Filter activities */
  const filteredActivities = useMemo(() => {
    if (activityFilter === "todas") return localActivities;
    const typeMap: Record<ActivityFilter, string[]> = {
      todas: [],
      mensagens: ["message", "email"],
      ligacoes: ["call"],
      tarefas: ["task"],
    };
    return localActivities.filter((a) => typeMap[activityFilter].includes(a.type));
  }, [localActivities, activityFilter]);

  const activityFilterCounts = useMemo(() => ({
    todas: localActivities.length,
    mensagens: localActivities.filter((a) => a.type === "message" || a.type === "email").length,
    ligacoes: localActivities.filter((a) => a.type === "call").length,
    tarefas: localActivities.filter((a) => a.type === "task").length,
  }), [localActivities]);

  const pendingTasks = localTasks.filter((t) => !t.done);
  const doneTasks = localTasks.filter((t) => t.done);

  const tipoLabel = lead.tipo.charAt(0).toUpperCase() + lead.tipo.slice(1);

  /* ESC to close */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[9998] flex justify-end">
      {/* Overlay */}
      <motion.div
        key="drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-[#1D1D1F]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.div
        key="drawer-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={springDrawerIn}
        className="relative ml-auto w-full max-w-[520px] flex flex-col h-full"
        style={{ backgroundColor: dk.bg, boxShadow: dk.isDark ? "0 8px 24px #000000, 0 2px 8px #000000" : `0 8px 24px ${C.disabled}, 0 2px 8px ${C.separatorDark}` }}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Header ── */}
        <div className="relative shrink-0" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
          <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
            <div className="flex gap-3 min-w-0 flex-1">
              {/* Avatar circle */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: dk.bgMuted }}
              >
                <User className="w-4.5 h-4.5" style={{ color: dk.isDark ? "#636366" : C.placeholder }} />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h2
                  className="text-[17px] tracking-[-0.01em] truncate"
                  style={{ fontWeight: 600, color: dk.textPrimary }}
                >
                  {lead.nome}
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <LeadStageBadge stage={lead.stage} size="sm" showDot />
                  <span className="w-px h-2.5" style={{ backgroundColor: dk.border }} />
                  <span className="text-[11px]" style={{ fontWeight: 400, color: C.muted }}>{tipoLabel}</span>
                  <span className="w-px h-2.5" style={{ backgroundColor: dk.border }} />
                  <span className="text-[12px] numeric" style={{ fontWeight: 600, color: C.quaternary }}>
                    {lead.valor}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`${GHOST_BTN} ${
                  menuOpen
                    ? (dk.isDark ? "bg-[#2C2C2E] text-[#AEAEB2]" : "bg-[#F2F2F7] text-[#AEAEB2]")
                    : (dk.isDark ? "text-[#636366] hover:text-[#8E8E93] hover:bg-[#2C2C2E]" : "text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7]")
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className={`${GHOST_BTN} ${dk.isDark ? "text-[#636366] hover:text-[#8E8E93] hover:bg-[#2C2C2E]" : "text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7]"}`}
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dropdown menu */}
          <AnimatePresence>
            {menuOpen && (
              <DrawerMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                lead={lead}
                onMoveToGanho={() => onMoveToGanho(lead)}
                onMoveTo={(stage) => onMoveTo(lead, stage)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center px-3 shrink-0" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
          {drawerTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-3 py-2.5 text-[12px] transition-colors duration-150 cursor-pointer whitespace-nowrap ${FOCUS_RING} ${
                activeTab === tab.key
                  ? (dk.isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]")
                  : "text-[#AEAEB2] hover:text-[#8E8E93]"
              }`}
              style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="crm-drawer-tab"
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ backgroundColor: dk.textPrimary }}
                  transition={spring}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content (scrollable) ── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ═══ RESUMO ═══ */}
            {activeTab === "resumo" && (
              <motion.div key="tab-resumo" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springContentIn}>
                <div className="flex flex-col gap-0">
                  {/* Contatos */}
                  <div className="px-6 py-3.5" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                    <span className="text-[10px] uppercase tracking-[0.06em] mb-1.5 block" style={{ fontWeight: 600, color: dk.textDisabled }}>Contato</span>
                    <ContactRow icon={<Phone className="w-3.5 h-3.5" />} value={lead.telefone} label="Telefone" />
                    <ContactRow icon={<Mail className="w-3.5 h-3.5" />} value={lead.email} label="E-mail" />
                  </div>

                  {/* Origem */}
                  <div className="px-6 py-3.5" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                    <span className="text-[10px] uppercase tracking-[0.06em] mb-2 block" style={{ fontWeight: 600, color: dk.textDisabled }}>Origem</span>
                    <LeadSourceTag source={lead.origem} />
                  </div>

                  {/* Detalhes do evento */}
                  <div className="px-6 py-3.5" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                    <span className="text-[10px] uppercase tracking-[0.06em] mb-1.5 block" style={{ fontWeight: 600, color: dk.textDisabled }}>Evento</span>
                    <div className="flex flex-col">
                      <InfoRow icon={<Heart className="w-3.5 h-3.5" />} label="Tipo" value={tipoLabel} />
                      <InfoRow icon={<DollarSign className="w-3.5 h-3.5" />} label="Valor" value={lead.valor} />
                      {lead.dataEvento && <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Data" value={lead.dataEvento} />}
                      {lead.local && <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Local" value={lead.local} />}
                      {lead.convidados && <InfoRow icon={<Users className="w-3.5 h-3.5" />} label="Convidados" value={lead.convidados} />}
                    </div>
                  </div>

                  {/* P31 — Projeto vinculado */}
                  {lead.projetoId && (() => {
                    const proj = projetos.find((p) => p.id === lead.projetoId);
                    if (!proj) return null;
                    const hasPendencia = proj.financeiro.vencidas > 0;
                    return (
                      <div className="px-6 py-3.5" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                        <span className="text-[10px] uppercase tracking-[0.06em] mb-2 block" style={{ fontWeight: 600, color: dk.textDisabled }}>Projeto vinculado</span>
                        <button
                          onClick={() => onViewProject?.(lead, hasPendencia ? "financeiro" : "cadastro")}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer group active:scale-[0.99] ${FOCUS_RING} ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F2F2F7]"}`}
                          style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}
                        >
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-[12px] truncate" style={{ fontWeight: 500, color: C.quaternary }}>{proj.nome}</span>
                            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.isDark ? "#636366" : C.placeholder }}>{proj.tipo} — {proj.dataEvento}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {hasPendencia && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px]" style={{ fontWeight: 500, backgroundColor: dk.dangerBg, color: C.dangerText, border: `1px solid ${dk.dangerBorder}` }}>
                                <AlertCircle className="w-2.5 h-2.5" />{proj.financeiro.vencidas} vencida{proj.financeiro.vencidas > 1 ? "s" : ""}
                              </span>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 group-hover:text-[#AEAEB2] transition-colors" style={{ color: dk.textDisabled }} />
                          </div>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Próxima ação */}
                  <div className="px-6 py-3.5" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontWeight: 600, color: dk.textDisabled }}>Próxima ação</span>
                      <button
                        onClick={() => setShowAgendarModal(true)}
                        className={`text-[10px] hover:text-[#8E8E93] transition-colors duration-150 cursor-pointer ${FOCUS_RING} rounded px-1 py-0.5`}
                        style={{ fontWeight: 500, color: C.muted }}
                      >Reagendar</button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: dk.bgSub, border: `1px solid ${dk.border}` }}>
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-[12px] truncate" style={{ fontWeight: 500, color: C.quaternary }}>{localProximaAcao.texto}</span>
                      </div>
                      <NextActionPill variant={localProximaAcao.variant} label={localProximaAcao.label} />
                    </div>
                  </div>

                  {/* Tags */}
                  {(lead.tags?.length ?? 0) > 0 && (
                    <div className="px-6 py-3.5" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                      <span className="text-[10px] uppercase tracking-[0.06em] mb-2 block" style={{ fontWeight: 600, color: dk.textDisabled }}>Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.tags!.map((tag) => (
                          <TagPill key={tag} variant="neutral">{tag}</TagPill>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observações curtas */}
                  {lead.notas && (
                    <div className="px-6 py-3.5" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                      <span className="text-[10px] uppercase tracking-[0.06em] mb-2 block" style={{ fontWeight: 600, color: dk.textDisabled }}>Observações</span>
                      <p className="text-[12px] leading-[1.6]" style={{ fontWeight: 400, color: C.muted }}>{lead.notas}</p>
                    </div>
                  )}

                  {/* Quick communication — opens message modal */}
                  <div className="px-6 py-3.5" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowAgendarModal(true); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${FOCUS_RING}`} style={{ fontWeight: 500, color: C.muted, borderColor: dk.border }}>
                        <Phone className="w-3 h-3" /> Ligar
                      </button>
                      <button onClick={() => openMsgModal("whatsapp")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${FOCUS_RING}`} style={{ fontWeight: 500, color: C.muted, borderColor: dk.border }}>
                        <Send className="w-3 h-3" /> WhatsApp
                      </button>
                      <button onClick={() => openMsgModal("email")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${FOCUS_RING}`} style={{ fontWeight: 500, color: C.muted, borderColor: dk.border }}>
                        <Mail className="w-3 h-3" /> E-mail
                      </button>
                    </div>
                  </div>

                  {/* CTA: Registrar atividade */}
                  <div className="px-6 py-5">
                    <button
                      onClick={() => openMsgModal("whatsapp")}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${FOCUS_RING}`}
                      style={{ fontWeight: 500, backgroundColor: C.blue }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Enviar mensagem
                    </button>
                    <button
                      onClick={() => setShowAgendarModal(true)}
                      className={`w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-[12px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#FAFAFA]"}`}
                      style={{ fontWeight: 500, color: C.quaternary, borderColor: dk.border }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Agendar próxima ação
                    </button>
                    {lead.stage !== "ganho" && lead.stage !== "perdido" && (
                      <button
                        onClick={() => onMoveToGanho(lead)}
                        className={`w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-[12px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${FOCUS_RING}`}
                        style={{ fontWeight: 500, color: C.successText, borderColor: dk.isDark ? "#204A28" : C.successBorder }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dk.successBg; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <Award className="w-3.5 h-3.5" />
                        Marcar como Ganho
                      </button>
                    )}
                    {/* P31 — CTA: Ver Projeto (ganho + vinculado) */}
                    {lead.stage === "ganho" && lead.projetoId && (() => {
                      const proj = projetos.find((p) => p.id === lead.projetoId);
                      const hasPendencia = (proj?.financeiro.vencidas ?? 0) > 0;
                      return (
                        <button
                          onClick={() => onViewProject?.(lead, hasPendencia ? "financeiro" : "cadastro")}
                          className={`w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-[12px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${FOCUS_RING}`}
                          style={{ fontWeight: 500, color: C.infoText, borderColor: dk.isDark ? "#203450" : C.infoBorder }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dk.infoBg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          Ver projeto {hasPendencia && "· Pendência financeira"}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ ATIVIDADES ═══ */}
            {activeTab === "atividades" && (
              <motion.div key="tab-atividades" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springContentIn}>
                {/* Filter bar */}
                <div className="flex items-center gap-1.5 px-5 py-2.5 overflow-x-auto" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                  <ListFilter className="w-3 h-3 shrink-0 mr-1" style={{ color: dk.textDisabled }} />
                  {([
                    { key: "todas" as ActivityFilter, label: "Todas" },
                    { key: "mensagens" as ActivityFilter, label: "Mensagens" },
                    { key: "ligacoes" as ActivityFilter, label: "Ligações" },
                    { key: "tarefas" as ActivityFilter, label: "Tarefas" },
                  ]).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setActivityFilter(f.key)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all duration-150 cursor-pointer whitespace-nowrap ${FOCUS_RING} ${
                        activityFilter === f.key
                          ? (dk.isDark ? "bg-[#2C2C2E] text-[#F5F5F7] border border-[#3C3C43]" : "bg-[#F2F2F7] text-[#1D1D1F] border border-[#E5E5EA]")
                          : "text-[#AEAEB2] hover:text-[#8E8E93] border border-transparent"
                      }`}
                      style={{ fontWeight: activityFilter === f.key ? 600 : 400 }}
                    >
                      {f.label}
                      <span className="numeric" style={{ fontWeight: 600, color: activityFilter === f.key ? C.muted : dk.textDisabled }}>
                        {activityFilterCounts[f.key]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Quick-add note */}
                <QuickAddNote onAdd={(text) => {
                  setLocalActivities((prev) => [{ id: `act-${Date.now()}`, type: "note", text, timestamp: "agora" }, ...prev]);
                  toast.success("Nota adicionada");
                }} />

                {/* Timeline */}
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((act, i) => (
                    <ActivityTimelineItem key={act.id} activity={act} showLine={i < filteredActivities.length - 1} compact />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <ListFilter className="w-5 h-5" style={{ color: dk.border }} />
                    <span className="text-[11px]" style={{ fontWeight: 400, color: dk.isDark ? "#636366" : C.placeholder }}>
                      Nenhuma atividade neste filtro
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ PROPOSTA / CONTRATO ═══ */}
            {activeTab === "proposta" && (
              <motion.div key="tab-proposta" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springContentIn}>
                <TabEmpty
                  icon={<FileText className="w-5 h-5" style={{ color: dk.textDisabled }} />}
                  title="Sem proposta"
                  desc="Crie e envie propostas comerciais ou contratos diretamente para este lead."
                  ctaLabel="Criar proposta"
                />
              </motion.div>
            )}

            {/* ═══ TAREFAS ═══ */}
            {activeTab === "tarefas" && (
              <motion.div key="tab-tarefas" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springContentIn}>
                {/* Add task input */}
                <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ borderColor: dk.border, backgroundColor: dk.bg }}>
                    <ClipboardList className="w-3 h-3" style={{ color: dk.textDisabled }} />
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
                      placeholder="Nova tarefa..."
                      className={`flex-1 text-[11px] bg-transparent outline-none ${FOCUS_RING}`}
                      style={{ fontWeight: 400, color: C.quaternary }}
                    />
                  </div>
                  <button onClick={addTask} className={`px-3 py-1.5 rounded-xl text-white text-[11px] transition-all duration-150 cursor-pointer active:scale-[0.97] ${FOCUS_RING}`} style={{ fontWeight: 500, backgroundColor: C.blue }}>
                    Nova tarefa
                  </button>
                </div>

                {localTasks.length === 0 ? (
                  <TabEmpty icon={<ClipboardList className="w-5 h-5" style={{ color: dk.textDisabled }} />} title="Nenhuma tarefa" desc="Crie tarefas para acompanhar o progresso deste lead." ctaLabel="Nova tarefa" />
                ) : (
                  <div className="flex flex-col gap-0 px-3 py-2">
                    {/* Pending */}
                    {pendingTasks.length > 0 && (
                      <div className="flex flex-col gap-0">
                        <span className="text-[9px] uppercase tracking-[0.06em] px-2 pt-2 pb-1" style={{ fontWeight: 600, color: dk.textDisabled }}>
                          Pendentes ({pendingTasks.length})
                        </span>
                        {pendingTasks.map((t) => (
                          <button key={t.id} onClick={() => toggleTask(t.id)} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-left cursor-pointer ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#FAFAFA]"}`}>
                            <span className="w-4 h-4 rounded-md shrink-0 transition-colors" style={{ border: `2px solid ${dk.textDisabled}` }} />
                            <span className="flex-1 text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{t.text}</span>
                            <TagPill variant="warning" size="xs">{t.due}</TagPill>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Done */}
                    {doneTasks.length > 0 && (
                      <div className="flex flex-col gap-0 mt-1">
                        <span className="text-[9px] uppercase tracking-[0.06em] px-2 pt-2 pb-1" style={{ fontWeight: 600, color: dk.textSubtle }}>
                          Concluídas ({doneTasks.length})
                        </span>
                        {doneTasks.map((t) => (
                          <button key={t.id} onClick={() => toggleTask(t.id)} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-left cursor-pointer ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#FAFAFA]"}`}>
                            <span className="w-4 h-4 rounded-md shrink-0 flex items-center justify-center" style={{ backgroundColor: dk.isDark ? "#1A2C1E" : "#DCF1E4", border: `2px solid ${dk.isDark ? "#204A28" : "#B9E3C9"}` }}>
                              <Check className="w-2 h-2 text-[#73C892]" />
                            </span>
                            <span className="flex-1 text-[12px] line-through" style={{ fontWeight: 400, color: dk.textDisabled }}>{t.text}</span>
                            <TagPill variant="success" size="xs">{t.due}</TagPill>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ NOTAS ═══ */}
            {activeTab === "notas" && (
              <motion.div key="tab-notas" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={springContentIn}>
                {/* Write note */}
                <div className="p-5" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
                  <div className="flex flex-col gap-2 p-3 rounded-xl border" style={{ borderColor: dk.border, backgroundColor: dk.bg }}>
                    <textarea placeholder="Escreva uma nota sobre este lead..." className="text-[12px] text-[#8E8E93] bg-transparent outline-none resize-none min-h-[64px]" style={{ fontWeight: 400 }} rows={3} />
                    <div className="flex justify-end">
                      <button onClick={() => toast.success("Nota salva")} className={`px-3 py-1.5 rounded-xl text-white text-[11px] transition-all duration-150 cursor-pointer active:scale-[0.97] ${FOCUS_RING}`} style={{ fontWeight: 500, backgroundColor: C.blue }}>
                        Nova nota
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes list */}
                {lead.notasList.length === 0 && !lead.notas ? (
                  <TabEmpty icon={<StickyNote className="w-5 h-5" style={{ color: dk.textDisabled }} />} title="Nenhuma nota" desc="Registre observações importantes sobre este lead." ctaLabel="Nova nota" />
                ) : (
                  <div className="flex flex-col gap-2.5 p-5">
                    {lead.notasList.map((n) => (
                      <div key={n.id} className="group flex flex-col gap-1.5 p-3 rounded-xl border transition-colors duration-150" style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}>
                        <p className="text-[12px] text-[#AEAEB2] leading-[1.6]" style={{ fontWeight: 400 }}>{n.text}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>{n.author}</span>
                            <span className="w-px h-2" style={{ backgroundColor: dk.border }} />
                            <span className="text-[10px] numeric" style={{ fontWeight: 400, color: dk.textDisabled }}>{n.time}</span>
                          </div>
                          <button
                            onClick={() => toast("Editar nota")}
                            className={`w-5 h-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${dk.isDark ? "text-[#3C3C43] hover:text-[#AEAEB2] hover:bg-[#2C2C2E]" : "text-[#E5E5EA] hover:text-[#AEAEB2] hover:bg-white"}`}
                          >
                            <Pencil className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {lead.notasList.length === 0 && lead.notas && (
                      <div className="flex flex-col gap-1.5 p-3 rounded-xl border" style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}>
                        <p className="text-[12px] text-[#AEAEB2] leading-[1.6]" style={{ fontWeight: 400 }}>{lead.notas}</p>
                        <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textSubtle }}>Marina R.</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4" style={{ borderTop: `1px solid ${dk.hairline}`, backgroundColor: dk.bg }}>
          <div className="flex items-center gap-1.5">
            <button onClick={() => openMsgModal("whatsapp")} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#FAFAFA]"}`} style={{ fontWeight: 500, color: C.muted, borderColor: dk.border }}>
              <MessageSquare className="w-3 h-3" /> Mensagem
            </button>
            <button onClick={() => setShowAgendarModal(true)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] transition-all duration-150 cursor-pointer active:scale-[0.98] ${FOCUS_RING} ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#FAFAFA]"}`} style={{ fontWeight: 500, color: C.muted, borderColor: dk.border }}>
              <Calendar className="w-3 h-3" /> Agendar
            </button>
          </div>
          <div className="flex items-center gap-2">
            {lead.stage !== "ganho" && lead.stage !== "perdido" && (
              <button
                onClick={() => onMoveToGanho(lead)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] transition-all duration-150 cursor-pointer active:scale-[0.97] ${FOCUS_RING}`}
                style={{ fontWeight: 500, backgroundColor: C.blue }}
              >
                <Check className="w-3.5 h-3.5" />
                Marcar como Ganho
              </button>
            )}
            {lead.stage === "ganho" && lead.projetoId && (
              <button
                onClick={() => {
                  const proj = projetos.find((p) => p.id === lead.projetoId);
                  const tab = (proj?.financeiro.vencidas ?? 0) > 0 ? "financeiro" as const : "cadastro" as const;
                  onViewProject?.(lead, tab);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] transition-all duration-150 cursor-pointer active:scale-[0.97] ${FOCUS_RING}`}
                style={{ fontWeight: 500, backgroundColor: C.blue }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Ver projeto
              </button>
            )}
            {lead.stage === "ganho" && !lead.projetoId && (
              <button
                onClick={() => onMoveToGanho(lead)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] transition-all duration-150 cursor-pointer active:scale-[0.97] ${FOCUS_RING}`}
                style={{ fontWeight: 500, backgroundColor: C.blue }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Criar projeto
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* P30 — Enviar Mensagem modal */}
      <AnimatePresence>
        {showMsgModal && (
          <EnviarMensagemModal
            lead={lead}
            initialChannel={msgChannel}
            onClose={() => setShowMsgModal(false)}
            onSent={handleMsgSent}
          />
        )}
      </AnimatePresence>

      {/* P30 — Agendar Próxima Ação modal */}
      <AnimatePresence>
        {showAgendarModal && (
          <AgendarProximaAcaoModal
            lead={lead}
            onClose={() => setShowAgendarModal(false)}
            onSave={handleAgendarSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Criar Projeto Modal ── */
function CriarProjetoModal({
  lead,
  onClose,
  onCreated,
}: {
  lead: FullLead;
  onClose: () => void;
  onCreated: (lead: FullLead, modeloNome?: string) => void;
}) {
  const dk = useDk();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedModelo, setSelectedModelo] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  /* ESC to close */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-[#1D1D1F]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <motion.div
        key={created ? "success" : `step-${step}`}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={springDrawerIn}
        className="relative w-full max-w-[480px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: dk.bg, boxShadow: dk.isDark ? "0 8px 24px #000000, 0 2px 8px #000000" : `0 8px 24px ${C.disabled}, 0 2px 8px ${C.separatorDark}` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
          {!created ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: `1px solid ${dk.border}` }}>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px]" style={{ fontWeight: 600, color: dk.textSecondary }}>Criar projeto</span>
                    <LeadStageBadge stage="ganho" size="sm" showDot />
                  </div>
                  <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>Converter lead em projeto — dados pré-preenchidos</span>
                </div>
                <button onClick={onClose} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${dk.isDark ? "text-[#636366] hover:text-[#8E8E93] hover:bg-[#2C2C2E]" : "text-[#C7C7CC] hover:text-[#AEAEB2] hover:bg-[#F2F2F7]"}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-1 px-6 py-3" style={{ backgroundColor: dk.bgSub, borderBottom: `1px solid ${dk.border}` }}>
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-colors" style={{ fontWeight: 600, backgroundColor: s <= step ? dk.textPrimary : dk.bgMuted, color: s <= step ? "#FFFFFF" : dk.textSubtle }}>
                      {s < step ? <Check className="w-2.5 h-2.5" /> : s}
                    </span>
                    <span className={`text-[10px] mr-3`} style={{ fontWeight: s === step ? 500 : 400, color: s <= step ? "#8E8E93" : dk.textDisabled }}>
                      {s === 1 ? "Dados" : s === 2 ? "Modelo" : "Criar"}
                    </span>
                    {s < 3 && <ArrowRight className="w-3 h-3 mr-1" style={{ color: dk.textDisabled }} />}
                  </div>
                ))}
              </div>

              {/* Step content */}
              <div className="px-6 py-5">
                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] text-[#8E8E93]" style={{ fontWeight: 500 }}>Dados do lead</span>
                      <LeadSourceTag source={lead.origem} />
                    </div>
                    <div className="flex flex-col rounded-xl border px-4 py-2" style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}>
                      <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Cliente" value={lead.nome} />
                      <InfoRow icon={<Heart className="w-3.5 h-3.5" />} label="Tipo" value={lead.tipo.charAt(0).toUpperCase() + lead.tipo.slice(1)} />
                      <InfoRow icon={<DollarSign className="w-3.5 h-3.5" />} label="Valor" value={lead.valor} />
                      {lead.dataEvento && <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Data" value={lead.dataEvento} />}
                      {lead.local && <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Local" value={lead.local} />}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="flex flex-col gap-3">
                    <span className="text-[13px] text-[#8E8E93] mb-1" style={{ fontWeight: 500 }}>Selecione o modelo de serviço</span>
                    {modelosServico.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedModelo(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left`}
                        style={{ borderColor: selectedModelo === m.id ? (dk.isDark ? "#48484A" : "#D1D1D6") : dk.border, backgroundColor: selectedModelo === m.id ? dk.bgSub : "transparent" }}
                      >
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: selectedModelo === m.id ? dk.textPrimary : "transparent", color: selectedModelo === m.id ? "#FFFFFF" : "transparent", border: selectedModelo === m.id ? "none" : `2px solid ${dk.textDisabled}` }}>
                          {selectedModelo === m.id && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>{m.nome}</span>
                          <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>{m.desc}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <TagPill variant="info" size="xs">{m.etapas} etapas</TagPill>
                          <TagPill variant="neutral" size="xs">{m.slaDias}d</TagPill>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {step === 3 && (
                  <div className="flex flex-col gap-4">
                    <span className="text-[13px] text-[#8E8E93] mb-1" style={{ fontWeight: 500 }}>Revisão final</span>
                    <div className="flex flex-col gap-3 p-4 rounded-xl border" style={{ borderColor: dk.border, backgroundColor: dk.bgSub }}>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#73C892]" />
                        <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 500 }}>{lead.nome}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-[9px] uppercase tracking-[0.06em] block" style={{ fontWeight: 600, color: dk.textDisabled }}>Valor</span><span className="text-[11px] text-[#AEAEB2] numeric" style={{ fontWeight: 500 }}>{lead.valor}</span></div>
                        <div><span className="text-[9px] uppercase tracking-[0.06em] block" style={{ fontWeight: 600, color: dk.textDisabled }}>Modelo</span><span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>{modelosServico.find((m) => m.id === selectedModelo)?.nome || "—"}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderTop: `1px solid ${dk.border}`, backgroundColor: dk.bgSub }}>
                <button
                  onClick={() => { if (step > 1) setStep((step - 1) as 1 | 2 | 3); }}
                  className={`px-3 py-1.5 rounded-xl text-[12px] text-[#AEAEB2] hover:text-[#8E8E93] transition-all cursor-pointer ${step === 1 ? "opacity-0 pointer-events-none" : ""} ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F2F2F7]"}`}
                  style={{ fontWeight: 500 }}
                >
                  Voltar
                </button>
                {step < 3 ? (
                  <button
                    onClick={() => setStep((step + 1) as 2 | 3)}
                    disabled={step === 2 && !selectedModelo}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[12px] hover:bg-[#48484A] transition-colors cursor-pointer active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: dk.textPrimary, fontWeight: 500 }}
                  >
                    Continuar <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCreated(true);
                      toast.success("Projeto criado!", { description: lead.nome });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[12px] hover:bg-[#48484A] transition-colors cursor-pointer active:scale-[0.97]"
                    style={{ fontWeight: 500, backgroundColor: dk.textPrimary }}
                  >
                    <Check className="w-3.5 h-3.5" /> Criar projeto
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center gap-4 px-8 py-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
                <Check className="w-7 h-7 text-[#73C892]" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[15px]" style={{ fontWeight: 600, color: dk.textSecondary }}>Projeto criado!</span>
                <span className="text-[13px] text-[#AEAEB2] text-center" style={{ fontWeight: 400, lineHeight: 1.6 }}>{lead.nome} foi convertido em projeto com sucesso.</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={onClose} className="px-3 py-1.5 rounded-xl border text-[12px] text-[#AEAEB2] transition-all cursor-pointer" style={{ fontWeight: 500, borderColor: dk.border }}>
                  Voltar ao CRM
                </button>
                <button
                  onClick={() => {
                    const modelo = modelosServico.find((m) => m.id === selectedModelo);
                    onCreated(lead, modelo?.nome);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-[12px] hover:bg-[#48484A] transition-colors cursor-pointer active:scale-[0.97]"
                  style={{ fontWeight: 500, backgroundColor: dk.textPrimary }}
                >
                  Abrir projeto <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
    </div>
  );
}

/* ── Page states removed — using WidgetEmptyState / WidgetErrorState from KIT ── */

/* ═══════════════════════════════════════════════════ */
/*  MAIN — CrmPipelineContent                        */
/* ═══════════════════════════════════════════════════ */

type FilterKey = "todos" | "hoje" | "atrasados" | "sem_prox" | "alto_valor" | "indicacao";

export function CrmPipelineContent() {
  const navigate = useNavigate();
  const appStore = useAppStore();
  const isMobile = useIsMobile();
  const dk = useDk();
  const isDark = dk.isDark;
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [selectedLead, setSelectedLead] = useState<FullLead | null>(null);
  const [criarProjetoLead, setCriarProjetoLead] = useState<FullLead | null>(null);
  const [leads, setLeads] = useState(mockLeads);
  const [busca, setBusca] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<LeadStage | null>(null);

  /* ── Swipe state for mobile kanban ── */
  const [swipeState, setSwipeState] = useState<{
    id: string; startX: number; currentX: number; swiping: boolean;
  } | null>(null);

  /* ── Slide-out animation state ── */
  const [slideOutId, setSlideOutId] = useState<string | null>(null);
  const [slideOutDir, setSlideOutDir] = useState<"left" | "right">("right");

  /* ── Slide-in animation state (tracks cards that just arrived) ── */
  const [slideInMap, setSlideInMap] = useState<Record<string, "left" | "right">>({});
  const triggerSlideIn = useCallback((id: string, fromDir: "left" | "right") => {
    setSlideInMap((prev) => ({ ...prev, [id]: fromDir }));
    setTimeout(() => setSlideInMap((prev) => { const next = { ...prev }; delete next[id]; return next; }), 50);
  }, []);

  /* ── Filter logic ── */
  const filtered = useMemo(() => {
    let result = leads;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      result = result.filter(
        (l) => l.nome.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.telefone.includes(q)
      );
    }
    switch (activeFilter) {
      case "hoje":
        result = result.filter((l) => l.proximaAcao === "hoje");
        break;
      case "atrasados":
        result = result.filter((l) => l.proximaAcao === "atrasado");
        break;
      case "sem_prox":
        result = result.filter((l) => l.proximaAcao === "sem_data");
        break;
      case "alto_valor":
        result = result.filter((l) => parseValor(l.valor) >= 8000); // R$ 8.000+
        break;
      case "indicacao":
        result = result.filter((l) => l.origem === "indicacao");
        break;
    }
    return result;
  }, [leads, busca, activeFilter]);

  /* ── Grouped by stage ── */
  const grouped = useMemo(() => {
    const map: Record<LeadStage, FullLead[]> = {
      novo: [], contato: [], reuniao: [], proposta: [], negociacao: [], ganho: [], perdido: [],
    };
    filtered.forEach((l) => map[l.stage].push(l));
    return map;
  }, [filtered]);

  /* ── Filter counts ── */
  const filterCounts = useMemo(() => ({
    todos: leads.length,
    hoje: leads.filter((l) => l.proximaAcao === "hoje").length,
    atrasados: leads.filter((l) => l.proximaAcao === "atrasado").length,
    sem_prox: leads.filter((l) => l.proximaAcao === "sem_data").length,
    alto_valor: leads.filter((l) => parseValor(l.valor) >= 8000).length,
    indicacao: leads.filter((l) => l.origem === "indicacao").length,
  }), [leads]);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const ativos = leads.filter((l) => l.stage !== "perdido");
    const valorPipeline = ativos.reduce((s, l) => s + parseValor(l.valor), 0);
    const ganhos = leads.filter((l) => l.stage === "ganho");
    const valorGanho = ganhos.reduce((s, l) => s + parseValor(l.valor), 0);
    const quentes = leads.filter((l) => l.proximaAcao === "hoje" || l.proximaAcao === "atrasado").length;
    return { ativos: ativos.length, valorPipeline, ganhos: ganhos.length, valorGanho, quentes };
  }, [leads]);

  /* ── Sync local stage change with AppStore ── */
  const syncStageToAppStore = useCallback((leadId: string, newStage: LeadStage) => {
    // Only sync stages that exist in AppStore
    const appStoreStages: AppLeadStage[] = ["novo", "contato", "reuniao", "proposta", "negociacao", "ganho", "perdido"];
    if (appStoreStages.includes(newStage as AppLeadStage)) {
      appStore.updateLeadStage(leadId, newStage as AppLeadStage);
    }
  }, [appStore]);

  /* ── Drag simulation ── */
  const handleDragStart = useCallback((id: string) => setDraggingId(id), []);
  const handleDragEnd = useCallback(() => {
    if (draggingId && dropTarget) {
      const lead = leads.find((l) => l.id === draggingId);
      const fromIdx = lead ? pipelineStages.indexOf(lead.stage) : -1;
      const toIdx = pipelineStages.indexOf(dropTarget);
      setLeads((prev) =>
        prev.map((l) => (l.id === draggingId ? { ...l, stage: dropTarget } : l))
      );
      toast(`${lead?.nome} movido para ${leadStageConfig[dropTarget].label}`, { duration: 2000 });
      syncStageToAppStore(draggingId, dropTarget);
      triggerSlideIn(draggingId, fromIdx < toIdx ? "left" : "right");
      if (dropTarget === "ganho" && lead) {
        setCriarProjetoLead(lead as FullLead);
      }
    }
    setDraggingId(null);
    setDropTarget(null);
  }, [draggingId, dropTarget, leads, syncStageToAppStore, triggerSlideIn]);

  /* ── Swipe handlers for mobile ── */
  const handleTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    setSwipeState({ id, startX: e.touches[0].clientX, currentX: e.touches[0].clientX, swiping: false });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState) return;
    const diff = Math.abs(e.touches[0].clientX - swipeState.startX);
    setSwipeState((prev) => prev ? { ...prev, currentX: e.touches[0].clientX, swiping: diff > 20 } : null);
  }, [swipeState]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState || !swipeState.swiping) { setSwipeState(null); return; }
    const diff = swipeState.currentX - swipeState.startX;
    const THRESHOLD = 80;
    if (Math.abs(diff) < THRESHOLD) { setSwipeState(null); return; }

    const lead = leads.find((l) => l.id === swipeState.id);
    if (!lead) { setSwipeState(null); return; }

    const currentIdx = pipelineStages.indexOf(lead.stage);
    const direction = diff > 0 ? 1 : -1; // right = forward, left = backward
    const newIdx = currentIdx + direction;

    if (newIdx >= 0 && newIdx < pipelineStages.length) {
      const newStage = pipelineStages[newIdx];
      const swipedId = swipeState.id;
      // Trigger slide-out animation
      setSlideOutId(swipedId);
      setSlideOutDir(direction > 0 ? "right" : "left");
      setSwipeState(null);

      // After animation completes, move the lead
      setTimeout(() => {
        setLeads((prev) =>
          prev.map((l) => (l.id === swipedId ? { ...l, stage: newStage } : l))
        );
        syncStageToAppStore(swipedId, newStage);
        triggerSlideIn(swipedId, direction > 0 ? "left" : "right");
        toast(`${lead.nome} → ${leadStageConfig[newStage].label}`, { duration: 1500 });
        setSlideOutId(null);
        if (newStage === "ganho") {
          setTimeout(() => setCriarProjetoLead({ ...lead, stage: newStage }), 300);
        }
      }, 250);
    } else {
      setSwipeState(null);
    }
  }, [swipeState, leads, syncStageToAppStore, triggerSlideIn]);

  /* ── "Marcar como Ganho" handler ── */
  const handleMoveToGanho = useCallback((lead: FullLead) => {
    const fromIdx = pipelineStages.indexOf(lead.stage);
    const toIdx = pipelineStages.indexOf("ganho");
    setSelectedLead(null);
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage: "ganho" as LeadStage } : l)));
    syncStageToAppStore(lead.id, "ganho");
    triggerSlideIn(lead.id, fromIdx < toIdx ? "left" : "right");
    toast.success(`${lead.nome} marcado como Ganho!`);
    setTimeout(() => setCriarProjetoLead({ ...lead, stage: "ganho" }), 300);
  }, [syncStageToAppStore, triggerSlideIn]);

  /* ── Move lead to any stage (from drawer menu) ── */
  const handleMoveTo = useCallback((lead: FullLead, stage: LeadStage) => {
    const fromIdx = pipelineStages.indexOf(lead.stage);
    const toIdx = pipelineStages.indexOf(stage);
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage } : l)));
    setSelectedLead(null);
    syncStageToAppStore(lead.id, stage);
    triggerSlideIn(lead.id, fromIdx < toIdx ? "left" : "right");
    toast(`${lead.nome} movido para ${leadStageConfig[stage].label}`, { duration: 2000 });
    if (stage === "ganho") {
      setTimeout(() => setCriarProjetoLead({ ...lead, stage }), 300);
    }
  }, [syncStageToAppStore, triggerSlideIn]);

  /* ── P31: Deep link after creating project ── */
  const handleProjectCreated = useCallback(
    (lead: FullLead, modeloNome?: string) => {
      setCriarProjetoLead(null);

      // Use AppStore to convert the lead (creates project + parcelas + notification)
      const appProject = appStore.convertLeadToProject(lead.id, modeloNome || lead.tipo);

      // Resolve or generate project ID for the converted lead
      const existingProjId = getProjectForLead(lead.id);
      const projId = appProject?.id || existingProjId || `proj-new-${Date.now()}`;
      // Register the new mapping dynamically
      if (!existingProjId) {
        LEAD_PROJECT_MAP[lead.id] = projId;
      }
      // Update the lead's projetoId in local state
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, projetoId: projId } : l)));
      // Navigate to Projetos with drawer open on "cadastro"
      navigateFromCrmToProject(navigate, {
        projectId: existingProjId || "proj-001", // fallback to proj-001 for demo
        tab: "cadastro",
        projetoNome: lead.nome,
      });
    },
    [navigate, appStore]
  );

  /* ── P31: View linked project from drawer ── */
  const handleViewProject = useCallback(
    (lead: FullLead, tab?: "cadastro" | "financeiro") => {
      if (!lead.projetoId) return;
      setSelectedLead(null);
      const proj = projetos.find((p) => p.id === lead.projetoId);
      navigateFromCrmToProject(navigate, {
        projectId: lead.projetoId,
        tab: tab ?? "cadastro",
        projetoNome: proj?.nome || lead.nome,
        financeiro: proj?.financeiro,
      });
    },
    [navigate]
  );

  /* ── Loading simulation ── */
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  /* ── Context line ── */
  const contextLine = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${kpis.ativos} leads ativos`);
    parts.push(`pipeline ${formatCurrency(kpis.valorPipeline)}`);
    if (kpis.quentes > 0) parts.push(`${kpis.quentes} requer${kpis.quentes > 1 ? "em" : ""} ação`);
    return parts.join(" · ");
  }, [kpis]);

  /* ── Alerts ── */
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  function dismissAlert(id: string) {
    setDismissedAlerts((prev) => new Set(prev).add(id));
  }
  const hasAtrasadosAlert = filterCounts.atrasados > 0 && !dismissedAlerts.has("alert-atrasados");
  const hasSemProxAlert = filterCounts.sem_prox > 0 && !dismissedAlerts.has("alert-sem-prox");

  /* ── Quick actions ── */
  const quickActions = useMemo(() => [
    { label: "Novo lead", icon: <UserPlus className="w-4 h-4" />, onClick: () => toast("Novo lead", { description: "Funcionalidade em desenvolvimento" }) },
    { label: "Importar leads", icon: <FileText className="w-4 h-4" />, onClick: () => toast("Importar", { description: "Funcionalidade em desenvolvimento" }) },
  ], []);

  /* Filter chips config */
  const chipBgCls = isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]";
  const chipBorderCls = isDark ? "border-[#3C3C43]" : "border-[#E5E5EA]";
  const filterChips: { key: FilterKey; label: string; dot: string; chipBg: string; chipText: string; chipBorder: string }[] = [
    { key: "todos", label: "Todos", dot: "bg-[#AEAEB2]", chipBg: chipBgCls, chipText: isDark ? "text-[#AEAEB2]" : "text-[#636366]", chipBorder: chipBorderCls },
    { key: "hoje", label: "Hoje", dot: "bg-[#FF9500]", chipBg: chipBgCls, chipText: "text-[#FF9500]", chipBorder: chipBorderCls },
    { key: "atrasados", label: "Atrasados", dot: "bg-[#FF3B30]", chipBg: chipBgCls, chipText: "text-[#FF3B30]", chipBorder: chipBorderCls },
    { key: "sem_prox", label: "Sem próxima ação", dot: "bg-[#D1D1D6]", chipBg: chipBgCls, chipText: "text-[#AEAEB2]", chipBorder: chipBorderCls },
    { key: "alto_valor", label: "Alto valor", dot: "bg-[#7C3AED]", chipBg: chipBgCls, chipText: "text-[#7C3AED]", chipBorder: chipBorderCls },
    { key: "indicacao", label: "Indicação", dot: "bg-[#34C759]", chipBg: chipBgCls, chipText: "text-[#34C759]", chipBorder: chipBorderCls },
  ];

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ════════════════════════════════════════════════════
          WIDGET 1 — HEADER (via HeaderWidget KIT)
          Same pattern as Dashboard / Produção / Projetos
          ════════════════════════════════════════════════════ */}
      <HeaderWidget
        greeting="CRM — Pipeline"
        userName=""
        contextLine={contextLine}
        quickActions={quickActions}
        showSearch
        searchPlaceholder="Buscar leads, contatos..."
        searchValue={busca}
        onSearchChange={setBusca}
      >
        {/* ─── Alerts ─── */}
        {(hasAtrasadosAlert || hasSemProxAlert) && (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.isDark ? "#2C2C2E" : "#F2F2F7" }} />
            <div className="flex flex-col px-2 py-1">
              {hasAtrasadosAlert && (
                <InlineBanner
                  variant="danger"
                  title={`${filterCounts.atrasados} lead${filterCounts.atrasados > 1 ? "s" : ""} com ação atrasada`}
                  desc="Entre em contato o mais rápido possível para não perder a oportunidade."
                  ctaLabel="Ver atrasados"
                  cta={() => {
                    setActiveFilter("atrasados");
                    dismissAlert("alert-atrasados");
                  }}
                  dismissible
                  onDismiss={() => dismissAlert("alert-atrasados")}
                />
              )}
              {hasSemProxAlert && (
                <InlineBanner
                  variant="warning"
                  title={`${filterCounts.sem_prox} lead${filterCounts.sem_prox > 1 ? "s" : ""} sem próxima ação definida`}
                  desc="Agende follow-ups para manter o pipeline ativo."
                  ctaLabel="Ver sem ação"
                  cta={() => {
                    setActiveFilter("sem_prox");
                    dismissAlert("alert-sem-prox");
                  }}
                  dismissible
                  onDismiss={() => dismissAlert("alert-sem-prox")}
                />
              )}
            </div>
          </>
        )}

        {/* ─── KPI Metrics ─── */}
        <div className="mx-5 h-px" style={{ backgroundColor: dk.isDark ? "#2C2C2E" : "#F2F2F7" }} />
        {isLoading ? (
          <MetricsSkeleton />
        ) : (
          <DashboardKpiGrid
            flat
            projetos={{
              label: "Leads Ativos",
              value: String(kpis.ativos),
              sub: "no pipeline",
            }}
            aReceber={{
              label: "Valor Pipeline",
              value: formatCurrency(kpis.valorPipeline),
              sub: "oportunidades abertas",
            }}
            producao={{
              label: "Requerem Ação",
              value: String(kpis.quentes),
              sub: kpis.quentes > 0 ? "hoje ou atrasados" : "nenhum pendente",
            }}
            compromissos={{
              label: "Ganhos",
              value: formatCurrency(kpis.valorGanho),
              sub: `${kpis.ganhos} convertido${kpis.ganhos !== 1 ? "s" : ""}`,
            }}
          />
        )}
      </HeaderWidget>

      {/* ════════════════════════════════════════════════════
          WIDGET 2 — PIPELINE KANBAN (via WidgetCard KIT)
          ════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {isLoading || viewState === "loading" ? (
          <WidgetSkeleton key="crm-sk" rows={5} delay={0.06} />
        ) : viewState === "empty" ? (
          <WidgetCard key="crm-empty" title="Pipeline" delay={0.06}>
            <WidgetEmptyState
              icon={<UserPlus className="w-6 h-6" />}
              message="Nenhum lead no pipeline. Adicione leads manualmente ou conecte seus formulários."
              cta="Novo lead"
              onCta={() => toast("Novo lead", { description: "Funcionalidade em desenvolvimento" })}
            />
          </WidgetCard>
        ) : viewState === "error" ? (
          <WidgetCard key="crm-error" title="Pipeline" delay={0.06}>
            <WidgetErrorState
              message="Não foi possível carregar o pipeline. Verifique sua conexão."
              onRetry={() => setViewState("ready")}
            />
          </WidgetCard>
        ) : (
          <WidgetCard
            key="crm-pipeline"
            title="Pipeline"
            count={filtered.length}
            action="Novo lead"
            onAction={() => toast("Novo lead", { description: "Funcionalidade em desenvolvimento" })}
            delay={0.06}
            footer={
              <div className="flex items-center justify-between px-5 py-2.5">
                <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                  <span className="text-[#8E8E93] numeric" style={{ fontWeight: 500 }}>{filtered.length}</span> leads
                  {activeFilter !== "todos" && <span> ({filterChips.find((f) => f.key === activeFilter)?.label})</span>}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] numeric" style={{ fontWeight: 400, color: dk.textDisabled }}>
                    Pipeline: <span className="text-[#AEAEB2]" style={{ fontWeight: 500 }}>{formatCurrency(kpis.valorPipeline)}</span>
                  </span>
                  <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
                  <span className="text-[11px] text-[#34C759] numeric" style={{ fontWeight: 400 }}>
                    Ganhos: <span style={{ fontWeight: 500 }}>{formatCurrency(kpis.valorGanho)}</span>
                  </span>
                </div>
              </div>
            }
          >
            {/* ─── FilterChips toolbar ─── */}
            <div className="flex flex-wrap gap-1.5 px-5 py-3" style={{ borderBottom: `1px solid ${dk.hairline}` }}>
              {filterChips.map((fc) => (
                <FilterChip
                  key={fc.key}
                  label={fc.label}
                  count={filterCounts[fc.key]}
                  active={activeFilter === fc.key}
                  dot={fc.dot}
                  chipBg={fc.chipBg}
                  chipText={fc.chipText}
                  chipBorder={fc.chipBorder}
                  onClick={() => setActiveFilter(activeFilter === fc.key ? "todos" : fc.key)}
                />
              ))}
            </div>

            {/* ─── Kanban board ─── */}
            <div className="flex gap-3 overflow-x-auto px-5 py-4">
              {pipelineStages.map((stage) => {
                const stageLeads = grouped[stage];
                const isDragOver = dropTarget === stage && draggingId !== null;
                return (
                  <div
                    key={stage}
                    className={`flex flex-col min-w-[210px] w-[210px] shrink-0 rounded-2xl border transition-all duration-200 ${
                      isDragOver ? "ring-2 ring-[#007AFF] border-[#007AFF] scale-[1.02]" : ""
                    }`}
                    style={{ backgroundColor: dk.bg, borderColor: isDragOver ? "#007AFF" : dk.border, boxShadow: dk.isDark ? "0 1px 3px #000000" : "0 1px 3px #E5E5EA" }}
                    onDragOver={(e) => { e.preventDefault(); setDropTarget(stage); }}
                    onDragLeave={() => { if (dropTarget === stage) setDropTarget(null); }}
                    onDrop={(e) => { e.preventDefault(); handleDragEnd(); }}
                  >
                    {/* Column header — flush inside card */}
                    <PipelineStageHeader
                      stage={stage}
                      count={stageLeads.length}
                      active={isDragOver}
                      onMenuClick={() => toast.info(`Menu: ${leadStageConfig[stage].label}`)}
                      flat
                    />
                    <div className="mx-3 h-px" style={{ backgroundColor: dk.hairline }} />

                    {/* Lead cards — flat flush with hairlines */}
                    <div className="flex flex-col flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 420px)" }}>
                      {stageLeads.map((lead, idx) => {
                        const isSlidingOut = slideOutId === lead.id;
                        const isBeingSwiped = swipeState?.id === lead.id && swipeState.swiping;
                        const swipeDelta = isBeingSwiped ? swipeState!.currentX - swipeState!.startX : 0;
                        const swipeClamp = Math.max(-100, Math.min(100, swipeDelta));
                        const stageIdx = pipelineStages.indexOf(lead.stage);
                        const canSwipeRight = stageIdx < pipelineStages.length - 1;
                        const canSwipeLeft = stageIdx > 0;
                        const showSwipeHint = Math.abs(swipeClamp) > 60;
                        const swipeThresholdReached = Math.abs(swipeDelta) >= 80;
                        const swipeTargetStage = swipeDelta > 0 && canSwipeRight
                          ? pipelineStages[stageIdx + 1]
                          : swipeDelta < 0 && canSwipeLeft
                            ? pipelineStages[stageIdx - 1]
                            : null;

                        const slideInDir = slideInMap[lead.id];
                        return (
                          <div
                            key={lead.id}
                            draggable={!isMobile}
                            onDragStart={() => handleDragStart(lead.id)}
                            onDragEnd={handleDragEnd}
                            onTouchStart={(e) => isMobile && handleTouchStart(lead.id, e)}
                            onTouchMove={(e) => isMobile && handleTouchMove(e)}
                            onTouchEnd={() => isMobile && handleTouchEnd()}
                            className={`${draggingId === lead.id ? "opacity-40 scale-[0.96]" : ""} relative`}
                            style={{
                              cursor: isMobile ? undefined : (draggingId ? "grabbing" : "grab"),
                              transform: isSlidingOut
                                ? `translateX(${slideOutDir === "right" ? "120%" : "-120%"}) scale(0.92)`
                                : isBeingSwiped
                                  ? `translateX(${swipeClamp}px)${swipeThresholdReached ? " scale(0.97)" : ""}`
                                  : slideInDir
                                    ? `translateX(${slideInDir === "left" ? "-110%" : "110%"}) scale(0.95)`
                                    : undefined,
                              opacity: isSlidingOut ? 0 : slideInDir ? 0 : undefined,
                              transition: isSlidingOut
                                ? "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease"
                                : isBeingSwiped ? "none" : "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
                            }}
                          >
                            {idx > 0 && <div className="mx-3 h-px" style={{ backgroundColor: dk.hairline }} />}
                            {/* Swipe direction hint */}
                            {isBeingSwiped && showSwipeHint && swipeTargetStage && (
                              <div
                                className="absolute top-1/2 -translate-y-1/2 text-[9px] px-2 py-1 rounded-md pointer-events-none z-10"
                                style={{
                                  [swipeDelta > 0 ? "right" : "left"]: "calc(100% + 4px)",
                                  background: swipeThresholdReached ? "#34C759" : "#007AFF",
                                  color: "#FFFFFF",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                  transform: swipeThresholdReached ? "scale(1.1)" : "scale(1)",
                                  transition: "background 0.15s ease, transform 0.15s ease",
                                }}
                              >
                                {swipeThresholdReached ? "✓ " : ""}{leadStageConfig[swipeTargetStage].label}
                              </div>
                            )}
                            <LeadCard
                              lead={lead}
                              selected={selectedLead?.id === lead.id}
                              onClick={(id) => {
                                if (swipeState?.swiping) return;
                                const l = leads.find((x) => x.id === id);
                                if (l) setSelectedLead(l);
                              }}
                              compact
                              flat
                            />
                          </div>
                        );
                      })}
                      {stageLeads.length === 0 && (
                        <div className={`flex flex-col items-center justify-center py-8 mx-3 mb-3 rounded-xl border border-dashed transition-all duration-200 ${
                          isDragOver ? "scale-[1.02]" : ""
                        }`} style={{ borderColor: isDragOver ? "#007AFF" : dk.border, backgroundColor: isDragOver ? (dk.isDark ? "#1C1C1E" : "#F5F5F7") : dk.bgSub }}>
                          <span className={`text-[10px] transition-colors ${isDragOver ? "text-[#007AFF]" : ""}`} style={{ fontWeight: isDragOver ? 500 : 400, color: isDragOver ? "#007AFF" : dk.textDisabled }}>
                            {isDragOver ? "Soltar aqui" : "Sem leads"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </WidgetCard>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════
          WIDGET 3 — LEADS RECENTES (lista canónica)
          ════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <WidgetSkeleton key="recent-sk" rows={4} delay={0.12} />
        ) : (
          <RecentLeadsList
            leads={leads}
            onSelectLead={(l) => setSelectedLead(l)}
          />
        )}
      </AnimatePresence>

      {/* ── Lead Drawer overlay (portal to body to escape ContentSlot transform) ── */}
      {createPortal(
        <AnimatePresence>
          {selectedLead && (
            <LeadDrawerOverlay
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onMoveToGanho={handleMoveToGanho}
              onMoveTo={handleMoveTo}
              onViewProject={handleViewProject}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Criar Projeto modal (portal to body) ── */}
      {createPortal(
        <AnimatePresence>
          {criarProjetoLead && (
            <CriarProjetoModal
              lead={criarProjetoLead}
              onClose={() => setCriarProjetoLead(null)}
              onCreated={handleProjectCreated}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  WIDGET 3 — RecentLeadsList (Canonical list)       */
/*  Pattern: icon → content → meta/badge → chevron    */
/*  WidgetHairline separators, expand/collapse,        */
/*  hover bg-[#FAFAFA] / active:bg-[#F5F5F7], footer  */
/* ═══════════════════════════════════════════════════ */

const RECENT_INITIAL = 5;

function RecentLeadsList({ leads, onSelectLead }: {
  leads: FullLead[];
  onSelectLead: (lead: FullLead) => void;
}) {
  const dk = useDk();
  const [expanded, setExpanded] = useState(false);

  /* Sort by most recent activity */
  const sorted = useMemo(() => {
    const active = leads.filter((l) => l.stage !== "perdido");
    return [...active].sort((a, b) => {
      const aUrgency = a.proximaAcao === "atrasado" ? 0 : a.proximaAcao === "hoje" ? 1 : a.proximaAcao === "amanha" ? 2 : 3;
      const bUrgency = b.proximaAcao === "atrasado" ? 0 : b.proximaAcao === "hoje" ? 1 : b.proximaAcao === "amanha" ? 2 : 3;
      return aUrgency - bUrgency;
    });
  }, [leads]);

  const visible = expanded ? sorted : sorted.slice(0, RECENT_INITIAL);
  const hiddenCount = sorted.length - RECENT_INITIAL;

  return (
    <WidgetCard
      title="Leads Recentes"
      count={sorted.length}
      action="Ver todos"
      onAction={() => toast("CRM completo", { description: "Funcionalidade em desenvolvimento" })}
      delay={0.12}
      footer={
        <div className="flex items-center justify-between px-5 py-2.5">
          <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
            <span className="text-[#8E8E93] numeric" style={{ fontWeight: 500 }}>{sorted.length}</span> leads ativos
          </span>
          <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
            Ordenados por urgência
          </span>
        </div>
      }
    >
      <AnimatePresence initial={false}>
        {visible.map((lead, i) => (
          <motion.div key={lead.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={spring}>
            {i > 0 && <WidgetHairline />}
            <button
              onClick={() => onSelectLead(lead)}
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors cursor-pointer text-left group ${dk.isDark ? "hover:bg-[#1C1C1E] active:bg-[#2C2C2E]" : "hover:bg-[#FAFAFA] active:bg-[#F5F5F7]"}`}
            >
              {/* Icon */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: dk.bgMuted }}>
                <User className="w-3.5 h-3.5" style={{ color: dk.textDisabled }} />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-0 flex-1 min-w-0">
                <span className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.textSecondary }}>
                  {lead.nome}
                </span>
                <span className="text-[11px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>
                  {lead.proximaAcaoTexto}
                </span>
              </div>

              {/* Meta / badge */}
              <div className="flex items-center gap-2 shrink-0">
                <NextActionPill variant={lead.proximaAcao} label={lead.proximaAcaoLabel} />
                <span className="text-[11px] text-[#AEAEB2] numeric" style={{ fontWeight: 500 }}>
                  {lead.valor}
                </span>
              </div>

              {/* Chevron on hover */}
              <ChevronRight className="w-3.5 h-3.5 group-hover:text-[#AEAEB2] transition-colors shrink-0" style={{ color: dk.textDisabled }} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Expand / collapse toggle */}
      {hiddenCount > 0 && (
        <>
          <WidgetHairline />
          <button
            onClick={() => setExpanded(!expanded)}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] text-[#8E8E93] transition-all cursor-pointer ${dk.isDark ? "hover:text-[#AEAEB2] hover:bg-[#1C1C1E] active:bg-[#2C2C2E]" : "hover:text-[#636366] hover:bg-[#FAFAFA] active:bg-[#F5F5F7]"}`}
            style={{ fontWeight: 500 }}
          >
            {expanded ? "Mostrar menos" : `Mais ${hiddenCount} leads`}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </>
      )}
    </WidgetCard>
  );
}
