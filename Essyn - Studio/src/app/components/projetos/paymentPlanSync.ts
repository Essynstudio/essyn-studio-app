import type { StatusParcela } from "../ui/status-badge";
import type { AcaoFinanceira, AcaoTipo, AcaoUrgencia, MetodoPagamento, NfStatus, Comprovante, TipoLinha } from "../ui/action-row-item";

/* ═══════════════════════════════════════════════════ */
/*  PaymentPlan — Type definitions                     */
/*  Plano de pagamento vinculado a um Projeto          */
/* ═══════════════════════════════════════════════════ */

export type FormaPagamento = "pix" | "cartao" | "boleto" | "transferencia" | "dinheiro";

export interface PaymentPlan {
  /** Valor total do contrato (em centavos ou inteiro) */
  valorTotal: number;
  /** Percentual de entrada (0–100) */
  entradaPercent: number;
  /** Data de vencimento da entrada (ISO YYYY-MM-DD) */
  entradaData: string;
  /** Forma de pagamento principal */
  formaPagamento: FormaPagamento;
  /** Quantidade de parcelas do restante (default 1) */
  numeroParcelas: number;
  /** Data da primeira parcela (ISO YYYY-MM-DD) */
  primeiraParcelaData: string;
  /** Intervalo entre parcelas em meses (default 1) */
  intervaloMeses: number;
  /** Status do plano */
  status?: "rascunho" | "ativo";
}

/* ═══════════════════════════════════════════════════ */
/*  GeneratedParcela — Parcela gerada pela sync        */
/* ═══════════════════════════════════════════════════ */

export interface GeneratedParcela {
  id: string;
  projectId: string;
  tipo: "entrada" | "parcela";
  numero: number;
  totalParcelas: number;
  valor: number;
  vencimento: string;       // ISO YYYY-MM-DD
  vencimentoDisplay: string; // "15 Fev 2026"
  status: StatusParcela;
  formaPagamento: FormaPagamento;
  nfStatus: NfStatus;
  comprovante: Comprovante;
  projetoNome: string;
  clienteNome: string;
  /** Optional: data in which it was paid */
  dataPagamento?: string;
}

/* ═══════════════════════════════════════════════════ */
/*  Helpers                                            */
/* ═══════════════════════════════════════════════════ */

const TODAY_ISO = "2026-02-23"; // Monday, February 23, 2026

