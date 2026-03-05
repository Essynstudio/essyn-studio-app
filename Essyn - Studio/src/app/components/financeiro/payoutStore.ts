import type { StatusParcela } from "../ui/status-badge";
import type {
  AcaoFinanceira,
  AcaoTipo,
  AcaoUrgencia,
  MetodoPagamento,
  NfStatus,
  Comprovante,
  TipoLinha,
} from "../ui/action-row-item";

/* ═══════════════════════════════════════════════════ */
/*  Payout Store — Repasses equipe/freela              */
/*  Persistence: localStorage essyn:payoutState        */
/*  Integrates with Financeiro Hoje + Pagar + Drawer   */
/* ═══════════════════════════════════════════════════ */

const STORAGE_KEY = "essyn:payoutState";
const TODAY_ISO = "2026-02-23";

/* ── Types ── */

export type PayoutStatus = "pendente" | "pago";
export type PayoutMethod = "PIX" | "Cartao" | "Boleto" | "Transferencia" | "Dinheiro";

export interface Payout {
  id: string;
  projectId: string;
  receiverName: string;
  role: string;
  amountCents: number;
  dueDateISO: string;
  dueDateDisplay: string;
  paidAtISO?: string;
  status: PayoutStatus;
  method?: PayoutMethod;
  hasReceipt: boolean;
  projetoNome: string;
  clienteNome: string;
}

export interface PayoutState {
  payouts: Payout[];
}

/* ── Display helpers ── */

const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function fmtDateBR(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function centsToBRL(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── Persistence ── */

function loadState(): PayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Seed with mock data on first load
  const seeded = seedMockPayouts();
  saveState(seeded);
  return seeded;
}

function saveState(state: PayoutState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded */ }
}

/* ── Mock seed data ── */

function seedMockPayouts(): PayoutState {
  return {
    payouts: [
      {
        id: "payout-001",
        projectId: "proj-006",
        receiverName: "Roberto Silva",
        role: "2º Fotógrafo",
        amountCents: 120000,
        dueDateISO: "2026-02-25",
        dueDateDisplay: fmtDateBR("2026-02-25"),
        status: "pendente",
        method: "PIX",
        hasReceipt: false,
        projetoNome: "Formatura Direito UFMG",
        clienteNome: "Carla Dias",
      },
      {
        id: "payout-002",
        projectId: "proj-009",
        receiverName: "Camila Santos",
        role: "Editora de fotos",
        amountCents: 90000,
        dueDateISO: "2026-03-01",
        dueDateDisplay: fmtDateBR("2026-03-01"),
        status: "pendente",
        method: "Transferencia",
        hasReceipt: false,
        projetoNome: "Casamento Ferreira & Lima",
        clienteNome: "Julia Ferreira",
      },
      {
        id: "payout-003",
        projectId: "proj-003",
        receiverName: "Lucas Mendes",
        role: "Assistente",
        amountCents: 50000,
        dueDateISO: "2026-02-20",
        dueDateDisplay: fmtDateBR("2026-02-20"),
        paidAtISO: "2026-02-20",
        status: "pago",
        method: "PIX",
        hasReceipt: true,
        projetoNome: "15 Anos Isabela Mendes",
        clienteNome: "Renata Mendes",
      },
      {
        id: "payout-004",
        projectId: "proj-001",
        receiverName: "Fernando Costa",
        role: "Filmmaker",
        amountCents: 200000,
        dueDateISO: "2026-02-15",
        dueDateDisplay: fmtDateBR("2026-02-15"),
        status: "pendente",
        method: "PIX",
        hasReceipt: false,
        projetoNome: "Casamento Oliveira & Santos",
        clienteNome: "Ana Oliveira",
      },
      {
        id: "payout-005",
        projectId: "proj-002",
        receiverName: "Mariana Alves",
        role: "2ª Fotógrafa",
        amountCents: 80000,
        dueDateISO: "2026-02-10",
        dueDateDisplay: fmtDateBR("2026-02-10"),
        paidAtISO: "2026-02-10",
        status: "pago",
        method: "Transferencia",
        hasReceipt: true,
        projetoNome: "Corporativo TechBR",
        clienteNome: "TechBR Soluções",
      },
      {
        id: "payout-006",
        projectId: "proj-006",
        receiverName: "Juliana Pereira",
        role: "Editora de fotos",
        amountCents: 75000,
        dueDateISO: "2026-02-28",
        dueDateDisplay: fmtDateBR("2026-02-28"),
        status: "pendente",
        method: "PIX",
        hasReceipt: false,
        projetoNome: "Formatura Direito UFMG",
        clienteNome: "Carla Dias",
      },
    ],
  };
}

/* ═══════════════════════════════════════════════════ */
/*  CRUD                                               */
/* ═══════════════════════════════════════════════════ */

export function getAllPayouts(): Payout[] {
  return loadState().payouts;
}

export function getPayoutsByProject(projectId: string): Payout[] {
  return loadState().payouts.filter((p) => p.projectId === projectId);
}

