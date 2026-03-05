import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Plus,
  Trash2,
  DollarSign,
  CreditCard,
  LoaderCircle,
  CircleCheck,
  ExternalLink,
  Camera,
  Lightbulb,
  Zap,
  Package,
  Users,
  FileText,
  Image,
  CheckCircle2,
} from "lucide-react";
import type { ProjetoTipo, FormaPagamento } from "./projetosData";
import { upsertPaymentPlan, type PaymentPlan } from "./paymentPlanSync";
import { KpiCard } from "../ui/kpi-card";
import {
  TIPO_DEFAULTS,
  PACOTES,
  EQUIPE_DISPONIVEL,
  buildAutoTitle,
  getSuggestedPacote,
  getAutoEquipe,
  fmtBRL as fmtBRLSmart,
  formatCurrencyInput,
  parseCurrencyToNumber,
  calcPrazoEntrega,
  calcPrazoEntregaISO,
  defaultEntradaData,
  defaultPrimeiraParcelaData,
} from "./smartDefaults";
import {
  addTrabalho as addTrabalhoToStore,
  modelosServico as prodModelosServico,
  equipe as prodEquipe,
  type EtapaServico,
} from "../producao/productionStore";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

interface ContatoExtra {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  relacao: string;
}

interface LocalExtra {
  id: string;
  nome: string;
  endereco: string;
}

interface MembroEquipe {
  id: string;
  nome: string;
  funcao: string;
}

type ModalState = "form" | "creating" | "success";

/* ═══════════════════════════════════════════════════ */
/*  REUSABLE FORM PRIMITIVES                          */
/* ═══════════════════════════════════════════════════ */

