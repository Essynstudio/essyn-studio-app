/**
 * CommandPalette — Global ⌘K Quick Navigation
 *
 * Spotlight-style command palette for fast module navigation.
 * Triggered by Cmd+K (Mac) or Ctrl+K (Win).
 *
 * Features:
 * - Fuzzy search across all modules
 * - Recent pages
 * - Quick actions
 *
 * Apple Premium design, zero transparency rule.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, LayoutDashboard, Clapperboard, CalendarDays,
  Images, ShoppingBag, FolderKanban, DollarSign,
  Users, Contact, UsersRound, BarChart3,
  FileText, Zap, Link2, Settings,
  ArrowRight, Command, Bell, HardDrive,
  Mail,
} from "lucide-react";
import { springSnappy } from "../../lib/motion-tokens";

/* ═══════════════════════════════════════════════════ */
/*  SEARCH ITEMS                                       */
/* ═══════════════════════════════════════════════════ */

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  route: string;
  section: string;
  keywords?: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, route: "/dashboard", section: "Navegação", keywords: ["home", "início", "painel"] },
  { id: "producao", label: "Produção", icon: <Clapperboard className="w-4 h-4" />, route: "/producao", section: "Navegação", keywords: ["radar", "pipeline", "workflow"] },
  { id: "agenda", label: "Agenda", icon: <CalendarDays className="w-4 h-4" />, route: "/agenda", section: "Navegação", keywords: ["calendário", "eventos", "sessões"] },
  { id: "galeria", label: "Galeria", icon: <Images className="w-4 h-4" />, route: "/galeria", section: "Navegação", keywords: ["fotos", "álbum", "portfolio"] },
  { id: "pedidos", label: "Pedidos", icon: <ShoppingBag className="w-4 h-4" />, route: "/pedidos", section: "Navegação", keywords: ["orders", "encomendas", "produtos"] },
  { id: "projetos", label: "Projetos", icon: <FolderKanban className="w-4 h-4" />, route: "/projetos", section: "Navegação", keywords: ["projects", "gestão"] },
  { id: "financeiro", label: "Financeiro", icon: <DollarSign className="w-4 h-4" />, route: "/financeiro", section: "Navegação", keywords: ["receitas", "pagamentos", "parcelas"] },
  { id: "crm", label: "CRM", icon: <Users className="w-4 h-4" />, route: "/crm", section: "Navegação", keywords: ["leads", "pipeline", "vendas"] },
  { id: "clientes", label: "Clientes", icon: <Contact className="w-4 h-4" />, route: "/clientes", section: "Navegação", keywords: ["contatos", "base"] },
  { id: "time", label: "Time", icon: <UsersRound className="w-4 h-4" />, route: "/time", section: "Navegação", keywords: ["team", "membros", "equipa"] },
  { id: "relatorios", label: "Relatórios", icon: <BarChart3 className="w-4 h-4" />, route: "/relatorios", section: "Navegação", keywords: ["analytics", "métricas", "dados"] },
  { id: "contratos", label: "Contratos", icon: <FileText className="w-4 h-4" />, route: "/contratos", section: "Navegação", keywords: ["documentos", "assinatura"] },
  { id: "automacoes", label: "Automações", icon: <Zap className="w-4 h-4" />, route: "/automacoes", section: "Navegação", keywords: ["workflow", "regras", "triggers"] },
  { id: "integracoes", label: "Integrações", icon: <Link2 className="w-4 h-4" />, route: "/integracoes", section: "Navegação", keywords: ["apps", "api", "connect"] },
  { id: "notificacoes", label: "Notificações", icon: <Bell className="w-4 h-4" />, route: "/notificacoes", section: "Navegação", keywords: ["alertas", "avisos"] },
  { id: "email-templates", label: "Templates de Email", icon: <Mail className="w-4 h-4" />, route: "/email-templates", section: "Navegação", keywords: ["email", "newsletter"] },
  { id: "armazenamento", label: "Armazenamento", icon: <HardDrive className="w-4 h-4" />, route: "/armazenamento", section: "Navegação", keywords: ["storage", "disco", "backup"] },
  { id: "configuracoes", label: "Configurações", icon: <Settings className="w-4 h-4" />, route: "/configuracoes", section: "Navegação", keywords: ["settings", "preferências"] },
];

/* ═══════════════════════════════════════════════════ */
/*  COMPONENT                                          */
/* ═══════════════════════════════════════════════════ */

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIdx(0);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return COMMAND_ITEMS;
    const q = query.toLowerCase();
    return COMMAND_ITEMS.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true;
      if (item.sublabel?.toLowerCase().includes(q)) return true;
      if (item.keywords?.some((k) => k.includes(q))) return true;
      return false;
    });
  }, [query]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIdx(0);
  }, [results.length]);

  const handleSelect = useCallback((item: CommandItem) => {
    setOpen(false);
    setQuery("");
    navigate(item.route);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      handleSelect(results[selectedIdx]);
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="cmd-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={springSnappy}
        className="fixed inset-0 z-[10000] bg-[#1D1D1F]"
        onClick={() => setOpen(false)}
      />
      <motion.div
        key="cmd-palette"
        initial={{ opacity: 0, scale: 0.96, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -20 }}
        transition={springSnappy}
        className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[10001] w-full max-w-[520px] px-4"
      >
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#F2F2F7]">
            <Search className="w-4 h-4 text-[#C7C7CC] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Navegar para..."
              className="flex-1 text-[14px] text-[#1D1D1F] bg-transparent outline-none placeholder:text-[#C7C7CC]"
              style={{ fontWeight: 400 }}
            />
            <kbd className="px-1.5 py-0.5 rounded-md bg-[#F2F2F7] text-[10px] text-[#8E8E93] shrink-0" style={{ fontWeight: 500 }}>
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto py-1.5">
            {results.length > 0 ? (
              results.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 transition-colors cursor-pointer text-left ${
                    idx === selectedIdx ? "bg-[#F5F5F7]" : "hover:bg-[#FAFAFA]"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    idx === selectedIdx ? "bg-[#007AFF] text-white" : "bg-[#F2F2F7] text-[#8E8E93]"
                  } transition-colors`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{item.label}</span>
                    {item.sublabel && (
                      <span className="text-[10px] text-[#AEAEB2] block" style={{ fontWeight: 400 }}>{item.sublabel}</span>
                    )}
                  </div>
                  {idx === selectedIdx && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#007AFF] shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center py-8 gap-2">
                <Search className="w-6 h-6 text-[#D1D1D6]" />
                <p className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                  Nenhum resultado para &ldquo;{query}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#F2F2F7]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-[#F2F2F7] text-[9px] text-[#8E8E93]" style={{ fontWeight: 500 }}>↑</kbd>
                <kbd className="px-1 py-0.5 rounded bg-[#F2F2F7] text-[9px] text-[#8E8E93]" style={{ fontWeight: 500 }}>↓</kbd>
                <span className="text-[9px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>navegar</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-[#F2F2F7] text-[9px] text-[#8E8E93]" style={{ fontWeight: 500 }}>↵</kbd>
                <span className="text-[9px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>abrir</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Command className="w-2.5 h-2.5 text-[#C7C7CC]" />
              <span className="text-[9px] text-[#C7C7CC]" style={{ fontWeight: 500 }}>K</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}