function fmtDateBR(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function calcStatus(vencimentoISO: string, isPaid: boolean): StatusParcela {
  if (isPaid) return "paga";
  if (vencimentoISO === TODAY_ISO) return "vence_hoje";
  if (vencimentoISO < TODAY_ISO) return "vencida";
  return "prevista";
}

function diasAtraso(vencimentoISO: string): number {
  const venc = new Date(vencimentoISO + "T12:00:00").getTime();
  const hoje = new Date(TODAY_ISO + "T12:00:00").getTime();
  if (venc >= hoje) return 0;
  return Math.round((hoje - venc) / 86400000);
}

/** Map FormaPagamento → MetodoPagamento (action-row-item compat) */
function toMetodo(f: FormaPagamento): MetodoPagamento {
  if (f === "dinheiro") return "pix"; // fallback — dinheiro not in MetodoPagamento
  return f as MetodoPagamento;
}

/** Determine CTA action based on parcela status */
function ctaForStatus(status: StatusParcela): AcaoTipo {
  switch (status) {
    case "vencida": return "cobrar";
    case "vence_hoje": return "cobrar";
    case "paga": return "marcar_pago";
    case "conciliada": return "marcar_pago";
    case "prevista": return "lembrete";
    case "cancelada": return "lembrete";
    default: return "lembrete";
  }
}

/** Determine urgency from status */
function urgenciaForStatus(status: StatusParcela): AcaoUrgencia {
  switch (status) {
    case "vencida": return "atrasada";
    case "vence_hoje": return "hoje";
    case "prevista": return "pendencia";
    case "paga": return "pendencia";
    case "conciliada": return "pendencia";
    case "cancelada": return "alerta";
    default: return "pendencia";
  }
}

export function fmtBRL(n: number): string {
  if (n >= 1000) {
    return `R$ ${Math.floor(n).toLocaleString("pt-BR")}`;
  }
  return `R$ ${n}`;
}

/** Convert cents → BRL display string */
export function centsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Convert BRL display string → cents (integer) */
export function brlToCents(display: string): number {
  const digits = display.replace(/\D/g, "");
  return parseInt(digits, 10) || 0;
}

/**
 * Compute status from dates (pure function).
 * @param dueDateISO  ISO date string YYYY-MM-DD
 * @param paidAtISO   ISO date string if paid, undefined otherwise
 * @returns StatusParcela
 */
export function computeStatusByDates(dueDateISO: string, paidAtISO?: string): StatusParcela {
  if (paidAtISO) return "paga";
  if (dueDateISO === TODAY_ISO) return "vence_hoje";
  if (dueDateISO < TODAY_ISO) return "vencida";
  return "prevista";
}

/**
 * Derive badge counts from a list of GeneratedParcela.
 * Useful for KPIs, tabs, and filter chips.
 */
export interface FinanceBadgeCounts {
  total: number;
  pagas: number;
  vencidas: number;
  venceHoje: number;
  previstas: number;
  canceladas: number;
  totalValor: number;
  totalRecebido: number;
  totalAReceber: number;
  totalVencido: number;
}

export function deriveFinanceBadgesCounts(entries: GeneratedParcela[]): FinanceBadgeCounts {
  const counts: FinanceBadgeCounts = {
    total: entries.length,
    pagas: 0,
    vencidas: 0,
    venceHoje: 0,
    previstas: 0,
    canceladas: 0,
    totalValor: 0,
    totalRecebido: 0,
    totalAReceber: 0,
    totalVencido: 0,
  };

  for (const e of entries) {
    counts.totalValor += e.valor;
    switch (e.status) {
      case "paga":
      case "conciliada":
        counts.pagas++;
        counts.totalRecebido += e.valor;
        break;
      case "vencida":
        counts.vencidas++;
        counts.totalAReceber += e.valor;
        counts.totalVencido += e.valor;
        break;
      case "vence_hoje":
        counts.venceHoje++;
        counts.totalAReceber += e.valor;
        break;
      case "prevista":
        counts.previstas++;
        counts.totalAReceber += e.valor;
        break;
      case "cancelada":
        counts.canceladas++;
        break;
    }
  }

  return counts;
}

/** Label map for FormaPagamento display */
export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  pix: "PIX",
  cartao: "Cartão",
  boleto: "Boleto",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};

/* ═══════════════════════════════════════════════════ */
/*  Persistence v1 — localStorage                     */
/*                                                     */
/*  Persist paymentPlans + paid parcela IDs so data    */
/*  survives page refresh.                              */
/* ═══════════════════════════════════════════════════ */

const STORAGE_KEY_PLANS = "essyn:paymentPlans";
const STORAGE_KEY_PAID = "essyn:paidParcelaIds";
const STORAGE_KEY_CONCILIADA = "essyn:conciliadaParcelaIds";
const STORAGE_KEY_META = "essyn:projectMeta";
const STORAGE_KEY_NF = "essyn:nfState";
const STORAGE_KEY_NF_EXPORT = "essyn:nfExportBatches";

/** Metadata for dynamically created projects (not in static projetosData) */
export interface ProjectMeta {
  nome: string;
  cliente: string;
  dataISO?: string;
}

function loadPlansFromStorage(): Record<string, PaymentPlan> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function savePlansToStorage(plans: Record<string, PaymentPlan>) {
  try {
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  } catch { /* quota exceeded — ignore */ }
}

function loadPaidIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAID);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch { return new Set(); }
}

export { loadPaidIds };

export function savePaidIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY_PAID, JSON.stringify([...ids]));
  } catch { /* quota exceeded — ignore */ }
}

/* ── Conciliada persistence ── */

function loadConciliadaIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONCILIADA);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch { return new Set(); }
}

export { loadConciliadaIds };

export function saveConciliadaIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY_CONCILIADA, JSON.stringify([...ids]));
  } catch { /* quota exceeded — ignore */ }
}

/**
 * Mark a parcela as conciliada (bank reconciliation confirmed).
 * Also marks it as paid if not already.
 */
