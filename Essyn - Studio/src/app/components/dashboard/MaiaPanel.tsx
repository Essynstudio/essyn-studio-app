/**
 * MaiaPanel — Global slide-over panel for the Maia AI assistant.
 * 
 * Slides in from the right edge on any page. Editorial design with
 * warm stone backdrop, gold accents, and frosted glass header.
 */
import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SERIF_SWASH, EASE } from "../ui/editorial";
import { useMaia } from "./MaiaProvider";
import { MaiaAssistantView } from "./MaiaAssistantView";
import { navigateToProject, type ProjetoTab } from "../../lib/navigation";
import { projetos } from "../projetos/projetosData";
import { getModuleFromPath, getMaiaModuleConfig } from "./maiaContextConfig";
import { useDk } from "../../lib/useDarkColors";

const PANEL_WIDTH = 520;

export function MaiaPanel() {
  const { isOpen, close } = useMaia();
  const dk = useDk();
  const navigate = useNavigate();
  const location = useLocation();
  const currentModule = getModuleFromPath(location.pathname);

  /* ── Navigation handlers (work from any page) ── */
  const handleNavigateToProject = useCallback(
    (projectId: string, tab: ProjetoTab) => {
      const proj = projetos.find((p) => p.id === projectId);
      close();
      // Small delay so panel closes before navigation
      setTimeout(() => {
        navigateToProject(navigate, {
          projectId,
          tab,
          from: "dashboard",
          projetoNome: proj?.nome,
        });
      }, 150);
    },
    [navigate, close]
  );

  const handleNavigateToModule = useCallback(
    (module: "producao" | "financeiro" | "agenda" | "galeria") => {
      close();
      setTimeout(() => navigate(`/${module}`), 150);
    },
    [navigate, close]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="maia-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className="fixed inset-0 z-[998] cursor-pointer bg-[#1D1D1F]"
            onClick={close}
          />

          {/* Panel */}
          <motion.aside
            key="maia-panel"
            initial={{ x: PANEL_WIDTH + 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: PANEL_WIDTH + 20, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 36,
              mass: 0.8,
            }}
            className="fixed top-0 right-0 bottom-0 z-[999] flex flex-col overflow-hidden"
            style={{
              width: PANEL_WIDTH,
              background: dk.bgPage,
              boxShadow: dk.isDark ? "-8px 0 40px #000000, -2px 0 12px #000000" : "-8px 0 40px #D1D1D6, -2px 0 12px #E5E5EA",
              borderLeft: `1px solid ${dk.border}`,
            }}
          >
            {/* ── Panel Header — frosted editorial ── */}
            <div
              className="flex items-center justify-between px-5 py-3 shrink-0"
              style={{
                background: dk.bgPage,
                borderBottom: `1px solid ${dk.border}`,
              }}
            >
              <div className="flex items-center gap-3">
                {/* Maia mark */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: dk.bgMuted,
                    border: `1px solid ${dk.border}`,
                  }}
                >
                  <span
                    className="text-[13px]"
                    style={{
                      fontFamily: SERIF_SWASH,
                      fontWeight: 400,
                      color: "var(--maia-accent)",
                    }}
                  >
                    M
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-[13px]"
                    style={{ fontWeight: 500, color: dk.textSecondary }}
                  >
                    Maia
                  </span>
                  <span
                    className="text-[9px]"
                    style={{ fontWeight: 400, color: dk.textDisabled }}
                  >
                    {(() => {
                      const cfg = getMaiaModuleConfig(currentModule);
                      return currentModule === "dashboard"
                        ? "Assistente do estudio"
                        : cfg.contextLabel;
                    })()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Shortcut hint */}
                <kbd
                  className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px]"
                  style={{
                    fontWeight: 500,
                    color: dk.textDisabled,
                    background: dk.bgMuted,
                    border: `1px solid ${dk.border}`,
                  }}
                >
                  ⌘K
                </kbd>

                {/* Close */}
                <button
                  onClick={close}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors cursor-pointer active:scale-[0.95]"
                  style={{ transitionTimingFunction: EASE, color: dk.textSubtle }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = dk.bgMuted; e.currentTarget.style.color = dk.textTertiary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = dk.textSubtle; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Maia Content ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <MaiaAssistantView
                onNavigateToProject={handleNavigateToProject}
                onNavigateToModule={handleNavigateToModule}
                panelMode
                moduleContext={currentModule}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}