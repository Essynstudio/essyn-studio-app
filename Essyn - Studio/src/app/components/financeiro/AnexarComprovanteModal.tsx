import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Check,
  FileImage,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { springDefault } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ── Reusable UI primitives ── */
import { StatusBadge } from "../ui/status-badge";
import { TagPill } from "../ui/tag-pill";
import { fmtCurrency } from "../ui/action-row-item";

/* ═══════════════════════════════════════════════════ */
/*  Modal — Anexar Comprovante (Apple Premium)        */
/* ═══════════════════════════════════════════════════ */

export function AnexarComprovanteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dk = useDk();
  const [file, setFile] = useState<string | null>(null);
  const [dataPagamento, setDataPagamento] = useState("2026-02-22");
  const [valorConfirmado, setValorConfirmado] = useState(2800);
  const [marcarPago, setMarcarPago] = useState(true);
  const [saved, setSaved] = useState(false);

  /* ESC close */
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const parcela = {
    projeto: "Casamento Oliveira & Santos",
    cliente: "Ana Oliveira",
    valor: 2800,
    parcela: "3/4",
    vencimento: "15 Fev 2026",
  };

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f.name);
  }

  function handleFileSelect() {
    setFile("comprovante_pix_ana_oliveira.pdf");
  }

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
        className="relative rounded-2xl w-full max-w-[480px] mx-4 overflow-hidden"
        style={{ backgroundColor: dk.bg, boxShadow: dk.isDark ? "0 1px 3px #000000, 0 4px 16px #000000" : "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${dk.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
              <Upload className="w-4 h-4 text-[#34C759]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[15px]" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>Anexar comprovante</h3>
              <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                {parcela.projeto} — Parcela {parcela.parcela}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: dk.textMuted }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info bar — using TagPill + StatusBadge */}
        <div className="flex items-center gap-3 px-6 py-3" style={{ backgroundColor: dk.bgSub, borderBottom: `1px solid ${dk.border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>Cliente:</span>
            <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textSecondary }}>{parcela.cliente}</span>
          </div>
          <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>Valor:</span>
            <span className="text-[13px] tabular-nums" style={{ fontWeight: 600, color: dk.textSecondary }}>{fmtCurrency(parcela.valor)}</span>
          </div>
          <span className="w-px h-3" style={{ backgroundColor: dk.border }} />
          <StatusBadge status="vencida" />
        </div>

        {/* Upload area */}
        <div className="px-6 pt-5 pb-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={handleFileSelect}
            className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed transition-all cursor-pointer"
            style={{
              borderColor: dk.border,
              backgroundColor: dk.bgSub,
            }}
          >
            {file ? (
              <>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
                  <FileImage className="w-5 h-5 text-[#34C759]" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textSecondary }}>{file}</span>
                  <TagPill variant="success">
                    <Check className="w-2.5 h-2.5" /> Arquivo selecionado
                  </TagPill>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-[11px] transition-colors"
                  style={{ fontWeight: 400, color: dk.textMuted }}
                >
                  Remover
                </button>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
                  <Upload className="w-5 h-5" style={{ color: dk.textDisabled }} />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textTertiary }}>
                    Arraste o comprovante ou clique para selecionar
                  </span>
                  <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
                    PDF, PNG, JPG — máx. 10MB
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="px-6 pb-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Data do pagamento</label>
              <div className="relative">
                <CalendarDays className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dk.textSubtle }} />
                <input
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-[12px] focus:outline-none focus:border-[#007AFF] transition-all"
                  style={{ fontWeight: 500, border: `1px solid ${dk.border}`, backgroundColor: dk.bg, color: dk.textSecondary }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Valor confirmado</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ fontWeight: 500, color: dk.textMuted }}>R$</span>
                <input
                  type="number"
                  value={valorConfirmado}
                  onChange={(e) => setValorConfirmado(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-[12px] tabular-nums focus:outline-none focus:border-[#007AFF] transition-all"
                  style={{ fontWeight: 600, border: `1px solid ${dk.border}`, backgroundColor: dk.bg, color: dk.textSecondary }}
                />
              </div>
            </div>
          </div>

          {/* Toggle marcar pago */}
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px]" style={{ fontWeight: 500, color: dk.textTertiary }}>Marcar como pago</span>
              <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textSubtle }}>Baixa automática ao confirmar</span>
            </div>
            <button
              onClick={() => setMarcarPago(!marcarPago)}
              className="w-9 h-5 rounded-full transition-colors cursor-pointer"
              style={{ backgroundColor: marcarPago ? "#34C759" : dk.border }}
            >
              <div className={"w-4 h-4 rounded-full bg-white transition-transform " + (marcarPago ? "translate-x-4.5" : "translate-x-0.5")} style={{ boxShadow: "0 1px 2px #1D1D1F" }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${dk.border}` }}>
          <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textDisabled }}>
            O comprovante ficará vinculado à parcela.
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer" style={{ fontWeight: 500, color: dk.textTertiary }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              Cancelar
            </button>
            <button
              onClick={() => { setSaved(true); setTimeout(onClose, 600); }}
              disabled={!file}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-all active:scale-[0.97] ${file ? "text-white bg-[#007AFF] hover:bg-[#0066D6] cursor-pointer" : "cursor-not-allowed"}`}
              style={{
                fontWeight: 500,
                backgroundColor: file ? undefined : dk.border,
                color: file ? undefined : dk.textMuted,
              }}
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
              {saved ? "Salvo!" : "Confirmar"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}