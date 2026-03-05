/* ═══════════════════════════════════════════════════ */
/*  Production Store — Serviços de produção            */
/*  Persistence: localStorage essyn:productionState    */
/*  Integrates with Produção Radar + Drawer Produção   */
/* ═══════════════════════════════════════════════════ */

const STORAGE_KEY = "essyn:productionState";
const TODAY_ISO = "2026-02-23";

/* ── Types ── */

export type TrabalhoTipo = "edicao" | "album" | "tratamento" | "impressao";
export type TrabalhoStatus = "novo" | "em_producao" | "finalizado";
export type Prioridade = "urgente" | "normal" | "baixa";
export type EtapaStatus = "concluida" | "atual" | "aguardando" | "pendente" | "atrasada";

export interface Responsavel {
  nome: string;
  iniciais: string;
}

export interface EtapaServico {
  nome: string;
  status: EtapaStatus;
  data?: string;
  responsavel?: string;
}

export interface TrabalhoProducao {
  id: string;
  projeto: string;
  projetoId: string;
  cliente: string;
  titulo: string;
  tipo: TrabalhoTipo;
  status: TrabalhoStatus;
  responsavel: Responsavel;
  prioridade: Prioridade;
  prazo: string;
  prazoISO: string;
  progresso: number;
  itens?: string;
  diasRestantes: number;
  etapas: EtapaServico[];
  etapaAtualNome?: string;
  aguardandoCliente?: boolean;
  slaDias: number;
}

export interface ProductionState {
  trabalhos: TrabalhoProducao[];
}

/* ── Team ── */

export const equipe: Responsavel[] = [
  { nome: "Marina Reis", iniciais: "MR" },
  { nome: "Carlos Mendes", iniciais: "CM" },
  { nome: "Julia Farias", iniciais: "JF" },
  { nome: "Lucas Prado", iniciais: "LP" },
];

/* ── Persistence ── */

function loadState(): ProductionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: ProductionState = JSON.parse(raw);
      // Sanitize stale "video" tipo from old sessions
      const validTipos: TrabalhoTipo[] = ["edicao", "album", "tratamento", "impressao"];
      parsed.trabalhos = parsed.trabalhos.map((t) => ({
        ...t,
        tipo: validTipos.includes(t.tipo) ? t.tipo : "edicao",
      }));
      return parsed;
    }
  } catch { /* ignore */ }
  const seeded = seedMockData();
  saveState(seeded);
  return seeded;
}

function saveState(state: ProductionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded */ }
}

/* ── Helpers ── */

function mkEtapas(nomes: string[], current: number, opts?: { aguardandoIdx?: number; atrasadoIdx?: number }): EtapaServico[] {
  const DAY = 86400000;
  const baseTs = new Date(TODAY_ISO + "T12:00:00").getTime();
  return nomes.map((nome, i) => {
    let status: EtapaStatus = "pendente";
    let data: string | undefined;
    if (i < current) {
      status = "concluida";
      data = fmtDateShort(baseTs - (current - i) * 5 * DAY);
    } else if (i === current) {
      if (opts?.atrasadoIdx === i) {
        status = "atrasada";
        data = "Atrasado";
      } else if (opts?.aguardandoIdx === i) {
        status = "aguardando";
        data = "Aguardando";
      } else {
        status = "atual";
        data = "Hoje";
      }
    }
    return { nome, status, data };
  });
}

function fmtDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function fmtDateFull(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function calcDiasRestantes(prazoISO: string): number {
  const today = new Date(TODAY_ISO + "T12:00:00").getTime();
  const prazo = new Date(prazoISO + "T12:00:00").getTime();
  return Math.round((prazo - today) / 86400000);
}

function currentEtapaNome(etapas: EtapaServico[]): string {
  const current = etapas.find((e) => e.status === "atual" || e.status === "aguardando" || e.status === "atrasada");
  return current?.nome || (etapas.every((e) => e.status === "concluida") ? "Concluído" : "Pendente");
}

/* ── Mock seed ── */

function seedMockData(): ProductionState {
  return {
    trabalhos: [
      {
        id: "t1",
        projeto: "Casamento Oliveira & Santos",
        projetoId: "proj-001",
        cliente: "Ana Oliveira",
        titulo: "Edição de fotos — Cerimônia + Festa",
        tipo: "edicao",
        status: "em_producao",
        responsavel: equipe[0],
        prioridade: "urgente",
        prazo: "26 Fev 2026",
        prazoISO: "2026-02-26",
        progresso: 68,
        itens: "342 fotos",
        diasRestantes: 3,
        etapas: mkEtapas(["Backup", "Prévia", "Seleção", "Edição", "Entregue"], 3),
        etapaAtualNome: "Edição",
        aguardandoCliente: false,
        slaDias: 30,
      },
      {
        id: "t2",
        projeto: "Casamento Oliveira & Santos",
        projetoId: "proj-001",
        cliente: "Ana Oliveira",
        titulo: "Álbum 30×30 — 60 páginas",
        tipo: "album",
        status: "novo",
        responsavel: equipe[2],
        prioridade: "normal",
        prazo: "15 Mar 2026",
        prazoISO: "2026-03-15",
        progresso: 0,
        itens: "60 páginas",
        diasRestantes: 20,
        etapas: mkEtapas(["Seleção", "Diagramação", "Revisão cliente", "Impressão"], 0),
        etapaAtualNome: "Seleção",
        aguardandoCliente: false,
        slaDias: 45,
      },
      {
        id: "t3",
        projeto: "Formatura Direito UFMG",
        projetoId: "proj-006",
        cliente: "Carla Dias",
        titulo: "Edição de fotos — Baile + Retratos",
        tipo: "edicao",
        status: "em_producao",
        responsavel: equipe[1],
        prioridade: "urgente",
        prazo: "01 Mar 2026",
        prazoISO: "2026-03-01",
        progresso: 35,
        itens: "210 fotos",
        diasRestantes: 6,
        etapas: mkEtapas(["Backup", "Prévia", "Seleção", "Edição", "Entregue"], 2),
        etapaAtualNome: "Seleção",
        aguardandoCliente: false,
        slaDias: 30,
      },
      {
        id: "t5",
        projeto: "Corporativo TechCo Annual",
        projetoId: "proj-002",
        cliente: "TechCo Brasil",
        titulo: "Tratamento de retratos corporativos",
        tipo: "tratamento",
        status: "em_producao",
        responsavel: equipe[0],
        prioridade: "normal",
        prazo: "28 Fev 2026",
        prazoISO: "2026-02-28",
        progresso: 80,
        itens: "30 retratos",
        diasRestantes: 5,
        etapas: mkEtapas(["Seleção", "Tratamento", "Revisão", "Entregue"], 2, { aguardandoIdx: 2 }),
        etapaAtualNome: "Revisão",
        aguardandoCliente: true,
        slaDias: 15,
      },
      {
        id: "t6",
        projeto: "Batizado Gabriel Costa",
        projetoId: "proj-004",
        cliente: "Pedro Costa",
        titulo: "Edição de fotos — Cerimônia + Família",
        tipo: "edicao",
        status: "em_producao",
        responsavel: equipe[0],
        prioridade: "urgente",
        prazo: "24 Fev 2026",
        prazoISO: "2026-02-24",
        progresso: 90,
        itens: "64 fotos",
        diasRestantes: 1,
        etapas: mkEtapas(["Backup", "Prévia", "Seleção", "Edição", "Entregue"], 4),
        etapaAtualNome: "Entregue",
        aguardandoCliente: false,
        slaDias: 15,
      },
      {
        id: "t7",
        projeto: "Ensaio Gestante — Família Lima",
        projetoId: "proj-005",
        cliente: "Fernanda Lima",
        titulo: "Mini álbum 20×20 — Impressão",
        tipo: "impressao",
        status: "finalizado",
        responsavel: equipe[2],
        prioridade: "baixa",
        prazo: "20 Fev 2026",
        prazoISO: "2026-02-20",
        progresso: 100,
        itens: "20 páginas",
        diasRestantes: -3,
        etapas: mkEtapas(["Diagramação", "Revisão", "Impressão", "Entregue"], 4),
        etapaAtualNome: "Concluído",
        aguardandoCliente: false,
        slaDias: 30,
      },
      {
        id: "t8",
        projeto: "Ensaio Newborn — Baby Theo",
        projetoId: "proj-008",
        cliente: "Amanda Rocha",
        titulo: "Tratamento final + Galeria online",
        tipo: "tratamento",
        status: "finalizado",
        responsavel: equipe[0],
        prioridade: "baixa",
        prazo: "18 Fev 2026",
        prazoISO: "2026-02-18",
        progresso: 100,
        itens: "40 fotos",
        diasRestantes: -5,
        etapas: mkEtapas(["Seleção", "Tratamento", "Galeria", "Entregue"], 4),
        etapaAtualNome: "Concluído",
        aguardandoCliente: false,
        slaDias: 15,
      },
      {
        id: "t9",
        projeto: "15 Anos Isabela Mendes",
        projetoId: "proj-003",
        cliente: "Renata Mendes",
        titulo: "Edição de fotos — Sessão pré-festa",
        tipo: "edicao",
        status: "novo",
        responsavel: equipe[1],
        prioridade: "normal",
        prazo: "10 Mar 2026",
        prazoISO: "2026-03-10",
        progresso: 0,
        itens: "86 fotos",
        diasRestantes: 15,
        etapas: mkEtapas(["Backup", "Prévia", "Seleção", "Edição", "Entregue"], 0),
        etapaAtualNome: "Backup",
        aguardandoCliente: false,
        slaDias: 30,
      },
      {
        id: "t10",
        projeto: "Casamento Ferreira & Lima",
        projetoId: "proj-009",
        cliente: "Julia Ferreira",
        titulo: "Álbum premium 30×40 — Layout",
        tipo: "album",
        status: "novo",
        responsavel: equipe[2],
        prioridade: "baixa",
        prazo: "20 Mar 2026",
        prazoISO: "2026-03-20",
        progresso: 0,
        itens: "80 páginas",
        diasRestantes: 25,
        etapas: mkEtapas(["Seleção", "Diagramação", "Revisão cliente", "Impressão"], 0),
        etapaAtualNome: "Seleção",
        aguardandoCliente: false,
        slaDias: 45,
      },
      {
        id: "t11",
        projeto: "Corporativo TechCo Annual",
        projetoId: "proj-002",
        cliente: "TechCo Brasil",
        titulo: "Entrega digital — Galeria alta resolução",
        tipo: "edicao",
        status: "em_producao",
        responsavel: equipe[0],
        prioridade: "normal",
        prazo: "05 Mar 2026",
        prazoISO: "2026-03-05",
        progresso: 55,
        itens: "128 fotos",
        diasRestantes: 10,
        etapas: mkEtapas(["Backup", "Seleção", "Edição", "Galeria", "Entregue"], 2),
        etapaAtualNome: "Edição",
        aguardandoCliente: false,
        slaDias: 21,
      },
      {
        id: "t12",
        projeto: "Batizado Gabriel Costa",
        projetoId: "proj-004",
        cliente: "Pedro Costa",
        titulo: "Impressão fine art — 3 quadros",
        tipo: "impressao",
        status: "novo",
        responsavel: equipe[2],
        prioridade: "normal",
        prazo: "12 Mar 2026",
        prazoISO: "2026-03-12",
        progresso: 0,
        itens: "3 quadros",
        diasRestantes: 17,
        etapas: mkEtapas(["Seleção", "Acabamento", "Impressão", "Entregue"], 0),
        etapaAtualNome: "Seleção",
        aguardandoCliente: false,
        slaDias: 30,
      },
    ],
  };
}

/* ═══════════════════════════════════════════════════ */
/*  CRUD                                               */
/* ═══════════════════════════════════════════════════ */

export function getAllTrabalhos(): TrabalhoProducao[] {
  return loadState().trabalhos;
}

export function getTrabalhosByProject(projectId: string): TrabalhoProducao[] {
  return loadState().trabalhos.filter((t) => t.projetoId === projectId);
}

export function addTrabalho(data: Omit<TrabalhoProducao, "id" | "diasRestantes" | "progresso" | "etapaAtualNome">): TrabalhoProducao {
  const state = loadState();
  const trabalho: TrabalhoProducao = {
    ...data,
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    diasRestantes: calcDiasRestantes(data.prazoISO),
    progresso: 0,
    etapaAtualNome: currentEtapaNome(data.etapas),
  };
  state.trabalhos.push(trabalho);
  saveState(state);
  return trabalho;
}

export function advanceEtapa(trabalhoId: string): ProductionState {
  const state = loadState();
  const trabalho = state.trabalhos.find((t) => t.id === trabalhoId);
  if (!trabalho) return state;

  const currentIdx = trabalho.etapas.findIndex((e) => e.status === "atual" || e.status === "aguardando" || e.status === "atrasada");
  if (currentIdx >= 0) {
    trabalho.etapas[currentIdx].status = "concluida";
    trabalho.etapas[currentIdx].data = fmtDateShort(Date.now());
    if (currentIdx + 1 < trabalho.etapas.length) {
      trabalho.etapas[currentIdx + 1].status = "atual";
      trabalho.etapas[currentIdx + 1].data = "Hoje";
    }
  }

  // Recalculate progress
  const done = trabalho.etapas.filter((e) => e.status === "concluida").length;
  trabalho.progresso = Math.round((done / trabalho.etapas.length) * 100);
  trabalho.etapaAtualNome = currentEtapaNome(trabalho.etapas);

  // Update status
  if (trabalho.progresso >= 100) {
    trabalho.status = "finalizado";
  } else if (trabalho.status === "novo" && done > 0) {
    trabalho.status = "em_producao";
  }

  trabalho.aguardandoCliente = trabalho.etapas.some((e) => e.status === "aguardando");

  saveState(state);
  return state;
}

export function setEtapaStatus(trabalhoId: string, etapaIdx: number, newStatus: EtapaStatus): ProductionState {
  const state = loadState();
  const trabalho = state.trabalhos.find((t) => t.id === trabalhoId);
  if (!trabalho || etapaIdx < 0 || etapaIdx >= trabalho.etapas.length) return state;

  const etapa = trabalho.etapas[etapaIdx];
  etapa.status = newStatus;
  etapa.data = newStatus === "concluida"
    ? fmtDateShort(Date.now())
    : newStatus === "atual" ? "Hoje"
    : newStatus === "atrasada" ? "Atrasado"
    : newStatus === "aguardando" ? "Aguardando"
    : undefined;

  /* Recalculate progress */
  const done = trabalho.etapas.filter((e) => e.status === "concluida").length;
  trabalho.progresso = Math.round((done / trabalho.etapas.length) * 100);
  trabalho.etapaAtualNome = currentEtapaNome(trabalho.etapas);

  /* Update status */
  if (trabalho.progresso >= 100) {
    trabalho.status = "finalizado";
  } else if (done > 0 && trabalho.status === "novo") {
    trabalho.status = "em_producao";
  } else if (done === 0 && trabalho.etapas.every((e) => e.status === "pendente")) {
    trabalho.status = "novo";
  }

  trabalho.aguardandoCliente = trabalho.etapas.some((e) => e.status === "aguardando");

  saveState(state);
  return state;
}

export function markTrabalhoFinalizado(trabalhoId: string): ProductionState {
  const state = loadState();
  const trabalho = state.trabalhos.find((t) => t.id === trabalhoId);
  if (trabalho) {
    trabalho.status = "finalizado";
    trabalho.progresso = 100;
    trabalho.etapas.forEach((e) => { e.status = "concluida"; });
    trabalho.etapaAtualNome = "Concluído";
  }
  saveState(state);
  return state;
}

/* ── Derived stats ── */

export interface ProductionStats {
  total: number;
  novos: number;
  emProducao: number;
  finalizados: number;
  atrasados: number;
  venceEm7d: number;
  aguardandoCliente: number;
  semResponsavel: number;
  altoVolume: number;
  urgentes: number;
}

export function computeStats(trabalhos: TrabalhoProducao[]): ProductionStats {
  const active = trabalhos.filter((t) => t.status !== "finalizado");
  return {
    total: trabalhos.length,
    novos: trabalhos.filter((t) => t.status === "novo").length,
    emProducao: trabalhos.filter((t) => t.status === "em_producao").length,
    finalizados: trabalhos.filter((t) => t.status === "finalizado").length,
    atrasados: active.filter((t) => t.diasRestantes < 0 || t.prioridade === "urgente" && t.diasRestantes <= 2).length,
    venceEm7d: active.filter((t) => t.diasRestantes >= 0 && t.diasRestantes <= 7).length,
    aguardandoCliente: active.filter((t) => t.aguardandoCliente).length,
    semResponsavel: 0, // mock: all assigned
    altoVolume: active.filter((t) => {
      const count = active.filter((x) => x.responsavel.iniciais === t.responsavel.iniciais).length;
      return count >= 3;
    }).length,
    urgentes: active.filter((t) => t.prioridade === "urgente").length,
  };
}

/* ── Template models for modal ── */

export interface ModeloServico {
  id: string;
  nome: string;
  descricao: string;
  etapas: string[];
  slaDias: number;
  tipo: TrabalhoTipo;
}

export const modelosServico: ModeloServico[] = [
  { id: "casamento", nome: "Casamento Completo", descricao: "Backup → Prévia → Seleção → Edição → Entrega", etapas: ["Backup", "Prévia", "Seleção", "Edição", "Entregue"], slaDias: 30, tipo: "edicao" },
  { id: "pre-wedding", nome: "Pré-Wedding", descricao: "Seleção → Edição → Revisão → Entrega", etapas: ["Seleção", "Edição", "Revisão", "Entregue"], slaDias: 15, tipo: "edicao" },
  { id: "15anos", nome: "15 Anos / Debutante", descricao: "Backup → Seleção → Edição → Entrega", etapas: ["Backup", "Seleção", "Edição", "Entregue"], slaDias: 21, tipo: "edicao" },
  { id: "album", nome: "Álbum Diagramação", descricao: "Seleção → Diagramação → Revisão cliente → Impressão", etapas: ["Seleção", "Diagramação", "Revisão cliente", "Impressão"], slaDias: 45, tipo: "album" },
  { id: "ensaio", nome: "Ensaio Externo", descricao: "Backup → Edição → Entrega", etapas: ["Backup", "Edição", "Entregue"], slaDias: 14, tipo: "edicao" },
  { id: "tratamento", nome: "Tratamento de Retratos", descricao: "Seleção → Tratamento → Revisão → Entrega", etapas: ["Seleção", "Tratamento", "Revisão", "Entregue"], slaDias: 15, tipo: "tratamento" },
  { id: "impressao", nome: "Impressão Fine Art", descricao: "Seleção → Acabamento → Impressão → Entrega", etapas: ["Seleção", "Acabamento", "Impressão", "Entregue"], slaDias: 30, tipo: "impressao" },
  { id: "formatura", nome: "Formatura — Edição", descricao: "Backup → Prévia → Seleção → Edição → Entrega", etapas: ["Backup", "Prévia", "Seleção", "Edição", "Entregue"], slaDias: 30, tipo: "edicao" },
  { id: "batizado", nome: "Batizado / Religioso", descricao: "Backup → Seleção → Edição → Entrega", etapas: ["Backup", "Seleção", "Edição", "Entregue"], slaDias: 21, tipo: "edicao" },
  { id: "corporativo", nome: "Corporativo / Institucional", descricao: "Seleção → Edição → Revisão → Entrega", etapas: ["Seleção", "Edição", "Revisão", "Entregue"], slaDias: 14, tipo: "edicao" },
  { id: "making-of", nome: "Making Of / Bastidores", descricao: "Backup → Prévia → Seleção → Edição → Entrega", etapas: ["Backup", "Prévia", "Seleção", "Edição", "Entregue"], slaDias: 45, tipo: "edicao" },
  { id: "drone", nome: "Drone / Aérea", descricao: "Backup → Edição → Color → Entrega", etapas: ["Backup", "Edição", "Color Grading", "Entregue"], slaDias: 14, tipo: "edicao" },
  { id: "same-day-edit", nome: "Same Day Edit", descricao: "Backup → Edição rápida → Projeção → Entrega", etapas: ["Backup", "Edição Rápida", "Projeção", "Entregue"], slaDias: 1, tipo: "edicao" },
  { id: "diagramacao", nome: "Diagramação / Layout", descricao: "Seleção → Diagramação → Revisão → Finalização", etapas: ["Seleção", "Diagramação", "Revisão", "Finalização"], slaDias: 30, tipo: "album" },
  { id: "entrega-digital", nome: "Entrega Digital", descricao: "Upload → Galeria → Revisão → Link ativo", etapas: ["Upload", "Galeria Online", "Revisão", "Link Ativo"], slaDias: 7, tipo: "edicao" },
];