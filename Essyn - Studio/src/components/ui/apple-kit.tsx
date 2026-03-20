"use client";

import { type ReactNode, type ComponentType } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import { X, Loader2, AlertCircle, Inbox, HelpCircle } from "lucide-react";
import {
  springModalIn,
  springDrawerIn,
  springOverlay,
  springContentIn,
  springFadeIn,
} from "@/lib/motion-tokens";
import { PRIMARY_CTA, SECONDARY_CTA, GHOST_BTN } from "@/lib/design-tokens";

// ═══════════════════════════════════════════════
// WidgetCard — refined, no shadow on default
// ═══════════════════════════════════════════════

interface WidgetCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function WidgetCard({
  children,
  className = "",
  onClick,
  hover = true,
}: WidgetCardProps) {
  return (
    <motion.div
      {...springContentIn}
      className={`bg-[var(--card)] border border-[var(--border-subtle)] rounded-xl ${
        hover && onClick
          ? "cursor-pointer hover:bg-[var(--card-hover)] transition-colors"
          : hover
          ? "hover:bg-[var(--card-hover)] transition-colors"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// Panel — unified container (reference-inspired)
// Single white surface grouping related content
// ═══════════════════════════════════════════════

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[var(--card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

// Panel header — title + subtitle + actions
export function PanelHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
      <div>
        <h2 className="text-[17px] font-semibold text-[var(--fg)] tracking-[-0.016em]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] text-[var(--fg-muted)] mt-0.5 tracking-[-0.004em]">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// Panel section — internal section with separator
export function PanelSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-b border-[var(--border-subtle)] last:border-0 ${className}`}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════
// StatBar — horizontal stats row inside Panel
// Replaces floating KPICard grid
// ═══════════════════════════════════════════════

interface Stat {
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
}

export function StatBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid divide-x divide-[var(--border-subtle)]" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
      {stats.map((s, i) => (
        <div key={i} className="px-5 py-4">
          <p
            className="text-[22px] font-bold tracking-[-0.022em] leading-none"
            style={{ color: s.valueColor || "var(--fg)" }}
          >
            {s.value}
          </p>
          <p className="text-[11px] text-[var(--fg-muted)] mt-1.5 tracking-[-0.003em]">
            {s.label}
          </p>
          {s.subtitle && (
            <p className="text-[11px] text-[var(--fg-secondary)] mt-0.5 tracking-[-0.003em]">
              {s.subtitle}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// DataRow — compact list row (table-style)
// ═══════════════════════════════════════════════

export function DataRow({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 border-b border-[var(--border-subtle)] last:border-0 ${
        onClick
          ? "cursor-pointer hover:bg-[var(--card-hover)] transition-colors"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════
// AlertBanner — full-width dismissible alert
// ═══════════════════════════════════════════════

interface AlertBannerProps {
  variant: "error" | "warning" | "info" | "success";
  children: ReactNode;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
}

const ALERT_COLORS = {
  error:   { bg: "var(--error-subtle)",   text: "var(--error)",   border: "var(--error)" },
  warning: { bg: "var(--warning-subtle)", text: "var(--warning)", border: "var(--warning)" },
  info:    { bg: "var(--info-subtle)",    text: "var(--info)",    border: "var(--info)" },
  success: { bg: "var(--success-subtle)", text: "var(--success)", border: "var(--success)" },
};

export function AlertBanner({ variant, children, onDismiss, action }: AlertBannerProps) {
  const c = ALERT_COLORS[variant];
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl text-[13px] font-medium"
      style={{
        backgroundColor: c.bg,
        color: c.text,
        borderLeft: `2.5px solid ${c.border}`,
      }}
    >
      <span className="flex-1 leading-relaxed">{children}</span>
      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        {action && (
          <button
            onClick={action.onClick}
            className="text-[12px] font-semibold underline-offset-2 hover:underline opacity-80 hover:opacity-100 transition-opacity"
          >
            {action.label}
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// WidgetSkeleton
// ═══════════════════════════════════════════════

export function WidgetSkeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`p-5 space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-full bg-[var(--border-subtle)] animate-pulse"
          style={{ width: `${60 + (i % 3) * 15}%` }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// WidgetEmptyState
// ═══════════════════════════════════════════════

export function WidgetEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div {...springFadeIn} className="py-8 px-6 text-center">
      <div className="mx-auto w-11 h-11 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center mb-3">
        <Icon size={20} className="text-[var(--fg-muted)]" />
      </div>
      <h3 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[12px] text-[var(--fg-muted)] mb-4 max-w-[260px] mx-auto leading-relaxed tracking-[-0.004em]">
          {description}
        </p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// WidgetErrorState
// ═══════════════════════════════════════════════

export function WidgetErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="py-12 px-6 text-center">
      <AlertCircle size={20} className="text-[var(--error)] mx-auto mb-2" />
      <p className="text-[13px] text-[var(--fg-secondary)] mb-4">
        {message || "Erro ao carregar dados."}
      </p>
      {onRetry && (
        <button onClick={onRetry} className={SECONDARY_CTA}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// HeaderWidget — page header
// ═══════════════════════════════════════════════

interface HeaderWidgetProps {
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
}

export function HeaderWidget({ title, subtitle, children }: HeaderWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
    >
      <div>
        <h1 className="t-title1 text-[var(--fg)]">{title}</h1>
        {subtitle && (
          <p className="text-[12px] text-[var(--fg-muted)] mt-1 tracking-[-0.004em]">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// SectionHeader
// ═══════════════════════════════════════════════

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.04em]">
        {title}
      </h3>
      {action}
    </div>
  );
}

// ═══════════════════════════════════════════════
// StatusBadge — dot + label (semantic variants)
// ═══════════════════════════════════════════════

const STATUS_VARIANTS = {
  success: { color: "var(--success)", bg: "var(--success-subtle)" },
  error:   { color: "var(--error)",   bg: "var(--error-subtle)" },
  warning: { color: "var(--warning)", bg: "var(--warning-subtle)" },
  info:    { color: "var(--info)",    bg: "var(--info-subtle)" },
  accent:  { color: "var(--accent)",  bg: "var(--accent-subtle)" },
  purple:  { color: "var(--purple)",  bg: "var(--purple-subtle)" },
  pink:    { color: "var(--pink)",    bg: "var(--pink-subtle)" },
  muted:   { color: "var(--fg-muted)", bg: "var(--bg-subtle)" },
} as const;

type StatusVariant = keyof typeof STATUS_VARIANTS;

export function StatusBadge({
  label,
  variant,
  color,
  bg,
}: {
  label: string;
  variant?: StatusVariant;
  color?: string;
  bg?: string;
}) {
  const v = variant ? STATUS_VARIANTS[variant] : null;
  const finalColor = color || v?.color || "var(--fg-muted)";
  const finalBg = bg || v?.bg || "var(--bg-subtle)";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-medium tracking-[-0.01em]"
      style={{ color: finalColor, backgroundColor: finalBg }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: finalColor }} />
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════
// AppleModal — iOS sheet style
// ═══════════════════════════════════════════════

interface AppleModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function AppleModal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: AppleModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          {/* Backdrop */}
          <motion.div
            {...springOverlay}
            className="absolute inset-0 bg-black/30 backdrop-blur-[8px]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            {...springModalIn}
            className={`relative w-full ${maxWidth} rounded-[20px] border border-[var(--border-subtle)] bg-[var(--card)] shadow-[var(--shadow-xl)] overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-[17px] font-semibold text-[var(--fg)] tracking-[-0.016em]">
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--fg-secondary)] hover:bg-[var(--border-subtle)] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content — scrollable */}
            <div className="max-h-[90vh] sm:max-h-[85vh] overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════
// AppleDrawer — right panel
// ═══════════════════════════════════════════════

interface AppleDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export function AppleDrawer({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
}: AppleDrawerProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            {...springOverlay}
            className="absolute inset-0 bg-black/25 backdrop-blur-[6px]"
            onClick={onClose}
          />
          <motion.div
            {...springDrawerIn}
            className={`relative w-full ${width} bg-[var(--card)] border-l border-[var(--border-subtle)] shadow-[var(--shadow-xl)] flex flex-col`}
          >
            {/* Sticky header */}
            <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
              <h2 className="text-[17px] font-semibold text-[var(--fg)] tracking-[-0.016em]">
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--fg-secondary)] hover:bg-[var(--border-subtle)] transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════
// PageTransition — page entrance animation
// ═══════════════════════════════════════════════

export function PageTransition({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className={`space-y-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// ActionPill — iOS-style segment filter pill
// ═══════════════════════════════════════════════

export function ActionPill({
  label,
  active = false,
  onClick,
  count,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all duration-150 tracking-[-0.006em] ${
        active
          ? "text-[var(--fg)] bg-[var(--card)]"
          : "text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] hover:bg-[var(--bg-subtle)]"
      }`}
      style={active ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 0.5px 1px rgba(0,0,0,0.06)" } : undefined}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-1 text-[10px] tabular-nums ${active ? "text-[var(--fg-secondary)]" : "opacity-40"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════
// KPICard — metric card (standalone)
// ═══════════════════════════════════════════════

export function KPICard({
  icon: Icon,
  label,
  value,
  subtitle,
  subtitleColor,
  valueColor,
  href,
  onClick,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  valueColor?: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between mb-2.5">
        <div className="w-8 h-8 rounded-[8px] bg-[var(--bg-subtle)] flex items-center justify-center">
          <Icon size={16} className="text-[var(--fg-secondary)]" />
        </div>
      </div>
      <p
        className="text-[22px] font-bold tracking-[-0.022em] leading-none"
        style={{ color: valueColor || "var(--fg)" }}
      >
        {value}
      </p>
      <p className="text-[11px] text-[var(--fg-muted)] mt-1.5 tracking-[-0.003em]">{label}</p>
      {subtitle && (
        <p
          className="text-[11px] font-medium mt-0.5 tracking-[-0.003em]"
          style={{ color: subtitleColor || "var(--fg-secondary)" }}
        >
          {subtitle}
        </p>
      )}
    </>
  );

  if (href) {
    const Link = require("next/link").default;
    return (
      <WidgetCard className="p-4 hover:bg-[var(--card-hover)]">
        <Link href={href} className="block">{content}</Link>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard className="p-4" onClick={onClick}>
      {content}
    </WidgetCard>
  );
}

// ═══════════════════════════════════════════════
// ListRow — basic list separator row
// ═══════════════════════════════════════════════

export function ListRow({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-3 px-1 border-b border-[var(--border-subtle)] last:border-0 ${
        onClick
          ? "cursor-pointer hover:bg-[var(--card-hover)] rounded-lg px-3 -mx-2 transition-colors"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════
// ConfirmDialog
// ═══════════════════════════════════════════════

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  destructive = false,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <AppleModal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="p-6">
        {description && (
          <p className="text-[13px] text-[var(--fg-secondary)] mb-6 leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className={SECONDARY_CTA}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${PRIMARY_CTA} ${destructive ? "!bg-[var(--error)]" : ""}`}
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </AppleModal>
  );
}

// ═══════════════════════════════════════════════
// InlineBanner — contextual info strip
// ═══════════════════════════════════════════════

export function InlineBanner({
  variant = "info",
  children,
}: {
  variant?: "info" | "warning" | "error" | "success";
  children: ReactNode;
}) {
  const colors = {
    info:    { bg: "var(--info-subtle)",    text: "var(--info)",    border: "var(--info)" },
    warning: { bg: "var(--warning-subtle)", text: "var(--warning)", border: "var(--warning)" },
    error:   { bg: "var(--error-subtle)",   text: "var(--error)",   border: "var(--error)" },
    success: { bg: "var(--success-subtle)", text: "var(--success)", border: "var(--success)" },
  };
  const c = colors[variant];

  return (
    <div
      className="text-[13px] px-4 py-3 rounded-xl flex items-start gap-2 font-medium"
      style={{
        backgroundColor: c.bg,
        color: c.text,
        borderLeft: `2.5px solid ${c.border}`,
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════
// HelpTip — tooltip
// ═══════════════════════════════════════════════

export function HelpTip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors"
      >
        <HelpCircle size={13} />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 rounded-xl bg-[var(--bg-ink)] text-[var(--fg-light)] text-[11px] leading-relaxed shadow-[var(--shadow-lg)] z-50 pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-ink)] rotate-45 -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
