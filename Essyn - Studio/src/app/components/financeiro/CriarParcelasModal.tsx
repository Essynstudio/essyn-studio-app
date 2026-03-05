import { useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Check,
  CreditCard,
  QrCode,
  Receipt,
  ArrowRightLeft,
  Banknote,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { springDefault } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ── Reusable UI primitives ── */
import { TagPill } from "../ui/tag-pill";
import { fmtCurrency } from "../ui/action-row-item";

/* ═══════════════════════════════════════════════════ */
/*  Modal — Criar Parcelas (Apple Premium)            */
/* ═══════════════════════════════════════════════════ */

type MetodoPagamento = "pix" | "cartao" | "boleto" | "transferencia" | "dinheiro";

interface ParcelaPreview {
  numero: number;
  valor: number;
  vencimento: string;
  metodo: MetodoPagamento;
}

const metodoOptions: { id: MetodoPagamento; label: string; icon: ReactNode }[] = [
  { id: "pix",            label: "PIX",            icon: <QrCode className="w-3 h-3" /> },
  { id: "cartao",         label: "Cartão",         icon: <CreditCard className="w-3 h-3" /> },
  { id: "boleto",         label: "Boleto",         icon: <Receipt className="w-3 h-3" /> },
  { id: "transferencia",  label: "Transferência",  icon: <ArrowRightLeft className="w-3 h-3" /> },
  { id: "dinheiro",       label: "Dinheiro",       icon: <Banknote className="w-3 h-3" /> },
];

const templates = [
  { id: "avista",     label: "À vista",          desc: "Pagamento único" },
  { id: "entrada_3x", label: "Entrada + 3x",     desc: "30/60/90 após entrada" },
  { id: "entrada_6x", label: "Entrada + 6x",     desc: "Mensal após entrada" },
  { id: "30_60_90",   label: "30/60/90",          desc: "3 parcelas iguais" },
  { id: "custom",     label: "Personalizado",     desc: "Definir manualmente" },
];

function generatePreview(total: number, template: string, entrada: number): ParcelaPreview[] {
  const baseDate = new Date(2026, 1, 22); // Feb 22 2026
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  switch (template) {
    case "avista":
      return [{ numero: 1, valor: total, vencimento: fmt(baseDate), metodo: "pix" }];
    case "entrada_3x": {
      const rest = total - entrada;
      const parcelaVal = Math.round((rest / 3) * 100) / 100;
      const result: ParcelaPreview[] = [
        { numero: 1, valor: entrada, vencimento: fmt(baseDate), metodo: "pix" },
      ];
      for (let i = 0; i < 3; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i + 1);
        result.push({ numero: i + 2, valor: i === 2 ? rest - parcelaVal * 2 : parcelaVal, vencimento: fmt(d), metodo: "pix" });
      }
      return result;
    }
    case "entrada_6x": {
      const rest = total - entrada;
      const parcelaVal = Math.round((rest / 6) * 100) / 100;
      const result: ParcelaPreview[] = [
        { numero: 1, valor: entrada, vencimento: fmt(baseDate), metodo: "pix" },
      ];
      for (let i = 0; i < 6; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i + 1);
        result.push({ numero: i + 2, valor: i === 5 ? rest - parcelaVal * 5 : parcelaVal, vencimento: fmt(d), metodo: "pix" });
      }
      return result;
    }
    case "30_60_90": {
      const parcelaVal = Math.round((total / 3) * 100) / 100;
      const result: ParcelaPreview[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i + 1);
        result.push({ numero: i + 1, valor: i === 2 ? total - parcelaVal * 2 : parcelaVal, vencimento: fmt(d), metodo: "boleto" });
      }
      return result;
    }
    default:
      return [{ numero: 1, valor: total, vencimento: fmt(baseDate), metodo: "pix" }];
  }
}