export function createPayout(data: Omit<Payout, "id" | "status" | "hasReceipt" | "dueDateDisplay">): Payout {
  const state = loadState();
  const payout: Payout = {
    ...data,
    id: `payout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dueDateDisplay: fmtDateBR(data.dueDateISO),
    status: "pendente",
    hasReceipt: false,
  };
  state.payouts.push(payout);
  saveState(state);
  return payout;
}

export function markPayoutPaid(
  id: string,
  paidAtISO: string,
  method?: PayoutMethod,
  hasReceipt?: boolean,
): PayoutState {
  const state = loadState();
  const payout = state.payouts.find((p) => p.id === id);
  if (payout) {
    payout.status = "pago";
    payout.paidAtISO = paidAtISO;
    if (method) payout.method = method;
    if (hasReceipt !== undefined) payout.hasReceipt = hasReceipt;
  }
  saveState(state);
  return state;
}

export function remarcarPayout(id: string, newDateISO: string): PayoutState {
  const state = loadState();
  const payout = state.payouts.find((p) => p.id === id);
  if (payout) {
    payout.dueDateISO = newDateISO;
    payout.dueDateDisplay = fmtDateBR(newDateISO);
  }
  saveState(state);
  return state;
}

/* ═══════════════════════════════════════════════════ */
/*  Derived status (maps to StatusParcela)             */
/* ═══════════════════════════════════════════════════ */

export function derivePayoutStatusParcela(p: Payout): StatusParcela {
  if (p.status === "pago") return "paga";
  if (p.dueDateISO < TODAY_ISO) return "vencida";
  if (p.dueDateISO === TODAY_ISO) return "vence_hoje";
  return "prevista";
}

/* ═══════════════════════════════════════════════════ */
/*  Converters — to AcaoFinanceira (for Hoje tab)      */
/* ═══════════════════════════════════════════════════ */

export function payoutsToAcoes(): AcaoFinanceira[] {
  const payouts = getAllPayouts().filter((p) => p.status === "pendente");

  return payouts.map((p): AcaoFinanceira => {
    const statusParcela = derivePayoutStatusParcela(p);
    let urgencia: AcaoUrgencia = "repasse";
    // Overdue payouts should show as "atrasada" for prominence, or keep as repasse?
    // Keep as "repasse" for the chip filter to work correctly
    if (p.dueDateISO < TODAY_ISO) urgencia = "repasse"; // still repasse but overdue

    return {
      id: p.id,
      tipoLinha: "repasse" as TipoLinha,
      projeto: p.projetoNome,
      cliente: p.clienteNome,
      descricao: `Repasse ${p.role} — ${p.receiverName}`,
      valor: p.amountCents / 100,
      urgencia,
      tipo: "pagar" as AcaoTipo,
      vencimento: p.dueDateDisplay,
      projetoId: p.projectId,
      metodo: (p.method?.toLowerCase() || "pix") as MetodoPagamento,
      nfStatus: "na" as NfStatus,
      comprovante: (p.hasReceipt ? "sim" : "nao") as Comprovante,
      statusParcela,
    };
  });
}

/* ═══════════════════════════════════════════════════ */
/*  Converter — to Despesa (for Pagar tab)             */
/*  Returns shape matching PagarContent's Despesa      */
/* ═══════════════════════════════════════════════════ */

export interface DespesaRepasse {
  id: string;
  descricao: string;
  fornecedor: string;
  categoria: "fornecedor" | "equipe" | "operacional";
  tipo: "fixa" | "evento" | "avulsa" | "repasse";
  projeto?: string;
  projetoId?: string;
  valor: number;
  vencimento: string;
  vencimentoISO: string;
  status: StatusParcela;
  metodo: string;
  nf: "emitida" | "pendente" | "na";
  comprovante: "sim" | "nao";
  diasAtraso?: number;
  isRepasse: true;
  payoutId: string;
  receiverName: string;
  role: string;
}

export function payoutsToDespesas(): DespesaRepasse[] {
  const payouts = getAllPayouts();

  return payouts.map((p): DespesaRepasse => {
    const status = derivePayoutStatusParcela(p);
    const diasAtraso =
      p.dueDateISO < TODAY_ISO && p.status === "pendente"
        ? Math.floor(
            (new Date(TODAY_ISO + "T12:00:00").getTime() -
              new Date(p.dueDateISO + "T12:00:00").getTime()) /
              86400000,
          )
        : undefined;

    return {
      id: p.id,
      descricao: `${p.role} — ${p.receiverName}`,
      fornecedor: p.receiverName,
      categoria: "equipe",
      tipo: "repasse",
      projeto: p.projetoNome,
      projetoId: p.projectId,
      valor: p.amountCents / 100,
      vencimento: p.dueDateDisplay,
      vencimentoISO: p.dueDateISO,
      status,
      metodo: p.method || "PIX",
      nf: "na",
      comprovante: p.hasReceipt ? "sim" : "nao",
      diasAtraso,
      isRepasse: true,
      payoutId: p.id,
      receiverName: p.receiverName,
      role: p.role,
    };
  });
}

/* ── Method labels ── */

export const METHOD_LABELS: Record<PayoutMethod, string> = {
  PIX: "PIX",
  Cartao: "Cartão",
  Boleto: "Boleto",
  Transferencia: "Transferência",
  Dinheiro: "Dinheiro",
};

/* ── Role options ── */

export const ROLE_OPTIONS = [
  "2º Fotógrafo",
  "2ª Fotógrafa",
  "Filmmaker",
  "Editor(a)",
  "Assistente",
  "Drone",
  "DJ / Som",
  "Maquiagem",
  "Outro",
];