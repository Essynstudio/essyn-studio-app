import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { TopbarBreadcrumb, TopbarCta } from "./Topbar";

/* ═══════════════════════════════════════════════════════════════ */
/*  ShellContext — Page-level shell configuration                  */
/*  ─────────────────────────────────────────────────────────────  */
/*  Allows each page to declare its breadcrumb, CTA, and search   */
/*  placeholder without duplicating AppShell boilerplate.          */
/*  AppLayout reads from this context and passes to AppShell.      */
/* ═══════════════════════════════════════════════════════════════ */

export interface ShellConfig {
  breadcrumb: TopbarBreadcrumb;
  cta?: TopbarCta;
  secondaryCta?: TopbarCta;
  searchPlaceholder?: string;
}

interface ShellContextValue {
  config: ShellConfig;
  setConfig: (config: ShellConfig) => void;
}

const DEFAULT_CONFIG: ShellConfig = {
  breadcrumb: { section: "", page: "" },
  searchPlaceholder: "Buscar no ESSYN\u2026",
};

const ShellCtx = createContext<ShellContextValue>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
});

export function ShellConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ShellConfig>(DEFAULT_CONFIG);
  return (
    <ShellCtx.Provider value={{ config, setConfig }}>
      {children}
    </ShellCtx.Provider>
  );
}

/**
 * useShellConfig — call from any page inside AppLayout to set shell props.
 *
 * Usage:
 * ```
 * useShellConfig({
 *   breadcrumb: { section: "Operação", page: "Dashboard" },
 *   cta: { label: "Novo Projeto", icon: <Plus className="w-3.5 h-3.5" /> },
 * });
 * ```
 */
export function useShellConfig(config: ShellConfig) {
  const { setConfig } = useContext(ShellCtx);

  useEffect(() => {
    setConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.breadcrumb.section,
    config.breadcrumb.page,
    config.cta?.label,
    config.secondaryCta?.label,
    config.searchPlaceholder,
  ]);
}

/** Read the current shell config (used by AppLayout) */
export function useShellConfigValue() {
  return useContext(ShellCtx).config;
}