export function CriarParcelasModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dk = useDk();
  const [valorTotal, setValorTotal] = useState(8500);
  const [selectedTemplate, setSelectedTemplate] = useState("entrada_3x");
  const [entrada, setEntrada] = useState(2500);
  const [metodo, setMetodo] = useState<MetodoPagamento>("pix");
  const [emitirNf, setEmitirNf] = useState(true);

  const preview = generatePreview(valorTotal, selectedTemplate, entrada);

  /* ESC close */
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springDefault}
        role="dialog"
        aria-modal="true"
        className="relative rounded-2xl w-full max-w-[720px] mx-4 overflow-hidden max-h-[85vh] flex flex-col"
        style={{ backgroundColor: dk.bg, boxShadow: dk.isDark ? "0 1px 3px #000000, 0 4px 16px #000000" : "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${dk.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
              <CalendarDays className="w-4 h-4 text-[#007AFF]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[15px]" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>Criar plano de pagamento</h3>
              <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>Casamento Oliveira & Santos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: dk.textMuted }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — 2 columns */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Config */}
          <div className="w-[320px] p-5 flex flex-col gap-5 overflow-y-auto" style={{ borderRight: `1px solid ${dk.border}` }}>
            {/* Valor total */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Valor total do contrato</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ fontWeight: 500, color: dk.textMuted }}>R$</span>
                <input
                  type="number"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-[14px] tabular-nums focus:outline-none focus:border-[#007AFF] transition-all"
                  style={{ fontWeight: 600, border: `1px solid ${dk.border}`, backgroundColor: dk.bg, color: dk.isDark ? "#AEAEB2" : "#48484A" }}
                />
              </div>
            </div>

            {/* Template */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Template rápido</label>
              <div className="flex flex-col gap-1">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-left"
                    style={{
                      borderColor: selectedTemplate === t.id ? (dk.isDark ? "#636366" : "#D1D1D6") : dk.border,
                      backgroundColor: selectedTemplate === t.id ? dk.bgMuted : "transparent",
                    }}
                  >
                    <div className={"w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 " + (
                      selectedTemplate === t.id ? "border-[#007AFF] bg-[#007AFF]" : ""
                    )} style={{ borderColor: selectedTemplate === t.id ? "#007AFF" : dk.isDark ? "#636366" : "#D1D1D6" }}>
                      {selectedTemplate === t.id && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex flex-col gap-0">
                      <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textSecondary }}>{t.label}</span>
                      <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>{t.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Entrada */}
            {(selectedTemplate === "entrada_3x" || selectedTemplate === "entrada_6x") && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Valor da entrada</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ fontWeight: 500, color: dk.textMuted }}>R$</span>
                  <input
                    type="number"
                    value={entrada}
                    onChange={(e) => setEntrada(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] tabular-nums focus:outline-none focus:border-[#007AFF] transition-all"
                    style={{ fontWeight: 500, border: `1px solid ${dk.border}`, backgroundColor: dk.bg, color: dk.isDark ? "#AEAEB2" : "#48484A" }}
                  />
                </div>
              </div>
            )}

            {/* Método */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Forma de pagamento</label>
              <div className="flex flex-wrap gap-1.5">
                {metodoOptions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMetodo(m.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer"
                    style={{
                      fontWeight: 500,
                      borderColor: metodo === m.id ? (dk.isDark ? "#636366" : "#D1D1D6") : dk.border,
                      backgroundColor: metodo === m.id ? dk.bgMuted : "transparent",
                      color: metodo === m.id ? dk.textSecondary : dk.textMuted,
                    }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* NF toggle */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Emitir Nota Fiscal</span>
              <button
                onClick={() => setEmitirNf(!emitirNf)}
                className={"w-9 h-5 rounded-full transition-colors cursor-pointer"}
                style={{ backgroundColor: emitirNf ? "#34C759" : dk.border }}
              >
                <div className={"w-4 h-4 rounded-full bg-white transition-transform " + (emitirNf ? "translate-x-4.5" : "translate-x-0.5")} style={{ boxShadow: "0 1px 2px #1D1D1F" }} />
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto" style={{ backgroundColor: dk.bgSub }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" style={{ color: dk.textSubtle }} />
              <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Preview do plano</span>
              <span className="text-[10px] tabular-nums" style={{ fontWeight: 400, color: dk.textSubtle }}>
                {preview.length} parcela{preview.length !== 1 && "s"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {preview.map((p) => (
                <div
                  key={p.numero}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: dk.bg, border: `1px solid ${dk.border}` }}
                >
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] tabular-nums shrink-0" style={{ fontWeight: 600, backgroundColor: dk.bgMuted, color: dk.textMuted }}>
                    {p.numero}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
                        {p.numero === 1 && (selectedTemplate === "entrada_3x" || selectedTemplate === "entrada_6x") ? "Entrada" : "Parcela " + p.numero}
                      </span>
                      <span className="text-[10px] tabular-nums" style={{ fontWeight: 400, color: dk.textSubtle }}>
                        {p.vencimento}
                      </span>
                    </div>
                  </div>
                  <span className="text-[13px] tabular-nums" style={{ fontWeight: 600, color: dk.textSecondary }}>
                    {fmtCurrency(p.valor)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total check */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ backgroundColor: dk.bgMuted, border: `1px solid ${dk.border}` }}>
              <span className="text-[11px]" style={{ fontWeight: 500, color: dk.textMuted }}>Total</span>
              <span className="text-[14px] tabular-nums" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>
                {fmtCurrency(preview.reduce((s, p) => s + p.valor, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: `1px solid ${dk.border}`, backgroundColor: dk.bg }}>
          <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
            As parcelas serão vinculadas ao projeto automaticamente.
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer" style={{ fontWeight: 500, color: dk.textTertiary }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              Cancelar
            </button>
            <button onClick={onClose} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] transition-colors cursor-pointer active:scale-[0.97]" style={{ fontWeight: 500 }}>
              <Plus className="w-3.5 h-3.5" />
              Criar parcelas
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}