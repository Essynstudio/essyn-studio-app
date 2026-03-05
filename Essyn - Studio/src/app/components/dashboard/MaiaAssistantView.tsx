import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import {
  Sparkles, BarChart3, DollarSign, Calendar, Layers,
  ArrowRight, FileText, TrendingUp, Zap, ExternalLink,
  CheckCircle2, AlertTriangle, Clock, MapPin, Users,
  Phone, Mail, Camera, Send,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springFadeIn } from "../../lib/motion-tokens";
import { SERIF, SERIF_SWASH, GOLD } from "../ui/editorial";
import { toast } from "sonner";
import type { ProjetoTab } from "../../lib/navigation";
import { useDk, type DkColors } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  MAIA EDITORIAL DARK TOKENS                        */
/* ═══════════════════════════════════════════════════ */

interface MaiaDkColors extends DkColors {
  /* Editorial gold surfaces */
  goldBg: string;       /* accent bg (kpi, briefing header) */
  goldBorder: string;   /* accent border */
  goldAvatarBg: string; /* maia avatar/orb bg */
  goldAvatarBorder: string;
  goldTeamBg: string;   /* team member chip bg */
}

function useMaiaDk(): MaiaDkColors {
  const dk = useDk();
  return {
    ...dk,
    goldBg:           dk.isDark ? "#2C2820" : "#F4EEE4",
    goldBorder:       dk.isDark ? "#4A3D2A" : "#E8D9C5",
    goldAvatarBg:     dk.isDark ? "#3A3220" : "#EDE3D6",
    goldAvatarBorder: dk.isDark ? "#5A4D35" : "#E0CDB0",
    goldTeamBg:       dk.isDark ? "#3A3220" : "#EADEC8",
  };
}

const MaiaDkCtx = createContext<MaiaDkColors>(null as any);
const useMCtx = () => useContext(MaiaDkCtx);

/* ── Data sources ── */
import { projetos, type Projeto } from "../projetos/projetosData";
import { getAllTrabalhos, type TrabalhoProducao } from "../producao/productionStore";
import { useAppStore, type AppStats } from "../../lib/appStore";

/* ── Module context ── */
import {
  type MaiaModule,
  getMaiaModuleConfig,
  getMaiaSlashCommands,
} from "./maiaContextConfig";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

export interface MaiaAssistantViewProps {
  onNavigateToProject?: (projectId: string, tab: ProjetoTab) => void;
  onNavigateToModule?: (module: "producao" | "financeiro" | "agenda" | "galeria") => void;
  /** When true, adapts layout for side panel (no min-height, tighter spacing) */
  panelMode?: boolean;
  /** Current module context — drives specialized prompts & behavior */
  moduleContext?: MaiaModule;
}

interface ActionChip {
  label: string;
  icon?: "navigate" | "check" | "send" | "open";
  action: () => void;
}

interface MaiaMessage {
  id: string;
  role: "user" | "maia";
  content: string;
  dataBlocks?: DataBlock[];
  actions?: ActionChip[];
  timestamp: Date;
}

type DataBlock =
  | { type: "kpi-row"; data: KpiRowData }
  | { type: "table"; data: TableData }
  | { type: "list"; data: ListData }
  | { type: "briefing"; data: BriefingData }
  | { type: "forecast"; data: ForecastData }
  | { type: "insight-card"; data: InsightCardData }
  | { type: "cross-intel"; data: CrossIntelData };

interface KpiRowData {
  items: { label: string; value: string; sub?: string; accent?: boolean }[];
}
interface TableData {
  headers: string[];
  rows: string[][];
}
interface ListData {
  items: { label: string; detail?: string; status?: "ok" | "warning" | "danger" }[];
}
interface BriefingData {
  projectName: string;
  type: string;
  date: string;
  time: string;
  locations: { name: string; address: string; time?: string }[];
  team: { name: string; role: string; initials: string }[];
  contacts: { name: string; phone: string; relation: string }[];
  financial: { total: string; paid: number; pending: number; overdue: number };
  production: { done: number; total: number; currentStage: string };
  package: string;
  items: string[];
  notes: string[];
}
interface ForecastData {
  months: { label: string; confirmed: number; projected: number }[];
  totalConfirmed: number;
  totalProjected: number;
  trend: "up" | "down" | "stable";
}
interface InsightCardData {
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
}
interface CrossIntelData {
  connections: { from: string; to: string; insight: string; severity: "info" | "warning" | "critical" }[];
}

/* ═══════════════════════════════════════════════════ */
/*  PROACTIVE INSIGHTS — what Maia "noticed"          */
/* ═══════════════════════════════════════════════════ */

function computeProactiveInsights(): InsightCardData[] {
  const insights: InsightCardData[] = [];
  const ativos = projetos.filter((p) =>
    ["confirmado", "producao", "edicao", "atrasado"].includes(p.status)
  );
  const comVencidas = ativos.filter((p) => p.financeiro.vencidas > 0);
  const allTrabalhos = getAllTrabalhos();
  const atrasados = allTrabalhos.filter(
    (t) => t.status !== "finalizado" && (t.diasRestantes < 0 || t.etapas.some((e) => e.status === "atrasada"))
  );

  if (comVencidas.length > 0 && atrasados.length > 0) {
    const overlap = comVencidas.filter((p) =>
      atrasados.some((t) => t.projetoId === p.id)
    );
    if (overlap.length > 0) {
      insights.push({
        severity: "critical",
        title: `${overlap.length} projeto${overlap.length > 1 ? "s" : ""} com divida dupla`,
        detail: `${overlap.map((p) => p.nome.split(" ")[0]).join(" e ")} ${overlap.length > 1 ? "tem" : "tem"} parcelas vencidas E producao atrasada. Cobre antes de entregar.`,
      });
    }
  }

  const proxSemana = ativos.filter((p) => {
    const d = new Date(p.dataISO);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });
  if (proxSemana.length > 0) {
    insights.push({
      severity: "info",
      title: `${proxSemana.length} evento${proxSemana.length > 1 ? "s" : ""} nos proximos 7 dias`,
      detail: `${proxSemana.map((p) => `${p.nome} (${p.dataEvento})`).join(", ")}. Use /briefing para preparar.`,
    });
  }

  const ociosos = ativos.filter((p) =>
    p.status === "confirmado" && p.producao.etapasConcluidas === 0 && p.producao.etapasTotal === 0
  );
  if (ociosos.length > 0) {
    insights.push({
      severity: "warning",
      title: `${ociosos.length} projeto${ociosos.length > 1 ? "s" : ""} sem producao iniciada`,
      detail: `${ociosos.map((p) => p.nome.split("—")[0].trim()).join(", ")} — ${ociosos.length > 1 ? "estao" : "esta"} confirmado${ociosos.length > 1 ? "s" : ""} mas sem etapas criadas.`,
    });
  }

  return insights;
}

/* ═══════════════════════════════════════════════════ */
/*  SUGGESTED PROMPTS — organized by category         */
/* ═══════════════════════════════════════════════════ */

/* Default prompts (used when no moduleContext provided — backward compat) */
const defaultSuggestedPrompts = [
  { icon: DollarSign, label: "Quanto tenho a receber este mes?", category: "financeiro" as const },
  { icon: Layers, label: "Relatorio completo de producao", category: "producao" as const },
  { icon: Calendar, label: "Quais meus compromissos de hoje?", category: "agenda" as const },
  { icon: BarChart3, label: "Resumo geral do estudio", category: "geral" as const },
  { icon: FileText, label: "/briefing Casamento Oliveira", category: "comando" as const },
  { icon: TrendingUp, label: "/forecast", category: "comando" as const },
];

/* ═══════════════════════════════════════════════════ */
/*  SLASH COMMAND REGISTRY                            */
/* ═══════════════════════════════════════════════════ */

/* Default slash commands (used when no moduleContext) */
const defaultSlashCommands = [
  { cmd: "/briefing", desc: "Gera briefing pre-evento completo", usage: "/briefing [nome do projeto]" },
  { cmd: "/forecast", desc: "Previsao de faturamento 3 meses", usage: "/forecast" },
  { cmd: "/relatorio", desc: "Relatorio completo do estudio", usage: "/relatorio" },
  { cmd: "/cobrar", desc: "Lista todas as cobranças pendentes", usage: "/cobrar" },
  { cmd: "/equipe", desc: "Distribuicao de carga da equipe", usage: "/equipe" },
  { cmd: "/entregas", desc: "Proximas entregas e prazos", usage: "/entregas" },
  { cmd: "/pipeline", desc: "Resumo do pipeline de leads por estagio", usage: "/pipeline" },
  { cmd: "/agenda", desc: "Compromissos e sessoes da semana", usage: "/agenda" },
  { cmd: "/galeria", desc: "Status das galerias e entregas pendentes", usage: "/galeria" },
  { cmd: "/kpi", desc: "KPIs do mes atual com comparativo", usage: "/kpi" },
  { cmd: "/atrasados", desc: "Tudo que esta atrasado (financeiro + producao)", usage: "/atrasados" },
  { cmd: "/cliente", desc: "Historico completo de um cliente", usage: "/cliente [nome]" },
];