export function markParcelaConciliada(parcelaId: string) {
  const conciliadaIds = loadConciliadaIds();
  conciliadaIds.add(parcelaId);
  saveConciliadaIds(conciliadaIds);

  // Also mark as paid
  const paidIds = loadPaidIds();
  paidIds.add(parcelaId);
  savePaidIds(paidIds);
}

/**
 * Remove conciliada status from a parcela.
 */
export function unmarkParcelaConciliada(parcelaId: string) {
  const conciliadaIds = loadConciliadaIds();
  conciliadaIds.delete(parcelaId);
  saveConciliadaIds(conciliadaIds);
}

function loadProjectMeta(): Record<string, ProjectMeta> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_META);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
}

function saveProjectMeta(meta: Record<string, ProjectMeta>) {
  try {
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify(meta));
  } catch { /* quota exceeded */ }
}

/* ═══════════════════════════════════════════════════ */
/*  NF State Store — persist NF status per parcela     */
/*  Overrides computed nfStatus from sync when user    */
/*  explicitly marks NF emitida / enviado_contador     */
/* ═══════════════════════════════════════════════════ */

export interface NfStateEntry {
  nfStatus: NfStatus;
  nfNumber?: string;
  nfIssuedAtISO?: string;
  accountantExportBatchId?: string;
}

export function loadNfStore(): Record<string, NfStateEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NF);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
}

export function saveNfStore(store: Record<string, NfStateEntry>) {
  try {
    localStorage.setItem(STORAGE_KEY_NF, JSON.stringify(store));
  } catch { /* quota exceeded */ }
}

export function getNfState(parcelaId: string): NfStateEntry | undefined {
  return loadNfStore()[parcelaId];
}

export function setNfState(parcelaId: string, patch: Partial<NfStateEntry>) {
  const store = loadNfStore();
  const existing = store[parcelaId] || { nfStatus: "pendente" as NfStatus };
  store[parcelaId] = { ...existing, ...patch };
  saveNfStore(store);
}

export function setNfStateBulk(ids: string[], patch: Partial<NfStateEntry>) {
  const store = loadNfStore();
  for (const id of ids) {
    const existing = store[id] || { nfStatus: "pendente" as NfStatus };
    store[id] = { ...existing, ...patch };
  }
  saveNfStore(store);
}

/* ── NF Export Batches ── */

export interface NfExportBatch {
  id: string;
  createdAtISO: string;
  createdAtDisplay: string;
  period: string;
  format: string;
  itemCount: number;
  totalValor: number;
}

export function loadNfExportBatches(): NfExportBatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NF_EXPORT);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

export function saveNfExportBatch(batch: NfExportBatch) {
  try {
    const batches = loadNfExportBatches();
    batches.unshift(batch);
    localStorage.setItem(STORAGE_KEY_NF_EXPORT, JSON.stringify(batches.slice(0, 20)));
  } catch { /* quota exceeded */ }
}

/**
 * Get the persisted payment plans, falling back to the seed data.
 * On first load, the seed is written to localStorage.
 */
export function getPersistedPlans(): Record<string, PaymentPlan> {
  const stored = loadPlansFromStorage();
  if (stored && Object.keys(stored).length > 0) return stored;
  // First load → seed to localStorage
  savePlansToStorage(projectPaymentPlans);
  return { ...projectPaymentPlans };
}

/**
 * Update a single project's payment plan and persist.
 * Optionally store project metadata for dynamic projects.
 */
export function upsertPaymentPlan(projectId: string, plan: PaymentPlan, meta?: ProjectMeta) {
  const all = getPersistedPlans();
  all[projectId] = plan;
  savePlansToStorage(all);
  if (meta) {
    const allMeta = loadProjectMeta();
    allMeta[projectId] = meta;
    saveProjectMeta(allMeta);
  }
}

/* ═══════════════════════════════════════════════════ */
/*  syncProjectPaymentPlanToFinance                    */
/*                                                     */
/*  Gera parcelas a partir do PaymentPlan de um proj.  */
/*  IDs estáveis: projectId + tipo + índice            */
/*  Status automático baseado em data vs TODAY_ISO     */
/* ═══════════════════════════════════════════════════ */

