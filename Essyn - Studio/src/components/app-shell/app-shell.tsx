"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springOverlay } from "@/lib/motion-tokens";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useOnlineStatus } from "@/hooks/use-online-status";

const springDrawerLeft = {
  initial: { x: "-100%" },
  animate: { x: 0 },
  exit: { x: "-100%" },
  transition: { type: "spring" as const, stiffness: 380, damping: 32 },
};

interface TrialBannerProps {
  isOnTrial: boolean;
  daysRemaining: number;
  isExpired: boolean;
}

interface AppShellProps {
  children: React.ReactNode;
  studioName?: string;
  userEmail?: string;
  teamPermissions?: string[] | null; // null = owner (full access)
  plan?: "starter" | "pro" | "studio" | "business";
  trialStatus?: TrialBannerProps;
}

export function AppShell({ children, studioName, userEmail, teamPermissions, plan = "starter", trialStatus }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const isOnline = useOnlineStatus();

  // Load dark mode preference
  useEffect(() => {
    const stored = localStorage.getItem("essyn_dark_mode");
    if (stored === "true") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("essyn_dark_mode", String(next));

    // Prevent transition flash
    document.body.classList.add("no-transitions");
    document.documentElement.classList.toggle("dark", next);
    requestAnimationFrame(() => {
      document.body.classList.remove("no-transitions");
    });
  }

  // Load sidebar collapsed preference
  useEffect(() => {
    const stored = localStorage.getItem("essyn_sidebar_collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("essyn_sidebar_collapsed", String(next));
  }

  // Keyboard shortcut: Cmd+B to toggle sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setCollapsed((prev) => {
          const next = !prev;
          localStorage.setItem("essyn_sidebar_collapsed", String(next));
          return next;
        });
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} allowedModules={teamPermissions} plan={plan} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              {...springOverlay}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              {...springDrawerLeft}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <Sidebar
                collapsed={false}
                onToggle={() => setMobileOpen(false)}
                onNavigate={() => {
                  // Delay closing so Next.js Link can start navigation first
                  setTimeout(() => setMobileOpen(false), 100);
                }}
                allowedModules={teamPermissions}
                plan={plan}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div
        className={`transition-[margin-left] duration-200 ease-out ${
          collapsed
            ? "lg:ml-[var(--sidebar-collapsed-width)]"
            : "lg:ml-[var(--sidebar-width)]"
        }`}
      >
        {!isOnline && (
          <div className="bg-[var(--warning)] text-white text-center py-1.5 text-[12px] font-medium tracking-[-0.01em]">
            Sem conexão — algumas funções podem não funcionar
          </div>
        )}

        {trialStatus?.isOnTrial && (
          <div className="h-8 bg-[var(--info)]/10 border-b border-[var(--info)]/20 flex items-center justify-center gap-2 text-[11px] text-[var(--info)] font-medium">
            <span>Trial: {trialStatus.daysRemaining} dia{trialStatus.daysRemaining !== 1 ? "s" : ""} restante{trialStatus.daysRemaining !== 1 ? "s" : ""}</span>
            <a href="/configuracoes/assinatura" className="underline hover:no-underline">Assinar agora</a>
          </div>
        )}

        {trialStatus?.isExpired && (
          <div className="h-8 bg-[var(--warning)]/10 border-b border-[var(--warning)]/20 flex items-center justify-center gap-2 text-[11px] text-[var(--warning)] font-medium">
            <span>Seu trial expirou. Você está no plano Starter.</span>
            <a href="/configuracoes/assinatura" className="underline hover:no-underline">Fazer upgrade</a>
          </div>
        )}

        <Topbar
          onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
          isDark={isDark}
          onToggleDark={toggleDark}
          studioName={studioName}
          userEmail={userEmail}
        />

        {/* Page content */}
        <main className="p-4 sm:p-5 lg:p-6 pb-[max(16px,env(safe-area-inset-bottom))]">{children}</main>
      </div>
    </div>
  );
}
