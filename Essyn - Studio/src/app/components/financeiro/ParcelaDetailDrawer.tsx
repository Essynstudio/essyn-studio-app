import { useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownRight,
  Check,
  FileCheck2,
  FileText,
  Flame,
  History,
  Paperclip,
  QrCode,
  Send,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { springDefault } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ── Reusable UI primitives ── */
import { StatusBadge, type StatusParcela } from "../ui/status-badge";
import { TagPill } from "../ui/tag-pill";
import { AlertBanner } from "../ui/alert-banner";
import { fmtCurrency } from "../ui/action-row-item";

/* ═══════════════════════════════════════════════════ */
/*  Drawer — Detalhe da Parcela (Apple Premium)       */
/* ═══════════════════════════════════════════════════ */

interface TimelineEvent {
  id: string;
  date: string;
  label: string;
  type: "created" | "sent" | "overdue" | "paid" | "nf";
}

const mockTimeline: TimelineEvent[] = [
  { id: "e1", date: "05 Jan 2026", label: "Parcela criada — plano Entrada + 3x", type: "created" },
  { id: "e2", date: "10 Jan 2026", label: "Cobrança enviada via WhatsApp", type: "sent" },
  { id: "e3", date: "15 Fev 2026", label: "Vencimento atingido — status: Vencida", type: "overdue" },
  { id: "e4", date: "18 Fev 2026", label: "Lembrete enviado por e-mail", type: "sent" },
];

const eventIcon = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "created": return <ArrowDownRight className="w-3 h-3 text-[#007AFF]" />;
    case "sent":    return <Send className="w-3 h-3 text-[#AEAEB2]" />;
    case "overdue": return <Flame className="w-3 h-3 text-[#FF3B30]" />;
    case "paid":    return <Check className="w-3 h-3 text-[#34C759]" />;
    case "nf":      return <FileCheck2 className="w-3 h-3 text-[#007AFF]" />;
  }
};

/* ── Mock parcela data ── */
const mockParcela = {
  projeto: "Casamento Oliveira & Santos",
  cliente: "Ana Oliveira",
  valor: 2800,
  parcela: "3/4",
  vencimento: "15 Fev 2026",
  diasAtraso: 7,
  statusParcela: "vencida" as StatusParcela,
  metodo: "pix" as const,
  nfStatus: "pendente" as const,
  comprovante: false,
};

