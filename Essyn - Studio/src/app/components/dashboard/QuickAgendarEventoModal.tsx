import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  LoaderCircle,
  CircleCheck,
  Sparkles,
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

type TipoEvento = "casamento" | "formatura" | "aniversario" | "corporativo" | "outro";

interface QuickAgendarEventoModalProps {
  open: boolean;
  onClose: () => void;
  editMode?: boolean;
  initialData?: {
    nomeEvento: string;
    cliente: string;
    tipo: TipoEvento;
    data: string;
    hora: string;
    local: string;
  };
}

/* ═══════════════════════════════════════════════════ */
/*  COMPONENT                                         */
/* ═══════════════════════════════════════════════════ */

export function QuickAgendarEventoModal({
  open,
  onClose,
  editMode,
  initialData,
}: QuickAgendarEventoModalProps) {
  const dk = useDk();
  const [state, setState] = useState<ModalState>("form");

  // Form state
  const [nomeEvento, setNomeEvento] = useState(initialData?.nomeEvento || "");
  const [cliente, setCliente] = useState(initialData?.cliente || "");
  const [tipo, setTipo] = useState<TipoEvento>(initialData?.tipo || "casamento");
  const [data, setData] = useState(initialData?.data || "");
  const [hora, setHora] = useState(initialData?.hora || "");
  const [local, setLocal] = useState(initialData?.local || "");

  // Load initial data when editing
  useEffect(() => {
    if (open && editMode && initialData) {
      setNomeEvento(initialData.nomeEvento || "");
      setCliente(initialData.cliente || "");
      setTipo(initialData.tipo || "casamento");
      setData(initialData.data || "");
      setHora(initialData.hora || "");
      setLocal(initialData.local || "");
    }
  }, [open, editMode, initialData]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setState("form");
        if (!editMode) {
          setNomeEvento("");
          setCliente("");
          setTipo("casamento");
          setData("");
          setHora("");
          setLocal("");
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, editMode]);

  // Handle submit
  async function handleSubmit() {
    if (!nomeEvento.trim() || !cliente.trim() || !data) {
      toast.error("Preencha nome do evento, cliente e data");
      return;
    }

    setState("creating");

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));

    setState("success");
    toast.success("Evento agendado com sucesso!");

    setTimeout(() => {
      onClose();
    }, 1500);
  }

  const tiposEvento = [
    { value: "casamento" as const, label: "Casamento", icon: "\uD83D\uDC8D" },
    { value: "formatura" as const, label: "Formatura", icon: "\uD83C\uDF93" },
    { value: "aniversario" as const, label: "Aniversário", icon: "\uD83C\uDF82" },
    { value: "corporativo" as const, label: "Corporativo", icon: "\uD83D\uDCBC" },
    { value: "outro" as const, label: "Outro", icon: "\uD83D\uDCF8" },
  ];

  const canSubmit =
    nomeEvento.trim().length > 0 && cliente.trim().length > 0 && data.length > 0;

  /* ── Dark-aware field styles ── */
  const inputWrapStyle: React.CSSProperties = {
    backgroundColor: dk.bg,
    borderColor: dk.border,
  };
  const inputWrapCls =
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
          label={state === "creating" ? "Agendando…" : "Agendar evento"}
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
      title={editMode ? "Editar evento" : "Agendar evento"}
      subtitle="Adicionar novo evento à agenda"
      size="md"
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
              Evento agendado!
            </h3>
            <p
              className="text-[13px] text-center"
              style={{ fontWeight: 400, color: dk.textSecondary }}
            >
              {nomeEvento} foi adicionado à sua agenda
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
            {/* Nome do Evento */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                Nome do evento
                <span className="ml-0.5" style={{ color: C.red }}>*</span>
              </label>
              <div className={inputWrapCls} style={inputWrapStyle}>
                <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
                <input
                  type="text"
                  value={nomeEvento}
                  onChange={(e) => setNomeEvento(e.target.value)}
                  placeholder="Ex: Casamento Ana & João"
                  className={"flex-1 bg-transparent text-[13px] outline-none min-w-0 " + FOCUS_RING}
                  style={inputTextStyle}
                  autoFocus
                  disabled={state === "creating"}
                />
              </div>
            </div>

            {/* Cliente */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                Cliente
                <span className="ml-0.5" style={{ color: C.red }}>*</span>
              </label>
              <div className={inputWrapCls} style={inputWrapStyle}>
                <User className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome do cliente"
                  className={"flex-1 bg-transparent text-[13px] outline-none min-w-0 " + FOCUS_RING}
                  style={inputTextStyle}
                  disabled={state === "creating"}
                />
              </div>
            </div>

            {/* Tipo de Evento */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                Tipo de evento
              </label>
              <div className="grid grid-cols-3 gap-2">
                {tiposEvento.map((t) => {
                  const isActive = tipo === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTipo(t.value)}
                      disabled={state === "creating"}
                      className={
                        "px-2.5 py-2 rounded-xl text-[11px] border transition-all flex flex-col items-center gap-1 cursor-pointer disabled:opacity-50 " +
                        FOCUS_RING
                      }
                      style={{
                        fontWeight: isActive ? 500 : 400,
                        backgroundColor: isActive ? dk.bgMuted : dk.bg,
                        borderColor: dk.border,
                        color: isActive ? dk.textPrimary : dk.textMuted,
                      }}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[11px]"
                  style={{ fontWeight: 500, color: dk.textMuted }}
                >
                  Data
                  <span className="ml-0.5" style={{ color: C.red }}>*</span>
                </label>
                <div className={inputWrapCls} style={inputWrapStyle}>
                  <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className={"flex-1 bg-transparent text-[13px] outline-none min-w-0 cursor-pointer " + FOCUS_RING}
                    style={inputTextStyle}
                    disabled={state === "creating"}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[11px]"
                  style={{ fontWeight: 500, color: dk.textMuted }}
                >
                  Horário
                </label>
                <div className={inputWrapCls} style={inputWrapStyle}>
                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className={"flex-1 bg-transparent text-[13px] outline-none min-w-0 cursor-pointer " + FOCUS_RING}
                    style={inputTextStyle}
                    disabled={state === "creating"}
                  />
                </div>
              </div>
            </div>

            {/* Local */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px]"
                style={{ fontWeight: 500, color: dk.textMuted }}
              >
                Local
              </label>
              <div className={inputWrapCls} style={inputWrapStyle}>
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
                <input
                  type="text"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex: Fazenda Vista Alegre"
                  className={"flex-1 bg-transparent text-[13px] outline-none min-w-0 " + FOCUS_RING}
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
