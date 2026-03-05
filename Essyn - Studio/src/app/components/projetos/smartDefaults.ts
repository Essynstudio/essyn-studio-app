/* ═══════════════════════════════════════════════════════════ */
/*  Smart Defaults Engine                                      */
/*  Maps ProjetoTipo → intelligent auto-fill for every module  */
/*  Goal: 3 fields → full project, zero rework                 */
/* ═══════════════════════════════════════════════════════════ */

import type { ProjetoTipo, FormaPagamento } from "./projetosData";

/* ── Pacotes ── */

export interface PacoteSugerido {
  nome: string;
  itens: string[];
  valor: number; // centavos
}

export const PACOTES: Record<string, PacoteSugerido> = {
  "Premium Completo": {
    nome: "Premium Completo",
    itens: [
      "Cobertura integral (cerimônia + festa)",
      "Ensaio pré-wedding",
      "Álbum 30×30 com 60 páginas",
      "Pendrive personalizado",
      "Galeria online por 12 meses",
    ],
    valor: 850000, // R$ 8.500,00
  },
  "Festa Completa": {
    nome: "Festa Completa",
    itens: [
      "Cobertura da festa completa",
      "100 fotos editadas",
      "Álbum 25×25 com 40 páginas",
      "Galeria online por 6 meses",
    ],
    valor: 550000,
  },
  "Corporativo Standard": {
    nome: "Corporativo Standard",
    itens: [
      "Cobertura do evento completo",
      "Fotos de palco e plateia",
      "Retratos corporativos (até 30 pessoas)",
      "Entrega digital em alta resolução",
    ],
    valor: 350000,
  },
  "Ensaio Básico": {
    nome: "Ensaio Básico",
    itens: [
      "Sessão de 1 hora",
      "30 fotos editadas",
      "Galeria online por 3 meses",
    ],
    valor: 120000,
  },
  "Batizado Essencial": {
    nome: "Batizado Essencial",
    itens: [
      "Cobertura da cerimônia",
      "50 fotos editadas",
      "Galeria online por 6 meses",
    ],
    valor: 180000,
  },
  "Formatura Premium": {
    nome: "Formatura Premium",
    itens: [
      "Cobertura do baile completo",
      "Retratos individuais",
      "Álbum 25×25 com 40 páginas",
      "Galeria online por 12 meses",
    ],
    valor: 650000,
  },
  "Aniversário Standard": {
    nome: "Aniversário Standard",
    itens: [
      "Cobertura da festa (4 horas)",
      "80 fotos editadas",
      "Galeria online por 6 meses",
    ],
    valor: 250000,
  },
};

/* ── Equipe sugerida ── */

export interface MembroSugerido {
  nome: string;
  funcao: string;
  iniciais: string;
}

export const EQUIPE_DISPONIVEL: MembroSugerido[] = [
  { nome: "Marina Reis", funcao: "Fotógrafa principal", iniciais: "MR" },
  { nome: "Carlos Mendes", funcao: "Segundo fotógrafo", iniciais: "CM" },
  { nome: "Julia Farias", funcao: "Assistente", iniciais: "JF" },
  { nome: "Lucas Prado", funcao: "Videógrafo", iniciais: "LP" },
  { nome: "Fernanda Lima", funcao: "Drone / Aéreo", iniciais: "FL" },
];

/* ── Smart Defaults per Tipo ── */

export interface TipoDefaults {
  /** Template for title — {cliente} is replaced */
  tituloTemplate: string;
  /** Default start time */
  horaInicio: string;
  /** Default end time */
  horaFim: string;
  /** Suggested pacote key (from PACOTES) */
  pacoteSugerido: string;
  /** IDs from modelosServico (productionStore) to auto-select */
  servicosProducaoIds: string[];
  /** Delivery deadline in days after event */
  prazoDias: number;
  /** Default payment method */
  formaPagamento: FormaPagamento;
  /** Default number of installments */
  parcelas: number;
  /** Default deposit percentage (0-100) */
  entradaPercent: number;
  /** Default installment interval in months */
  intervaloMeses: number;
  /** Equipe indices from EQUIPE_DISPONIVEL to auto-assign */
  equipeIndices: number[];
}

