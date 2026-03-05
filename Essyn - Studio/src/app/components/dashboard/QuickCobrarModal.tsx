import { useState, useEffect } from "react";
import {
  DollarSign,
  Calendar,
  User,
  FileText,
  LoaderCircle,
  CircleCheck,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { AppleModal, CTAButton } from "../ui/apple-kit";
import { C, FOCUS_RING } from "../../lib/apple-style";
import { springContentIn, springBounce } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                             */
/* ═══════════════════════════════════════════════════ */

type ModalState = "form" | "creating" | "success";

interface QuickCobrarModalProps {
  open: boolean;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════ */
/*  COMPONENT                                         */
/* ═══════════════════════════════════════════════════ */

export function QuickCobrarModal({ open, onClose }: QuickCobrarModalProps) {
  const dk = useDk();
  const [state, setState] = useState<ModalState>("form");

  // Form state
  const [cliente, setCliente] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [descricao, setDescricao] = useState("");
  const [metodo, setMetodo] = useState<"pix" | "link" | "boleto">("pix");

  // Reset on close
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setState("form");
        setCliente("");
        setValor("");
        setVencimento("");
        setDescricao("");
        setMetodo("pix");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Format currency
  function formatCurrency(val: string): string {
    const num = val.replace(/\D/g, "");
    if (!num) return "";
    const parsed = (parseInt(num, 10) / 100).toFixed(2);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(parsed));
  }

  // Handle submit
  async function handleSubmit() {
    if (!cliente.trim() || !valor) {
      toast.error("Preencha cliente e valor");
      return;
    }

    setState("creating");

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));

    setState("success");
    toast.success("Cobrança emitida com sucesso!");

    setTimeout(() => {
      onClose();
    }, 1500);
  }

  const canSubmit = cliente.trim().length > 0 && valor.length > 0;

  /* ── Dark-aware field styles ── */
  const inputWrapStyle: React.CSSProperties = {
    backgroundColor: dk.bg,
    borderColor: dk.border,
  };
  const inputWrapFocusCls =
    "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all";
  const inputTextStyle: React.CSSProperties = { fontWeight: 400, color: dk.textPrimary };

  /* ── Footer ── */
  const footer =
    state === "form" || state === "creating" ? (
      <div className="flex items-center gap-2 w-full">
        <CTAButton
          label="Cancelar"
          variant="secondary"
          onClick={onClose}
          disabled={state === "creating"}
          className="flex-1 justify-center"
          radius={12}
        />
        <CTAButton
          label={state === "creating" ? "Emitindo…" : "Emitir cobrança"}
          icon={
            state === "creating" ? (
              <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
            ) : undefined
          }
          variant="primary"
          onClick={handleSubmit}
          disabled={state === "creating" || !canSubmit}
          className="flex-1 justify-center"
          radius={12}
        />
      </div>
    ) : undefined;

  return (
    <AppleModal
      open={open}
      onClose={onClose}
      title="Emitir cobrança"
      subtitle="Enviar cobrança ao cliente"
      size="sm"
      footer={footer}
      persistent={state === "creating"}
    >
      <AnimatePresence mode="wait">
        {/* ── SUCCESS STATE ── */}
        {state === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springBounce}
            className="flex flex-col items-center justify-center py-12 px-6"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: dk.successBg }}
            >
              <CircleCheck
                className="w-8 h-8"
                style={{ color: C.green }}
                strokeWidth={2}
              />
            </div>
            <h3
              className="text-[15px] text-center mb-2"
              style={{ fontWeight: 600, color: dk.textPrimary }}
            >
              Cobrança emitida!
            </h3>
            <p
              className="text-[13px] text-center"
              style={{ fontWeight: 400, color: dk.textSecondary }}
            >
              Link de pagamento enviado com sucesso
            </p>
          </motion.div>
        )}

        {/* ── FORM STATE ── */}
        {(state === "form" || state === "creating") && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={springContentIn}
            className="flex flex-col gap-4"
          >
            {/* Cliente */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                Cliente
                <span className="ml-0.5" style={{ color: C.red }}>*</span>
              </label>
              <div className={inputWrapFocusCls} style={inputWrapStyle}>
                <User className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome do cliente"
                  className={"flex-1 bg-transparent text-[13px] outline-none min-w-0 " + FOCUS_RING}
                  style={{ ...inputTextStyle, color: dk.textPrimary }}
                  autoFocus
                  disabled={state === "creating"}
                />
              </div>
            </div>

            {/* Valor */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                Valor
                <span className="ml-0.5" style={{ color: C.red }}>*</span>
              </label>
              <div className={inputWrapFocusCls} style={inputWrapStyle}>
                <DollarSign className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
                <input
                  type="text"
                  value={valor}
                  onChange={(e) => setValor(formatCurrency(e.target.value))}
                  placeholder="R$ 0,00"
                  className={"flex-1 bg-transparent text-[13px] outline-none min-w-0 " + FOCUS_RING}
                  style={inputTextStyle}
                  disabled={state === "creating"}
                />
              </div>
            </div>

            {/* Vencimento */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                Vencimento
              </label>
              <div className={inputWrapFocusCls} style={inputWrapStyle}>
                <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
                <input
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  className={"flex-1 bg-transparent text-[13px] outline-none min-w-0 cursor-pointer " + FOCUS_RING}
                  style={inputTextStyle}
                  disabled={state === "creating"}
                />
              </div>
            </div>

            {/* Método */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                Método de pagamento
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { value: "pix" as const, label: "PIX" },
                    { value: "link" as const, label: "Link" },
                    { value: "boleto" as const, label: "Boleto" },
                  ] as const
                ).map((m) => {
                  const isActive = metodo === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMetodo(m.value)}
                      disabled={state === "creating"}
                      className={
                        "flex-1 px-3 py-2 rounded-xl text-[12px] border transition-all cursor-pointer disabled:opacity-50 " +
                        FOCUS_RING
                      }
                      style={{
                        fontWeight: isActive ? 500 : 400,
                        backgroundColor: isActive ? dk.bgMuted : dk.bg,
                        borderColor: dk.border,
                        color: isActive ? dk.textPrimary : dk.textMuted,
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Descrição */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                Descrição
              </label>
              <div className={inputWrapFocusCls + " items-start"} style={inputWrapStyle}>
                <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: dk.textDisabled }} />
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Sinal do casamento, 2ª parcela..."
                  rows={3}
                  className={"flex-1 bg-transparent text-[13px] outline-none min-w-0 resize-none " + FOCUS_RING}
                  style={inputTextStyle}
                  disabled={state === "creating"}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppleModal>
  );
}
