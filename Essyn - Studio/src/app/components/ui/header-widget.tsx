import { type ReactNode, useMemo } from "react";
import { Search } from "lucide-react";
import { motion } from "motion/react";
import { springSidebar, withDelay } from "../../lib/motion-tokens";
import { WIDGET_STYLE } from "../../lib/apple-style";
import { ActionPillGroup } from "./action-pill";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════════════════ */
/*  HeaderWidget — Apple Premium Masthead Card                    */
/*  Greeting + context line + quick action pills + opt search.    */
/*  Used as the topmost card in Dashboard-style pages.            */
/* ═══════════════════════════════════════════════════════════════ */

export interface HeaderWidgetProps {
  /** Greeting text (default: auto-computed by time of day) */
  greeting?: string;
  /** User first name */
  userName: string;
  /** Context summary line (e.g. "6 compromissos hoje") */
  contextLine?: string;
  /** Quick action pills */
  quickActions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
  }>;
  /** Show inline search input */
  showSearch?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Optional body — rendered below the masthead (before footer) */
  children?: ReactNode;
}

export function HeaderWidget({
  greeting,
  userName,
  contextLine,
  quickActions,
  showSearch = false,
  searchPlaceholder = "Buscar projetos, clientes...",
  searchValue = "",
  onSearchChange,
  children,
}: HeaderWidgetProps) {
  const { isDark } = useDk();
  const autoGreeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const formattedDate = useMemo(() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleString("pt-BR", { month: "long" });
    const weekday = d.toLocaleString("pt-BR", { weekday: "long" });
    return `${weekday}, ${day} de ${month}`;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSidebar}
      className={`flex flex-col overflow-hidden ${isDark ? "bg-[#141414]" : "bg-white"}`}
      style={isDark ? { ...WIDGET_STYLE, boxShadow: "0 0.5px 1px #000000, 0 1px 3px #000000" } : WIDGET_STYLE}
    >
      {/* Masthead */}
      <div className="px-5 pt-5 pb-4 flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <p
              className={`text-[13px] capitalize ${isDark ? "text-[#636366]" : "text-[#8E8E93]"}`}
              style={{ fontWeight: 400, lineHeight: 1.4 }}
            >
              {formattedDate}
            </p>
            <h1
              className={`text-[28px] tracking-[-0.025em] ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
              style={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              {greeting || autoGreeting}{userName ? `, ${userName}` : ""}
            </h1>
          </div>

          {showSearch && (
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-[#C7C7CC] pointer-events-none" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className={`w-[220px] h-[34px] pl-8 pr-3 text-[13px] placeholder-[#C7C7CC] transition-all duration-200 focus:outline-none focus:w-[280px] ${
                  isDark
                    ? "text-[#F5F5F7] bg-[#1C1C1E] focus:bg-[#2C2C2E]"
                    : "text-[#1D1D1F] bg-[#F5F5F7] focus:bg-[#EDEDF0]"
                }`}
                style={{ fontWeight: 400, borderRadius: 10 }}
              />
            </div>
          )}
        </div>

        {contextLine && (
          <p
            className={`text-[13px] -mt-1 ${isDark ? "text-[#636366]" : "text-[#8E8E93]"}`}
            style={{ fontWeight: 400, lineHeight: 1.4 }}
          >
            {contextLine}
          </p>
        )}

        {quickActions && quickActions.length > 0 && (
          <ActionPillGroup
            actions={quickActions}
            className="-ml-1.5"
          />
        )}
      </div>

      {/* Body (alerts, metrics, etc.) */}
      {children}
    </motion.div>
  );
}