export function syncProjectPaymentPlanToFinance(
  projectId: string,
  plan: PaymentPlan,
  projetoNome: string,
  clienteNome: string,
  /** Parcelas already marked as paid (ids) */
  paidIds: Set<string> = new Set(),
): GeneratedParcela[] {
  const result: GeneratedParcela[] = [];

  const entradaAmount = plan.entradaPercent > 0
    ? Math.round(plan.valorTotal * (plan.entradaPercent / 100))
    : 0;
  const restante = plan.valorTotal - entradaAmount;
  const n = Math.max(1, plan.numeroParcelas);
  const valorParcela = Math.round(restante / n);

  // Total number of line items (entrada counts as 1 if present)
  const totalItems = (entradaAmount > 0 ? 1 : 0) + n;

  // ── Entrada ──
  if (entradaAmount > 0) {
    const id = `${projectId}-entrada`;
    const isPaid = paidIds.has(id) || plan.entradaData < TODAY_ISO;
    // For mock realism: entrada before today is auto-paid
    const status = calcStatus(plan.entradaData, isPaid);
    result.push({
      id,
      projectId,
      tipo: "entrada",
      numero: 1,
      totalParcelas: totalItems,
      valor: entradaAmount,
      vencimento: plan.entradaData,
      vencimentoDisplay: fmtDateBR(plan.entradaData),
      status,
      formaPagamento: plan.formaPagamento,
      nfStatus: isPaid ? "emitida" : "pendente",
      comprovante: isPaid ? "sim" : "nao",
      projetoNome,
      clienteNome,
      dataPagamento: isPaid ? fmtDateBR(plan.entradaData) : undefined,
    });
  }

  // ── Parcelas ──
  for (let i = 0; i < n; i++) {
    const id = `${projectId}-parc-${i + 1}`;
    const parcelaDate = new Date(plan.primeiraParcelaData + "T12:00:00");
    parcelaDate.setMonth(parcelaDate.getMonth() + i * plan.intervaloMeses);
    // Clamp day to avoid month overflow
    const day = new Date(plan.primeiraParcelaData + "T12:00:00").getDate();
    parcelaDate.setDate(Math.min(day, 28));
    const vencISO = parcelaDate.toISOString().slice(0, 10);

    // Last parcela absorbs rounding difference
    const val = i === n - 1 ? restante - valorParcela * (n - 1) : valorParcela;

    const isPaid = paidIds.has(id) || vencISO < TODAY_ISO;
    const status = calcStatus(vencISO, isPaid);

    result.push({
      id,
      projectId,
      tipo: "parcela",
      numero: (entradaAmount > 0 ? 2 : 1) + i,
      totalParcelas: totalItems,
      valor: Math.max(0, val),
      vencimento: vencISO,
      vencimentoDisplay: vencISO === TODAY_ISO ? "Hoje" : fmtDateBR(vencISO),
      status,
      formaPagamento: plan.formaPagamento,
      nfStatus: isPaid ? "emitida" : (status === "vencida" ? "pendente" : "na"),
      comprovante: isPaid ? "sim" : "nao",
      projetoNome,
      clienteNome,
      dataPagamento: isPaid ? fmtDateBR(vencISO) : undefined,
    });
  }

  return result;
}

/* ═══════════════════════════════════════════════════ */
/*  parcelaToAcaoFinanceira                            */
/*  Convert GeneratedParcela → AcaoFinanceira          */
/*  for use in ActionRowItem / FinanceiroHojeContent    */
/* ═══════════════════════════════════════════════════ */

export function parcelaToAcaoFinanceira(p: GeneratedParcela): AcaoFinanceira {
  const atraso = diasAtraso(p.vencimento);
  const parcelaLabel = p.tipo === "entrada"
    ? "Entrada"
    : `${p.numero}/${p.totalParcelas}`;

  return {
    id: p.id,
    tipoLinha: "receber" as TipoLinha,
    projeto: p.projetoNome,
    cliente: p.clienteNome,
    descricao: p.tipo === "entrada"
      ? `Entrada — ${p.formaPagamento.toUpperCase()}`
      : `Parcela ${parcelaLabel} — vence ${p.vencimentoDisplay}`,
    valor: p.valor,
    urgencia: urgenciaForStatus(p.status),
    tipo: ctaForStatus(p.status),
    vencimento: p.vencimentoDisplay,
    parcela: parcelaLabel,
    diasAtraso: atraso > 0 ? atraso : undefined,
    projetoId: p.projectId,
    metodo: toMetodo(p.formaPagamento),
    nfStatus: p.nfStatus,
    comprovante: p.comprovante,
    statusParcela: p.status,
  };
}

