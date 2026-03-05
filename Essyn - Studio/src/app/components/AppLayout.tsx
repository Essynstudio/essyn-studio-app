/**
 * AppLayout — Root wrapper for authenticated app routes.
 *
 * Single source of truth for the Apple Premium shell:
 * sidebar + topbar + system background + content slot.
 *
 * When Maia Focus Mode activates, the main content fades and scales
 * down slightly while a dark veil rises — clean, minimal dissolve.
 */
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { PaywallProvider, usePaywall } from "./ui/paywall-provider";
import { MaiaProvider } from "./dashboard/MaiaProvider";
import { MaiaPanel } from "./dashboard/MaiaPanel";
import { MaiaFocusChatWrapper } from "./dashboard/MaiaFocusChatWrapper";
import { useMaia } from "./dashboard/MaiaProvider";
import { AppShell } from "./ui/AppShell";
import {
  buildSidebarSections,
  corePlanLockedFeatures,
  type EssynModule,
} from "./ui/sidebar-config";
import {
  ShellConfigProvider,
  useShellConfigValue,
} from "./ui/ShellContext";
import { AppStoreProvider, useAppStore } from "../lib/appStore";
import { CommandPalette } from "./ui/CommandPalette";
import { DarkModeProvider } from "./ui/DarkModeProvider";

/* ── Map pathname to active sidebar module ── */
function getActiveModule(pathname: string): EssynModule {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/producao")) return "producao";
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/galeria")) return "galeria";
  if (pathname.startsWith("/pedidos")) return "pedidos";
  if (pathname.startsWith("/whatsapp")) return "whatsapp";
  if (pathname.startsWith("/projetos")) return "projetos";
  if (pathname.startsWith("/financeiro")) return "financeiro";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/clientes")) return "clientes";
  if (pathname.startsWith("/time")) return "time";
  if (pathname.startsWith("/relatorios")) return "relatorios";
  if (pathname.startsWith("/contratos")) return "contratos";
  if (pathname.startsWith("/automacoes")) return "automacoes";
  if (pathname.startsWith("/notificacoes")) return "dashboard";
  if (pathname.startsWith("/integracoes")) return "integracoes";
  if (pathname.startsWith("/email-templates")) return "automacoes";
  if (pathname.startsWith("/armazenamento")) return "configuracoes";
  if (pathname.startsWith("/configuracoes")) return "configuracoes";
  return "dashboard";
}

/**
 * AppContent — inner component that reads MaiaProvider + PaywallProvider + ShellContext
 * and renders the unified AppShell.
 */
function AppContent() {
  const { isFocusMode, isOpen: maiaPanelOpen, openFocusMode } = useMaia();
  const { openDrawer } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const shellConfig = useShellConfigValue();
  const { notifications, orders } = useAppStore();

  const [collapsed, setCollapsed] = useState(false);
  const maiaOpen = maiaPanelOpen || isFocusMode;
  const activeModule = getActiveModule(location.pathname);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingOrdersCount = orders.filter((o) => o.status === "pendente").length;

  /* ─── Sidebar sections (consistent across all pages) ─── */
  const sections = buildSidebarSections({
    activeModule,
    navigate,
    lockedFeatures: corePlanLockedFeatures,
    onLockedClick: (featureKey) => openDrawer(featureKey),
    badges: {
      ...(unreadCount > 0 ? { dashboard: unreadCount } : {}),
      ...(pendingOrdersCount > 0 ? { pedidos: pendingOrdersCount } : {}),
    },
  });

  return (
    <div
      className="h-screen w-screen overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div
        style={{
          transition: "all 0.7s cubic-bezier(0.22, 0.61, 0.36, 1)",
          opacity: isFocusMode ? 0 : 1,
          transform: isFocusMode ? "scale(0.98)" : "scale(1)",
          pointerEvents: isFocusMode ? "none" : "auto",
          willChange: isFocusMode ? "opacity, transform" : "auto",
          height: "100%",
          width: "100%",
        }}
      >
        <AppShell
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          sections={sections}
          breadcrumb={shellConfig.breadcrumb}
          cta={shellConfig.cta}
          secondaryCta={shellConfig.secondaryCta}
          avatar={{ initials: "MR", name: "Marina R.", plan: "Studio Pro" }}
          searchPlaceholder={shellConfig.searchPlaceholder || "Buscar no ESSYN\u2026"}
          onMaiaToggle={openFocusMode}
          maiaOpen={maiaOpen}
          externalNotificationCount={unreadCount}
        >
          <Outlet />
        </AppShell>
      </div>
      <MaiaPanel />
      <MaiaFocusChatWrapper />
      <CommandPalette />
    </div>
  );
}

export function AppLayout() {
  return (
    <DarkModeProvider>
      <PaywallProvider currentPlan="core">
        <MaiaProvider>
          <ShellConfigProvider>
            <AppStoreProvider>
              <AppContent />
            </AppStoreProvider>
          </ShellConfigProvider>
        </MaiaProvider>
      </PaywallProvider>
    </DarkModeProvider>
  );
}