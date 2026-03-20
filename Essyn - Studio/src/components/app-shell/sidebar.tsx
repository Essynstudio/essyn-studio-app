"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { IconChevronDown, IconChevronLeft, IconChevronRight } from "@/components/icons/essyn-icons";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springSnappy, springCollapse } from "@/lib/motion-tokens";
import { hasFeature, type PlanId, type PlanDefinition } from "@/lib/plans";
import { UpgradeModal } from "./upgrade-modal";
import {
  pinnedModules,
  moduleGroups,
  footerModules,
  type ModuleGroup,
} from "./sidebar-config";

// Map module hrefs to required plan features
const MODULE_FEATURE_MAP: Record<string, keyof PlanDefinition["features"]> = {
  "/crm": "crm",
  "/clientes": "crm",
  "/financeiro": "contracts",
  "/pedidos": "shop",
  "/contratos": "contracts",
  "/time": "crm",
  "/relatorios": "reports",
  "/whatsapp": "whatsapp",
  "/automacoes": "crm",
};

function isModuleLocked(href: string, plan: PlanId): boolean {
  const feature = MODULE_FEATURE_MAP[href];
  if (!feature) return false;
  return !hasFeature(plan, feature);
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  allowedModules?: string[] | null; // null = owner (full access), string[] = team member
  plan?: PlanId;
}

