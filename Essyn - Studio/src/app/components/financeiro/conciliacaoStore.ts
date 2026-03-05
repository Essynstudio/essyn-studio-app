import { getAllSyncedParcelas, markParcelaConciliada, type GeneratedParcela } from "../projetos/paymentPlanSync";

/* ═══════════════════════════════════════════════════ */
/*  Conciliação Store — BankTxn + match engine         */
/*  Persistence: localStorage essyn:conciliacaoState   */
/*  Match rules: Xero-style suggestMatch               */
/* ═══════════════════════════════════════════════════ */

const STORAGE_KEY = "essyn:conciliacaoState";

/* ── Types ── */

export type MatchConfidence = "alta" | "media" | "baixa";
export type TxnStatus = "pendente" | "sugerida" | "conciliada" | "ignorada";

export interface BankTxn {
  id: string;
  dateISO: string;
  dateDisplay: string;
  description: string;
  amountCents: number; // positive = entrada, negative = saída
  direction: "in" | "out";
  matched: boolean;
  matchedEntryId?: string;
  suggestedEntryId?: string;
  suggestedConfidence?: MatchConfidence;
  suggestedLabel?: string;
  ignored: boolean;
  detectedMethod?: string; // PIX, TED, Boleto, Cartão
  detectedCategory?: string; // Software, Assistente, etc.
  account: string;
}

export interface ConciliacaoState {
  transactions: BankTxn[];
  lastImportISO?: string;
  lastImportDisplay?: string;
}

/* ── Persistence ── */

export function loadConciliacaoState(): ConciliacaoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { transactions: [] };
    return JSON.parse(raw);
  } catch {
    return { transactions: [] };
  }
}

export function saveConciliacaoState(state: ConciliacaoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded */
  }
}

/* ── Date helpers ── */

