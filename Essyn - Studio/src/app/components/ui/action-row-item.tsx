import { useState, forwardRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowRightLeft,
  BellRing,
  Check,
  Clock,
  CreditCard,
  FileCheck2,
  FileText,
  FileWarning,
  Flame,
  MoreHorizontal,
  Paperclip,
  QrCode,
  Receipt,
  Send,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { springContentIn, springPopoverIn } from "../../lib/motion-tokens";
import { TagPill } from "./tag-pill";
import { StatusBadge, type StatusParcela } from "./status-badge";
import { RowSelectCheckbox } from "./row-select-checkbox";
import { TypeBadge, type TypeBadgeVariant } from "./type-badge";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  ActionRowItem — Apple whispered color             */
/*  Subtle semantic tints, ghost CTA, Apple shadows   */
/* ═══════════════════════════════════════════════════ */

/* ── Shared types ── */

export type AcaoTipo =
  | "cobrar"
  | "marcar_pago"
  | "lembrete"
  | "pagar"
  | "revisar_custos";

export type AcaoUrgencia =
  | "atrasada"
  | "hoje"
  | "pendencia"
  | "alerta"
  | "nf_pendente"
  | "repasse";

export type MetodoPagamento = "pix" | "cartao" | "boleto" | "transferencia";
export type NfStatus = "pendente" | "emitida" | "enviado_contador" | "na";
export type Comprovante = "sim" | "nao";
export type TipoLinha = "receber" | "pagar" | "alerta" | "repasse" | "fiscal";

export interface AcaoFinanceira {
  id: string;
  tipoLinha: TipoLinha;
  projeto: string;
  cliente: string;
  descricao: string;
  valor: number;
  urgencia: AcaoUrgencia;
  tipo: AcaoTipo;
  vencimento: string;
  parcela?: string;
  diasAtraso?: number;
  projetoId: string;
  metodo: MetodoPagamento;
  nfStatus: NfStatus;
  comprovante: Comprovante;
  statusParcela: StatusParcela;
}

/* ── Config maps — whispered semantic colors ── */

export const urgenciaConfig: Record<
  AcaoUrgencia,
  {
    label: string;
    dot: string;
    iconColor: string;
    iconBg: string;
    chipBg: string;
    chipText: string;
    chipBorder: string;
  }
> = {
  atrasada: {
    label: "Atrasadas",
    dot: "bg-[#FF3B30]",
    iconColor: "text-[#FF3B30]",
    iconBg: "#FBF5F4",
    chipBg: "bg-[#FBF5F4]",
    chipText: "text-[#FF3B30]",
    chipBorder: "border-[#F2DDD9]",
  },
  hoje: {
    label: "Vence hoje",
    dot: "bg-[#FF9500]",
    iconColor: "text-[#FF9500]",
    iconBg: "#FAF7F0",
    chipBg: "bg-[#FAF7F0]",
    chipText: "text-[#FF9500]",
    chipBorder: "border-[#EFEAD8]",
  },
  pendencia: {
    label: "Pendências",
    dot: "bg-[#7DA2D4]",
    iconColor: "text-[#7DA2D4]",
    iconBg: "#F4F7FB",
    chipBg: "bg-[#F4F7FB]",
    chipText: "text-[#7DA2D4]",
    chipBorder: "border-[#DCE7F3]",
  },
  alerta: {
    label: "Alertas",
    dot: "bg-[#D1D1D6]",
    iconColor: "text-[#C7C7CC]",
    iconBg: "#F5F5F7",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#AEAEB2]",
    chipBorder: "border-[#F2F2F7]",
  },
  nf_pendente: {
    label: "NF pendente",
    dot: "bg-[#FF9500]",
    iconColor: "text-[#FF9500]",
    iconBg: "#FAF7F0",
    chipBg: "bg-[#FAF7F0]",
    chipText: "text-[#FF9500]",
    chipBorder: "border-[#EFEAD8]",
  },
  repasse: {
    label: "Repasses",
    dot: "bg-[#AF52DE]",
    iconColor: "text-[#AF52DE]",
    iconBg: "#F5F5F7",
    chipBg: "bg-[#F2F2F7]",
    chipText: "text-[#AEAEB2]",
    chipBorder: "border-[#F2F2F7]",
  },
};

const tipoCtaConfig: Record<AcaoTipo, { label: string; icon: ReactNode }> = {
  cobrar: {
    label: "Cobrar",
    icon: <Send className="w-3 h-3" />,
  },
  marcar_pago: { label: "Marcar pago", icon: <Check className="w-3 h-3" /> },
  lembrete: {
    label: "Lembrete",
    icon: <BellRing className="w-3 h-3" />,
  },
  pagar: {
    label: "Pagar",
    icon: <Wallet className="w-3 h-3" />,
  },
  revisar_custos: {
    label: "Revisar",
    icon: <FileWarning className="w-3 h-3" />,
  },
};

function urgenciaIcon(u: AcaoUrgencia) {
  const cfg = urgenciaConfig[u];
  switch (u) {
    case "atrasada":
      return <Flame className={`w-3.5 h-3.5 ${cfg.iconColor}`} />;
    case "hoje":
      return <Clock className={`w-3.5 h-3.5 ${cfg.iconColor}`} />;
    case "pendencia":
      return <BellRing className={`w-3.5 h-3.5 ${cfg.iconColor}`} />;
    case "alerta":
      return <AlertCircle className={`w-3.5 h-3.5 ${cfg.iconColor}`} />;
    case "nf_pendente":
      return <FileText className={`w-3.5 h-3.5 ${cfg.iconColor}`} />;
    case "repasse":
      return <ArrowRightLeft className={`w-3.5 h-3.5 ${cfg.iconColor}`} />;
  }
}

const metodoLabel: Record<
  MetodoPagamento,
  { text: string; icon: ReactNode }
> = {
  pix: { text: "PIX", icon: <QrCode className="w-2.5 h-2.5" /> },
  cartao: { text: "Cartão", icon: <CreditCard className="w-2.5 h-2.5" /> },
  boleto: { text: "Boleto", icon: <Receipt className="w-2.5 h-2.5" /> },
  transferencia: {
    text: "TED",
    icon: <ArrowRightLeft className="w-2.5 h-2.5" />,
  },
};

export function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/* ── Menu items ── */

const defaultMenuItems = [
  "Ver projeto",
  "Remarcar vencimento",
  "Anexar comprovante",
  "Ver histórico",
  "Enviar WhatsApp",
  "Copiar link pagamento",
];

/* ── ActionRowItem ── */

export const ActionRowItem = forwardRef<
  HTMLDivElement,
  {
    acao: AcaoFinanceira;
    onAction: (id: string, tipo: AcaoTipo) => void;
    onViewProject?: (projetoId: string) => void;
    onOpenDetail?: (id: string) => void;
    onAnexar?: () => void;
    selected: boolean;
    onToggleSelect: (id: string) => void;
    menuItems?: string[];
    /** Flat row mode — no shadow/radius, uses border-b instead (for embedding in SectionCards) */
    embedded?: boolean;
  }
>(function ActionRowItem(
  {
    acao,
    onAction,
    onViewProject,
    onOpenDetail,
    onAnexar,
    selected,
    onToggleSelect,
    menuItems = defaultMenuItems,
    embedded = false,
  },
  ref
) {
  const cta = tipoCtaConfig[acao.tipo];
  const [menuOpen, setMenuOpen] = useState(false);
  const met = metodoLabel[acao.metodo];
  const urgCfg = urgenciaConfig[acao.urgencia];
  const { isDark } = useDk();

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: springPopoverIn }}
      transition={springContentIn}
      className={
        embedded
          ? `group overflow-hidden transition-colors duration-150 ${isDark ? "hover:bg-[#1C1C1E] active:bg-[#2C2C2E]" : "hover:bg-[#FAFAFA] active:bg-[#F5F5F7]"}`
          : `group overflow-hidden transition-all duration-150 border ${isDark ? "bg-[#141414] border-[#2C2C2E] hover:border-[#3C3C43]" : "bg-white border-[#E5E5EA] hover:border-[#D1D1D6]"}`
      }
      style={
        embedded
          ? undefined
          : {
              borderRadius: 16,
              boxShadow: selected
                ? isDark ? "0 0 0 1.5px #F5F5F7" : "0 0 0 1.5px #1D1D1F"
                : undefined,
            }
      }
    >
      <div
        className={`flex items-center gap-3 ${
          embedded ? "px-5 py-3" : "px-4 py-3"
        }`}
      >
        {/* Checkbox */}
        <RowSelectCheckbox
          state={selected ? "checked" : "unchecked"}
          onChange={() => onToggleSelect(acao.id)}
        />

        {/* Urgency dot — whispered minimal */}
        <span
          className={`w-[6px] h-[6px] rounded-full shrink-0 ${urgCfg.dot}`}
        />

        {/* Center content */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <TypeBadge variant={acao.tipoLinha as TypeBadgeVariant} />
            <button
              type="button"
              onClick={() => onOpenDetail?.(acao.id)}
              className={`text-[13px] truncate transition-colors cursor-pointer text-left ${isDark ? "text-[#F5F5F7] hover:text-[#AEAEB2]" : "text-[#1D1D1F] hover:text-[#636366]"}`}
              style={{ fontWeight: 500 }}
            >
              {acao.projeto}
            </button>
            {acao.diasAtraso && acao.diasAtraso > 0 && (
              <span
                className="shrink-0 text-[9px] text-[#E2998D] px-1.5 py-[1px] rounded-md"
                style={{ fontWeight: 500, background: "#FBF5F4" }}
              >
                {acao.diasAtraso}d atraso
              </span>
            )}
            <StatusBadge status={acao.statusParcela} />
          </div>
          <span
            className={`text-[11px] truncate ${isDark ? "text-[#8E8E93]" : "text-[#636366]"}`}
            style={{ fontWeight: 400 }}
          >
            {acao.descricao}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className={`text-[10px] ${isDark ? "text-[#636366]" : "text-[#8E8E93]"}`}
              style={{ fontWeight: 400 }}
            >
              {acao.cliente}
            </span>
            {acao.parcela && (
              <>
                <span className={`w-px h-2 ${isDark ? "bg-[#3C3C43]" : "bg-[#D1D1D6]"}`} />
                <span
                  className={`text-[10px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
                  style={{ fontWeight: 400 }}
                >
                  Parcela {acao.parcela}
                </span>
              </>
            )}
            <span className={`w-px h-2 ${isDark ? "bg-[#3C3C43]" : "bg-[#D1D1D6]"}`} />
            <span
              className={`text-[10px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
              style={{ fontWeight: 400 }}
            >
              {acao.vencimento}
            </span>
            <span className={`w-px h-2 ${isDark ? "bg-[#3C3C43]" : "bg-[#D1D1D6]"}`} />
            <TagPill>
              {met.icon} {met.text}
            </TagPill>
            {acao.nfStatus !== "na" && (
              <TagPill
                variant={
                  acao.nfStatus === "emitida" || acao.nfStatus === "enviado_contador"
                    ? "success"
                    : "warning"
                }
              >
                {acao.nfStatus === "emitida" ? (
                  <FileCheck2 className="w-2.5 h-2.5" />
                ) : (
                  <FileText className="w-2.5 h-2.5" />
                )}
                {acao.nfStatus === "emitida"
                  ? "NF Emitida"
                  : acao.nfStatus === "enviado_contador"
                  ? "Enviado"
                  : "Pendente NF"}
              </TagPill>
            )}
            {acao.comprovante === "sim" && (
              <TagPill variant="success">
                <Paperclip className="w-2.5 h-2.5" /> Comprov.
              </TagPill>
            )}
          </div>
        </div>

        {/* Right: value + CTA + menu */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={`text-[14px] numeric ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
            style={{ fontWeight: 500 }}
          >
            {fmtCurrency(acao.valor)}
          </span>
          <button
            onClick={() => onAction(acao.id, acao.tipo)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] border ${isDark ? "text-[#AEAEB2] hover:text-[#F5F5F7] hover:bg-[#2C2C2E] active:bg-[#3C3C43] border-[#3C3C43] hover:border-[#636366]" : "text-[#636366] hover:text-[#48484A] hover:bg-[#F2F2F7] active:bg-[#EDEDF0] border-[#E5E5EA] hover:border-[#D1D1D6]"}`}
            style={{ fontWeight: 500 }}
          >
            {cta.icon}
            {cta.label}
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D1D1D6] ${isDark ? "text-[#3C3C43] hover:text-[#8E8E93] hover:bg-[#2C2C2E] active:bg-[#3C3C43]" : "text-[#D1D1D6] hover:text-[#8E8E93] hover:bg-[#F2F2F7] active:bg-[#EDEDF0]"}`}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  key="action-menu"
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={springPopoverIn}
                  className={`absolute right-0 top-full mt-1 z-50 w-52 py-1 overflow-hidden border ${isDark ? "bg-[#1C1C1E] border-[#3C3C43]" : "bg-white border-[#E5E5EA]"}`}
                  style={{
                    borderRadius: 12,
                    boxShadow: isDark ? "0 4px 16px #000000" : "0 4px 16px #E5E5EA",
                  }}
                >
                  {menuItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        if (item === "Ver projeto" && onViewProject)
                          onViewProject(acao.projetoId);
                        if (item === "Anexar comprovante" && onAnexar)
                          onAnexar();
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-[13px] transition-colors duration-150 cursor-pointer focus-visible:outline-none ${isDark ? "text-[#F5F5F7] hover:bg-[#2C2C2E] active:bg-[#3C3C43]" : "text-[#3C3C43] hover:bg-[#FAFAFA] active:bg-[#F5F5F7]"}`}
                      style={{ fontWeight: 400 }}
                    >
                      {item}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {menuOpen && (
              createPortal(
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setMenuOpen(false)}
                />,
                document.body
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ActionRowItem.displayName = "ActionRowItem";