/* ═══════════════════════════════════════════════════ */
/*  FUZZY PROJECT MATCHER                             */
/* ═══════════════════════════════════════════════════ */

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "");
}

function findProject(query: string): Projeto | undefined {
  const q = normalize(query);
  // Exact id match
  const byId = projetos.find((p) => p.id === query);
  if (byId) return byId;
  // Name contains
  const byName = projetos.find((p) => normalize(p.nome).includes(q));
  if (byName) return byName;
  // Client contains
  const byClient = projetos.find((p) => normalize(p.cliente).includes(q));
  if (byClient) return byClient;
  // Partial word match
  const words = q.split(" ").filter(Boolean);
  return projetos.find((p) => {
    const haystack = normalize(`${p.nome} ${p.cliente} ${p.tipo}`);
    return words.every((w) => haystack.includes(w));
  });
}

/* ═══════════════════════════════════════════════════ */
/*  AI ENGINE — pattern matching on real data         */
/* ═══════════════════════════════════════════════════ */

function generateMaiaResponse(
  query: string,
  _history: MaiaMessage[],
  nav: MaiaAssistantViewProps,
  appStats?: AppStats,
): { content: string; dataBlocks: DataBlock[]; actions: ActionChip[] } {
  const q = normalize(query);
  const allProjetos = projetos;
  const ativos = allProjetos.filter((p) =>
    ["confirmado", "producao", "edicao", "atrasado"].includes(p.status)
  );
  const allTrabalhos = getAllTrabalhos();
  const activeTrabalhos = allTrabalhos.filter((t) => t.status !== "finalizado");

  /* ════════════════════════════════════════════════ */
  /*  SLASH COMMANDS                                  */
  /* ════════════════════════════════════════════════ */

  /* /briefing [project] */
  if (q.startsWith("/briefing") || (q.includes("briefing") && q.includes("/"))) {
    const projectQuery = query.replace(/\/briefing\s*/i, "").trim();
    const proj = projectQuery ? findProject(projectQuery) : ativos[0];
    if (!proj) {
      return { content: `Nao encontrei o projeto "${projectQuery}". Tente com o nome ou cliente.`, dataBlocks: [], actions: [] };
    }
    const trabalhos = allTrabalhos.filter((t) => t.projetoId === proj.id);
    const currentStage = trabalhos.length > 0
      ? trabalhos[0].etapas.find((e) => ["atual", "aguardando", "atrasada"].includes(e.status))?.nome || "Nenhuma"
      : proj.producao.etapasTotal > 0 ? "Em andamento" : "Nao iniciada";

    const notes: string[] = [];
    if (proj.financeiro.vencidas > 0) notes.push(`ATENCAO: ${proj.financeiro.vencidas} parcela(s) vencida(s) — cobre antes do evento`);
    if (trabalhos.some((t) => t.diasRestantes < 0)) notes.push("Producao atrasada — revisar cronograma com equipe");
    if (proj.contatos.length > 2) notes.push(`${proj.contatos.length} contatos cadastrados — confirme ponto focal`);
    const daysUntil = Math.ceil((new Date(proj.dataISO).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 3) notes.push(`EVENTO EM ${daysUntil} DIA${daysUntil !== 1 ? "S" : ""} — confirme checklist`);

    return {
      content: `Briefing completo gerado para **${proj.nome}**. Todas as informacoes do projeto reunidas para voce ir preparada.`,
      dataBlocks: [
        {
          type: "briefing",
          data: {
            projectName: proj.nome,
            type: proj.tipo,
            date: proj.dataEvento,
            time: proj.horario,
            locations: proj.locais,
            team: proj.equipe,
            contacts: proj.contatos.map((c) => ({ name: c.nome, phone: c.telefone, relation: c.relacao })),
            financial: {
              total: proj.valor,
              paid: proj.financeiro.pagas,
              pending: proj.financeiro.parcelas - proj.financeiro.pagas - proj.financeiro.vencidas,
              overdue: proj.financeiro.vencidas,
            },
            production: {
              done: proj.producao.etapasConcluidas,
              total: proj.producao.etapasTotal,
              currentStage,
            },
            package: proj.pacote,
            items: proj.itensPacote,
            notes,
          } as BriefingData,
        },
      ],
      actions: [
        { label: "Abrir projeto", icon: "open", action: () => nav.onNavigateToProject?.(proj.id, "cadastro") },
        { label: "Ver financeiro", icon: "navigate", action: () => nav.onNavigateToProject?.(proj.id, "financeiro") },
        ...(proj.financeiro.vencidas > 0
          ? [{ label: "Cobrar parcela", icon: "send" as const, action: () => toast.success("Lembrete enviado via WhatsApp", { description: `Mensagem enviada para ${proj.contatos[0]?.nome || proj.cliente}` }) }]
          : []),
      ],
    };
  }

  /* /forecast */
  if (q.startsWith("/forecast") || q.includes("forecast") || q.includes("previsao") || q.includes("projecao")) {
    const now = new Date();
    const months: ForecastData["months"] = [];
    for (let i = 0; i < 3; i++) {
      const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = m.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      const monthProjects = ativos.filter((p) => {
        const d = new Date(p.dataISO);
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
      });
      const confirmed = monthProjects.reduce((s, p) => s + (parseInt(p.valor.replace(/\D/g, ""), 10) || 0), 0);
      const projected = Math.round(confirmed * (1 + (i * 0.15)));
      months.push({ label, confirmed, projected });
    }
    const totalConfirmed = months.reduce((s, m) => s + m.confirmed, 0);
    const totalProjected = months.reduce((s, m) => s + m.projected, 0);

    return {
      content: `Previsao de faturamento para os proximos 3 meses. Total confirmado: **R$ ${(totalConfirmed / 1000).toFixed(1).replace(".", ",")}k** com projecao de ate **R$ ${(totalProjected / 1000).toFixed(1).replace(".", ",")}k** incluindo pipeline.`,
      dataBlocks: [
        {
          type: "forecast",
          data: { months, totalConfirmed, totalProjected, trend: totalProjected > totalConfirmed ? "up" : "stable" } as ForecastData,
        },
      ],
      actions: [
        { label: "Ver financeiro completo", icon: "navigate", action: () => nav.onNavigateToModule?.("financeiro") },
      ],
    };
  }

  /* /cobrar */
  if (q.startsWith("/cobrar") || (q.includes("cobr") && q.includes("/"))) {
    const comVencidas = ativos.filter((p) => p.financeiro.vencidas > 0);
    return {
      content: `**${comVencidas.length} projetos** com parcelas pendentes de cobranca. Acao rapida disponivel para cada um.`,
      dataBlocks: [{
        type: "list",
        data: {
          items: comVencidas.map((p) => ({
            label: `${p.nome} — ${p.cliente}`,
            detail: `${p.financeiro.vencidas} parcela(s) vencida(s) · ${p.valor}`,
            status: "danger" as const,
          })),
        } as ListData,
      }],
      actions: comVencidas.map((p) => ({
        label: `Cobrar ${p.cliente.split(" ")[0]}`,
        icon: "send" as const,
        action: () => toast.success(`Lembrete enviado para ${p.cliente}`, { description: `WhatsApp enviado — ${p.nome}` }),
      })),
    };
  }

  /* /equipe */
  if (q.startsWith("/equipe") || q.includes("equipe") || q.includes("carga") || q.includes("distribuic")) {
    const teamMap = new Map<string, { projects: string[]; workload: number }>();
    ativos.forEach((p) => {
      p.equipe.forEach((m) => {
        const entry = teamMap.get(m.nome) || { projects: [], workload: 0 };
        entry.projects.push(p.nome.split("—")[0].split("Casamento")[0].trim().slice(0, 20));
        entry.workload++;
        teamMap.set(m.nome, entry);
      });
    });

    return {
      content: `Distribuicao de carga da equipe em ${ativos.length} projetos ativos. ${teamMap.size} profissionais alocados.`,
      dataBlocks: [{
        type: "table",
        data: {
          headers: ["Profissional", "Projetos", "Carga"],
          rows: Array.from(teamMap.entries()).sort((a, b) => b[1].workload - a[1].workload).map(([name, data]) => [
            name,
            data.projects.slice(0, 3).join(", ") + (data.projects.length > 3 ? ` +${data.projects.length - 3}` : ""),
            `${data.workload} projeto${data.workload > 1 ? "s" : ""}`,
          ]),
        } as TableData,
      }],
      actions: [],
    };
  }

  /* /entregas */
  if (q.startsWith("/entregas") || (q.includes("entrega") && q.includes("prox"))) {
    const sorted = [...ativos].filter((p) => p.prazoEntrega).sort((a, b) => {
      const da = new Date(a.prazoEntrega.replace(/(\d{2})\s(\w+)\s(\d{4})/, "$2 $1, $3"));
      const db = new Date(b.prazoEntrega.replace(/(\d{2})\s(\w+)\s(\d{4})/, "$2 $1, $3"));
      return da.getTime() - db.getTime();
    });

    return {
      content: `**${sorted.length} entregas** programadas. Listadas por ordem de prazo.`,
      dataBlocks: [{
        type: "list",
        data: {
          items: sorted.map((p) => {
            const isLate = p.status === "atrasado";
            return {
              label: `${p.nome}`,
              detail: `Prazo: ${p.prazoEntrega} · ${p.producao.etapasConcluidas}/${p.producao.etapasTotal} etapas · ${p.cliente}`,
              status: isLate ? "danger" as const : "ok" as const,
            };
          }),
        } as ListData,
      }],
      actions: [
        { label: "Ver producao", icon: "navigate", action: () => nav.onNavigateToModule?.("producao") },
      ],
    };
  }

  /* /relatorio */
  if (q.startsWith("/relatorio") || (q.includes("relatorio") && q.includes("complet"))) {
    return generateFullReport(ativos, activeTrabalhos, nav);
  }

  /* ════════════════════════════════════════════════ */
  /*  NAVIGATION — "abra o projeto X"                */
  /* ════════════════════════════════════════════════ */

  if (q.includes("abr") && (q.includes("projet") || q.includes("financ") || q.includes("produc") || q.includes("galeri"))) {
    const words = query.split(" ");
    const nameCandidate = words.slice(words.findIndex((w) => normalize(w).match(/projet|financ|produc|casam|corp|aniver|batiz|ensai|form/)) + 1).join(" ");
    const proj = findProject(nameCandidate || query);
    if (proj) {
      const tab: ProjetoTab = q.includes("financ") ? "financeiro" : q.includes("produc") ? "producao" : q.includes("galeri") ? "galeria" : "cadastro";
      return {
        content: `Abrindo **${proj.nome}** na aba ${tab === "cadastro" ? "geral" : tab}...`,
        dataBlocks: [],
        actions: [
          { label: `Abrir ${proj.nome.split(" ")[0]}`, icon: "open", action: () => nav.onNavigateToProject?.(proj.id, tab) },
        ],
      };
    }
  }

  /* ════════════════════════════════════════════════ */
  /*  NEW SLASH COMMANDS (v2)                        */
  /* ════════════════════════════════════════════════ */

  /* /pipeline */
  if (q.startsWith("/pipeline") || (q.includes("pipeline") && q.includes("/"))) {
    const s = appStats;
    const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
    const totalLeads = s?.totalLeads ?? 12;
    const pipelineValor = s?.pipelineValor ?? 7980000;
    return {
      content: `Pipeline CRM com **${totalLeads} leads ativos**, valor total do pipeline: **${fmtBRL(pipelineValor)}**.\n\nDistribuicao por estagio:`,
      dataBlocks: [{
        type: "table",
        data: {
          headers: ["Estagio", "Leads", "Valor Total"],
          rows: [
            ["Novo", "3", "R$ 14.600"],
            ["Contato", "2", "R$ 11.700"],
            ["Reuniao", "1", "R$ 9.800"],
            ["Proposta", "2", "R$ 6.000"],
            ["Negociacao", "2", "R$ 20.300"],
            ["Ganho", "1", "R$ 15.000"],
            ["Perdido", "1", "R$ 2.200"],
          ],
        },
      }],
      actions: [
        { label: "Abrir CRM", icon: "open", action: () => nav.onNavigateToModule?.("financeiro" as any) },
      ],
    };
  }

  /* /kpi */
  if (q.startsWith("/kpi") || (q.includes("kpi") && q.includes("/"))) {
    const s = appStats;
    const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
    return {
      content: `KPIs do mes de **Marco 2026**:`,
      dataBlocks: [{
        type: "table",
        data: {
          headers: ["Metrica", "Atual", "Meta", "Status"],
          rows: [
            ["Leads no pipeline", String(s?.totalLeads ?? 7), "10", s && s.totalLeads >= 10 ? "Atingida" : `${Math.round(((s?.totalLeads ?? 7) / 10) * 100)}%`],
            ["Taxa conversao", `${s?.taxaConversao ?? 14}%`, "20%", (s?.taxaConversao ?? 14) >= 20 ? "Atingida" : "Abaixo"],
            ["A receber", fmtBRL(s?.receberPendente ?? 620000), "R$ 25.000", s && s.receberAtrasado > 0 ? `${fmtBRL(s.receberAtrasado)} atrasado` : "Em dia"],
            ["Projetos ativos", String(s?.projetosAtivos ?? 3), "—", "Estavel"],
            ["Producao em andamento", String(s?.producaoEmAndamento ?? 2), "—", "Normal"],
            ["Entregas pendentes", String(s?.entregasPendentes ?? 0), "0", (s?.entregasPendentes ?? 0) === 0 ? "No prazo" : "Atenção"],
          ],
        },
      }],
      actions: [
        { label: "Ver Dashboard", icon: "open", action: () => nav.onNavigateToModule?.("financeiro" as any) },
      ],
    };
  }

  /* /atrasados */
  if (q.startsWith("/atrasados") || (q.includes("atrasados") && q.includes("/"))) {
    const s = appStats;
    const fmtBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
    const atrasadoVal = s?.receberAtrasado ?? 425000;
    const leadsAtrasados = s?.leadsHoje ?? 2;
    return {
      content: `Itens atrasados encontrados:\n\n**Financeiro:** ${atrasadoVal > 0 ? `${fmtBRL(atrasadoVal)} em parcelas atrasadas` : "Nenhuma parcela atrasada"}\n**Producao:** ${(s?.entregasPendentes ?? 0) > 0 ? `${s!.entregasPendentes} entregas pendentes` : "Nenhum trabalho atrasado"}\n**CRM:** ${leadsAtrasados} leads requerem acao`,
      dataBlocks: [{
        type: "table",
        data: {
          headers: ["Item", "Tipo", "Atraso", "Valor"],
          rows: [
            ["Sinal — Corp TechBrasil", "Financeiro", "10 dias", "R$ 4.250"],
            ["Amanda Torres — Portfolio", "CRM", "3 dias", "—"],
            ["Juliana Prado — Resposta", "CRM", "2 dias", "—"],
          ],
        },
      }],
      actions: [
        { label: "Ver Financeiro", icon: "open", action: () => nav.onNavigateToModule?.("financeiro" as any) },
      ],
    };
  }

  /* /agenda */
  if (q.startsWith("/agenda") && q.includes("/")) {
    return generateAgendaReport(nav);
  }

  /* /galeria */
  if (q.startsWith("/galeria") && q.includes("/")) {
    return {
      content: `Status das galerias:\n\n- **Casamento Ana & Diego** — Em edicao (240 fotos selecionadas)\n- **Ensaio Gestante Luisa** — Selecao em andamento (180 fotos)\n- **Corp TechBrasil** — Aguardando captacao`,
      dataBlocks: [],
      actions: [
        { label: "Ver Galeria", icon: "open", action: () => nav.onNavigateToModule?.("galeria" as any) },
      ],
    };
  }

  /* /cliente [nome] */
  if (q.startsWith("/cliente")) {
    const clienteQuery = query.replace(/\/cliente\s*/i, "").trim();
    if (clienteQuery) {
      const proj = findProject(clienteQuery);
      if (proj) {
        return generateProjectDetail(proj, allTrabalhos, nav);
      }
    }
    return {
      content: `Para buscar o historico de um cliente, use: \`/cliente [nome]\`\n\nExemplo: \`/cliente Ana Clara\``,
      dataBlocks: [],
    };
  }

  /* ════════════════════════════════════════════════ */
  /*  CLIENT/PROJECT-SPECIFIC QUERIES                */
  /* ════════════════════════════════════════════════ */

  const mentionedProject = projetos.find((p) => {
    const nameWords = normalize(p.nome).split(" ");
    const clientWords = normalize(p.cliente).split(" ");
    return nameWords.some((w) => w.length > 3 && q.includes(w)) ||
      clientWords.some((w) => w.length > 3 && q.includes(w));
  });

  if (mentionedProject) {
    return generateProjectDetail(mentionedProject, allTrabalhos, nav);
  }

  /* ════════════════════════════════════════════════ */
  /*  CATEGORY QUERIES                                */
  /* ════════════════════════════════════════════════ */

  /* Financial */
  if (q.includes("receber") || q.includes("financ") || q.includes("valor") || q.includes("faturamento") || q.includes("dinheiro") || q.includes("pagamento")) {
    return generateFinancialReport(ativos, nav);
  }

  /* Overdue */
  if (q.includes("vencid") || q.includes("atras") || q.includes("atraso") || q.includes("pend")) {
    return generateOverdueReport(ativos, activeTrabalhos, nav);
  }

  /* Production */
  if (q.includes("produc") || q.includes("edicao") || q.includes("fila")) {
    return generateProductionReport(activeTrabalhos, nav);
  }

  /* Agenda */
  if (q.includes("agenda") || q.includes("compromis") || q.includes("hoje") || q.includes("evento")) {
    return generateAgendaReport(nav);
  }

  /* General */
  if (q.includes("resum") || q.includes("geral") || q.includes("estudio") || q.includes("tudo") || q.includes("overview")) {
    return generateFullReport(ativos, activeTrabalhos, nav);
  }

  /* Slash help */
  if (q.startsWith("/") || q.includes("comando") || q.includes("ajuda") || q.includes("help")) {
    /* Use all registered commands (global + default) for help response */
    const allCmds = [...defaultSlashCommands];
    const seen = new Set(allCmds.map((c) => c.cmd));
    defaultSlashCommands.forEach((c) => { if (!seen.has(c.cmd)) { allCmds.push(c); seen.add(c.cmd); } });
    return {
      content: `Aqui estao os comandos disponiveis. Voce tambem pode simplesmente perguntar em linguagem natural — eu entendo.`,
      dataBlocks: [{
        type: "table",
        data: {
          headers: ["Comando", "Descricao"],
          rows: allCmds.map((c) => [c.usage, c.desc]),
        } as TableData,
      }],
      actions: [],
    };
  }

  /* Fallback */
  return {
    content: `Entendi. Posso ajudar com **financeiro**, **producao**, **agenda**, **projetos** ou use comandos como **/briefing**, **/forecast**, **/cobrar**. Tambem posso abrir qualquer projeto — basta dizer o nome.`,
    dataBlocks: [],
    actions: [],
  };
}

/* ── Sub-generators ── */

function generateFinancialReport(
  ativos: Projeto[],
  nav: MaiaAssistantViewProps,
): { content: string; dataBlocks: DataBlock[]; actions: ActionChip[] } {
  const totalReceber = ativos.reduce((sum, p) => {
    const val = parseInt(p.valor.replace(/\D/g, ""), 10) || 0;
    const frac = (p.financeiro.parcelas - p.financeiro.pagas) / Math.max(p.financeiro.parcelas, 1);
    return sum + Math.round(val * frac);
  }, 0);
  const totalVencidas = ativos.reduce((s, p) => s + p.financeiro.vencidas, 0);
  const vencidasValor = totalVencidas * 3200;
  const totalPago = ativos.reduce((sum, p) => {
    const val = parseInt(p.valor.replace(/\D/g, ""), 10) || 0;
    const frac = p.financeiro.pagas / Math.max(p.financeiro.parcelas, 1);
    return sum + Math.round(val * frac);
  }, 0);

  return {
    content: `Este mes voce tem **R$ ${fmt(totalReceber)}** a receber em ${ativos.length} projetos. Ja recebeu **R$ ${fmt(totalPago)}**. ${totalVencidas > 0 ? `**${totalVencidas} parcelas vencidas** (R$ ${fmt(vencidasValor)}) precisam de cobranca imediata.` : "Sem parcelas vencidas — tudo em dia."}`,
    dataBlocks: [
      {
        type: "kpi-row",
        data: {
          items: [
            { label: "A receber", value: `R$ ${fmt(totalReceber)}`, accent: true },
            { label: "Ja recebido", value: `R$ ${fmt(totalPago)}` },
            { label: "Vencidas", value: String(totalVencidas), sub: totalVencidas > 0 ? `R$ ${fmt(vencidasValor)}` : "nenhuma" },
            { label: "Projetos", value: String(ativos.length) },
          ],
        } as KpiRowData,
      },
      {
        type: "table",
        data: {
          headers: ["Projeto", "Valor total", "Pagas", "Status"],
          rows: ativos.map((p) => [
            p.nome,
            p.valor,
            `${p.financeiro.pagas}/${p.financeiro.parcelas}`,
            p.financeiro.vencidas > 0 ? `${p.financeiro.vencidas} vencida(s)` : "Em dia",
          ]),
        } as TableData,
      },
    ],
    actions: [
      { label: "Ver financeiro", icon: "navigate", action: () => nav.onNavigateToModule?.("financeiro") },
      ...(totalVencidas > 0 ? [{ label: "Cobrar vencidas", icon: "send" as const, action: () => toast.success("Lembretes enviados", { description: `${totalVencidas} mensagens enviadas via WhatsApp` }) }] : []),
    ],
  };
}

function generateOverdueReport(
  ativos: Projeto[],
  activeTrabalhos: TrabalhoProducao[],
  nav: MaiaAssistantViewProps,
): { content: string; dataBlocks: DataBlock[]; actions: ActionChip[] } {
  const comVencidas = ativos.filter((p) => p.financeiro.vencidas > 0);
  const atrasadosProducao = activeTrabalhos.filter(
    (t) => t.diasRestantes < 0 || t.etapas.some((e) => e.status === "atrasada")
  );
  const overlap = comVencidas.filter((p) => atrasadosProducao.some((t) => t.projetoId === p.id));

  const blocks: DataBlock[] = [{
    type: "list",
    data: {
      items: [
        ...comVencidas.map((p) => ({
          label: `${p.nome} — ${p.financeiro.vencidas} parcela(s) vencida(s)`,
          detail: `${p.cliente} · ${p.valor}`,
          status: "danger" as const,
        })),
        ...atrasadosProducao.map((t) => ({
          label: `${t.titulo} — ${Math.abs(t.diasRestantes)}d atraso`,
          detail: `${t.projeto} · ${t.responsavel.nome}`,
          status: "warning" as const,
        })),
      ],
    } as ListData,
  }];

  if (overlap.length > 0) {
    blocks.push({
      type: "cross-intel",
      data: {
        connections: overlap.map((p) => ({
          from: `Financeiro: ${p.financeiro.vencidas} parcela(s) vencida(s)`,
          to: `Producao: entrega atrasada`,
          insight: `${p.nome} — cobre ANTES de entregar para proteger seu fluxo de caixa`,
          severity: "critical" as const,
        })),
      } as CrossIntelData,
    });
  }

  return {
    content: `**${comVencidas.length}** projetos com parcelas vencidas e **${atrasadosProducao.length}** trabalhos atrasados.${overlap.length > 0 ? ` Detectei **${overlap.length} caso(s) critico(s)** onde financeiro e producao estao comprometidos simultaneamente.` : ""}`,
    dataBlocks: blocks,
    actions: [
      { label: "Ver financeiro", icon: "navigate", action: () => nav.onNavigateToModule?.("financeiro") },
      { label: "Ver producao", icon: "navigate", action: () => nav.onNavigateToModule?.("producao") },
    ],
  };
}

function generateProductionReport(
  activeTrabalhos: TrabalhoProducao[],
  nav: MaiaAssistantViewProps,
): { content: string; dataBlocks: DataBlock[]; actions: ActionChip[] } {
  const atrasados = activeTrabalhos.filter(
    (t) => t.diasRestantes < 0 || t.etapas.some((e) => e.status === "atrasada")
  );
  const aguardando = activeTrabalhos.filter((t) => t.aguardandoCliente);

  return {
    content: `Fila de producao: **${activeTrabalhos.length} trabalhos ativos**, ${atrasados.length} atrasados, ${aguardando.length} aguardando cliente.`,
    dataBlocks: [
      {
        type: "kpi-row",
        data: {
          items: [
            { label: "Ativos", value: String(activeTrabalhos.length), accent: true },
            { label: "Atrasados", value: String(atrasados.length) },
            { label: "Aguardando", value: String(aguardando.length) },
          ],
        } as KpiRowData,
      },
      {
        type: "table",
        data: {
          headers: ["Trabalho", "Projeto", "Prazo", "Responsavel"],
          rows: activeTrabalhos.slice(0, 10).map((t) => [
            t.titulo,
            t.projeto,
            t.diasRestantes < 0 ? `${Math.abs(t.diasRestantes)}d atrasado` : `${t.diasRestantes}d`,
            t.responsavel.nome,
          ]),
        } as TableData,
      },
    ],
    actions: [
      { label: "Ver producao completa", icon: "navigate", action: () => nav.onNavigateToModule?.("producao") },
    ],
  };
}

function generateAgendaReport(
  nav: MaiaAssistantViewProps,
): { content: string; dataBlocks: DataBlock[]; actions: ActionChip[] } {
  return {
    content: `Hoje voce tem **6 compromissos**: 2 reunioes, 2 eventos, 1 entrega e 1 lembrete. Proximo: **Entrega album — Batizado Gabriel** (10:00).`,
    dataBlocks: [{
      type: "list",
      data: {
        items: [
          { label: "08:30 — Alinhamento pre-evento Oliveira", detail: "Google Meet · Concluido", status: "ok" as const },
          { label: "10:00 — Entrega album Batizado Gabriel", detail: "Em andamento", status: "warning" as const },
          { label: "14:00 — Sessao pre-wedding Oliveira", detail: "Parque das Mangabeiras", status: "ok" as const },
          { label: "17:00 — Lembrete: enviar previa Formatura", detail: "Coord. Direito UFMG", status: "warning" as const },
          { label: "18:30 — Reuniao financeiro TechCo", detail: "Escritorio", status: "ok" as const },
          { label: "19:30 — Evento corporativo TechCo Annual", detail: "Centro de Conv. BH", status: "ok" as const },
        ],
      } as ListData,
    }],
    actions: [
      { label: "Ver agenda completa", icon: "navigate", action: () => nav.onNavigateToModule?.("agenda") },
    ],
  };
}

function generateProjectDetail(
  proj: Projeto,
  allTrabalhos: TrabalhoProducao[],
  nav: MaiaAssistantViewProps,
): { content: string; dataBlocks: DataBlock[]; actions: ActionChip[] } {
  const trabalhos = allTrabalhos.filter((t) => t.projetoId === proj.id);
  const hasOverdue = proj.financeiro.vencidas > 0;
  const isLate = proj.status === "atrasado" || trabalhos.some((t) => t.diasRestantes < 0);

  const blocks: DataBlock[] = [
    {
      type: "kpi-row",
      data: {
        items: [
          { label: "Valor", value: proj.valor, accent: true },
          { label: "Parcelas", value: `${proj.financeiro.pagas}/${proj.financeiro.parcelas}`, sub: hasOverdue ? `${proj.financeiro.vencidas} vencida(s)` : "em dia" },
          { label: "Producao", value: `${proj.producao.etapasConcluidas}/${proj.producao.etapasTotal}` },
          { label: "Prazo", value: proj.prazoEntrega },
        ],
      } as KpiRowData,
    },
  ];

  if (hasOverdue && isLate) {
    blocks.push({
      type: "cross-intel",
      data: {
        connections: [{
          from: `${proj.financeiro.vencidas} parcela(s) vencida(s)`,
          to: "Producao atrasada",
          insight: `Cobre a parcela antes de entregar — proteja seu fluxo de caixa`,
          severity: "critical" as const,
        }],
      } as CrossIntelData,
    });
  }

  return {
    content: `**${proj.nome}** (${proj.tipo}) — ${proj.cliente}. Data do evento: ${proj.dataEvento}. Status: ${proj.status}. Equipe: ${proj.equipe.map((e) => e.nome).join(", ")}.`,
    dataBlocks: blocks,
    actions: [
      { label: "Abrir projeto", icon: "open", action: () => nav.onNavigateToProject?.(proj.id, "cadastro") },
      { label: "Financeiro", icon: "navigate", action: () => nav.onNavigateToProject?.(proj.id, "financeiro") },
      { label: "Producao", icon: "navigate", action: () => nav.onNavigateToProject?.(proj.id, "producao") },
      ...(hasOverdue ? [{ label: "Cobrar", icon: "send" as const, action: () => toast.success(`Lembrete enviado para ${proj.cliente}`) }] : []),
    ],
  };
}

function generateFullReport(
  ativos: Projeto[],
  activeTrabalhos: TrabalhoProducao[],
  nav: MaiaAssistantViewProps,
): { content: string; dataBlocks: DataBlock[]; actions: ActionChip[] } {
  const totalReceber = ativos.reduce((sum, p) => {
    const val = parseInt(p.valor.replace(/\D/g, ""), 10) || 0;
    const frac = (p.financeiro.parcelas - p.financeiro.pagas) / Math.max(p.financeiro.parcelas, 1);
    return sum + Math.round(val * frac);
  }, 0);
  const totalVencidas = ativos.reduce((s, p) => s + p.financeiro.vencidas, 0);
  const atrasados = activeTrabalhos.filter(
    (t) => t.diasRestantes < 0 || t.etapas.some((e) => e.status === "atrasada")
  );

  return {
    content: `Panorama completo do estudio: **${ativos.length} projetos ativos**, **${activeTrabalhos.length} trabalhos** em producao, **R$ ${fmt(totalReceber)}** a receber. ${totalVencidas > 0 ? `${totalVencidas} parcelas vencidas.` : ""} ${atrasados.length > 0 ? `${atrasados.length} trabalho(s) atrasado(s).` : "Producao em dia."}`,
    dataBlocks: [
      {
        type: "kpi-row",
        data: {
          items: [
            { label: "Projetos ativos", value: String(ativos.length), accent: true },
            { label: "A receber", value: `R$ ${fmt(totalReceber)}` },
            { label: "Producao", value: `${activeTrabalhos.length} trabalhos` },
            { label: "Hoje", value: "6 compromissos" },
          ],
        } as KpiRowData,
      },
      {
        type: "table",
        data: {
          headers: ["Projeto", "Status", "Financeiro", "Producao", "Prazo"],
          rows: ativos.map((p) => [
            p.nome,
            p.status,
            `${p.financeiro.pagas}/${p.financeiro.parcelas} pagas${p.financeiro.vencidas > 0 ? ` (${p.financeiro.vencidas} venc.)` : ""}`,
            `${p.producao.etapasConcluidas}/${p.producao.etapasTotal}`,
            p.prazoEntrega,
          ]),
        } as TableData,
      },
    ],
    actions: [
      { label: "Financeiro", icon: "navigate", action: () => nav.onNavigateToModule?.("financeiro") },
      { label: "Producao", icon: "navigate", action: () => nav.onNavigateToModule?.("producao") },
      { label: "Agenda", icon: "navigate", action: () => nav.onNavigateToModule?.("agenda") },
    ],
  };
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")}k`;
  return String(n);
}

/* ═══════════════════════════════════════════════════ */
/*  DATA BLOCK RENDERERS                              */
/* ═══════════════════════════════════════════════════ */

function RenderKpiRow({ data }: { data: KpiRowData }) {
  const m = useMCtx();
  return (
    <div className="flex items-stretch gap-2.5 mt-3">
      {data.items.map((item, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col gap-1 px-3.5 py-2.5 rounded-xl"
          style={{
            background: item.accent ? m.goldBg : m.bgMuted,
          }}
        >
          <span className="text-[8px] uppercase tracking-[0.08em]" style={{ fontWeight: 500, color: m.textSubtle }}>
            {item.label}
          </span>
          <span
            className="text-[16px] tracking-[-0.02em] numeric"
            style={{
              fontWeight: 600,
              color: item.accent ? GOLD : m.textTertiary,
            }}
          >
            {item.value}
          </span>
          {item.sub && (
            <span className="text-[9px]" style={{ fontWeight: 400, color: m.textSubtle }}>
              {item.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function RenderTable({ data }: { data: TableData }) {
  const m = useMCtx();
  return (
    <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: m.hairline }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: m.bgMuted }}>
              {data.headers.map((h, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2 text-[8px] uppercase tracking-[0.06em] whitespace-nowrap"
                  style={{ fontWeight: 600, color: m.textSubtle }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri} className="border-t" style={{ borderColor: m.hairline }}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-2 text-[11px] whitespace-nowrap"
                    style={{ fontWeight: ci === 0 ? 500 : 400, color: ci === 0 ? m.textTertiary : m.textSubtle }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RenderList({ data }: { data: ListData }) {
  const m = useMCtx();
  const dotColor = {
    ok: "#34C759",
    warning: "#FF9500",
    danger: "#FF3B30",
  };
  return (
    <div className="mt-3 flex flex-col rounded-xl overflow-hidden border" style={{ borderColor: m.hairline }}>
      {data.items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0"
          style={{ borderColor: m.hairline }}
        >
          <div
            className="w-[5px] h-[5px] rounded-full shrink-0"
            style={{ background: item.status ? dotColor[item.status] : m.textDisabled }}
          />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] block truncate" style={{ fontWeight: 500, color: m.textTertiary }}>
              {item.label}
            </span>
            {item.detail && (
              <span className="text-[10px] block truncate" style={{ fontWeight: 400, color: m.textSubtle }}>
                {item.detail}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Briefing Renderer — the showstopper ── */

function RenderBriefing({ data }: { data: BriefingData }) {
  const mc = useMCtx();
  return (
    <div className="mt-3 flex flex-col rounded-2xl overflow-hidden border" style={{ borderColor: mc.hairline }}>
      {/* Header with gold accent */}
      <div
        className="px-5 py-4 flex flex-col gap-1"
        style={{
          background: mc.goldBg,
          borderBottom: `1px solid ${mc.goldBorder}`,
        }}
      >
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5" style={{ color: "#CFB48A" }} />
          <span className="text-[9px] uppercase tracking-[0.10em]" style={{ fontWeight: 600, color: "#CFB48A" }}>
            Briefing Pre-Evento
          </span>
        </div>
        <h3
          className="text-[18px] tracking-[-0.02em]"
          style={{ fontWeight: 500, fontFamily: SERIF, color: mc.textTertiary }}
        >
          {data.projectName}
        </h3>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px]" style={{ fontWeight: 400, color: mc.textMuted }}>{data.type}</span>
          <span className="w-px h-2.5" style={{ background: mc.border }} />
          <span className="text-[11px]" style={{ fontWeight: 400, color: mc.textMuted }}>{data.date}</span>
          <span className="w-px h-2.5" style={{ background: mc.border }} />
          <span className="text-[11px] numeric" style={{ fontWeight: 400, color: mc.textMuted }}>{data.time}</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col" style={{ background: mc.bg }}>
        {/* Locations */}
        <div className="px-5 py-3.5 flex flex-col gap-2 border-b" style={{ borderColor: mc.hairline }}>
          <BriefingSectionLabel icon={<MapPin className="w-3 h-3" />} label="Locais" />
          {data.locations.map((loc, i) => (
            <div key={i} className="flex items-start gap-2 pl-5">
              <span className="text-[11px]" style={{ fontWeight: 500, color: mc.textTertiary }}>{loc.name}</span>
              <span className="text-[10px]" style={{ fontWeight: 400, color: mc.textSubtle }}>{loc.address}</span>
              {loc.horario && <span className="text-[10px] numeric" style={{ fontWeight: 400, color: mc.textSubtle }}>{loc.horario}</span>}
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="px-5 py-3.5 flex flex-col gap-2 border-b" style={{ borderColor: mc.hairline }}>
          <BriefingSectionLabel icon={<Users className="w-3 h-3" />} label={`Equipe (${data.team.length})`} />
          <div className="flex flex-wrap gap-2 pl-5">
            {data.team.map((tm, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: mc.bgMuted }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px]"
                  style={{ background: mc.goldTeamBg, fontWeight: 600, color: mc.textMuted }}
                >
                  {tm.initials}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px]" style={{ fontWeight: 500, color: mc.textTertiary }}>{tm.name}</span>
                  <span className="text-[9px]" style={{ fontWeight: 400, color: mc.textSubtle }}>{tm.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contacts */}
        <div className="px-5 py-3.5 flex flex-col gap-2 border-b" style={{ borderColor: mc.hairline }}>
          <BriefingSectionLabel icon={<Phone className="w-3 h-3" />} label={`Contatos (${data.contacts.length})`} />
          {data.contacts.map((c, i) => (
            <div key={i} className="flex items-center gap-3 pl-5">
              <span className="text-[11px]" style={{ fontWeight: 500, color: mc.textTertiary }}>{c.name}</span>
              <span className="text-[10px]" style={{ fontWeight: 400, color: mc.textSubtle }}>{c.relation}</span>
              <span className="text-[10px] numeric" style={{ fontWeight: 400, color: mc.textMuted }}>{c.phone}</span>
            </div>
          ))}
        </div>

        {/* Financial + Production KPIs */}
        <div className="px-5 py-3.5 flex flex-col gap-2 border-b" style={{ borderColor: mc.hairline }}>
          <BriefingSectionLabel icon={<DollarSign className="w-3 h-3" />} label="Status" />
          <div className="flex items-stretch gap-2 pl-5">
            <MiniKpi label="Valor" value={data.financial.total} accent />
            <MiniKpi label="Pagas" value={`${data.financial.paid}/${data.financial.paid + data.financial.pending + data.financial.overdue}`} />
            {data.financial.overdue > 0 && <MiniKpi label="Vencidas" value={String(data.financial.overdue)} danger />}
            <MiniKpi label="Producao" value={`${data.production.done}/${data.production.total}`} />
          </div>
        </div>

        {/* Package items */}
        <div className="px-5 py-3.5 flex flex-col gap-2 border-b" style={{ borderColor: mc.hairline }}>
          <BriefingSectionLabel icon={<Layers className="w-3 h-3" />} label={`Pacote: ${data.package}`} />
          <div className="flex flex-col gap-1 pl-5">
            {data.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "#34C759" }} />
                <span className="text-[10px]" style={{ fontWeight: 400, color: mc.textMuted }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes / alerts */}
        {data.notes.length > 0 && (
          <div className="px-5 py-3.5 flex flex-col gap-2" style={{ background: mc.dangerBg }}>
            <BriefingSectionLabel icon={<AlertTriangle className="w-3 h-3" />} label="Alertas" danger />
            {data.notes.map((note, i) => (
              <div key={i} className="flex items-start gap-2 pl-5">
                <Zap className="w-3 h-3 shrink-0 mt-0.5" style={{ color: "#FF3B30" }} />
                <span className="text-[10px]" style={{ fontWeight: 450, color: mc.textTertiary }}>{note}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BriefingSectionLabel({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  const m = useMCtx();
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: danger ? "#FF3B30" : "#CFB48A" }}>{icon}</span>
      <span
        className="text-[9px] uppercase tracking-[0.08em]"
        style={{ fontWeight: 600, color: danger ? "#FF3B30" : m.textMuted }}
      >
        {label}
      </span>
    </div>
  );
}

function MiniKpi({ label, value, accent, danger }: { label: string; value: string; accent?: boolean; danger?: boolean }) {
  const m = useMCtx();
  return (
    <div
      className="flex-1 flex flex-col gap-0.5 px-3 py-2 rounded-lg"
      style={{
        background: danger ? m.dangerBg : accent ? m.goldBg : m.bgMuted,
      }}
    >
      <span className="text-[8px] uppercase tracking-[0.06em]" style={{ fontWeight: 500, color: m.textSubtle }}>
        {label}
      </span>
      <span
        className="text-[13px] numeric"
        style={{
          fontWeight: 600,
          color: danger ? "#FF3B30" : accent ? GOLD : m.textTertiary,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Forecast Renderer ── */

function RenderForecast({ data }: { data: ForecastData }) {
  const mc = useMCtx();
  const maxVal = Math.max(...data.months.map((m) => Math.max(m.confirmed, m.projected)), 1);
  return (
    <div className="mt-3 rounded-xl overflow-hidden border p-4" style={{ borderColor: mc.hairline }}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-3.5 h-3.5" style={{ color: "#CFB48A" }} />
        <span className="text-[9px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: mc.textSubtle }}>
          Previsao 3 Meses
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: "#C9A87A" }} />
            <span className="text-[8px]" style={{ fontWeight: 400, color: mc.textSubtle }}>Confirmado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: mc.isDark ? "#5A4D35" : "#E8DDD0" }} />
            <span className="text-[8px]" style={{ fontWeight: 400, color: mc.textSubtle }}>Projecao</span>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-3 h-24">
        {data.months.map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end gap-1 h-20">
              <div
                className="flex-1 rounded-t-md transition-all duration-500"
                style={{
                  height: `${(m.confirmed / maxVal) * 100}%`,
                  background: "#C9A87A",
                  minHeight: 4,
                }}
              />
              <div
                className="flex-1 rounded-t-md transition-all duration-500"
                style={{
                  height: `${(m.projected / maxVal) * 100}%`,
                  background: mc.isDark ? "#5A4D35" : "#E8DDD0",
                  minHeight: 4,
                }}
              />
            </div>
            <span className="text-[9px] numeric" style={{ fontWeight: 400, color: mc.textSubtle }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: mc.hairline }}>
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] uppercase tracking-[0.06em]" style={{ fontWeight: 500, color: mc.textSubtle }}>Total confirmado</span>
          <span className="text-[14px] numeric" style={{ fontWeight: 600, color: GOLD }}>
            R$ {fmt(data.totalConfirmed)}
          </span>
        </div>
        <div className="w-px h-6" style={{ background: mc.border }} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] uppercase tracking-[0.06em]" style={{ fontWeight: 500, color: mc.textSubtle }}>Projecao total</span>
          <span className="text-[14px] numeric" style={{ fontWeight: 600, color: mc.textTertiary }}>
            R$ {fmt(data.totalProjected)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Cross-Intelligence Renderer ── */

function RenderCrossIntel({ data }: { data: CrossIntelData }) {
  const mc = useMCtx();
  const bgMap = { critical: mc.dangerBg, warning: mc.warningBg, info: mc.infoBg };
  const borderMap = { critical: mc.dangerBorder, warning: mc.warningBorder, info: mc.infoBorder };
  return (
    <div className="mt-3 flex flex-col gap-2">
      {data.connections.map((c, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 px-4 py-3 rounded-xl"
          style={{
            background: bgMap[c.severity] || mc.infoBg,
            border: `1px solid ${borderMap[c.severity] || mc.infoBorder}`,
          }}
        >
          <div className="flex items-center gap-2">
            <Zap
              className="w-3 h-3"
              style={{
                color: c.severity === "critical" ? "#FF3B30" : "#FF9500",
              }}
            />
            <span
              className="text-[9px] uppercase tracking-[0.06em]"
              style={{
                fontWeight: 600,
                color: c.severity === "critical" ? "#FF3B30" : "#FF9500",
              }}
            >
              Inteligencia cruzada
            </span>
          </div>
          <div className="flex items-center gap-2 pl-5">
            <span className="text-[10px]" style={{ fontWeight: 450, color: mc.textMuted }}>{c.from}</span>
            <ArrowRight className="w-3 h-3" style={{ color: mc.textDisabled }} />
            <span className="text-[10px]" style={{ fontWeight: 450, color: mc.textMuted }}>{c.to}</span>
          </div>
          <p className="text-[11px] pl-5" style={{ fontWeight: 500, color: mc.textTertiary }}>
            {c.insight}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Insight Card Renderer ── */

function RenderInsightCard({ data }: { data: InsightCardData }) {
  const mc = useMCtx();
  const colors = {
    critical: { bg: mc.dangerBg, border: mc.dangerBorder, text: "#FF3B30" },
    warning: { bg: mc.warningBg, border: mc.warningBorder, text: "#FF9500" },
    info: { bg: mc.infoBg, border: mc.infoBorder, text: "#007AFF" },
  };
  const c = colors[data.severity];
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: c.text }} />
      <div className="flex-1 min-w-0">
        <span className="text-[11px] block" style={{ fontWeight: 550, color: mc.textTertiary }}>
          {data.title}
        </span>
        <span className="text-[10px] block mt-0.5" style={{ fontWeight: 400, color: mc.textMuted }}>
          {data.detail}
        </span>
      </div>
    </div>
  );
}

function RenderDataBlock({ block }: { block: DataBlock }) {
  switch (block.type) {
    case "kpi-row": return <RenderKpiRow data={block.data as KpiRowData} />;
    case "table": return <RenderTable data={block.data as TableData} />;
    case "list": return <RenderList data={block.data as ListData} />;
    case "briefing": return <RenderBriefing data={block.data as BriefingData} />;
    case "forecast": return <RenderForecast data={block.data as ForecastData} />;
    case "cross-intel": return <RenderCrossIntel data={block.data as CrossIntelData} />;
    case "insight-card": return <RenderInsightCard data={block.data as InsightCardData} />;
    default: return null;
  }
}

/* ═══════════════════════════════════════════════════ */
/*  FORMATTED TEXT RENDERER — handles **bold** *ital* */
/* ═══════════════════════════════════════════════════ */

function FormattedText({ text }: { text: string }) {
  const mc = useMCtx();
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <span key={i} style={{ fontWeight: 600, color: mc.textTertiary }}>
              {part.slice(2, -2)}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  ACTION CHIP RENDERER                              */
/* ═══════════════════════════════════════════════════ */

function ActionChipButton({ chip }: { chip: ActionChip }) {
  const mc = useMCtx();
  const icons = {
    navigate: <ExternalLink className="w-3 h-3" />,
    check: <CheckCircle2 className="w-3 h-3" />,
    send: <Send className="w-3 h-3" />,
    open: <ExternalLink className="w-3 h-3" />,
  };
  return (
    <button
      onClick={chip.action}
      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] transition-all duration-200 cursor-pointer active:scale-[0.97]"
      style={{
        fontWeight: 500,
        color: mc.textMuted,
        background: mc.bgMuted,
        border: `1px solid ${mc.border}`,
      }}
    >
      <span style={{ color: "#C4B8A8" }}>
        {chip.icon ? icons[chip.icon] : icons.navigate}
      </span>
      {chip.label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  SLASH COMMAND AUTOCOMPLETE                        */
/* ═══════════════════════════════════════════════════ */

function SlashAutocomplete({
  query,
  onSelect,
  commands,
}: {
  query: string;
  onSelect: (cmd: string) => void;
  commands: { cmd: string; desc: string; usage: string }[];
}) {
  const matches = commands.filter((c) =>
    c.cmd.startsWith(query.split(" ")[0].toLowerCase())
  );
  const mc = useMCtx();
  if (matches.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden"
      style={{
        background: mc.bg,
        boxShadow: mc.isDark ? "0 4px 20px #000000, 0 1px 4px #000000" : "0 4px 20px #D1D1D6, 0 1px 4px #E5E5EA",
        border: `1px solid ${mc.border}`,
      }}
    >
      {matches.map((cmd) => (
        <button
          key={cmd.cmd}
          onClick={() => onSelect(cmd.usage)}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors cursor-pointer"
          style={{ background: "transparent" }}
          onMouseEnter={(e) => e.currentTarget.style.background = mc.bgMuted}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <span className="text-[11px] numeric" style={{ fontWeight: 600, color: "#CFB48A" }}>
            {cmd.cmd}
          </span>
          <span className="text-[11px]" style={{ fontWeight: 400, color: mc.textMuted }}>
            {cmd.desc}
          </span>
        </button>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                    */
/* ═══════════════════════════════════════════════════ */

export function MaiaAssistantView({ onNavigateToProject, onNavigateToModule, panelMode, moduleContext }: MaiaAssistantViewProps) {
  const maiaDk = useMaiaDk();
  const [messages, setMessages] = useState<MaiaMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { getStats } = useAppStore();

  const nav: MaiaAssistantViewProps = { onNavigateToProject, onNavigateToModule };

  /* ── Module-aware config ── */
  const moduleConfig = moduleContext ? getMaiaModuleConfig(moduleContext) : null;
  const activeSlashCommands = moduleContext ? getMaiaSlashCommands(moduleContext) : defaultSlashCommands;
  const activeSuggestedPrompts = moduleConfig?.suggestedPrompts || defaultSuggestedPrompts;

  const proactiveInsights = computeProactiveInsights();

  /* ── Reset conversation when module context changes ── */
  const prevModuleRef = useRef(moduleContext);
  useEffect(() => {
    if (moduleContext && moduleContext !== prevModuleRef.current) {
      setMessages([]);
      setInputValue("");
      setIsTyping(false);
      setShowSlash(false);
    }
    prevModuleRef.current = moduleContext;
  }, [moduleContext]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Track slash input
  useEffect(() => {
    setShowSlash(inputValue.startsWith("/") && inputValue.length > 0 && inputValue.length < 12);
  }, [inputValue]);

  function handleSend(text?: string) {
    const query = text || inputValue.trim();
    if (!query) return;

    const userMsg: MaiaMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setShowSlash(false);
    setIsTyping(true);

    const delay = query.startsWith("/briefing") ? 1200 : 600 + Math.random() * 500;

    setTimeout(() => {
      const response = generateMaiaResponse(query, [...messages, userMsg], nav, getStats());
      const maiaMsg: MaiaMessage = {
        id: `msg-${Date.now()}-maia`,
        role: "maia",
        content: response.content,
        dataBlocks: response.dataBlocks,
        actions: response.actions,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, maiaMsg]);
      setIsTyping(false);
    }, delay);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSlashSelect(cmd: string) {
    setInputValue(cmd);
    setShowSlash(false);
    inputRef.current?.focus();
  }

  const isEmpty = messages.length === 0;
  const mc = maiaDk;

  return (
    <MaiaDkCtx.Provider value={maiaDk}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springFadeIn}
      className="flex flex-col h-full"
      style={{ minHeight: panelMode ? 0 : "calc(100vh - 180px)" }}
    >
      {isEmpty ? (
        /* ═══════ Empty State — Welcome + Proactive Insights ═══════ */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          {/* Maia identity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: mc.goldAvatarBg,
                border: `1px solid ${mc.goldAvatarBorder}`,
              }}
            >
              <span
                className="text-[22px] tracking-[-0.03em]"
                style={{ fontFamily: SERIF_SWASH, fontWeight: 400, color: "#C9A87A" }}
              >
                M
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <h2
                className="text-[26px] tracking-[-0.03em]"
                style={{ fontWeight: 400, fontFamily: SERIF, color: mc.textTertiary }}
              >
                {moduleConfig?.greeting || "Como posso ajudar?"}
              </h2>
              {/* Context badge */}
              {moduleConfig && moduleContext !== "dashboard" && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-[0.06em]"
                  style={{
                    fontWeight: 600,
                    color: "#C9A87A",
                    background: mc.goldBg,
                    border: `1px solid ${mc.goldBorder}`,
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {moduleConfig.contextLabel}
                </span>
              )}
              <p
                className="text-[12px] text-center max-w-[400px]"
                style={{ fontWeight: 400, lineHeight: 1.6, color: mc.textSubtle }}
              >
                {moduleConfig?.subtitle || (
                  <>
                    Pergunte em linguagem natural, mencione projetos ou clientes pelo nome,
                    ou use comandos como <span className="text-[#CFB48A]" style={{ fontWeight: 500 }}>/briefing</span>, <span className="text-[#CFB48A]" style={{ fontWeight: 500 }}>/forecast</span>, <span className="text-[#CFB48A]" style={{ fontWeight: 500 }}>/cobrar</span>
                  </>
                )}
              </p>
            </div>
          </motion.div>

          {/* Proactive insights — Maia "noticed" */}
          {proactiveInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
              className="w-full max-w-[540px] flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 px-1">
                <Zap className="w-3 h-3" style={{ color: "#D4B88C" }} />
                <span className="text-[9px] uppercase tracking-[0.08em]" style={{ fontWeight: 600, color: mc.textSubtle }}>
                  Maia notou
                </span>
              </div>
              {proactiveInsights.slice(0, 3).map((insight, i) => (
                <RenderInsightCard key={i} data={insight} />
              ))}
            </motion.div>
          )}

          {/* Suggested prompts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className="grid grid-cols-2 gap-2 w-full max-w-[540px]"
          >
            {activeSuggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt.label)}
                className="group flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer active:scale-[0.98]"
                style={{
                  background: mc.bg,
                  boxShadow: mc.shadowCard,
                  border: `1px solid ${mc.hairline}`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: prompt.category === "comando" ? mc.goldAvatarBg : mc.bgMuted }}
                >
                  <prompt.icon
                    className="w-3 h-3"
                    style={{ color: prompt.category === "comando" ? "#C9A87A" : mc.textMuted }}
                  />
                </div>
                <span
                  className="text-[11px] transition-colors"
                  style={{ fontWeight: 450, color: mc.textMuted }}
                >
                  {prompt.label}
                </span>
              </button>
            ))}
          </motion.div>
        </div>
      ) : (
        /* ═══════ Conversation ═══════ */
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-6 gap-5">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div
                    className="max-w-[65%] px-4 py-2.5 rounded-2xl rounded-br-lg"
                    style={{ background: mc.isDark ? "#2C2C2E" : "#E5E5EA" }}
                  >
                    <p className="text-[13px]" style={{ fontWeight: 450, lineHeight: 1.55, color: mc.textTertiary }}>
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <div className="max-w-[88%] flex gap-3">
                    {/* Avatar */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: mc.goldAvatarBg,
                        border: `1px solid ${mc.goldAvatarBorder}`,
                      }}
                    >
                      <span className="text-[11px]" style={{ fontFamily: SERIF_SWASH, fontWeight: 400, color: "#C9A87A" }}>
                        M
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <span className="text-[8px] tracking-[0.08em] uppercase mb-1" style={{ fontWeight: 600, color: "#D4B88C" }}>
                        Maia
                      </span>

                      <p className="text-[13px]" style={{ fontWeight: 400, lineHeight: 1.65, color: mc.textTertiary }}>
                        <FormattedText text={msg.content} />
                      </p>

                      {/* Data blocks */}
                      {msg.dataBlocks && msg.dataBlocks.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {msg.dataBlocks.map((block, bi) => (
                            <RenderDataBlock key={bi} block={block} />
                          ))}
                        </div>
                      )}

                      {/* Action chips */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          {msg.actions.map((chip, ci) => (
                            <ActionChipButton key={ci} chip={chip} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 items-start"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: mc.goldAvatarBg,
                    border: `1px solid ${mc.goldAvatarBorder}`,
                  }}
                >
                  <span className="text-[11px]" style={{ fontFamily: SERIF_SWASH, fontWeight: 400, color: "#C9A87A" }}>
                    M
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#D4B88C" }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ═══════ Input Bar ═══════ */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="relative">
          {/* Slash autocomplete */}
          <AnimatePresence>
            {showSlash && (
              <SlashAutocomplete query={inputValue} onSelect={handleSlashSelect} commands={activeSlashCommands} />
            )}
          </AnimatePresence>

          <div
            className="relative flex items-end gap-2 px-4 py-3 rounded-2xl transition-shadow duration-200"
            style={{
              background: mc.bg,
              boxShadow: mc.isDark
                ? "0 1px 6px #000000, 0 1px 3px #000000, 0 0 0 1px #3A3A3C"
                : "0 1px 6px #E5E5EA, 0 1px 3px #E5E5EA, 0 0 0 1px #E5E5EA",
            }}
          >
            <Sparkles className="w-4 h-4 shrink-0 mb-0.5" style={{ color: "#D4B88C" }} />

            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={moduleConfig?.placeholder || "Pergunte algo ou digite / para comandos..."}
              rows={1}
              className="flex-1 resize-none text-[13px] bg-transparent outline-none"
              style={{
                fontWeight: 400,
                lineHeight: 1.5,
                maxHeight: 120,
                fontFamily: "var(--font-sans)",
                color: mc.textTertiary,
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-15 disabled:cursor-default"
              style={{
                background: inputValue.trim()
                  ? (mc.isDark ? "#F5F5F7" : "#1D1D1F")
                  : (mc.isDark ? "#3A3A3C" : "#E5E5EA"),
              }}
            >
              <ArrowRight className="w-3.5 h-3.5" style={{ color: inputValue.trim() ? (mc.isDark ? "#1D1D1F" : "#FFFFFF") : mc.textSubtle }} />
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <p className="text-[9px]" style={{ fontWeight: 400, color: mc.textDisabled }}>
            Maia analisa dados do seu estudio em tempo real
          </p>
          <span className="w-px h-2" style={{ background: mc.border }} />
          <p className="text-[9px]" style={{ fontWeight: 400, color: mc.textDisabled }}>
            <kbd className="px-1 py-0.5 rounded text-[8px]" style={{ fontWeight: 500, background: mc.bgMuted, color: mc.textDisabled }}>
              Ctrl K
            </kbd>
            {" "}para ativar de qualquer tela
          </p>
        </div>
      </div>
    </motion.div>
    </MaiaDkCtx.Provider>
  );
}
