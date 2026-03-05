import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  X,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Copy,
  Archive,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { springPopoverIn } from "../../lib/motion-tokens";
import type { Projeto } from "./projetosData";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  SHARED TYPES                                       */
/* ═══════════════════════════════════════════════════ */

export type TabState = "ready" | "loading" | "error";

export type TabId = "cadastro" | "producao" | "financeiro" | "galeria" | "docs" | "timeline" | "portal";

/* ═══════════════════════════════════════════════════ */
/*  REUSABLE DRAWER PRIMITIVES                        */
/* ═══════════════════════════════════════════════════ */

/* ─── DrawerCard: Section wrapper ─── */

export function DrawerCard({
  title,
  count,
  extra,
  children,
}: {
  title: string;
  count?: number;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const dk = useDk();
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-[0.1em]"
          style={{ fontWeight: 600, color: dk.textDisabled }}
        >
          {title}
          {count !== undefined && (
            <span className="ml-1" style={{ color: dk.textDisabled }}>({count})</span>
          )}
        </span>
        {extra}
      </div>
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: dk.border, backgroundColor: dk.bg }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── DrawerCardRow: Single row inside a card ─── */

export function DrawerCardRow({
  icon,
  label,
  value,
  meta,
  trailing,
  noBorder,
}: {
  icon?: ReactNode;
  label?: string;
  value: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  noBorder?: boolean;
}) {
  const dk = useDk();
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${
        noBorder ? "" : "border-b last:border-b-0"
      }`}
      style={{ borderColor: noBorder ? undefined : dk.hairline }}
    >
      {icon && (
        <div className="shrink-0" style={{ color: dk.textDisabled }}>{icon}</div>
      )}
      <div className="flex flex-col min-w-0 flex-1">
        {label && (
          <span
            className="text-[11px]"
            style={{ fontWeight: 400, color: dk.textSubtle }}
          >
            {label}
          </span>
        )}
        <div className="text-[13px]" style={{ fontWeight: 400, color: dk.textSecondary }}>
          {value}
        </div>
        {meta && (
          <div className="text-[12px] mt-0.5" style={{ fontWeight: 400, color: dk.textMuted }}>
            {meta}
          </div>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

/* ─── Tab Loading skeleton ─── */

export function TabLoading() {
  const dk = useDk();
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          <div
            className="h-2.5 rounded"
            style={{ width: 80 + i * 20, backgroundColor: dk.bgMuted }}
          />
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: dk.border, backgroundColor: dk.bg }}>
            {Array.from({ length: 2 + (i % 2) }).map((_, j) => (
              <div
                key={j}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                style={{ borderColor: dk.hairline }}
              >
                <div className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: dk.bgMuted }} />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div
                    className="h-2.5 rounded"
                    style={{ width: 100 + j * 40, backgroundColor: dk.bgMuted }}
                  />
                  <div
                    className="h-2 rounded"
                    style={{ width: 140 + j * 20, backgroundColor: dk.isDark ? "#1C1C1E" : "#F5F5F7" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Tab Empty state ─── */

export function TabEmpty({
  icon,
  title,
  description,
  ctaLabel,
  ctaIcon,
  onCta,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  ctaIcon?: ReactNode;
  onCta?: () => void;
}) {
  const dk = useDk();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: dk.bgMuted }}
      >
        {icon}
      </div>
      <div className="flex flex-col items-center gap-1.5 max-w-[260px]">
        <span
          className="text-[15px]"
          style={{ fontWeight: 500, color: dk.textSecondary }}
        >
          {title}
        </span>
        <span
          className="text-[12px] text-center"
          style={{ fontWeight: 400, color: dk.textSubtle }}
        >
          {description}
        </span>
      </div>
      <button
        onClick={onCta}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] active:scale-[0.98] transition-all cursor-pointer"
        style={{
          fontWeight: 500,
          backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F",
          color: dk.isDark ? "#1D1D1F" : "#FFFFFF",
          boxShadow: dk.shadowCard,
        }}
      >
        {ctaIcon || <Plus className="w-3.5 h-3.5" />}
        {ctaLabel}
      </button>
    </div>
  );
}

/* ─── Tab Error state ─── */

export function TabError({ onRetry }: { onRetry?: () => void }) {
  const dk = useDk();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: dk.dangerBg }}
      >
        <AlertCircle className="w-5 h-5 text-[#FF3B30]" />
      </div>
      <div className="flex flex-col items-center gap-1.5 max-w-[260px]">
        <span
          className="text-[15px]"
          style={{ fontWeight: 500, color: dk.textSecondary }}
        >
          Erro ao carregar
        </span>
        <span
          className="text-[12px] text-center"
          style={{ fontWeight: 400, color: dk.textSubtle }}
        >
          Houve um problema ao carregar os dados desta seção.
        </span>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] active:scale-[0.98] transition-all cursor-pointer"
        style={{
          fontWeight: 500,
          backgroundColor: dk.isDark ? "#F5F5F7" : "#1D1D1F",
          color: dk.isDark ? "#1D1D1F" : "#FFFFFF",
          boxShadow: dk.shadowCard,
        }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Tentar novamente
      </button>
    </div>
  );
}

/* ─── Tab state wrapper (loading / error / content) ─── */

export function TabStateWrapper({
  state,
  onRetry,
  children,
}: {
  state: TabState;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (state === "loading") return <TabLoading />;
  if (state === "error") return <TabError onRetry={onRetry} />;
  return <>{children}</>;
}

/* ═══════════════════════════════════════════════════ */
/*  DELETE CONFIRMATION MODAL                         */
/* ═══════════════════════════════════════════════════ */

export function DeleteConfirmation({
  projeto,
  onClose,
  onConfirm,
}: {
  projeto: Projeto;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dk = useDk();
  const [typed, setTyped] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const items = [
    {
      id: "fotos",
      label: `${projeto.fotos || 0} fotos serão excluídas permanentemente`,
    },
    {
      id: "contatos",
      label: "Dados de contatos e histórico serão removidos",
    },
    {
      id: "financeiro",
      label: "Registros financeiros serão perdidos",
    },
  ];

  const allChecked = items.every((i) => checks[i.id]);
  const nameMatches =
    typed.trim().toLowerCase() === projeto.nome.toLowerCase();
  const canConfirm = allChecked && nameMatches;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#1D1D1F]"
        style={{ opacity: 0.4 }}
        onClick={onClose}
      />
      <div
        className="relative rounded-2xl w-full max-w-[440px] mx-4 overflow-hidden"
        style={{ backgroundColor: dk.bg, boxShadow: dk.shadowModal }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{ backgroundColor: dk.dangerBg }}
          >
            <AlertCircle className="w-5 h-5 text-[#FF3B30]" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h3
              className="text-[15px]"
              style={{ fontWeight: 600, color: dk.isDark ? "#E5E5EA" : "#48484A" }}
            >
              Excluir projeto
            </h3>
            <p
              className="text-[13px]"
              style={{ fontWeight: 400, color: dk.textMuted }}
            >
              Esta ação é irreversível. Todos os dados de{" "}
              <span style={{ fontWeight: 500 }}>"{projeto.nome}"</span> serão
              perdidos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded-lg transition-colors cursor-pointer"
            style={{ color: dk.textSubtle }}
            onMouseEnter={(e) => { e.currentTarget.style.color = dk.textTertiary; e.currentTarget.style.backgroundColor = dk.bgMuted; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = dk.textSubtle; e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Checklist */}
        <div className="px-6 py-3 flex flex-col gap-1.5">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <div
                className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors`}
                style={{
                  backgroundColor: checks[item.id] ? "#FF3B30" : "transparent",
                  borderColor: checks[item.id] ? "#FF3B30" : dk.border,
                }}
                onClick={() =>
                  setChecks((c) => ({ ...c, [item.id]: !c[item.id] }))
                }
              >
                {checks[item.id] && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className="text-[12px] text-[#FF3B30]"
                style={{ fontWeight: 400 }}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>

        {/* Type to confirm */}
        <div className="px-6 py-3">
          <label
            className="text-[11px] block mb-1.5"
            style={{ fontWeight: 500, color: dk.textMuted }}
          >
            Digite{" "}
            <span className="font-mono text-[#FF3B30]">{projeto.nome}</span>{" "}
            para confirmar
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={projeto.nome}
            className="w-full px-3 py-2 rounded-xl border text-[13px] outline-none transition-all"
            style={{
              fontWeight: 400,
              borderColor: dk.border,
              backgroundColor: dk.isDark ? "#2C2C2E" : "#FFFFFF",
              color: dk.textSecondary,
            }}
          />
        </div>

        {/* Actions */}
        <div
          className="flex items-center justify-end gap-2 px-6 py-4 border-t"
          style={{ borderColor: dk.hairline }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] transition-colors cursor-pointer"
            style={{ fontWeight: 500, color: dk.textTertiary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            Cancelar
          </button>
          <button
            onClick={canConfirm ? onConfirm : undefined}
            disabled={!canConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] transition-all"
            style={{
              fontWeight: 500,
              backgroundColor: canConfirm ? "#FF3B30" : dk.isDark ? "#4A2020" : "#F2DDD9",
              color: "white",
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir permanentemente
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  TAB STATE DEMO TOGGLES                            */
/* ═══════════════════════════════════════════════════ */

export function TabStatePicker({
  state,
  onChange,
}: {
  state: TabState;
  onChange: (s: TabState) => void;
}) {
  const dk = useDk();
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5 shrink-0"
      style={{ backgroundColor: dk.bgMuted }}
    >
      {(["ready", "loading", "error"] as TabState[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="px-2 py-0.5 rounded-md text-[9px] uppercase tracking-[0.06em] transition-all cursor-pointer"
          style={{
            fontWeight: 500,
            backgroundColor: state === s ? dk.bg : "transparent",
            color: state === s ? dk.textSecondary : dk.textDisabled,
            boxShadow: state === s ? dk.shadowCard : undefined,
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  DRAWER HEADER ACTIONS MENU                        */
/* ═══════════════════════════════════════════════════ */

export function ActionsMenu({
  open,
  onToggle,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const dk = useDk();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        onToggle();
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onToggle]);

  const actions = [
    {
      icon: <Pencil className="w-3.5 h-3.5" />,
      label: "Editar cadastro",
      variant: "default" as const,
    },
    {
      icon: <Copy className="w-3.5 h-3.5" />,
      label: "Duplicar projeto",
      variant: "default" as const,
    },
    {
      icon: <Archive className="w-3.5 h-3.5" />,
      label: "Arquivar",
      variant: "default" as const,
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className="p-1.5 rounded-lg transition-colors cursor-pointer"
        style={{
          backgroundColor: open ? dk.bgMuted : "transparent",
          color: open ? dk.textMuted : dk.textSubtle,
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.backgroundColor = dk.bgMuted; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-20 w-48 rounded-xl border py-1 overflow-hidden"
          style={{ borderColor: dk.border, backgroundColor: dk.bg, boxShadow: dk.shadowModal }}
        >
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={onToggle}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors cursor-pointer"
              style={{ fontWeight: 400, color: dk.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
          <div className="h-px my-1" style={{ backgroundColor: dk.hairline }} />
          <button
            onClick={() => {
              onToggle();
              onDelete();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#FF3B30] transition-colors cursor-pointer"
            style={{ fontWeight: 400 }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dk.bgMuted}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir projeto
          </button>
        </div>
      )}
    </div>
  );
}