export const TIPO_DEFAULTS: Record<ProjetoTipo, TipoDefaults> = {
  Casamento: {
    tituloTemplate: "Casamento {cliente}",
    horaInicio: "16:00",
    horaFim: "23:00",
    pacoteSugerido: "Premium Completo",
    servicosProducaoIds: ["casamento", "pre-wedding"],
    prazoDias: 30,
    formaPagamento: "pix",
    parcelas: 3,
    entradaPercent: 30,
    intervaloMeses: 1,
    equipeIndices: [0, 1, 2], // Marina, Carlos, Julia
  },
  Corporativo: {
    tituloTemplate: "Corporativo {cliente}",
    horaInicio: "09:00",
    horaFim: "18:00",
    pacoteSugerido: "Corporativo Standard",
    servicosProducaoIds: ["corporativo", "tratamento"],
    prazoDias: 14,
    formaPagamento: "boleto",
    parcelas: 2,
    entradaPercent: 50,
    intervaloMeses: 1,
    equipeIndices: [0, 2], // Marina, Julia
  },
  "Aniversário": {
    tituloTemplate: "Aniversário {cliente}",
    horaInicio: "19:00",
    horaFim: "00:00",
    pacoteSugerido: "Aniversário Standard",
    servicosProducaoIds: ["15anos"],
    prazoDias: 21,
    formaPagamento: "pix",
    parcelas: 2,
    entradaPercent: 30,
    intervaloMeses: 1,
    equipeIndices: [0, 2], // Marina, Julia
  },
  Ensaio: {
    tituloTemplate: "Ensaio {cliente}",
    horaInicio: "07:00",
    horaFim: "10:00",
    pacoteSugerido: "Ensaio Básico",
    servicosProducaoIds: ["ensaio"],
    prazoDias: 14,
    formaPagamento: "pix",
    parcelas: 1,
    entradaPercent: 50,
    intervaloMeses: 1,
    equipeIndices: [0], // Marina
  },
  Batizado: {
    tituloTemplate: "Batizado {cliente}",
    horaInicio: "10:00",
    horaFim: "14:00",
    pacoteSugerido: "Batizado Essencial",
    servicosProducaoIds: ["batizado"],
    prazoDias: 21,
    formaPagamento: "pix",
    parcelas: 2,
    entradaPercent: 30,
    intervaloMeses: 1,
    equipeIndices: [0, 2], // Marina, Julia
  },
  Formatura: {
    tituloTemplate: "Formatura {cliente}",
    horaInicio: "19:00",
    horaFim: "02:00",
    pacoteSugerido: "Formatura Premium",
    servicosProducaoIds: ["formatura"],
    prazoDias: 30,
    formaPagamento: "pix",
    parcelas: 4,
    entradaPercent: 25,
    intervaloMeses: 1,
    equipeIndices: [0, 1, 3], // Marina, Carlos, Lucas
  },
};

/* ── Helpers ── */

/** Generate auto title from tipo + client name */
export function buildAutoTitle(tipo: ProjetoTipo, clienteNome: string): string {
  const defaults = TIPO_DEFAULTS[tipo];
  if (!defaults || !clienteNome.trim()) return "";
  return defaults.tituloTemplate.replace("{cliente}", clienteNome.trim());
}

/** Get the suggested pacote object for a tipo */
export function getSuggestedPacote(tipo: ProjetoTipo): PacoteSugerido | null {
  const defaults = TIPO_DEFAULTS[tipo];
  if (!defaults) return null;
  return PACOTES[defaults.pacoteSugerido] || null;
}

/** Get auto-assigned equipe for a tipo */
export function getAutoEquipe(tipo: ProjetoTipo): MembroSugerido[] {
  const defaults = TIPO_DEFAULTS[tipo];
  if (!defaults) return [];
  return defaults.equipeIndices
    .filter((i) => i < EQUIPE_DISPONIVEL.length)
    .map((i) => EQUIPE_DISPONIVEL[i]);
}