/* ─── FormField: wrapper with label + optional error ─── */

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[11px] text-[#8E8E93]"
        style={{ fontWeight: 500 }}
      >
        {label}
        {required && <span className="text-[#FF3B30] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <span
          className="text-[11px] text-[#FF3B30]"
          style={{ fontWeight: 400 }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

/* ─── TextInput ─── */

function TextInput({
  value,
  onChange,
  placeholder,
  error,
  autoFocus,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  autoFocus?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
        error
          ? "border-[#F2DDD9] focus-within:border-[#FF3B30] focus-within:ring-2 focus-within:ring-[#FBF5F4]"
          : "border-[#E5E5EA] focus-within:border-[#D1D1D6] focus-within:ring-2 focus-within:ring-[#F2F2F7]"
      }`}
    >
      {icon && <div className="shrink-0 text-[#AEAEB2]">{icon}</div>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent text-[13px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none min-w-0"
        style={{ fontWeight: 400 }}
      />
    </div>
  );
}

/* ─── Select ─── */

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  error,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
        error
          ? "border-[#F2DDD9] focus-within:border-[#FF3B30]"
          : "border-[#E5E5EA] focus-within:border-[#D1D1D6]"
      }`}
    >
      {icon && <div className="shrink-0 text-[#AEAEB2]">{icon}</div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`flex-1 bg-transparent text-[13px] outline-none min-w-0 cursor-pointer appearance-none ${
          value ? "text-[#1D1D1F]" : "text-[#C7C7CC]"
        }`}
        style={{ fontWeight: 400 }}
      >
        <option value="" disabled>
          {placeholder || "Selecionar..."}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 text-[#AEAEB2] shrink-0 pointer-events-none" />
    </div>
  );
}

/* ─── Section header ─── */

function SectionTitle({
  children,
  count,
  icon,
  autoTag,
}: {
  children: ReactNode;
  count?: number;
  icon?: ReactNode;
  autoTag?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon && <div className="text-[#AEAEB2]">{icon}</div>}
      <span
        className="text-[10px] uppercase tracking-[0.1em] text-[#8E8E93]"
        style={{ fontWeight: 600 }}
      >
        {children}
      </span>
      {count !== undefined && count > 0 && (
        <span
          className="text-[9px] text-[#8E8E93] bg-[#F2F2F7] px-1.5 py-0.5 rounded-full numeric"
          style={{ fontWeight: 600 }}
        >
          {count}
        </span>
      )}
      {autoTag && (
        <span
          className="text-[9px] text-[#007AFF] bg-[#EBF5FF] px-1.5 py-0.5 rounded-full flex items-center gap-1"
          style={{ fontWeight: 600 }}
        >
          <Zap className="w-2.5 h-2.5" />
          AUTO
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  SMART INSIGHT BANNER                              */
/* ═══════════════════════════════════════════════════ */

function SmartInsightBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="rounded-xl bg-[#EBF5FF] border border-[#D6E8FF] px-4 py-3 flex items-start gap-3">
      <div className="w-6 h-6 rounded-lg bg-[#007AFF] flex items-center justify-center shrink-0 mt-0.5">
        <Zap className="w-3 h-3 text-white" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span
          className="text-[12px] text-[#007AFF]"
          style={{ fontWeight: 600 }}
        >
          Preenchimento inteligente ativo
        </span>
        <span
          className="text-[11px] text-[#636366]"
          style={{ fontWeight: 400 }}
        >
          {count} campos preenchidos automaticamente com base no tipo de evento. Ajuste o que precisar.
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  EQUIPE CHIPS                                      */
/* ═══════════════════════════════════════════════════ */

function EquipeChips({
  equipe,
  onRemove,
  onAdd,
}: {
  equipe: MembroEquipe[];
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {equipe.map((m) => {
        const iniciais = m.nome
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <div
            key={m.id}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA] group"
          >
            <span
              className="text-[9px] text-[#AEAEB2] w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0"
              style={{ fontWeight: 600 }}
            >
              {iniciais}
            </span>
            <div className="flex flex-col">
              <span
                className="text-[11px] text-[#3C3C43]"
                style={{ fontWeight: 500 }}
              >
                {m.nome}
              </span>
              <span
                className="text-[9px] text-[#8E8E93]"
                style={{ fontWeight: 400 }}
              >
                {m.funcao}
              </span>
            </div>
            <button
              onClick={() => onRemove(m.id)}
              className="p-0.5 rounded text-[#D1D1D6] hover:text-[#FF3B30] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-[#D1D1D6] text-[11px] text-[#8E8E93] hover:text-[#636366] hover:border-[#AEAEB2] transition-colors cursor-pointer"
        style={{ fontWeight: 500 }}
      >
        <Plus className="w-3 h-3" />
        Adicionar
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PRODUCTION SERVICES CHIPS                         */
/* ═══════════════════════════════════════════════════ */

function ServicosChips({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {prodModelosServico.map((m) => {
        const active = selected.includes(m.id);
        return (
          <button
            key={m.id}
            onClick={() => toggle(m.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] border transition-all cursor-pointer ${
              active
                ? "bg-[#EBF5FF] border-[#B3D7FF] text-[#007AFF]"
                : "bg-white border-[#E5E5EA] text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366]"
            }`}
            style={{ fontWeight: active ? 500 : 400 }}
          >
            {active && <CheckCircle2 className="w-3 h-3" />}
            {m.nome}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PACOTE PICKER                                     */
/* ═══════════════════════════════════════════════════ */

function PacotePicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (nome: string) => void;
}) {
  const allPacotes = Object.values(PACOTES);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {allPacotes.map((p) => (
          <button
            key={p.nome}
            onClick={() => onSelect(p.nome)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] border transition-all cursor-pointer ${
              selected === p.nome
                ? "bg-[#F2F2F7] border-[#D1D1D6] text-[#3C3C43]"
                : "bg-white border-[#E5E5EA] text-[#8E8E93] hover:border-[#D1D1D6] hover:text-[#636366]"
            }`}
            style={{ fontWeight: selected === p.nome ? 500 : 400 }}
          >
            {selected === p.nome && <CheckCircle2 className="w-3 h-3 text-[#34C759]" />}
            {p.nome}
            <span className="text-[10px] text-[#AEAEB2] numeric ml-1">
              {fmtBRLSmart(p.valor)}
            </span>
          </button>
        ))}
      </div>
      {selected && PACOTES[selected] && (
        <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-hidden">
          {PACOTES[selected].itens.map((item, i) => (
            <div
              key={`${selected}-${i}`}
              className="flex items-center gap-2.5 px-3 py-2 border-b border-[#F2F2F7] last:border-b-0"
            >
              <CircleCheck className="w-3 h-3 text-[#34C759] shrink-0" />
              <span
                className="text-[12px] text-[#636366]"
                style={{ fontWeight: 400 }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  FINANCEIRO COMPACT SECTION                        */
/* ═══════════════════════════════════════════════════ */

const formasPagamento: { value: FormaPagamento; label: string }[] = [
  { value: "pix", label: "PIX" },
  { value: "cartao", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
  { value: "dinheiro", label: "Dinheiro" },
];

const parcelasPresets = [
  { value: 1, label: "À vista" },
  { value: 2, label: "2×" },
  { value: 3, label: "3×" },
  { value: 4, label: "4×" },
  { value: 6, label: "6×" },
  { value: 10, label: "10×" },
  { value: 12, label: "12×" },
];

function FinanceiroCompact({
  valorTotal,
  setValorTotal,
  entrada,
  setEntrada,
  parcelas,
  setParcelas,
  formaPagamento,
  setFormaPagamento,
  entradaData,
  setEntradaData,
  primeiraParcelaData,
  setPrimeiraParcelaData,
  intervaloMeses,
  setIntervaloMeses,
}: {
  valorTotal: string;
  setValorTotal: (v: string) => void;
  entrada: string;
  setEntrada: (v: string) => void;
  parcelas: number;
  setParcelas: (v: number) => void;
  formaPagamento: FormaPagamento;
  setFormaPagamento: (v: FormaPagamento) => void;
  entradaData: string;
  setEntradaData: (v: string) => void;
  primeiraParcelaData: string;
  setPrimeiraParcelaData: (v: string) => void;
  intervaloMeses: number;
  setIntervaloMeses: (v: number) => void;
}) {
  const total = parseCurrencyToNumber(valorTotal);
  const ent = parseCurrencyToNumber(entrada);
  const restante = Math.max(0, total - ent);
  const parcelaValor = parcelas > 0 && restante > 0 ? restante / parcelas : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Valor total + Entrada */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Valor total" required>
          <TextInput
            value={valorTotal}
            onChange={(v) => setValorTotal(formatCurrencyInput(v))}
            placeholder="R$ 0,00"
            icon={<DollarSign className="w-3 h-3" />}
          />
        </FormField>
        <FormField label="Entrada (sinal)">
          <TextInput
            value={entrada}
            onChange={(v) => setEntrada(formatCurrencyInput(v))}
            placeholder="R$ 0,00"
            icon={<CreditCard className="w-3 h-3" />}
          />
        </FormField>
      </div>

      {/* Data entrada + Forma pagamento */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Vencimento da entrada">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5EA] focus-within:border-[#D1D1D6] transition-all">
            <Calendar className="w-3 h-3 text-[#AEAEB2] shrink-0" />
            <input
              type="date"
              value={entradaData}
              onChange={(e) => setEntradaData(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-[#1D1D1F] outline-none min-w-0 cursor-pointer"
              style={{ fontWeight: 400 }}
            />
          </div>
        </FormField>
        <FormField label="Forma de pagamento">
          <div className="flex flex-wrap gap-1.5">
            {formasPagamento.map((f) => (
              <button
                key={f.value}
                onClick={() => setFormaPagamento(f.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
                  formaPagamento === f.value
                    ? "bg-[#F2F2F7] border-[#D1D1D6] text-[#3C3C43]"
                    : "bg-white border-[#E5E5EA] text-[#8E8E93] hover:border-[#D1D1D6]"
                }`}
                style={{ fontWeight: formaPagamento === f.value ? 500 : 400 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </FormField>
      </div>

      {/* Parcelas presets */}
      <div className="flex flex-col gap-1.5">
        <span
          className="text-[11px] text-[#8E8E93]"
          style={{ fontWeight: 500 }}
        >
          Parcelas do restante
        </span>
        <div className="flex flex-wrap gap-1.5">
          {parcelasPresets.map((p) => (
            <button
              key={p.value}
              onClick={() => setParcelas(p.value)}
              className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all cursor-pointer numeric ${
                parcelas === p.value
                  ? "bg-[#F2F2F7] border-[#D1D1D6] text-[#3C3C43]"
                  : "bg-white border-[#E5E5EA] text-[#8E8E93] hover:border-[#D1D1D6]"
              }`}
              style={{ fontWeight: parcelas === p.value ? 500 : 400 }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primeira parcela + Intervalo */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="1ª parcela (vencimento)">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5EA] focus-within:border-[#D1D1D6] transition-all">
            <Calendar className="w-3 h-3 text-[#AEAEB2] shrink-0" />
            <input
              type="date"
              value={primeiraParcelaData}
              onChange={(e) => setPrimeiraParcelaData(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-[#1D1D1F] outline-none min-w-0 cursor-pointer"
              style={{ fontWeight: 400 }}
            />
          </div>
        </FormField>
        <FormField label="Intervalo entre parcelas">
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: 1, label: "Mensal" },
              { value: 2, label: "Bimestral" },
              { value: 3, label: "Trimestral" },
            ].map((o) => (
              <button
                key={o.value}
                onClick={() => setIntervaloMeses(o.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
                  intervaloMeses === o.value
                    ? "bg-[#F2F2F7] border-[#D1D1D6] text-[#3C3C43]"
                    : "bg-white border-[#E5E5EA] text-[#8E8E93] hover:border-[#D1D1D6]"
                }`}
                style={{ fontWeight: intervaloMeses === o.value ? 500 : 400 }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </FormField>
      </div>

      {/* Summary KPIs */}
      {total > 0 && parcelas > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <KpiCard
            compact
            label="Valor total"
            value={total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            icon={<DollarSign className="w-3 h-3 text-[#AEAEB2]" />}
          />
          <KpiCard
            compact
            label="Entrada"
            value={ent > 0 ? ent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
            icon={<CreditCard className="w-3 h-3 text-[#FF9500]" />}
            sub={ent > 0 && total > 0 ? `${Math.round((ent / total) * 100)}%` : undefined}
          />
          <KpiCard
            compact
            label="A receber"
            value={restante.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            icon={<DollarSign className="w-3 h-3 text-[#34C759]" />}
            sub={`${parcelas}× de ${parcelaValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
          />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  SUMMARY PREVIEW                                   */
/* ═══════════════════════════════════════════════════ */

function SummaryPreview({
  titulo,
  tipo,
  cliente,
  contato,
  dataEvento,
  horaInicio,
  horaFim,
  localNome,
  equipeCount,
  pacoteNome,
  servicosCount,
  servicosNomes,
  prazoDias,
  valorTotal,
  entradaPercent,
  parcelas,
  formaPagamento,
}: {
  titulo: string;
  tipo: string;
  cliente: string;
  contato: string;
  dataEvento: string;
  horaInicio: string;
  horaFim: string;
  localNome: string;
  equipeCount: number;
  pacoteNome: string;
  servicosCount: number;
  servicosNomes: string[];
  prazoDias: number;
  valorTotal: number;
  entradaPercent: number;
  parcelas: number;
  formaPagamento: string;
}) {
  const entradaValor = valorTotal * (entradaPercent / 100);
  const restante = Math.max(0, valorTotal - entradaValor);
  const parcelaValor = parcelas > 0 ? restante / parcelas : 0;
  const prazoEntrega = calcPrazoEntrega(dataEvento, prazoDias);
  const fmtPagamento = formasPagamento.find((f) => f.value === formaPagamento)?.label || formaPagamento;

  // Count how many tabs will have data
  const tabsData = [
    { nome: "Cadastro", icon: <FileText className="w-3 h-3" />, items: [tipo, cliente, localNome].filter(Boolean).length, ok: true },
    { nome: "Financeiro", icon: <DollarSign className="w-3 h-3" />, items: valorTotal > 0 ? parcelas : 0, ok: valorTotal > 0 },
    { nome: "Produção", icon: <Camera className="w-3 h-3" />, items: servicosCount, ok: servicosCount > 0 },
    { nome: "Galeria", icon: <Image className="w-3 h-3" />, items: 1, ok: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Tab coverage indicators */}
      <div className="grid grid-cols-4 gap-2">
        {tabsData.map((tab) => (
          <div
            key={tab.nome}
            className={`rounded-xl border px-3 py-2.5 flex flex-col items-center gap-1.5 ${
              tab.ok
                ? "bg-[#F0FAF4] border-[#D1F0D9]"
                : "bg-[#F2F2F7] border-[#E5E5EA]"
            }`}
          >
            <div className={tab.ok ? "text-[#34C759]" : "text-[#AEAEB2]"}>{tab.icon}</div>
            <span
              className={`text-[10px] ${tab.ok ? "text-[#34C759]" : "text-[#AEAEB2]"}`}
              style={{ fontWeight: 600 }}
            >
              {tab.nome}
            </span>
            {tab.ok && (
              <CheckCircle2 className="w-3 h-3 text-[#34C759]" />
            )}
          </div>
        ))}
      </div>

      {/* Natural language summary */}
      <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E5EA] px-4 py-3">
        <p
          className="text-[12px] text-[#636366]"
          style={{ fontWeight: 400, lineHeight: 1.7 }}
        >
          <span style={{ fontWeight: 600, color: "#1D1D1F" }}>"{titulo}"</span> será criado para{" "}
          <span style={{ fontWeight: 500 }}>{cliente}</span>
          {dataEvento && (
            <>
              {" "}no dia{" "}
              <span className="numeric" style={{ fontWeight: 500 }}>
                {new Date(dataEvento + "T12:00:00").toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </>
          )}
          .
          {valorTotal > 0 && (
            <>
              {" "}Valor total de{" "}
              <span className="numeric" style={{ fontWeight: 600, color: "#1D1D1F" }}>
                {valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              {entradaValor > 0 && (
                <>
                  {" "}com entrada de{" "}
                  <span className="numeric" style={{ fontWeight: 500 }}>
                    {entradaValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </>
              )}
              {parcelas > 1 && (
                <>
                  {" "}e{" "}
                  <span className="numeric" style={{ fontWeight: 500 }}>
                    {parcelas}× de {parcelaValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </>
              )}
              {" "}via {fmtPagamento}.
            </>
          )}
          {servicosCount > 0 && (
            <>
              {" "}{servicosCount} workflow{servicosCount > 1 ? "s" : ""} de produção
              {servicosCount <= 3 && (
                <> ({servicosNomes.join(", ")})</>
              )}
              {servicosCount === 1 ? " será criado" : " serão criados"} automaticamente.
            </>
          )}
          {prazoEntrega && (
            <>
              {" "}Entrega prevista para{" "}
              <span style={{ fontWeight: 500 }}>{prazoEntrega}</span>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  SUCCESS STATE                                     */
/* ═══════════════════════════════════════════════════ */

function SuccessState({
  nome,
  syncCounts,
  onClose,
  onOpenProject,
}: {
  nome: string;
  syncCounts: { financeiro: number; producao: number };
  onClose: () => void;
  onOpenProject: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6 px-6">
      {/* Animated checkmark */}
      <div className="w-16 h-16 rounded-2xl bg-[#F2F8F4] flex items-center justify-center">
        <CircleCheck className="w-8 h-8 text-[#34C759]" />
      </div>
      <div className="flex flex-col items-center gap-2 max-w-[360px]">
        <h3
          className="text-[17px] text-[#1D1D1F] tracking-[-0.01em]"
          style={{ fontWeight: 600 }}
        >
          Projeto criado com sucesso
        </h3>
        <p
          className="text-[13px] text-[#636366] text-center"
          style={{ fontWeight: 400 }}
        >
          <span style={{ fontWeight: 500 }}>"{nome}"</span> está pronto para usar.
        </p>

        {/* Sync summary */}
        <div className="flex items-center gap-3 mt-2">
          {syncCounts.financeiro > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-[#34C759] bg-[#F0FAF4] px-2.5 py-1 rounded-full" style={{ fontWeight: 500 }}>
              <DollarSign className="w-3 h-3" />
              {syncCounts.financeiro} parcela{syncCounts.financeiro > 1 ? "s" : ""} gerada{syncCounts.financeiro > 1 ? "s" : ""}
            </span>
          )}
          {syncCounts.producao > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-[#007AFF] bg-[#EBF5FF] px-2.5 py-1 rounded-full" style={{ fontWeight: 500 }}>
              <Camera className="w-3 h-3" />
              {syncCounts.producao} workflow{syncCounts.producao > 1 ? "s" : ""} criado{syncCounts.producao > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-[13px] text-[#8E8E93] border border-[#E5E5EA] hover:bg-[#F2F2F7] transition-colors cursor-pointer"
          style={{ fontWeight: 500 }}
        >
          Fechar
        </button>
        <button
          onClick={onOpenProject}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer"
          style={{ fontWeight: 500, boxShadow: "0 1px 2px #E5E5EA" }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir Projeto
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  COLLAPSIBLE SECTION                               */
/* ═══════════════════════════════════════════════════ */

function CollapsibleSection({
  title,
  icon,
  defaultOpen,
  autoTag,
  badge,
  children,
}: {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  autoTag?: boolean;
  badge?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="flex flex-col gap-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between py-2.5 cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <div className="text-[#AEAEB2] group-hover:text-[#8E8E93] transition-colors">{icon}</div>
          <span
            className="text-[12px] text-[#3C3C43] group-hover:text-[#1D1D1F] transition-colors"
            style={{ fontWeight: 500 }}
          >
            {title}
          </span>
          {autoTag && (
            <span
              className="text-[9px] text-[#007AFF] bg-[#EBF5FF] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
              style={{ fontWeight: 600 }}
            >
              <Zap className="w-2 h-2" />
              AUTO
            </span>
          )}
          {badge && (
            <span
              className="text-[9px] text-[#8E8E93] bg-[#F2F2F7] px-1.5 py-0.5 rounded-full numeric"
              style={{ fontWeight: 600 }}
            >
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#AEAEB2]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#AEAEB2]" />
        )}
      </button>
      {open && (
        <div className="pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN MODAL                                        */
/* ═══════════════════════════════════════════════════ */

const tipoOptions: { value: ProjetoTipo; label: string }[] = [
  { value: "Casamento", label: "Casamento" },
  { value: "Corporativo", label: "Corporativo" },
  { value: "Aniversário", label: "Aniversário" },
  { value: "Ensaio", label: "Ensaio" },
  { value: "Batizado", label: "Batizado" },
  { value: "Formatura", label: "Formatura" },
];

export function NovoProjetoModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (nome: string) => void;
}) {
  /* ── Core fields (user MUST fill these) ── */
  const [tipo, setTipo] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteContato, setClienteContato] = useState("");

  /* ── Auto-filled fields (editable) ── */
  const [titulo, setTitulo] = useState("");
  const [tituloManual, setTituloManual] = useState(false);
  const [horaInicio, setHoraInicio] = useState("16:00");
  const [horaFim, setHoraFim] = useState("23:00");
  const [localNome, setLocalNome] = useState("");
  const [localEndereco, setLocalEndereco] = useState("");
  const [equipe, setEquipe] = useState<MembroEquipe[]>([]);
  const [pacote, setPacote] = useState("");
  const [itensPacote, setItensPacote] = useState<string[]>([]);
  const [servicosProducao, setServicosProducao] = useState<string[]>([]);
  const [prazoEntregaDias, setPrazoEntregaDias] = useState("30");

  /* ── Financeiro ── */
  const [valorTotal, setValorTotal] = useState("");
  const [entrada, setEntrada] = useState("");
  const [parcelas, setParcelas] = useState(3);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("pix");
  const [entradaData, setEntradaData] = useState("");
  const [primeiraParcelaData, setPrimeiraParcelaData] = useState("");
  const [intervaloMeses, setIntervaloMeses] = useState(1);

  /* ── Extras (advanced, rarely touched) ── */
  const [contatosExtras, setContatosExtras] = useState<ContatoExtra[]>([]);
  const [locaisExtras, setLocaisExtras] = useState<LocalExtra[]>([]);

  /* ── UI State ── */
  const [modalState, setModalState] = useState<ModalState>("form");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [smartApplied, setSmartApplied] = useState(false);
  const [showEquipeSuggestions, setShowEquipeSuggestions] = useState(false);
  const [syncCounts, setSyncCounts] = useState({ financeiro: 0, producao: 0 });

  const contentRef = useRef<HTMLDivElement>(null);

  /* ═══ SMART DEFAULTS ENGINE ═══ */

  /** When tipo changes → apply all smart defaults */
  function applySmartDefaults(newTipo: string) {
    const defaults = TIPO_DEFAULTS[newTipo as ProjetoTipo];
    if (!defaults) return;

    // Title
    if (!tituloManual) {
      setTitulo(buildAutoTitle(newTipo as ProjetoTipo, clienteNome));
    }

    // Horário
    setHoraInicio(defaults.horaInicio);
    setHoraFim(defaults.horaFim);

    // Pacote + valor
    const pct = getSuggestedPacote(newTipo as ProjetoTipo);
    if (pct) {
      setPacote(pct.nome);
      setItensPacote(pct.itens);
      setValorTotal(formatCurrencyInput(String(pct.valor)));
      // Auto-calc entrada
      const entVal = Math.round(pct.valor * (defaults.entradaPercent / 100));
      setEntrada(formatCurrencyInput(String(entVal)));
    }

    // Equipe
    const autoEquipe = getAutoEquipe(newTipo as ProjetoTipo);
    setEquipe(
      autoEquipe.map((m, i) => ({
        id: `eq-auto-${Date.now()}-${i}`,
        nome: m.nome,
        funcao: m.funcao,
      })),
    );

    // Serviços de produção
    setServicosProducao(defaults.servicosProducaoIds);

    // Prazo
    setPrazoEntregaDias(String(defaults.prazoDias));

    // Financeiro defaults
    setFormaPagamento(defaults.formaPagamento);
    setParcelas(defaults.parcelas);
    setIntervaloMeses(defaults.intervaloMeses);

    // Dates
    setEntradaData(defaultEntradaData());
    if (dataEvento) {
      setPrimeiraParcelaData(defaultPrimeiraParcelaData(dataEvento));
    }

    setSmartApplied(true);
  }

  /** When tipo changes */
  function handleTipoChange(v: string) {
    setTipo(v);
    applySmartDefaults(v);
  }

  /** When clienteNome changes → update auto title if not manually set */
  function handleClienteChange(v: string) {
    setClienteNome(v);
    if (!tituloManual && tipo) {
      setTitulo(buildAutoTitle(tipo as ProjetoTipo, v));
    }
  }

  /** When data changes → update primeira parcela date */
  function handleDataChange(v: string) {
    setDataEvento(v);
    if (v) {
      setPrimeiraParcelaData(defaultPrimeiraParcelaData(v));
    }
  }

  /** When pacote changes → update valor */
  function handlePacoteChange(nome: string) {
    const pct = PACOTES[nome];
    setPacote(nome);
    if (pct) {
      setItensPacote(pct.itens);
      setValorTotal(formatCurrencyInput(String(pct.valor)));
      // Recalc entrada with current tipo's percent
      const defaults = tipo ? TIPO_DEFAULTS[tipo as ProjetoTipo] : null;
      const pct2 = defaults?.entradaPercent || 30;
      const entVal = Math.round(pct.valor * (pct2 / 100));
      setEntrada(formatCurrencyInput(String(entVal)));
    }
  }

  /* ESC to close */
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalState !== "creating") onClose();
    },
    [onClose, modalState],
  );
  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, handleEsc]);

  /* Body scroll lock */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Reset on open */
  useEffect(() => {
    if (open) {
      setTipo("");
      setDataEvento("");
      setClienteNome("");
      setClienteContato("");
      setTitulo("");
      setTituloManual(false);
      setHoraInicio("16:00");
      setHoraFim("23:00");
      setLocalNome("");
      setLocalEndereco("");
      setEquipe([]);
      setPacote("");
      setItensPacote([]);
      setServicosProducao([]);
      setPrazoEntregaDias("30");
      setValorTotal("");
      setEntrada("");
      setParcelas(3);
      setFormaPagamento("pix");
      setEntradaData("");
      setPrimeiraParcelaData("");
      setIntervaloMeses(1);
      setContatosExtras([]);
      setLocaisExtras([]);
      setModalState("form");
      setErrors({});
      setTouched(false);
      setSmartApplied(false);
      setShowEquipeSuggestions(false);
      setSyncCounts({ financeiro: 0, producao: 0 });
    }
  }, [open]);

  /* Validation */
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!tipo) errs.tipo = "Selecione o tipo";
    if (!dataEvento) errs.dataEvento = "Selecione a data";
    if (!clienteNome.trim()) errs.clienteNome = "Informe o nome do cliente";
    if (!titulo.trim()) errs.titulo = "Informe o título do evento";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ═══ SUBMIT — sync to ALL modules ═══ */
  function handleSubmit() {
    setTouched(true);
    if (!validate()) {
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const newProjectId = `proj-new-${Date.now()}`;
    const totalParsed = parseCurrencyToNumber(valorTotal);
    const entParsed = parseCurrencyToNumber(entrada);
    const entPercentCalc = totalParsed > 0 ? Math.round((entParsed / totalParsed) * 100) : 0;

    /* ── 1. FINANCEIRO: Persist PaymentPlan ── */
    let finCount = 0;
    if (totalParsed > 0) {
      const plan: PaymentPlan = {
        valorTotal: totalParsed,
        entradaPercent: entPercentCalc,
        entradaData: entradaData || defaultEntradaData(),
        formaPagamento,
        numeroParcelas: parcelas,
        primeiraParcelaData: primeiraParcelaData || defaultPrimeiraParcelaData(dataEvento),
        intervaloMeses,
        status: "ativo",
      };
      upsertPaymentPlan(newProjectId, plan, {
        nome: titulo,
        cliente: clienteNome,
        dataISO: dataEvento || undefined,
      });
      finCount = parcelas + (entParsed > 0 ? 1 : 0); // parcelas + entrada
    }

    /* ── 2. PRODUÇÃO: Create workflows for selected services ── */
    let prodCount = 0;
    const prazoISO = calcPrazoEntregaISO(dataEvento, parseInt(prazoEntregaDias || "30", 10));
    const prazoDisplay = calcPrazoEntrega(dataEvento, parseInt(prazoEntregaDias || "30", 10));

    for (const servicoId of servicosProducao) {
      const modelo = prodModelosServico.find((m) => m.id === servicoId);
      if (!modelo) continue;

      // Find a responsible person from the equipe
      const responsavel = prodEquipe[prodCount % prodEquipe.length] || prodEquipe[0];

      const etapas: EtapaServico[] = modelo.etapas.map((nome, i) => ({
        nome,
        status: i === 0 ? "atual" as const : "pendente" as const,
        data: i === 0 ? "Hoje" : undefined,
      }));

      addTrabalhoToStore({
        projeto: titulo,
        projetoId: newProjectId,
        cliente: clienteNome,
        titulo: `${modelo.nome} — ${clienteNome}`,
        tipo: modelo.tipo,
        status: "novo",
        responsavel,
        prioridade: "normal",
        prazo: prazoDisplay,
        prazoISO: prazoISO || "2026-04-01",
        itens: undefined,
        etapas,
        aguardandoCliente: false,
        slaDias: modelo.slaDias,
      });
      prodCount++;
    }

    setSyncCounts({ financeiro: finCount, producao: prodCount });
    setModalState("creating");

    // Simulate API call
    setTimeout(() => {
      setModalState("success");
      onCreated?.(titulo);
    }, 1800);
  }

  if (!open) return null;

  /* ── Computed values ── */
  const totalParsed = parseCurrencyToNumber(valorTotal);
  const entParsed = parseCurrencyToNumber(entrada);
  const entPercentCalc = totalParsed > 0 ? Math.round((entParsed / totalParsed) * 100) : 0;
  const coreFieldsFilled = !!(tipo && dataEvento && clienteNome.trim());
  const autoFilledCount = smartApplied
    ? [titulo, horaInicio, pacote, equipe.length > 0, servicosProducao.length > 0, prazoEntregaDias, valorTotal, entrada, formaPagamento].filter(Boolean).length
    : 0;

  // Build servicosNomes map for summary
  const servicosNomesMap: Record<string, string> = {};
  for (const m of prodModelosServico) {
    servicosNomesMap[m.id] = m.nome;
  }

  // Available equipe members for suggestions
  const availableEquipe = EQUIPE_DISPONIVEL.filter(
    (s) => !equipe.some((m) => m.nome === s.nome),
  );

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[#1D1D1F] z-[9998]"
        style={{ opacity: 0.4 }}
        onClick={modalState === "creating" ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog wrapper */}
      <div
        className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="novo-projeto-title"
      >
        <div
          className="relative bg-white w-full max-w-[600px] flex flex-col max-h-[calc(100vh-80px)] overflow-hidden"
          style={{
            borderRadius: 16,
            boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {modalState === "success" ? (
            <SuccessState
              nome={titulo}
              syncCounts={syncCounts}
              onClose={onClose}
              onOpenProject={() => {
                onClose();
              }}
            />
          ) : (
            <>
              {/* ────────── HEADER ────────── */}
              <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F2F2F7]">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#EBF5FF] flex items-center justify-center">
                      <Zap className="w-3 h-3 text-[#007AFF]" />
                    </div>
                    <h2
                      id="novo-projeto-title"
                      className="text-[15px] text-[#1D1D1F] tracking-[-0.01em]"
                      style={{ fontWeight: 600 }}
                    >
                      Novo Projeto
                    </h2>
                  </div>
                  <p
                    className="text-[12px] text-[#8E8E93] ml-8"
                    style={{ fontWeight: 400 }}
                  >
                    Preencha 3 campos — o sistema configura tudo automaticamente
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={modalState === "creating"}
                  className="p-1.5 rounded-lg text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6]"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ────────── CONTENT (scrollable) ────────── */}
              <div
                ref={contentRef}
                className="flex-1 overflow-y-auto min-h-0 px-6 py-5"
              >
                <div className="flex flex-col gap-5">
                  {/* ═══════════════════════════════════════ */}
                  {/*  SECTION 1: ESSENCIAL (3 campos core)  */}
                  {/* ═══════════════════════════════════════ */}

                  <div className="flex flex-col gap-1 mb-1">
                    <span
                      className="text-[11px] uppercase tracking-[0.1em] text-[#007AFF]"
                      style={{ fontWeight: 700 }}
                    >
                      1. Essencial
                    </span>
                    <span
                      className="text-[11px] text-[#AEAEB2]"
                      style={{ fontWeight: 400 }}
                    >
                      Estes 3 campos configuram todo o projeto
                    </span>
                  </div>

                  {/* Tipo do evento — THE TRIGGER */}
                  <FormField
                    label="Tipo do evento"
                    required
                    error={touched ? errors.tipo : undefined}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {tipoOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleTipoChange(opt.value)}
                          className={`px-3 py-2 rounded-xl text-[12px] border transition-all cursor-pointer ${
                            tipo === opt.value
                              ? "bg-[#007AFF] border-[#007AFF] text-white"
                              : "bg-white border-[#E5E5EA] text-[#636366] hover:border-[#D1D1D6] hover:text-[#3C3C43]"
                          }`}
                          style={{ fontWeight: tipo === opt.value ? 600 : 400 }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </FormField>

                  {/* Data + Cliente row */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      label="Data do evento"
                      required
                      error={touched ? errors.dataEvento : undefined}
                    >
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                          touched && errors.dataEvento
                            ? "border-[#F2DDD9]"
                            : "border-[#E5E5EA] focus-within:border-[#D1D1D6]"
                        }`}
                      >
                        <Calendar className="w-3 h-3 text-[#AEAEB2] shrink-0" />
                        <input
                          type="date"
                          value={dataEvento}
                          onChange={(e) => handleDataChange(e.target.value)}
                          className="flex-1 bg-transparent text-[13px] text-[#1D1D1F] outline-none min-w-0 cursor-pointer"
                          style={{ fontWeight: 400 }}
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Nome do cliente"
                      required
                      error={touched ? errors.clienteNome : undefined}
                    >
                      <TextInput
                        value={clienteNome}
                        onChange={handleClienteChange}
                        placeholder="Ex.: Ana Oliveira"
                        error={touched && !!errors.clienteNome}
                        autoFocus
                        icon={<User className="w-3 h-3" />}
                      />
                    </FormField>
                  </div>

                  {/* Contacto + Local row */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Telefone ou e-mail">
                      <TextInput
                        value={clienteContato}
                        onChange={setClienteContato}
                        placeholder="(11) 99999-0000"
                        icon={<Phone className="w-3 h-3" />}
                      />
                    </FormField>
                    <FormField label="Local do evento">
                      <TextInput
                        value={localNome}
                        onChange={setLocalNome}
                        placeholder="Ex.: Espaço Villa Real"
                        icon={<MapPin className="w-3 h-3" />}
                      />
                    </FormField>
                  </div>

                  {/* ═══════════════════════════════════════════ */}
                  {/*  SECTION 2: AUTO-PREENCHIDO                */}
                  {/*  Only shows after tipo is selected          */}
                  {/* ═══════════════════════════════════════════ */}

                  {smartApplied && (
                    <>
                      <div className="h-px bg-[#F2F2F7]" />

                      <SmartInsightBanner count={autoFilledCount} />

                      <div className="flex flex-col gap-1 mb-1">
                        <span
                          className="text-[11px] uppercase tracking-[0.1em] text-[#007AFF]"
                          style={{ fontWeight: 700 }}
                        >
                          2. Configuração automática
                        </span>
                        <span
                          className="text-[11px] text-[#AEAEB2]"
                          style={{ fontWeight: 400 }}
                        >
                          Ajuste o que precisar — tudo é editável
                        </span>
                      </div>

                      {/* Title (auto-generated, inline editable) */}
                      <FormField
                        label="Título do evento"
                        required
                        error={touched ? errors.titulo : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <TextInput
                              value={titulo}
                              onChange={(v) => {
                                setTitulo(v);
                                setTituloManual(true);
                              }}
                              placeholder='Ex.: "Casamento Mário & Júlia"'
                              error={touched && !!errors.titulo}
                            />
                          </div>
                          {tituloManual && (
                            <button
                              onClick={() => {
                                setTituloManual(false);
                                if (tipo && clienteNome) {
                                  setTitulo(buildAutoTitle(tipo as ProjetoTipo, clienteNome));
                                }
                              }}
                              className="px-2 py-1.5 rounded-lg text-[10px] text-[#007AFF] hover:bg-[#EBF5FF] transition-colors cursor-pointer shrink-0"
                              style={{ fontWeight: 500 }}
                            >
                              Auto
                            </button>
                          )}
                        </div>
                      </FormField>

                      {/* Horário */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Horário início">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5EA] focus-within:border-[#D1D1D6] transition-all">
                            <Clock className="w-3 h-3 text-[#AEAEB2] shrink-0" />
                            <input
                              type="time"
                              value={horaInicio}
                              onChange={(e) => setHoraInicio(e.target.value)}
                              className="flex-1 bg-transparent text-[13px] text-[#1D1D1F] outline-none min-w-0 cursor-pointer"
                              style={{ fontWeight: 400 }}
                            />
                          </div>
                        </FormField>
                        <FormField label="Horário fim">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5EA] focus-within:border-[#D1D1D6] transition-all">
                            <Clock className="w-3 h-3 text-[#AEAEB2] shrink-0" />
                            <input
                              type="time"
                              value={horaFim}
                              onChange={(e) => setHoraFim(e.target.value)}
                              className="flex-1 bg-transparent text-[13px] text-[#1D1D1F] outline-none min-w-0 cursor-pointer"
                              style={{ fontWeight: 400 }}
                            />
                          </div>
                        </FormField>
                      </div>

                      {/* ── Equipe ── */}
                      <CollapsibleSection
                        title="Equipe"
                        icon={<Users className="w-3.5 h-3.5" />}
                        defaultOpen
                        autoTag
                        badge={`${equipe.length}`}
                      >
                        <EquipeChips
                          equipe={equipe}
                          onRemove={(id) => setEquipe(equipe.filter((m) => m.id !== id))}
                          onAdd={() => setShowEquipeSuggestions(!showEquipeSuggestions)}
                        />
                        {showEquipeSuggestions && availableEquipe.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {availableEquipe.map((s) => (
                              <button
                                key={s.nome}
                                onClick={() => {
                                  setEquipe([
                                    ...equipe,
                                    {
                                      id: `eq-${Date.now()}-${s.nome}`,
                                      nome: s.nome,
                                      funcao: s.funcao,
                                    },
                                  ]);
                                  if (availableEquipe.length <= 1) setShowEquipeSuggestions(false);
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F2F2F7] text-[11px] text-[#8E8E93] hover:bg-[#E5E5EA] hover:text-[#636366] transition-all cursor-pointer"
                                style={{ fontWeight: 450 }}
                              >
                                <span
                                  className="text-[9px] text-[#AEAEB2]"
                                  style={{ fontWeight: 600 }}
                                >
                                  {s.iniciais}
                                </span>
                                {s.nome}
                              </button>
                            ))}
                          </div>
                        )}
                      </CollapsibleSection>

                      {/* ── Pacote ── */}
                      <CollapsibleSection
                        title="Pacote contratado"
                        icon={<Package className="w-3.5 h-3.5" />}
                        defaultOpen
                        autoTag
                      >
                        <PacotePicker
                          selected={pacote}
                          onSelect={handlePacoteChange}
                        />
                      </CollapsibleSection>

                      {/* ── Serviços de Produção ── */}
                      <CollapsibleSection
                        title="Serviços de Produção"
                        icon={<Camera className="w-3.5 h-3.5" />}
                        defaultOpen
                        autoTag
                        badge={`${servicosProducao.length}`}
                      >
                        <div className="flex flex-col gap-3">
                          {/* Info callout */}
                          <div className="rounded-xl bg-[#FAF7F0] border border-[#EFEAD8] px-4 py-3">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-3.5 h-3.5 text-[#FF9500] mt-0.5 shrink-0" />
                              <p
                                className="text-[11px] text-[#8E8E93]"
                                style={{ fontWeight: 400, lineHeight: 1.65 }}
                              >
                                Cada serviço selecionado cria um{" "}
                                <span style={{ fontWeight: 600 }}>workflow completo</span> com etapas rastreáveis na aba Produção.
                              </p>
                            </div>
                          </div>
                          <ServicosChips
                            selected={servicosProducao}
                            onChange={setServicosProducao}
                          />
                        </div>
                      </CollapsibleSection>

                      {/* ── Prazo de entrega ── */}
                      <CollapsibleSection
                        title="Prazo de entrega"
                        icon={<Calendar className="w-3.5 h-3.5" />}
                        autoTag
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5EA] focus-within:border-[#D1D1D6] transition-all w-[120px]">
                            <input
                              type="number"
                              min={1}
                              max={365}
                              value={prazoEntregaDias}
                              onChange={(e) => setPrazoEntregaDias(e.target.value)}
                              className="flex-1 bg-transparent text-[13px] text-[#1D1D1F] outline-none min-w-0 numeric"
                              style={{ fontWeight: 400 }}
                            />
                          </div>
                          <span
                            className="text-[12px] text-[#8E8E93]"
                            style={{ fontWeight: 400 }}
                          >
                            dias após o evento
                          </span>
                        </div>
                        {dataEvento && prazoEntregaDias && (
                          <span
                            className="text-[11px] text-[#AEAEB2] mt-1.5"
                            style={{ fontWeight: 400 }}
                          >
                            Entrega estimada:{" "}
                            {calcPrazoEntrega(dataEvento, parseInt(prazoEntregaDias || "30", 10))}
                          </span>
                        )}
                      </CollapsibleSection>

                      {/* ── Financeiro ── */}
                      <CollapsibleSection
                        title="Plano de pagamento"
                        icon={<DollarSign className="w-3.5 h-3.5" />}
                        defaultOpen
                        autoTag
                      >
                        <FinanceiroCompact
                          valorTotal={valorTotal}
                          setValorTotal={setValorTotal}
                          entrada={entrada}
                          setEntrada={setEntrada}
                          parcelas={parcelas}
                          setParcelas={setParcelas}
                          formaPagamento={formaPagamento}
                          setFormaPagamento={setFormaPagamento}
                          entradaData={entradaData}
                          setEntradaData={setEntradaData}
                          primeiraParcelaData={primeiraParcelaData}
                          setPrimeiraParcelaData={setPrimeiraParcelaData}
                          intervaloMeses={intervaloMeses}
                          setIntervaloMeses={setIntervaloMeses}
                        />
                      </CollapsibleSection>

                      {/* ── Extras (contatos + locais) ── */}
                      <CollapsibleSection
                        title="Contatos e locais extras"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        badge={
                          contatosExtras.length + locaisExtras.length > 0
                            ? `${contatosExtras.length + locaisExtras.length}`
                            : undefined
                        }
                      >
                        <div className="flex flex-col gap-4">
                          {/* Contatos extras */}
                          <div className="flex flex-col gap-2">
                            <span
                              className="text-[11px] text-[#8E8E93]"
                              style={{ fontWeight: 500 }}
                            >
                              Contatos extras
                            </span>
                            {contatosExtras.map((c) => (
                              <div
                                key={c.id}
                                className="rounded-xl border border-[#E5E5EA] bg-[#fafafa] p-3 flex flex-col gap-2 relative group"
                              >
                                <button
                                  onClick={() => setContatosExtras(contatosExtras.filter((x) => x.id !== c.id))}
                                  className="absolute top-2 right-2 p-1 rounded-lg text-[#D1D1D6] hover:text-[#FF3B30] hover:bg-[#FBF5F4] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                  <TextInput
                                    value={c.nome}
                                    onChange={(v) =>
                                      setContatosExtras(
                                        contatosExtras.map((x) => (x.id === c.id ? { ...x, nome: v } : x)),
                                      )
                                    }
                                    placeholder="Nome"
                                    icon={<User className="w-3 h-3" />}
                                  />
                                  <TextInput
                                    value={c.relacao}
                                    onChange={(v) =>
                                      setContatosExtras(
                                        contatosExtras.map((x) => (x.id === c.id ? { ...x, relacao: v } : x)),
                                      )
                                    }
                                    placeholder="Relação (ex.: Mãe)"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <TextInput
                                    value={c.telefone}
                                    onChange={(v) =>
                                      setContatosExtras(
                                        contatosExtras.map((x) => (x.id === c.id ? { ...x, telefone: v } : x)),
                                      )
                                    }
                                    placeholder="(11) 99999-0000"
                                    icon={<Phone className="w-3 h-3" />}
                                  />
                                  <TextInput
                                    value={c.email}
                                    onChange={(v) =>
                                      setContatosExtras(
                                        contatosExtras.map((x) => (x.id === c.id ? { ...x, email: v } : x)),
                                      )
                                    }
                                    placeholder="email@exemplo.com"
                                    icon={<Mail className="w-3 h-3" />}
                                  />
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() =>
                                setContatosExtras([
                                  ...contatosExtras,
                                  { id: `ce-${Date.now()}`, nome: "", telefone: "", email: "", relacao: "" },
                                ])
                              }
                              className="flex items-center gap-1.5 text-[12px] text-[#8E8E93] hover:text-[#636366] transition-colors cursor-pointer self-start"
                              style={{ fontWeight: 500 }}
                            >
                              <Plus className="w-3 h-3" />
                              Adicionar contato
                            </button>
                          </div>

                          <div className="h-px bg-[#F2F2F7]" />

                          {/* Locais extras */}
                          <div className="flex flex-col gap-2">
                            <span
                              className="text-[11px] text-[#8E8E93]"
                              style={{ fontWeight: 500 }}
                            >
                              Locais extras
                            </span>
                            {locaisExtras.map((l) => (
                              <div
                                key={l.id}
                                className="rounded-xl border border-[#E5E5EA] bg-[#fafafa] p-3 flex flex-col gap-2 relative group"
                              >
                                <button
                                  onClick={() => setLocaisExtras(locaisExtras.filter((x) => x.id !== l.id))}
                                  className="absolute top-2 right-2 p-1 rounded-lg text-[#D1D1D6] hover:text-[#FF3B30] hover:bg-[#FBF5F4] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <TextInput
                                  value={l.nome}
                                  onChange={(v) =>
                                    setLocaisExtras(
                                      locaisExtras.map((x) => (x.id === l.id ? { ...x, nome: v } : x)),
                                    )
                                  }
                                  placeholder="Nome do local"
                                  icon={<MapPin className="w-3 h-3" />}
                                />
                                <TextInput
                                  value={l.endereco}
                                  onChange={(v) =>
                                    setLocaisExtras(
                                      locaisExtras.map((x) => (x.id === l.id ? { ...x, endereco: v } : x)),
                                    )
                                  }
                                  placeholder="Endereço (opcional)"
                                />
                              </div>
                            ))}
                            <button
                              onClick={() =>
                                setLocaisExtras([
                                  ...locaisExtras,
                                  { id: `le-${Date.now()}`, nome: "", endereco: "" },
                                ])
                              }
                              className="flex items-center gap-1.5 text-[12px] text-[#8E8E93] hover:text-[#636366] transition-colors cursor-pointer self-start"
                              style={{ fontWeight: 500 }}
                            >
                              <Plus className="w-3 h-3" />
                              Adicionar local
                            </button>
                          </div>
                        </div>
                      </CollapsibleSection>

                      {/* ═══════════════════════════════════════════ */}
                      {/*  SECTION 3: RESUMO VISUAL                  */}
                      {/* ═══════════════════════════════════════════ */}

                      {coreFieldsFilled && (
                        <>
                          <div className="h-px bg-[#F2F2F7]" />

                          <div className="flex flex-col gap-1 mb-1">
                            <span
                              className="text-[11px] uppercase tracking-[0.1em] text-[#34C759]"
                              style={{ fontWeight: 700 }}
                            >
                              3. Resumo
                            </span>
                            <span
                              className="text-[11px] text-[#AEAEB2]"
                              style={{ fontWeight: 400 }}
                            >
                              Confirme os dados antes de criar
                            </span>
                          </div>

                          <SummaryPreview
                            titulo={titulo}
                            tipo={tipo}
                            cliente={clienteNome}
                            contato={clienteContato}
                            dataEvento={dataEvento}
                            horaInicio={horaInicio}
                            horaFim={horaFim}
                            localNome={localNome}
                            equipeCount={equipe.length}
                            pacoteNome={pacote}
                            servicosCount={servicosProducao.length}
                            servicosNomes={servicosProducao.map((id) => servicosNomesMap[id] || id)}
                            prazoDias={parseInt(prazoEntregaDias || "30", 10)}
                            valorTotal={totalParsed}
                            entradaPercent={entPercentCalc}
                            parcelas={parcelas}
                            formaPagamento={formaPagamento}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ────────── FOOTER ────────── */}
              <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-[#F2F2F7]">
                <div className="flex items-center gap-2">
                  {touched && Object.keys(errors).length > 0 && (
                    <span
                      className="text-[11px] text-[#FF3B30]"
                      style={{ fontWeight: 400 }}
                    >
                      {Object.keys(errors).length} campo{Object.keys(errors).length > 1 ? "s" : ""} obrigatório{Object.keys(errors).length > 1 ? "s" : ""}
                    </span>
                  )}
                  {smartApplied && !touched && (
                    <span
                      className="text-[11px] text-[#34C759] flex items-center gap-1"
                      style={{ fontWeight: 500 }}
                    >
                      <Zap className="w-3 h-3" />
                      {autoFilledCount} campos auto-preenchidos
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    disabled={modalState === "creating"}
                    className="px-4 py-2 rounded-xl text-[13px] text-[#8E8E93] hover:bg-[#F2F2F7] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ fontWeight: 500 }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={modalState === "creating"}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#007AFF] text-white text-[13px] hover:bg-[#0066DD] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontWeight: 500, boxShadow: "0 1px 2px #E5E5EA" }}
                  >
                    {modalState === "creating" ? (
                      <>
                        <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        Criar Projeto
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