function fmtDateBR(iso: string): string {
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const d = new Date(iso + "T12:00:00");
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`;
}

/* ── Method detection rules ── */

function detectMethod(desc: string): string | undefined {
  const d = desc.toUpperCase();
  if (d.includes("PIX")) return "PIX";
  if (d.includes("TED")) return "TED";
  if (d.includes("BOLETO") || d.includes("BOL")) return "Boleto";
  if (d.includes("CARTAO") || d.includes("CARTÃO") || d.includes("*CC") || d.includes("VISA") || d.includes("MASTERCARD")) return "Cartão";
  if (d.includes("DOC")) return "DOC";
  return undefined;
}

/* ── Category detection rules (recurring) ── */

function detectCategory(desc: string): string | undefined {
  const d = desc.toUpperCase();
  if (d.includes("ADOBE") || d.includes("CREATIVE CLOUD")) return "Software";
  if (d.includes("SPOTIFY") || d.includes("NETFLIX")) return "Assinatura";
  if (d.includes("ALUGUEL") || d.includes("LOCAÇÃO")) return "Aluguel";
  if (d.includes("TARIFA") || d.includes("MANUT")) return "Taxa bancária";
  if (d.includes("SEGURO")) return "Seguro";
  if (d.includes("LUZ") || d.includes("CPFL") || d.includes("CEMIG") || d.includes("ENEL")) return "Energia";
  if (d.includes("INTERNET") || d.includes("VIVO") || d.includes("CLARO") || d.includes("TIM")) return "Telecom";
  return undefined;
}

/* ═══════════════════════════════════════════════════ */
/*  suggestMatch — Simple rule-based match engine      */
/*  Returns suggested parcela + confidence             */
/* ═══════════════════════════════════════════════════ */

export interface MatchSuggestion {
  entryId: string;
  label: string;
  confidence: MatchConfidence;
}

export function suggestMatch(
  txn: BankTxn,
  parcelas: GeneratedParcela[],
): MatchSuggestion | null {
  // Only match incoming txns to receivables, outgoing to payables (future)
  if (txn.direction === "out") return null;
  if (txn.amountCents <= 0) return null;

  const txnAmount = txn.amountCents;
  const txnDate = txn.dateISO;
  const txnDesc = txn.description.toUpperCase();

  let bestMatch: MatchSuggestion | null = null;
  let bestScore = 0;

  for (const p of parcelas) {
    // Skip already conciliada or cancelada
    if (p.status === "cancelada") continue;

    const parcelaAmountCents = p.valor * 100;
    const clienteUpper = p.clienteNome.toUpperCase();
    const projetoUpper = p.projetoNome.toUpperCase();

    let score = 0;
    const reasons: string[] = [];

    // Rule 1: Exact amount match (strongest signal)
    if (txnAmount === parcelaAmountCents) {
      score += 50;
      reasons.push("valor");
    } else {
      // Close amount (within 5%)
      const diff = Math.abs(txnAmount - parcelaAmountCents) / parcelaAmountCents;
      if (diff < 0.05) {
        score += 20;
        reasons.push("valor~");
      }
    }

    // Rule 2: Date match (within 3 days)
    const txnD = new Date(txnDate + "T12:00:00").getTime();
    const parcD = new Date(p.vencimento + "T12:00:00").getTime();
    const daysDiff = Math.abs(txnD - parcD) / 86400000;
    if (daysDiff === 0) {
      score += 30;
      reasons.push("data");
    } else if (daysDiff <= 3) {
      score += 15;
      reasons.push("data~");
    } else if (daysDiff <= 7) {
      score += 5;
    }

    // Rule 3: Description contains client name parts
    const clienteParts = clienteUpper.split(/\s+/).filter((w) => w.length > 2);
    const nameMatches = clienteParts.filter((part) => txnDesc.includes(part)).length;
    if (nameMatches >= 2) {
      score += 30;
      reasons.push("nome");
    } else if (nameMatches >= 1) {
      score += 15;
      reasons.push("nome~");
    }

    // Rule 4: Description contains project keywords
    const projParts = projetoUpper.split(/\s+/).filter((w) => w.length > 3);
    if (projParts.some((part) => txnDesc.includes(part))) {
      score += 10;
    }

    if (score > bestScore && score >= 30) {
      bestScore = score;
      const parcelaLabel =
        p.tipo === "entrada"
          ? `Entrada — ${p.projetoNome}`
          : `Parcela ${p.numero}/${p.totalParcelas} — ${p.projetoNome}`;

      let confidence: MatchConfidence = "baixa";
      if (score >= 70) confidence = "alta";
      else if (score >= 45) confidence = "media";

      bestMatch = {
        entryId: p.id,
        label: parcelaLabel,
        confidence,
      };
    }
  }

  return bestMatch;
}

/* ═══════════════════════════════════════════════════ */
/*  applyMatch — mark txn as matched                   */
/* ═══════════════════════════════════════════════════ */

export function applyMatch(txnId: string, entryId: string): ConciliacaoState {
  const state = loadConciliacaoState();
  const txn = state.transactions.find((t) => t.id === txnId);
  if (txn) {
    txn.matched = true;
    txn.matchedEntryId = entryId;
    txn.ignored = false;
  }
  saveConciliacaoState(state);
  // Also mark the corresponding parcela as conciliada in paymentPlanSync
  markParcelaConciliada(entryId);
  return state;
}

/* ═══════════════════════════════════════════════════ */
/*  ignoreTxn — mark transaction as ignored            */
/* ═══════════════════════════════════════════════════ */

export function ignoreTxn(txnId: string): ConciliacaoState {
  const state = loadConciliacaoState();
  const txn = state.transactions.find((t) => t.id === txnId);
  if (txn) {
    txn.ignored = true;
    txn.matched = false;
    txn.matchedEntryId = undefined;
  }
  saveConciliacaoState(state);
  return state;
}

/* ═══════════════════════════════════════════════════ */
/*  unignoreTxn — restore ignored transaction          */
/* ═══════════════════════════════════════════════════ */

export function unignoreTxn(txnId: string): ConciliacaoState {
  const state = loadConciliacaoState();
  const txn = state.transactions.find((t) => t.id === txnId);
  if (txn) {
    txn.ignored = false;
  }
  saveConciliacaoState(state);
  return state;
}

/* ═══════════════════════════════════════════════════ */
/*  unmatchTxn — remove match from transaction         */
/* ═══════════════════════════════════════════════════ */

export function unmatchTxn(txnId: string): ConciliacaoState {
  const state = loadConciliacaoState();
  const txn = state.transactions.find((t) => t.id === txnId);
  if (txn) {
    txn.matched = false;
    txn.matchedEntryId = undefined;
  }
  saveConciliacaoState(state);
  return state;
}

/* ═══════════════════════════════════════════════════ */
/*  getTxnStatus — derive display status               */
/* ═══════════════════════════════════════════════════ */

export function getTxnStatus(txn: BankTxn): TxnStatus {
  if (txn.matched) return "conciliada";
  if (txn.ignored) return "ignorada";
  if (txn.suggestedEntryId) return "sugerida";
  return "pendente";
}

/* ═══════════════════════════════════════════════════ */
/*  generateMockImport — create mock bank transactions */
/*  Reads real parcelas to create realistic matches    */
/* ═══════════════════════════════════════════════════ */

export function generateMockImport(account: string): ConciliacaoState {
  const state = loadConciliacaoState();
  const parcelas = getAllSyncedParcelas();

  // Find paid parcelas to create matching bank entries
  const paidParcelas = parcelas.filter(
    (p) => p.status === "paga" || p.status === "conciliada",
  );

  const txns: BankTxn[] = [];
  let idCounter = state.transactions.length + 1;

  // ── Credit entries from paid parcelas (realistic matches) ──
  const usedParcelas = paidParcelas.slice(0, 6);
  for (const p of usedParcelas) {
    const metodoUpper = p.formaPagamento.toUpperCase();
    const prefix =
      metodoUpper === "PIX" ? "PIX RECEBIDO" :
      metodoUpper === "BOLETO" ? "BOLETO COMPENSADO" :
      metodoUpper === "CARTAO" ? "CRÉDITO CARTÃO" :
      "TED RECEBIDO";
    const clienteFirst = p.clienteNome.split(" ")[0].toUpperCase();
    const clienteLast = p.clienteNome.split(" ").slice(-1)[0].toUpperCase();

    const txn: BankTxn = {
      id: `btxn-${idCounter++}`,
      dateISO: p.vencimento,
      dateDisplay: fmtDateBR(p.vencimento),
      description: `${prefix} ${clienteFirst} ${clienteLast}`,
      amountCents: p.valor * 100,
      direction: "in",
      matched: false,
      ignored: false,
      detectedMethod: detectMethod(prefix),
      detectedCategory: undefined,
      account,
    };

    // Run match suggestion
    const suggestion = suggestMatch(txn, parcelas);
    if (suggestion) {
      txn.suggestedEntryId = suggestion.entryId;
      txn.suggestedConfidence = suggestion.confidence;
      txn.suggestedLabel = suggestion.label;
    }

    txns.push(txn);
  }

  // ── Debit entries (expenses, recurring) ──
  const expenses: { desc: string; amount: number; date: string }[] = [
    { desc: "ADOBE SYSTEMS *CC MENSAL", amount: 29000, date: "2026-02-15" },
    { desc: "PIX ENVIADO LUCAS ASSISTENTE", amount: 50000, date: "2026-02-10" },
    { desc: "TARIFA MANUTENÇÃO CONTA FEV", amount: 2800, date: "2026-02-01" },
    { desc: "BOLETO ALUGUEL STUDIO FEV/26", amount: 180000, date: "2026-02-05" },
    { desc: "VIVO FIBRA *INTERNET", amount: 14990, date: "2026-02-08" },
  ];

  for (const exp of expenses) {
    txns.push({
      id: `btxn-${idCounter++}`,
      dateISO: exp.date,
      dateDisplay: fmtDateBR(exp.date),
      description: exp.desc,
      amountCents: -exp.amount,
      direction: "out",
      matched: false,
      ignored: false,
      detectedMethod: detectMethod(exp.desc),
      detectedCategory: detectCategory(exp.desc),
      account,
    });
  }

  // ── Unknown / orphan credit (no match in ESSYN) ──
  txns.push({
    id: `btxn-${idCounter++}`,
    dateISO: "2026-02-18",
    dateDisplay: fmtDateBR("2026-02-18"),
    description: "PIX RECEBIDO JOAO SILVA",
    amountCents: 35000,
    direction: "in",
    matched: false,
    ignored: false,
    detectedMethod: "PIX",
    account,
  });

  // Sort by date descending
  txns.sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const newState: ConciliacaoState = {
    transactions: [...txns, ...state.transactions],
    lastImportISO: "2026-02-23",
    lastImportDisplay: "23 Fev 2026, 14:30",
  };

  saveConciliacaoState(newState);
  return newState;
}

/* ═══════════════════════════════════════════════════ */
/*  bulkApproveMatches — approve all suggested matches */
/* ═══════════════════════════════════════════════════ */

export function bulkApproveMatches(ids: string[]): ConciliacaoState {
  const state = loadConciliacaoState();
  for (const id of ids) {
    const txn = state.transactions.find((t) => t.id === id);
    if (txn && txn.suggestedEntryId && !txn.matched && !txn.ignored) {
      txn.matched = true;
      txn.matchedEntryId = txn.suggestedEntryId;
      // Mark the parcela as conciliada
      markParcelaConciliada(txn.suggestedEntryId);
    }
  }
  saveConciliacaoState(state);
  return state;
}

/* ═══════════════════════════════════════════════════ */
/*  bulkIgnore — ignore multiple transactions          */
/* ═══════════════════════════════════════════════════ */

export function bulkIgnore(ids: string[]): ConciliacaoState {
  const state = loadConciliacaoState();
  for (const id of ids) {
    const txn = state.transactions.find((t) => t.id === id);
    if (txn) {
      txn.ignored = true;
      txn.matched = false;
      txn.matchedEntryId = undefined;
    }
  }
  saveConciliacaoState(state);
  return state;
}

/* ── fmtCurrency helper (cents → BRL) ── */

export function fmtCentsToBRL(cents: number): string {
  const abs = Math.abs(cents);
  return `R$ ${(abs / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