export function ParcelaDetailDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dk = useDk();
  const [activeSection, setActiveSection] = useState<"historico" | "nf" | "comprovantes">("historico");

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex justify-end">
      <div className="absolute inset-0 bg-[#1D1D1F]" style={{ opacity: 0.4 }} onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={springDefault}
        className="relative w-[480px] h-full flex flex-col"
        style={{ backgroundColor: dk.bg, boxShadow: dk.isDark ? "-1px 0 3px #000000, -4px 0 16px #000000" : "-1px 0 3px #E5E5EA, -4px 0 16px #E5E5EA" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${dk.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
              <Flame className="w-4 h-4 text-[#FF3B30]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px]" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>Parcela {mockParcela.parcela}</h3>
                <StatusBadge status={mockParcela.statusParcela} />
              </div>
              <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                {mockParcela.projeto}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: dk.textMuted }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-0 shrink-0" style={{ borderBottom: `1px solid ${dk.border}` }}>
          <div className="px-5 py-3 flex flex-col gap-0.5" style={{ borderRight: `1px solid ${dk.border}` }}>
            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>Valor</span>
            <span className="text-[16px] tabular-nums" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>{fmtCurrency(mockParcela.valor)}</span>
          </div>
          <div className="px-5 py-3 flex flex-col gap-0.5" style={{ borderRight: `1px solid ${dk.border}` }}>
            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>Vencimento</span>
            <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textSecondary }}>{mockParcela.vencimento}</span>
          </div>
          <div className="px-5 py-3 flex flex-col gap-1">
            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>Atraso</span>
            <span className="text-[12px] text-[#FF3B30] tabular-nums" style={{ fontWeight: 600 }}>
              {mockParcela.diasAtraso}d
            </span>
          </div>
        </div>

        {/* Detail fields — using TagPill for metadata */}
        <div className="px-6 py-4 grid grid-cols-2 gap-3 shrink-0" style={{ borderBottom: `1px solid ${dk.border}` }}>
          <div className="flex flex-col gap-1">
            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>Cliente</span>
            <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textSecondary }}>{mockParcela.cliente}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>Método</span>
            <div>
              <TagPill>
                <QrCode className="w-2.5 h-2.5" /> PIX
              </TagPill>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>NF Status</span>
            <div>
              <TagPill variant="warning">
                <FileText className="w-2.5 h-2.5" /> Pendente NF
              </TagPill>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>Comprovante</span>
            <div>
              <TagPill>
                <Paperclip className="w-2.5 h-2.5" /> Nenhum anexo
              </TagPill>
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-0 px-6 shrink-0" style={{ borderBottom: `1px solid ${dk.border}` }}>
          {([
            { id: "historico" as const, label: "Histórico", icon: <History className="w-3 h-3" /> },
            { id: "nf" as const, label: "Nota Fiscal", icon: <FileCheck2 className="w-3 h-3" /> },
            { id: "comprovantes" as const, label: "Comprovantes", icon: <Paperclip className="w-3 h-3" /> },
          ]).map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="relative flex items-center gap-1.5 px-3 py-2.5 text-[12px] transition-colors cursor-pointer"
              style={{
                fontWeight: activeSection === s.id ? 500 : 400,
                color: activeSection === s.id ? dk.textSecondary : dk.textMuted,
              }}
            >
              {s.icon} {s.label}
              {activeSection === s.id && (
                <motion.div layoutId="drawer-tab" className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ backgroundColor: dk.textSecondary }} transition={springDefault} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "historico" && (
            <div className="flex flex-col gap-0">
              {mockTimeline.map((ev, i) => (
                <div key={ev.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: dk.bgMuted }}>
                      {eventIcon(ev.type)}
                    </div>
                    {i < mockTimeline.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: dk.border }} />}
                  </div>
                  <div className="pb-5">
                    <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textSecondary }}>{ev.label}</span>
                    <div className="text-[10px] mt-0.5" style={{ fontWeight: 400, color: dk.textSubtle }}>{ev.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "nf" && (
            <div className="flex flex-col gap-4">
              <AlertBanner
                variant="warning"
                title="NF pendente de emissão"
                desc="Emita ou marque como enviada ao contador."
                compact
              />
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
                  <FileText className="w-6 h-6 text-[#FF9500]" />
                </div>
                <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textTertiary }}>NF pendente</span>
                <span className="text-[11px] text-center max-w-[260px]" style={{ fontWeight: 400, lineHeight: 1.5, color: dk.textMuted }}>
                  A nota fiscal desta parcela ainda não foi emitida.
                </span>
                <button
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
                  style={{
                    fontWeight: 500,
                    backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F",
                    color: dk.isDark ? "#1D1D1F" : "#FFFFFF",
                  }}
                >
                  <FileCheck2 className="w-3.5 h-3.5" /> Emitir NF
                </button>
              </div>
            </div>
          )}

          {activeSection === "comprovantes" && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
                <Upload className="w-6 h-6" style={{ color: dk.textDisabled }} />
              </div>
              <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Nenhum comprovante</span>
              <span className="text-[11px] text-center max-w-[260px]" style={{ fontWeight: 400, lineHeight: 1.5, color: dk.textMuted }}>
                Anexe o comprovante de pagamento recebido do cliente.
              </span>
              <button
                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer"
                style={{ fontWeight: 500, border: `1px solid ${dk.border}`, color: dk.textTertiary }}
              >
                <Upload className="w-3.5 h-3.5" /> Anexar comprovante
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-6 py-4 shrink-0" style={{ borderTop: `1px solid ${dk.border}` }}>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{
              fontWeight: 500,
              backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F",
              color: dk.isDark ? "#1D1D1F" : "#FFFFFF",
            }}
          >
            <Send className="w-3.5 h-3.5" /> Cobrar
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] transition-colors cursor-pointer active:scale-[0.97]"
            style={{
              fontWeight: 500,
              backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F",
              color: dk.isDark ? "#1D1D1F" : "#FFFFFF",
            }}
          >
            <Check className="w-3.5 h-3.5" /> Marcar pago
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}