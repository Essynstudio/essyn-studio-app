import { useState, useCallback, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ContentSlot } from "./ContentSlot";
import { DISPLAY } from "./editorial";
import { MaiaAssistantView } from "../dashboard/MaiaAssistantView";
import { getModuleFromPath, getMaiaModuleConfig } from "../dashboard/maiaContextConfig";
import { navigateToProject, type ProjetoTab } from "../../lib/navigation";
import { projetos } from "../projetos/projetosData";
import { useIsMobile } from "./use-mobile";
import { useDk } from "../../lib/useDarkColors";
import type { SidebarSection } from "./Sidebar";
import type { TopbarBreadcrumb, TopbarCta, TopbarAvatar } from "./Topbar";

/* ─── Types ─── */

export interface AppShellProps {
  /** Sidebar collapsed state */
  collapsed: boolean;
  /** Toggle sidebar */
  onToggle?: () => void;
  /** Nav sections */
  sections: SidebarSection[];
  /** Breadcrumb */
  breadcrumb: TopbarBreadcrumb;
  /** Primary CTA */
  cta?: TopbarCta;
  /** Secondary CTA (when a module needs 2 CTAs) */
  secondaryCta?: TopbarCta;
  /** Avatar */
  avatar?: TopbarAvatar;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search callback */
  onSearch?: (query: string) => void;
  /** Content slot */
  children: ReactNode;
  /** Logo overrides */
  logoMark?: string;
  brandName?: string;
  brandSub?: string;
  /** Maia slide-over panel toggle (sidebar) */
  onMaiaToggle?: () => void;
  /** Maia slide-over panel open state */
  maiaOpen?: boolean;
  /** External notification count for Topbar badge */
  externalNotificationCount?: number;
}

/**
 * AppShell — Layout base executável do ESSYN
 *
 * Maia inline mode: a pill editorial fica no topo da área de conteúdo,
 * alinhada com o título de cada página. Quando ativada, substitui
 * children pelo MaiaAssistantView — comportamento idêntico em TODAS as páginas.
 *
 * Estrutura:
 * ┌────────────┬───────────────────────────────┐
 * │            │  Topbar (56px)                 │
 * │  Sidebar   ├───────────────────────────────┤
 * │  240/68px  │  [Maia pill]  ← content top   │
 * │            │  ContentSlot / MaiaView        │
 * │            │  (flex-1 scroll)               │
 * │            │                               │
 * └────────────┴───────────────────────────────┘
 */
export function AppShell({
  collapsed,
  onToggle,
  sections,
  breadcrumb,
  cta,
  secondaryCta,
  avatar,
  searchPlaceholder,
  onSearch,
  children,
  logoMark,
  brandName,
  brandSub,
  onMaiaToggle,
  maiaOpen,
  externalNotificationCount,
}: AppShellProps) {
  /* ── Inline Maia mode (content area swap) ── */
  const [maiaInline, setMaiaInline] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentModule = getModuleFromPath(location.pathname);

  /* Reset maia inline when navigating to a different page */
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    if (maiaInline) setMaiaInline(false);
  }

  const toggleMaiaInline = useCallback(() => {
    setMaiaInline((prev) => !prev);
  }, []);

  /* ── Navigation handlers for MaiaAssistantView ── */
  const handleNavigateToProject = useCallback(
    (projectId: string, tab: ProjetoTab) => {
      const proj = projetos.find((p) => p.id === projectId);
      setMaiaInline(false);
      setTimeout(() => {
        navigateToProject(navigate, {
          projectId,
          tab,
          from: "maia",
          projetoNome: proj?.nome,
        });
      }, 100);
    },
    [navigate]
  );

  const handleNavigateToModule = useCallback(
    (module: "producao" | "financeiro" | "agenda" | "galeria") => {
      setMaiaInline(false);
      setTimeout(() => navigate(`/${module}`), 100);
    },
    [navigate]
  );

  const isMobile = useIsMobile();
  const { isDark } = useDk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Close mobile menu on navigation */
  const [prevPathMobile, setPrevPathMobile] = useState(location.pathname);
  if (location.pathname !== prevPathMobile) {
    setPrevPathMobile(location.pathname);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ backgroundColor: isDark ? "#0A0A0A" : "#F5F5F7" }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          collapsed={collapsed}
          onToggle={onToggle}
          sections={sections}
          logoMark={logoMark}
          brandName={brandName}
          brandSub={brandSub}
          onMaiaToggle={onMaiaToggle}
          maiaOpen={maiaOpen}
        />
      )}

      {/* Mobile sidebar overlay */}
      {isMobile &&
        createPortal(
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <motion.div
                  key="mobile-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  className="fixed inset-0 bg-[#1D1D1F] z-[9996]"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <motion.div
                  key="mobile-sidebar"
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: "spring", damping: 30, stiffness: 350 }}
                  className="fixed left-0 top-0 bottom-0 z-[9997] w-[280px]"
                >
                  <Sidebar
                    collapsed={false}
                    onToggle={() => setMobileMenuOpen(false)}
                    sections={sections}
                    logoMark={logoMark}
                    brandName={brandName}
                    brandSub={brandSub}
                    onMaiaToggle={() => {
                      setMobileMenuOpen(false);
                      onMaiaToggle?.();
                    }}
                    maiaOpen={maiaOpen}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          breadcrumb={breadcrumb}
          cta={isMobile ? undefined : cta}
          secondaryCta={isMobile ? undefined : secondaryCta}
          avatar={avatar}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          onMaiaInlineToggle={toggleMaiaInline}
          maiaInlineOpen={maiaInline}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          isMobile={isMobile}
          externalNotificationCount={externalNotificationCount}
        />
        <ContentSlot>
          <AnimatePresence mode="wait">
            {maiaInline ? (
              <motion.div
                key="maia-inline"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="flex flex-col gap-5 flex-1"
              >
                {/* ── Maia editorial header ── */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h1
                      className="text-[26px] tracking-[-0.03em]"
                      style={{ fontWeight: 400, fontFamily: DISPLAY, color: isDark ? "#F5F5F7" : "#3C3C43" }}
                    >
                      Maia
                    </h1>
                    <p
                      className="text-[11px]"
                      style={{ fontWeight: 400, color: "#AEAEB2" }}
                    >
                      {currentModule === "dashboard"
                        ? "Assistente inteligente do seu estudio"
                        : getMaiaModuleConfig(currentModule).contextLabel}
                    </p>
                  </div>
                  {/* Filete — Apple HIG separator */}
                  <div
                    className="h-px"
                    style={{
                      background: isDark ? "#2C2C2E" : "#E5E5EA",
                    }}
                  />
                </div>

                {/* ── MaiaAssistantView ── */}
                <MaiaAssistantView
                  onNavigateToProject={handleNavigateToProject}
                  onNavigateToModule={handleNavigateToModule}
                  moduleContext={currentModule}
                />
              </motion.div>
            ) : (
              <div
                key="page-content"
                className="flex flex-col gap-4"
              >
                {children}
              </div>
            )}
          </AnimatePresence>
        </ContentSlot>
      </div>
    </div>
  );
}