/* ═══════════════════════════════════════════════════ */
/*  Pre-seeded PaymentPlans for existing mock projects */
/* ═══════════════════════════════════════════════════ */

export const projectPaymentPlans: Record<string, PaymentPlan> = {
  "proj-001": {
    valorTotal: 8500,
    entradaPercent: 20,
    entradaData: "2025-12-15",
    formaPagamento: "pix",
    numeroParcelas: 3,
    primeiraParcelaData: "2026-01-15",
    intervaloMeses: 1,
    status: "ativo",
  },
  "proj-002": {
    valorTotal: 4200,
    entradaPercent: 50,
    entradaData: "2026-01-22",
    formaPagamento: "boleto",
    numeroParcelas: 1,
    primeiraParcelaData: "2026-03-22",
    intervaloMeses: 1,
    status: "ativo",
  },
  "proj-003": {
    valorTotal: 3800,
    entradaPercent: 30,
    entradaData: "2025-11-28",
    formaPagamento: "cartao",
    numeroParcelas: 2,
    primeiraParcelaData: "2026-01-28",
    intervaloMeses: 1,
    status: "ativo",
  },
  "proj-004": {
    valorTotal: 1800,
    entradaPercent: 50,
    entradaData: "2025-12-05",
    formaPagamento: "pix",
    numeroParcelas: 1,
    primeiraParcelaData: "2026-02-23",
    intervaloMeses: 1,
    status: "ativo",
  },
  "proj-005": {
    valorTotal: 1200,
    entradaPercent: 0,
    entradaData: "",
    formaPagamento: "pix",
    numeroParcelas: 1,
    primeiraParcelaData: "2026-01-10",
    intervaloMeses: 1,
    status: "ativo",
  },
  "proj-006": {
    valorTotal: 6500,
    entradaPercent: 20,
    entradaData: "2025-10-12",
    formaPagamento: "boleto",
    numeroParcelas: 4,
    primeiraParcelaData: "2025-11-12",
    intervaloMeses: 1,
    status: "ativo",
  },
  "proj-009": {
    valorTotal: 12000,
    entradaPercent: 25,
    entradaData: "2025-11-21",
    formaPagamento: "transferencia",
    numeroParcelas: 3,
    primeiraParcelaData: "2025-12-21",
    intervaloMeses: 1,
    status: "ativo",
  },
};

/* ═══════════════════════════════════════════════════ */
/*  getAllSyncedParcelas                                */
/*  Collect all parcelas from all seeded projects      */
/* ═══════════════════════════════════════════════════ */

import { projetos } from "./projetosData";

export function getAllSyncedParcelas(): GeneratedParcela[] {
  const all: GeneratedParcela[] = [];
  const plans = getPersistedPlans();
  const paidIds = loadPaidIds();
  const conciliadaIds = loadConciliadaIds();
  const meta = loadProjectMeta();
  const nfStore = loadNfStore();
  const processed = new Set<string>();

  // First: process known projects from static data
  for (const proj of projetos) {
    const plan = plans[proj.id];
    if (!plan) continue;
    processed.add(proj.id);
    all.push(
      ...syncProjectPaymentPlanToFinance(proj.id, plan, proj.nome, proj.cliente, paidIds)
    );
  }

  // Second: process dynamic projects (created via Modal, not in static data)
  for (const [projId, plan] of Object.entries(plans)) {
    if (processed.has(projId)) continue;
    const m = meta[projId];
    if (!m) continue;
    all.push(
      ...syncProjectPaymentPlanToFinance(projId, plan, m.nome, m.cliente, paidIds)
    );
  }

  // Apply NF state overrides from localStorage
  for (const p of all) {
    const nfOverride = nfStore[p.id];
    if (nfOverride) {
      p.nfStatus = nfOverride.nfStatus;
    }
  }

  // Apply conciliada overrides from localStorage
  for (const p of all) {
    if (conciliadaIds.has(p.id)) {
      p.status = "conciliada";
    }
  }

  return all;
}

export function getAllSyncedAcoes(): AcaoFinanceira[] {
  return getAllSyncedParcelas().map(parcelaToAcaoFinanceira);
}