export function Sidebar({ collapsed, onToggle, onNavigate, allowedModules, plan = "starter" }: SidebarProps) {
  const pathname = usePathname();
  const isOwner = allowedModules === null || allowedModules === undefined;
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");

  function handleLockedClick(label: string) {
    setBlockedFeature(label);
    setUpgradeOpen(true);
  }

  // Filter modules based on permissions
  const filteredPinned = isOwner
    ? pinnedModules
    : pinnedModules.filter(m => allowedModules!.includes(m.id));

  const filteredGroups = isOwner
    ? moduleGroups
    : moduleGroups
        .map(g => ({ ...g, modules: g.modules.filter(m => allowedModules!.includes(m.id)) }))
        .filter(g => g.modules.length > 0);

  const filteredFooter = isOwner
    ? footerModules
    : footerModules.filter(m => allowedModules!.includes(m.id));

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-50 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex flex-col transition-[width] duration-200 ease-out select-none ${
        collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]"
      }`}
    >
      {/* Logo + Collapse toggle */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--sidebar-border)]">
        {collapsed ? (
          /* When collapsed: clicking logo expands sidebar */
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            className="w-8 h-8 rounded-[22%] bg-[#2C444D] flex items-center justify-center shrink-0 mx-auto relative overflow-hidden"
            title="Expandir menu"
            aria-label="Expandir menu"
          >
            <div className="absolute inset-[8%] rounded-full border border-[rgba(194,173,144,0.33)]" />
            <span className="font-[family-name:var(--font-playfair)] text-[10px] font-normal text-[#C2AD90] tracking-[0.05em] relative z-10">
              ES
            </span>
          </motion.button>
        ) : (
          <>
            <Link href="/iris" className="flex items-center gap-2.5 min-w-0 group">
              <motion.div
                whileHover={{ scale: 1.04 }}
                transition={springSnappy}
                className="w-8 h-8 rounded-[22%] bg-[#2C444D] flex items-center justify-center shrink-0 relative overflow-hidden"
              >
                <div className="absolute inset-[8%] rounded-full border border-[rgba(194,173,144,0.33)]" />
                <span className="font-[family-name:var(--font-playfair)] text-[10px] font-normal text-[#C2AD90] tracking-[0.05em] relative z-10">
                  ES
                </span>
              </motion.div>
              <span className="flex items-baseline gap-[6px] truncate">
                <span className="font-[family-name:var(--font-playfair)] text-[13px] font-semibold text-[var(--fg)] tracking-[0.12em] uppercase">
                  ESSYN
                </span>
                <span className="text-[8px] text-[#A58D66] self-center">·</span>
                <span className="font-[family-name:var(--font-cormorant)] text-[11px] font-light text-[var(--fg-muted)] tracking-[0.2em] uppercase">
                  STUDIO
                </span>
              </span>
            </Link>
            <motion.button
              onClick={onToggle}
              whileHover={{ backgroundColor: "var(--sidebar-hover)" }}
              whileTap={{ scale: 0.95 }}
              transition={springSnappy}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors shrink-0"
              title="Recolher menu"
              aria-label="Recolher menu"
            >
              <IconChevronLeft size={16} />
            </motion.button>
          </>
        )}
      </div>

      {/* Expand bar — visible only when collapsed */}
      {collapsed && (
        <motion.button
          onClick={onToggle}
          whileHover={{ backgroundColor: "var(--sidebar-hover)" }}
          whileTap={{ scale: 0.95 }}
          transition={springSnappy}
          className="flex items-center justify-center py-2 mx-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors"
          title="Expandir menu"
          aria-label="Expandir menu"
        >
          <IconChevronRight size={16} />
        </motion.button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {/* Pinned */}
        {filteredPinned.map((mod) => (
          <SidebarItem
            key={mod.id}
            href={mod.href}
            icon={<mod.icon size={18} />}
            label={mod.label}
            active={pathname === mod.href || pathname.startsWith(mod.href + "/")}
            collapsed={collapsed}
            badge={mod.badge}
            onNavigate={onNavigate}
          />
        ))}

        <div className="editorial-divider my-2 mx-3" />

        {/* Groups */}
        {filteredGroups.map((group) => (
          <SidebarGroup
            key={group.label}
            group={group}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
            plan={plan}
            onLockedClick={handleLockedClick}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--sidebar-border)] py-2 px-2">
        {filteredFooter.map((mod) => (
          <SidebarItem
            key={mod.id}
            href={mod.href}
            icon={<mod.icon size={18} />}
            label={mod.label}
            active={pathname.startsWith(mod.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        {/* Expand toggle (only when collapsed) */}
        {collapsed && (
          <motion.button
            onClick={onToggle}
            whileHover={{ backgroundColor: "var(--sidebar-hover)" }}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
            className="w-full flex items-center justify-center py-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors mt-1"
            title="Expandir menu"
            aria-label="Expandir menu"
          >
            <IconChevronRight size={16} />
          </motion.button>
        )}
      </div>
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentPlan={plan}
        blockedFeature={blockedFeature}
      />
    </aside>
  );
}

function SidebarGroup({
  group,
  pathname,
  collapsed,
  onNavigate,
  plan = "starter",
  onLockedClick,
}: {
  group: ModuleGroup;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  plan?: PlanId;
  onLockedClick?: (label: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasActive = group.modules.some((m) => pathname.startsWith(m.href));

  if (collapsed) {
    return (
      <div className="py-1">
        {group.modules.map((mod) => {
          const locked = mod.paywall ? isModuleLocked(mod.href, plan) : false;
          return (
            <SidebarItem
              key={mod.id}
              href={mod.href}
              icon={<mod.icon size={18} />}
              label={mod.label}
              active={pathname.startsWith(mod.href)}
              collapsed={collapsed}
              locked={locked}
              onNavigate={onNavigate}
              onLockedClick={onLockedClick}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="py-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors"
      >
        {group.label}
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={springSnappy}
        >
          <IconChevronDown size={12} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {(open || hasActive) && (
          <motion.div
            {...springCollapse}
            className="overflow-hidden"
          >
            {group.modules.map((mod) => {
              const locked = mod.paywall ? isModuleLocked(mod.href, plan) : false;
              return (
                <SidebarItem
                  key={mod.id}
                  href={mod.href}
                  icon={<mod.icon size={18} />}
                  label={mod.label}
                  active={pathname.startsWith(mod.href)}
                  collapsed={collapsed}
                  badge={mod.badge}
                  locked={locked}
                  onNavigate={onNavigate}
                  onLockedClick={onLockedClick}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  active,
  collapsed,
  badge,
  locked,
  onNavigate,
  onLockedClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  locked?: boolean;
  onNavigate?: () => void;
  onLockedClick?: (label: string) => void;
}) {
  const baseClasses = `group flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] transition-all duration-150 relative tracking-[-0.006em] ${
    collapsed ? "justify-center" : ""
  }`;

  // Locked modules: render as button that opens upgrade modal
  if (locked) {
    return (
      <button
        type="button"
        onClick={() => onLockedClick?.(label)}
        className={`${baseClasses} text-[var(--sidebar-text)] opacity-50 hover:opacity-70 cursor-pointer transition-opacity w-full`}
        title={collapsed ? `${label} (requer upgrade)` : undefined}
      >
        <span className="shrink-0">
          {icon}
        </span>
        {!collapsed && (
          <>
            <span className="truncate flex-1 text-left">{label}</span>
            <Lock size={11} className="text-[var(--fg-muted)] shrink-0 opacity-50" />
          </>
        )}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`${baseClasses} ${
        active
          ? "bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)] font-semibold"
          : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]"
      }`}
      title={collapsed ? label : undefined}
    >
      {/* Active indicator — Gold bar */}
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="sidebar-active-indicator"
            className="absolute left-0 top-1/2 w-[2px] h-4 rounded-r-full bg-[var(--fg)]"
            initial={{ opacity: 0, y: "-50%", scaleY: 0 }}
            animate={{ opacity: 1, y: "-50%", scaleY: 1 }}
            exit={{ opacity: 0, y: "-50%", scaleY: 0 }}
            transition={springSnappy}
          />
        )}
      </AnimatePresence>

      <span className="shrink-0">
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="truncate flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="min-w-[18px] h-[18px] rounded-full bg-[var(--accent)] text-white text-[10px] font-medium flex items-center justify-center px-1 shrink-0">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