/** Format centavos to BRL display */
export function fmtBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Format a BRL currency input string */
export function formatCurrencyInput(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Parse BRL currency string to number */
export function parseCurrencyToNumber(v: string): number {
  return parseFloat(v.replace(/\D/g, "")) / 100 || 0;
}

/** Calculate delivery date display */
export function calcPrazoEntrega(dataEvento: string, dias: number): string {
  if (!dataEvento) return "";
  const d = new Date(new Date(dataEvento).getTime() + dias * 86400000);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Calculate prazo entrega ISO */
export function calcPrazoEntregaISO(dataEvento: string, dias: number): string {
  if (!dataEvento) return "";
  const d = new Date(new Date(dataEvento).getTime() + dias * 86400000);
  return d.toISOString().slice(0, 10);
}

/** Generate entry date (same day as creation or 7 days from now) */
export function defaultEntradaData(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Generate first installment date (30 days from event) */
export function defaultPrimeiraParcelaData(dataEvento: string): string {
  if (!dataEvento) {
    return new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  }
  // First installment 7 days before event
  const d = new Date(new Date(dataEvento).getTime() - 7 * 86400000);
  return d.toISOString().slice(0, 10);
}

/* ── Summary calculation ── */

export interface ProjectSummary {
  titulo: string;
  tipo: ProjetoTipo;
  cliente: string;
  contato: string;
  dataEvento: string;
  horario: string;
  local: string;
  localEndereco: string;
  equipeCount: number;
  pacoteNome: string;
  servicosCount: number;
  servicosNomes: string[];
  prazoDias: number;
  prazoEntrega: string;
  valorTotal: number;
  entradaValor: number;
  parcelasCount: number;
  parcelaValor: number;
  formaPagamento: string;
  /** How many tabs will be auto-populated */
  tabsPopuladas: number;
}

const FORMA_LABELS: Record<string, string> = {
  pix: "PIX",
  cartao: "Cartão",
  boleto: "Boleto",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};

export function buildSummary(opts: {
  titulo: string;
  tipo: ProjetoTipo;
  cliente: string;
  contato: string;
  dataEvento: string;
  horaInicio: string;
  horaFim: string;
  localNome: string;
  localEndereco: string;
  equipeCount: number;
  pacoteNome: string;
  servicosIds: string[];
  servicosNomesMap: Record<string, string>;
  prazoDias: number;
  valorTotal: number;
  entradaPercent: number;
  parcelas: number;
  formaPagamento: FormaPagamento;
}): ProjectSummary {
  const entradaValor = opts.valorTotal * (opts.entradaPercent / 100);
  const restante = Math.max(0, opts.valorTotal - entradaValor);
  const parcelaValor = opts.parcelas > 0 ? restante / opts.parcelas : 0;

  // Count populated tabs
  let tabs = 1; // Cadastro always
  if (opts.valorTotal > 0) tabs++; // Financeiro
  if (opts.servicosIds.length > 0) tabs++; // Produção
  tabs++; // Galeria (always auto)

  return {
    titulo: opts.titulo,
    tipo: opts.tipo,
    cliente: opts.cliente,
    contato: opts.contato,
    dataEvento: opts.dataEvento,
    horario: `${opts.horaInicio} — ${opts.horaFim}`,
    local: opts.localNome,
    localEndereco: opts.localEndereco,
    equipeCount: opts.equipeCount,
    pacoteNome: opts.pacoteNome,
    servicosCount: opts.servicosIds.length,
    servicosNomes: opts.servicosIds.map(
      (id) => opts.servicosNomesMap[id] || id,
    ),
    prazoDias: opts.prazoDias,
    prazoEntrega: calcPrazoEntrega(opts.dataEvento, opts.prazoDias),
    valorTotal: opts.valorTotal,
    entradaValor,
    parcelasCount: opts.parcelas,
    parcelaValor,
    formaPagamento: FORMA_LABELS[opts.formaPagamento] || opts.formaPagamento,
    tabsPopuladas: tabs,
  };
}