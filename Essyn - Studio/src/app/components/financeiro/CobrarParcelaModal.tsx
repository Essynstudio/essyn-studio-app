import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Copy,
  MessageSquare,
  Mail,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { springDefault } from "../../lib/motion-tokens";
import { useDk } from "../../lib/useDarkColors";

/* ── Reusable UI primitives ── */
import { StatusBadge } from "../ui/status-badge";
import { TagPill } from "../ui/tag-pill";
import { AlertBanner } from "../ui/alert-banner";
import { fmtCurrency } from "../ui/action-row-item";

/* ═══════════════════════════════════════════════════ */
/*  Modal — Cobrar Parcela (Apple Premium)            */
/* ═══════════════════════════════════════════════════ */

export function CobrarParcelaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dk = useDk();
  const [canal, setCanal] = useState<"whatsapp" | "email">("whatsapp");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

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
    diasAtraso: 7,
  };

  const msgWhatsApp = "Olá, Ana! Tudo bem?\n\nEstou entrando em contato referente à parcela 3/4 do seu casamento, no valor de " + fmtCurrency(parcela.valor) + ", com vencimento em " + parcela.vencimento + ".\n\nPoderia confirmar o pagamento ou me avisar caso precise de algum ajuste? Fico à disposição.\n\nUm abraço,\nMarina — ESSYN Studio";

  const msgEmail = "Prezada Ana,\n\nEspero que esteja bem! Gostaria de lembrar que a parcela 3/4 referente ao serviço fotográfico do seu casamento, no valor de " + fmtCurrency(parcela.valor) + ", teve vencimento em " + parcela.vencimento + ".\n\nCaso já tenha efetuado o pagamento, por favor desconsidere esta mensagem e nos envie o comprovante.\n\nQualquer dúvida, estou à disposição.\n\nAtenciosamente,\nMarina Reis — ESSYN Studio";

  const message = canal === "whatsapp" ? msgWhatsApp : msgEmail;

  function handleCopy() {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        className="relative rounded-2xl w-full max-w-[520px] mx-4 overflow-hidden"
        style={{ backgroundColor: dk.bg, boxShadow: dk.isDark ? "0 1px 3px #000000, 0 4px 16px #000000" : "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${dk.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
              <Send className="w-4 h-4" style={{ color: dk.textMuted }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[15px]" style={{ fontWeight: 600, color: dk.isDark ? "#AEAEB2" : "#48484A" }}>{dk.isDark ? "Cobrar parcela" : "Cobrar parcela"}</h3>
              <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                {parcela.projeto} — Parcela {parcela.parcela}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: dk.textMuted }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info bar — using TagPill and StatusBadge */}
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
          <TagPill variant="danger">
            {parcela.diasAtraso}d atraso
          </TagPill>
        </div>

        {/* Compact alert for context */}
        <div className="px-6 pt-4">
          <AlertBanner
            variant="danger"
            title={"Parcela vencida há " + parcela.diasAtraso + " dias"}
            desc="Envie a cobrança para regularizar o recebimento."
            compact
          />
        </div>

        {/* Canal selector */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-1 p-0.5 rounded-xl w-fit" style={{ backgroundColor: dk.bgMuted }}>
            <button
              onClick={() => setCanal("whatsapp")}
              className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer"}
              style={{
                fontWeight: canal === "whatsapp" ? 500 : 400,
                backgroundColor: canal === "whatsapp" ? dk.bg : "transparent",
                color: canal === "whatsapp" ? dk.textSecondary : dk.textMuted,
                boxShadow: canal === "whatsapp" ? dk.shadowCard : "none",
              }}
            >
              <MessageSquare className="w-3 h-3" /> WhatsApp
            </button>
            <button
              onClick={() => setCanal("email")}
              className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer"}
              style={{
                fontWeight: canal === "email" ? 500 : 400,
                backgroundColor: canal === "email" ? dk.bg : "transparent",
                color: canal === "email" ? dk.textSecondary : dk.textMuted,
                boxShadow: canal === "email" ? dk.shadowCard : "none",
              }}
            >
              <Mail className="w-3 h-3" /> E-mail
            </button>
          </div>
        </div>

        {/* Message preview */}
        <div className="px-6 py-3">
          <div className="rounded-xl p-4" style={{ border: `1px solid ${dk.border}`, backgroundColor: dk.bgSub }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3" style={{ color: dk.textDisabled }} />
              <span className="text-[10px]" style={{ fontWeight: 500, color: dk.textMuted }}>
                Mensagem gerada (tom profissional)
              </span>
            </div>
            <pre className="text-[12px] whitespace-pre-wrap font-[inherit]" style={{ fontWeight: 400, lineHeight: 1.6, color: dk.textSecondary }}>
              {message}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${dk.border}` }}>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] transition-colors cursor-pointer"
            style={{ fontWeight: 500, border: `1px solid ${dk.border}`, color: dk.textTertiary }}
          >
            {copied ? <Check className="w-3 h-3 text-[#34C759]" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copiado!" : "Copiar texto"}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer" style={{ fontWeight: 500, color: dk.textTertiary }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              Cancelar
            </button>
            <button
              onClick={() => { setSent(true); setTimeout(onClose, 800); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] text-white bg-[#007AFF] hover:bg-[#0066D6] transition-colors cursor-pointer active:scale-[0.97]"
              style={{ fontWeight: 500 }}
            >
              {sent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              {sent ? "Enviado!" : "Marcar como enviado"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}