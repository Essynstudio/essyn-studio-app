import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Search, X, Plus, ChevronDown, ChevronRight,
  Bell, Menu, FolderKanban, Users, DollarSign,
  Images, CalendarDays, Clapperboard,
} from "lucide-react";
import { DISPLAY } from "./editorial";
import { useDk } from "../../lib/useDarkColors";
import { useGlobalSearch } from "../../lib/useGlobalSearch";
import { DarkModeToggle } from "./DarkModeToggle";
import { NotificationCenter, type Notification, mockNotifications } from "./NotificationCenter";
import { SearchResults } from "./SearchResults";

/* ─── Types ─── */

export interface TopbarBreadcrumb {
  section: string;
  page: string;
}

export interface TopbarQuickAction {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export interface TopbarCta {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /**
   * Quick actions dropdown — when provided, renders a split button:
   * - Left side (icon + label) → executes primary onClick
   * - Right side (caret ▾) → opens dropdown with quick actions
   */
  quickActions?: TopbarQuickAction[];
}

export interface TopbarAvatar {
  initials: string;
  name: string;
  plan: string;
}

export interface TopbarProps {
  breadcrumb: TopbarBreadcrumb;
  cta?: TopbarCta;
  secondaryCta?: TopbarCta;
  avatar?: TopbarAvatar;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onMaiaInlineToggle?: () => void;
  maiaInlineOpen?: boolean;
  /** Mobile hamburger callback */
  onMobileMenuToggle?: () => void;
  /** Whether we're in mobile mode */
  isMobile?: boolean;
  /** External notification count (e.g. from AppStore) — merged with internal */
  externalNotificationCount?: number;
}

/* ─── Default quick actions ─── */

export const defaultQuickActions: TopbarQuickAction[] = [
  { label: "Novo Projeto", icon: <FolderKanban className="w-3.5 h-3.5" /> },
  { label: "Novo Lead", icon: <Users className="w-3.5 h-3.5" /> },
  { label: "Novo Lançamento", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { label: "Nova Coleção", icon: <Images className="w-3.5 h-3.5" /> },
  { label: "Novo Evento", icon: <CalendarDays className="w-3.5 h-3.5" /> },
  { label: "Novo Trabalho", icon: <Clapperboard className="w-3.5 h-3.5" /> },
];

/* ─── Subcomponents ─── */

function TopbarSearch({
  placeholder,
  onSearchQuery,
  searchOpen,
  onSearchOpenChange,
}: {
  placeholder: string;
  onSearchQuery?: (q: string) => void;
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useDk();

  function handleChange(newValue: string) {
    setValue(newValue);
    onSearchQuery?.(newValue);
    onSearchOpenChange(newValue.trim().length > 0);
  }

  function handleClear() {
    setValue("");
    onSearchQuery?.("");
    onSearchOpenChange(false);
  }

  return (
    <div className="relative" ref={searchContainerRef}>
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-[260px] transition-all ${
          isDark
            ? focused
              ? "bg-[#1C1C1E] border border-[#3C3C43] ring-1 ring-[#48484A] shadow-[0_2px_8px_#000000]"
              : "bg-[#1C1C1E] border border-transparent hover:bg-[#2C2C2E]"
            : focused
              ? "bg-white border border-[#E5E5EA] ring-1 ring-[#D1D1D6] shadow-[0_2px_8px_#E5E5EA]"
              : "bg-[#F5F5F7] border border-transparent hover:bg-[#E5E5EA]"
        }`}
      >
        <Search className={`w-3.5 h-3.5 shrink-0 transition-colors ${focused ? "text-[#8E8E93]" : "text-[#AEAEB2]"}`} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 200);
          }}
          className={`flex-1 bg-transparent text-[13px] outline-none min-w-0 ${
            isDark ? "text-[#F5F5F7] placeholder:text-[#636366]" : "text-[#1D1D1F] placeholder:text-[#AEAEB2]"
          }`}
          style={{ fontWeight: 400 }}
        />
        {value ? (
          <button
            onClick={handleClear}
            className={`flex items-center justify-center w-4 h-4 rounded-full transition-colors cursor-pointer ${
              isDark ? "bg-[#3C3C43] hover:bg-[#48484A] text-[#8E8E93]" : "bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#8E8E93]"
            }`}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        ) : (
          <span className="flex items-center gap-0.5 shrink-0 ml-auto">
            <kbd
              className={`text-[10px] text-[#AEAEB2] rounded px-1 py-0.5 ${
                isDark ? "bg-[#1C1C1E] border border-[#3C3C43]" : "bg-white border border-[#E5E5EA]"
              }`}
              style={{ fontWeight: 500 }}
            >
              ⌘
            </kbd>
            <kbd
              className={`text-[10px] text-[#AEAEB2] rounded px-1 py-0.5 ${
                isDark ? "bg-[#1C1C1E] border border-[#3C3C43]" : "bg-white border border-[#E5E5EA]"
              }`}
              style={{ fontWeight: 500 }}
            >
              K
            </kbd>
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Simple Button (secondary / backward compat) ─── */

function TopbarButton({
  cta,
  variant = "primary",
}: {
  cta: TopbarCta;
  variant?: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={cta.onClick}
      disabled={cta.disabled}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[13px] transition-all ${
        cta.disabled
          ? isPrimary
            ? "bg-[#D1D1D6] text-[#F5F5F7] cursor-not-allowed"
            : "border border-[#E5E5EA] text-[#D1D1D6] cursor-not-allowed"
          : isPrimary
          ? "bg-[#1D1D1F] text-white hover:bg-[#48484A] active:scale-[0.98] cursor-pointer"
          : "border border-[#E5E5EA] text-[#636366] hover:bg-[#F2F2F7] hover:border-[#D1D1D6] active:scale-[0.98] cursor-pointer"
      }`}
      style={{ fontWeight: 500 }}
    >
      {cta.icon || (isPrimary && <Plus className="w-3.5 h-3.5" />)}
      <span>{cta.label}</span>
    </button>
  );
}

/* ─── Split Button (contextual + dropdown) ─── */

function SplitButton({
  cta,
  disabled = false,
}: {
  cta: TopbarCta;
  disabled?: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isDark } = useDk();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const isDisabled = disabled || cta.disabled;

  return (
    <div className="relative" ref={ref}>
      <div
        className={`flex items-center rounded-xl overflow-hidden transition-all ${
          isDisabled
            ? "bg-[#D1D1D6] cursor-not-allowed"
            : "bg-[#1D1D1F]"
        }`}
      >
        {/* ── Primary action (left side) ── */}
        <button
          type="button"
          onClick={isDisabled ? undefined : cta.onClick}
          disabled={isDisabled}
          className={`flex items-center gap-1.5 pl-3.5 pr-2.5 py-1.5 text-[13px] transition-all ${
            isDisabled
              ? "text-[#8E8E93] cursor-not-allowed"
              : "text-white hover:bg-[#3C3C43] active:scale-[0.98] cursor-pointer"
          }`}
          style={{ fontWeight: 500 }}
        >
          {cta.icon || <Plus className="w-3.5 h-3.5" />}
          <span>{cta.label}</span>
        </button>

        {/* ── Divider ── */}
        <div className={`w-px h-5 ${isDisabled ? "bg-[#48484A]" : "bg-[#48484A]"}`} />

        {/* ── Caret (right side) ── */}
        <button
          type="button"
          onClick={isDisabled ? undefined : () => setDropdownOpen(!dropdownOpen)}
          disabled={isDisabled}
          className={`flex items-center justify-center px-2 py-1.5 transition-all ${
            isDisabled
              ? "text-[#636366] cursor-not-allowed"
              : dropdownOpen
              ? "text-white bg-[#3C3C43] cursor-pointer"
              : "text-[#8E8E93] hover:text-white hover:bg-[#3C3C43] cursor-pointer"
          }`}
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* ── Quick Actions Dropdown ── */}
      {dropdownOpen && cta.quickActions && (
        <div className={`absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border py-1 overflow-hidden ${
          isDark
            ? "border-[#2C2C2E] bg-[#1C1C1E] shadow-[0_4px_16px_#000000]"
            : "border-[#E5E5EA] bg-white shadow-[0_4px_16px_#E5E5EA]"
        }`}>
          <div className={`px-3 py-1.5 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#E5E5EA]"}`}>
            <span
              className={`text-[10px] uppercase tracking-[0.08em] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
              style={{ fontWeight: 600 }}
            >
              Criar novo
            </span>
          </div>
          {cta.quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setDropdownOpen(false);
                action.onClick?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors cursor-pointer ${
                isDark
                  ? "text-[#AEAEB2] hover:bg-[#2C2C2E]"
                  : "text-[#636366] hover:bg-[#F5F5F7]"
              }`}
              style={{ fontWeight: 400 }}
            >
              <span className={`flex items-center justify-center w-5 h-5 ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}>
                {action.icon || <Plus className="w-3.5 h-3.5" />}
              </span>
              {action.label}
            </button>
          ))}
          <div className={`h-px my-1 ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`} />
          <div className="px-3 py-1.5 flex items-center gap-2">
            <span className={`text-[10px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`} style={{ fontWeight: 400 }}>
              Dica: o botão principal muda por módulo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─── */

export function Topbar({
  breadcrumb,
  searchPlaceholder = "Buscar…",
  cta,
  secondaryCta,
  avatar = { initials: "MR", name: "Marina R.", plan: "Studio Pro" },
  onSearch,
  onMaiaInlineToggle,
  maiaInlineOpen,
  onMobileMenuToggle,
  isMobile,
  externalNotificationCount = 0,
}: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchOpen, setSearchOpen] = useState(false);

  // Use global search hook
  const { query, setQuery, isSearching, results, groupedResults } = useGlobalSearch();

  // Dark mode state — used for all conditional styling below
  const { isDark } = useDk();

  const hasSplitButton = cta && cta.quickActions && cta.quickActions.length > 0;

  /* Calculate unread count dynamically (internal + external AppStore) */
  const unreadCount = notifications.filter((n) => !n.read).length + externalNotificationCount;

  /* Mark notification as read */
  function handleMarkAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  /* Mark all notifications as read */
  function handleMarkAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  /* Handle search query change */
  function handleSearchQuery(q: string) {
    setQuery(q);
    onSearch?.(q); // Keep backward compatibility
  }

  return (
    <header className={`flex items-center h-14 shrink-0 gap-4 ${
      isMobile ? "px-3" : "px-6"
    } ${isDark ? "bg-[#0A0A0A] border-b border-[#2C2C2E]" : "bg-white border-b border-[#E5E5EA]"}`}>
      {/* Mobile Menu Toggle */}
      {isMobile && (
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.97] text-[#636366] hover:bg-[#F5F5F7]"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Breadcrumb — hide section on mobile */}
      <div className="flex items-center gap-1.5">
        {!isMobile && (
          <>
            <span
              className={`text-[13px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`}
              style={{ fontWeight: 400 }}
            >
              {breadcrumb.section}
            </span>
            <ChevronRight className={`w-3 h-3 ${isDark ? "text-[#48484A]" : "text-[#D1D1D6]"}`} />
          </>
        )}
        <span
          className={`text-[13px] ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
          style={{ fontWeight: 500 }}
        >
          {breadcrumb.page}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search with results — hide on mobile */}
      {!isMobile && (
        <div className="relative">
          <TopbarSearch 
            placeholder={searchPlaceholder} 
            onSearchQuery={handleSearchQuery}
            searchOpen={searchOpen}
            onSearchOpenChange={setSearchOpen}
          />
          
          {/* Search Results Dropdown */}
          <SearchResults
            query={query}
            results={results}
            groupedResults={groupedResults}
            isSearching={isSearching}
            isOpen={searchOpen}
            onClose={() => {
              setSearchOpen(false);
              setQuery("");
            }}
          />
        </div>
      )}

      {/* Secondary CTA */}
      {secondaryCta && <TopbarButton cta={secondaryCta} variant="secondary" />}

      {/* Primary CTA — split or simple */}
      {cta && (
        hasSplitButton
          ? <SplitButton cta={cta} />
          : <TopbarButton cta={cta} variant="primary" />
      )}

      {/* Maia Button */}
      {onMaiaInlineToggle && (
        <>
          <span className={`w-px h-6 ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`} />
          <button
            type="button"
            onClick={onMaiaInlineToggle}
            className="group flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.97]"
            style={{
              background: isDark
                ? maiaInlineOpen ? "#1C1C1E" : "#141414"
                : maiaInlineOpen ? "#F5F5F7" : "#FAFAFA",
              border: isDark
                ? maiaInlineOpen ? "1px solid #3C3C43" : "1px solid #2C2C2E"
                : maiaInlineOpen ? "1px solid #E5E5EA" : "1px solid #F2F2F7",
            }}
            title="Abrir Maia (⌘K)"
          >
            {/* M mark */}
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
              style={{
                background: isDark
                  ? maiaInlineOpen ? "#2C2C2E" : "#1C1C1E"
                  : maiaInlineOpen ? "#F0EDE8" : "#F5F5F7",
                border: isDark
                  ? maiaInlineOpen ? "1px solid #3C3C43" : "1px solid transparent"
                  : maiaInlineOpen ? "1px solid #E5E0D8" : "1px solid transparent",
              }}
            >
              <span
                className="text-[14px]"
                style={{
                  fontFamily: DISPLAY,
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: maiaInlineOpen ? "var(--maia-accent)" : "#AEAEB2",
                }}
              >
                M
              </span>
            </div>
            
            {!isMobile && (
              <div className="flex flex-col items-start">
                <span
                  className="text-[11px] transition-colors duration-200"
                  style={{
                    fontWeight: 500,
                    color: maiaInlineOpen ? "var(--maia-accent)" : isDark ? "#8E8E93" : "#636366",
                  }}
                >
                  Maia
                </span>
                <span
                  className="text-[9px]"
                  style={{
                    fontWeight: 400,
                    color: "#AEAEB2",
                  }}
                >
                  ⌘K
                </span>
              </div>
            )}
          </button>
        </>
      )}

      {/* Dark Mode Toggle */}
      <DarkModeToggle />

      {/* Separator */}
      <span className={`w-px h-6 ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`} />

      {/* Notifications */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
          className={`relative flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all duration-150 ${
            isDark
              ? "hover:bg-[#1C1C1E] active:bg-[#2C2C2E] text-[#8E8E93] hover:text-[#F5F5F7]"
              : "hover:bg-[#F5F5F7] active:bg-[#E5E5EA] text-[#636366] hover:text-[#1D1D1F]"
          }`}
          aria-label="Notificações"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span 
              className={`absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-[#EF4444] border-2 ${isDark ? "border-[#0A0A0A]" : "border-white"}`}
              aria-label={`${unreadCount} notificações não lidas`}
            />
          )}
        </button>

        {/* Notification Center Panel */}
        <NotificationCenter
          isOpen={notificationPanelOpen}
          onClose={() => setNotificationPanelOpen(false)}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </div>

      {/* Separator */}
      <span className={`w-px h-6 ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`} />

      {/* Avatar / Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-[#1C1C1E]" : "bg-[#F2F2F7]"}`}>
            <span
              className={`text-[11px] ${isDark ? "text-[#8E8E93]" : "text-[#636366]"}`}
              style={{ fontWeight: 600 }}
            >
              {avatar.initials}
            </span>
          </div>
          {!isMobile && (
            <>
              <div className="flex flex-col items-start">
                <span
                  className={`text-[12px] ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
                  style={{ fontWeight: 500 }}
                >
                  {avatar.name}
                </span>
                <span
                  className="text-[10px] text-[#8E8E93]"
                  style={{ fontWeight: 400 }}
                >
                  {avatar.plan}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-[#AEAEB2]" />
            </>
          )}
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            {createPortal(
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setMenuOpen(false)}
              />,
              document.body
            )}
            <div className={`absolute right-0 top-full mt-2 z-[9999] w-48 rounded-xl border py-1 overflow-hidden ${
              isDark
                ? "bg-[#1C1C1E] border-[#2C2C2E] shadow-[0_4px_16px_#000000]"
                : "bg-white border-[#E5E5EA] shadow-[0_4px_16px_#E5E5EA]"
            }`}>
              <div className={`px-3 py-2 border-b ${isDark ? "border-[#2C2C2E]" : "border-[#E5E5EA]"}`}>
                <span
                  className={`text-[12px] block ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
                  style={{ fontWeight: 500 }}
                >
                  {avatar.name}
                </span>
                <span
                  className="text-[10px] text-[#8E8E93]"
                  style={{ fontWeight: 400 }}
                >
                  {avatar.plan}
                </span>
              </div>
              {[
                "Minha conta",
                "Configurações",
                "Plano & Faturamento",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => setMenuOpen(false)}
                  className={`w-full text-left px-3 py-2 text-[13px] transition-colors cursor-pointer ${
                    isDark
                      ? "text-[#8E8E93] hover:bg-[#2C2C2E] hover:text-[#F5F5F7]"
                      : "text-[#636366] hover:bg-[#F5F5F7]"
                  }`}
                  style={{ fontWeight: 400 }}
                >
                  {item}
                </button>
              ))}
              <div className={`h-px ${isDark ? "bg-[#2C2C2E]" : "bg-[#E5E5EA]"}`} />
              <button
                onClick={() => setMenuOpen(false)}
                className={`w-full text-left px-3 py-2 text-[13px] text-[#FF3B30] transition-colors cursor-pointer ${
                  isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#F5F5F7]"
                }`}
                style={{ fontWeight: 400 }}
              >
                Sair
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}