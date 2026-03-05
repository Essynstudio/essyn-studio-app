import { motion } from "motion/react";
import { createPortal } from "react-dom";
import { X, Mail, Eye } from "lucide-react";

interface EmailTemplatePreviewProps {
  open: boolean;
  onClose: () => void;
  template: "padrao" | "minimalista" | "elegante";
  clienteNome: string;
  colecaoNome: string;
  mensagemPersonalizada?: string;
}

export function EmailTemplatePreview({
  open,
  onClose,
  template,
  clienteNome,
  colecaoNome,
  mensagemPersonalizada,
}: EmailTemplatePreviewProps) {
  if (!open) return null;

  const templates = {
    padrao: {
      bg: "#FFFFFF",
      headerBg: "#F2F2F7",
      accentColor: "#1D1D1F",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
    minimalista: {
      bg: "#F5F5F7",
      headerBg: "#FFFFFF",
      accentColor: "#48484A",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
    elegante: {
      bg: "#F2F2F7",
      headerBg: "#FFFFFF",
      accentColor: "#007AFF",
      fontFamily: "Georgia, serif",
    },
  };

  const config = templates[template];

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-[#1D1D1F]"
        style={{ opacity: 0.4 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ boxShadow: "0 8px 32px #E5E5EA" }}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#007AFF]" />
            <h2 className="text-[18px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontWeight: 600 }}>
              Preview do email
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F2F2F7] flex items-center justify-center text-[#AEAEB2] hover:text-[#8E8E93] hover:bg-[#E5E5EA] transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F2F2F7]">
          <div
            className="w-full max-w-[600px] mx-auto rounded-xl overflow-hidden"
            style={{
              backgroundColor: config.bg,
              fontFamily: config.fontFamily,
              boxShadow: "0 8px 32px #E5E5EA",
            }}
          >
            {/* Email Header */}
            <div
              className="px-8 py-6 text-center"
              style={{
                backgroundColor: config.headerBg,
                borderBottom: `2px solid ${config.accentColor}`,
              }}
            >
              <Mail className="w-12 h-12 mx-auto mb-3" style={{ color: config.accentColor }} />
              <h1
                className="text-[24px] mb-1"
                style={{
                  fontWeight: template === "elegante" ? 400 : 600,
                  color: config.accentColor,
                  letterSpacing: template === "elegante" ? "0.02em" : "-0.01em",
                }}
              >
                ESSYN
              </h1>
              <p className="text-[12px] uppercase tracking-[0.1em]" style={{ color: "#AEAEB2", fontWeight: 500 }}>
                Fotografia de Eventos
              </p>
            </div>

            {/* Email Body */}
            <div className="px-8 py-8">
              <p className="text-[15px] mb-6" style={{ color: "#1D1D1F", fontWeight: 400, lineHeight: "1.6" }}>
                Olá <strong>{clienteNome || "Cliente"}</strong>,
              </p>

              <p className="text-[15px] mb-6" style={{ color: "#1D1D1F", fontWeight: 400, lineHeight: "1.6" }}>
                Sua galeria <strong style={{ color: config.accentColor }}>{colecaoNome || "Coleção"}</strong> está pronta para visualização!
              </p>

              {mensagemPersonalizada && (
                <div
                  className="px-4 py-4 rounded-xl mb-6"
                  style={{
                    backgroundColor: template === "elegante" ? "#F2F2F7" : "#F5F5F7",
                    borderLeft: `3px solid ${config.accentColor}`,
                  }}
                >
                  <p className="text-[14px]" style={{ color: "#636366", fontWeight: 400, lineHeight: "1.6", fontStyle: template === "elegante" ? "italic" : "normal" }}>
                    "{mensagemPersonalizada}"
                  </p>
                </div>
              )}

              <p className="text-[15px] mb-8" style={{ color: "#1D1D1F", fontWeight: 400, lineHeight: "1.6" }}>
                Clique no botão abaixo para acessar suas fotos:
              </p>

              {/* CTA Button */}
              <div className="text-center mb-8">
                <a
                  href="#"
                  className="inline-block px-8 py-4 rounded-xl text-white text-[15px] no-underline transition-all"
                  style={{
                    backgroundColor: config.accentColor,
                    fontWeight: 600,
                    letterSpacing: template === "elegante" ? "0.02em" : "-0.01em",
                  }}
                >
                  Ver minha galeria
                </a>
              </div>

              <p className="text-[13px] text-center" style={{ color: "#AEAEB2", fontWeight: 400, lineHeight: "1.6" }}>
                Ou copie e cole este link no seu navegador:
                <br />
                <span style={{ color: config.accentColor }}>https://essyn.co/g/exemplo</span>
              </p>
            </div>

            {/* Email Footer */}
            <div className="px-8 py-6 text-center" style={{ backgroundColor: config.headerBg, borderTop: "1px solid #E5E5EA" }}>
              <p className="text-[11px] mb-2" style={{ color: "#AEAEB2", fontWeight: 400 }}>
                © 2026 ESSYN — Fotografia de Eventos
              </p>
              <p className="text-[10px]" style={{ color: "#D1D1D6", fontWeight: 400 }}>
                Este é um email automático. Por favor, não responda.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#E5E5EA] px-6 py-4 flex items-center justify-end bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#1D1D1F] text-white text-[13px] hover:bg-[#3C3C43] active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Fechar preview
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}