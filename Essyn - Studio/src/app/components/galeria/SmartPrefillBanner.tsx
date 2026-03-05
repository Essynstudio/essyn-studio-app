import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, TrendingUp, AlertTriangle } from "lucide-react";
import type { GalleryType } from "./types";
import type { ColecaoFormData } from "./types";
import { COLLECTION_TEMPLATES } from "./presets";

interface SmartSuggestion {
  type: "learning" | "warning" | "import";
  title: string;
  description: string;
  config?: Partial<ColecaoFormData>;
  stats?: string;
}

interface SmartPrefillBannerProps {
  tipoGaleria: GalleryType;
  clienteNome?: string;
  onApply: (config: Partial<ColecaoFormData>) => void;
  onDismiss: () => void;
  marcaDagua: boolean;
}

export function SmartPrefillBanner({
  tipoGaleria,
  clienteNome,
  onApply,
  onDismiss,
  marcaDagua,
}: SmartPrefillBannerProps) {
  // Gera sugestões baseadas no contexto
  const suggestions: SmartSuggestion[] = [];

  // LEARNING: Baseado em histórico
  if (tipoGaleria === "wedding") {
    const template = COLLECTION_TEMPLATES.find((t) => t.id === "wedding-preset");
    if (template) {
      suggestions.push({
        type: "learning",
        title: "Configuração típica de casamento",
        description: "Baseado nos seus últimos 5 casamentos, você normalmente permite download em alta-res, seleção de 150 fotos e não usa marca d'água.",
        config: template.config,
        stats: "Aplicado em 87% dos seus casamentos",
      });
    }
  }

  if (tipoGaleria === "portrait") {
    const template = COLLECTION_TEMPLATES.find((t) => t.id === "portrait-preset");
    if (template) {
      suggestions.push({
        type: "learning",
        title: "Configuração típica de ensaio",
        description: "Seus ensaios sempre têm marca d'água ativa, download bloqueado e limite de 30 seleções.",
        config: template.config,
        stats: "Seu padrão em ensaios",
      });
    }
  }

  // WARNING: Alertas de segurança
  if ((tipoGaleria === "corporate" || tipoGaleria === "event") && !marcaDagua) {
    suggestions.push({
      type: "warning",
      title: "⚠️ Marca d'água recomendada",
      description: "Coleções corporativas geralmente precisam de proteção. Ative marca d'água para evitar uso indevido das imagens.",
      config: {
        marcaDagua: true,
        posicaoMarcaDagua: "center",
        permiteDownload: true,
        tipoDownload: "web-res",
      },
    });
  }

  // IMPORT: Auto-nome baseado em cliente
  if (clienteNome && !suggestions.find((s) => s.type === "import")) {
    const nomeGerado = `${tipoGaleria === "wedding" ? "Casamento" : tipoGaleria === "portrait" ? "Ensaio" : "Evento"} ${clienteNome.split(" ")[0]} — ${new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
    
    suggestions.push({
      type: "import",
      title: "🪄 Sugestão de nome",
      description: `Que tal "${nomeGerado}"?`,
      config: {
        nome: nomeGerado,
      },
    });
  }

  if (suggestions.length === 0) return null;

  const mainSuggestion = suggestions[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden mb-5"
      >
        <div
          className={`relative p-4 rounded-xl border ${
            mainSuggestion.type === "warning"
              ? "bg-[#FFF9F0] border-[#F5E6D3]"
              : mainSuggestion.type === "learning"
              ? "bg-[#F0EDEB] border-[#E0DCD7]"
              : "bg-[#F0EDEB] border-[#E0DCD7]"
          }`}
        >
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-white hover:bg-[#F2F2F7] flex items-center justify-center transition-all cursor-pointer"
            aria-label="Dispensar sugestão"
          >
            <X className="w-3 h-3 text-[#C7C7CC]" />
          </button>

          <div className="flex items-start gap-3 pr-8">
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                mainSuggestion.type === "warning"
                  ? "bg-[#FAF7F0]"
                  : mainSuggestion.type === "learning"
                  ? "bg-[#F2F2F7]"
                  : "bg-[#F2F2F7]"
              }`}
            >
              {mainSuggestion.type === "warning" ? (
                <AlertTriangle
                  className="w-5 h-5"
                  style={{ color: mainSuggestion.type === "warning" ? "#FF9500" : "#007AFF" }}
                />
              ) : mainSuggestion.type === "learning" ? (
                <TrendingUp className="w-5 h-5 text-[#007AFF]" />
              ) : (
                <Sparkles className="w-5 h-5 text-[#34C759]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-1.5">
              <h4 className="text-[13px] text-[#48484A]" style={{ fontWeight: 600 }}>
                {mainSuggestion.title}
              </h4>
              <p className="text-[12px] text-[#636366]" style={{ fontWeight: 400 }}>
                {mainSuggestion.description}
              </p>
              {mainSuggestion.stats && (
                <span className="text-[10px] text-[#AEAEB2] uppercase tracking-[0.04em]" style={{ fontWeight: 500 }}>
                  {mainSuggestion.stats}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          {mainSuggestion.config && (
            <div className="flex items-center gap-2 mt-3 pl-13">
              <button
                onClick={() => {
                  if (mainSuggestion.config) {
                    onApply(mainSuggestion.config);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#007AFF] text-white text-[12px] hover:bg-[#0066D6] active:scale-[0.98] transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <Sparkles className="w-3 h-3" />
                Aplicar sugestão
              </button>
              <button
                onClick={onDismiss}
                className="px-3 py-2 rounded-lg text-[12px] text-[#636366] hover:bg-white transition-all cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                Personalizar manualmente
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}