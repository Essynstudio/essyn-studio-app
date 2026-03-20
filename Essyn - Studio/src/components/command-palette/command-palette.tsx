"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IconSearch,
  IconProjetos,
  IconLeads,
  IconAgenda,
  IconAddCircle,
  IconFinanceiro,
  IconLoading,
  IconGaleria,
  IconContratos,
  IconUserAdd,
  IconProducao,
  IconPedidos,
  IconTime,
  IconConfiguracoes,
  IconIris,
} from "@/components/icons/essyn-icons";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDrawer } from "@/components/drawers/drawer-provider";
import { springModalIn, springOverlay, springSnappy } from "@/lib/motion-tokens";
import { PILL_CLS } from "@/lib/design-tokens";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: "projeto" | "cliente" | "parcela" | "evento" | "galeria" | "contrato" | "lead" | "acao";
  icon: typeof IconProjetos;
  action: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof IconProjetos;
  category: "acao";
  action: () => void;
}

// ═══════════════════════════════════════════════
// Category config
// ═══════════════════════════════════════════════

const categoryLabels: Record<string, string> = {
  acao: "Ações rápidas",
  projeto: "Projetos",
  cliente: "Clientes",
  parcela: "Parcelas",
  evento: "Eventos",
  galeria: "Galerias",
  contrato: "Contratos",
  lead: "Leads",
};

const categoryColors: Record<string, { color: string; bg: string }> = {
  acao: { color: "var(--fg-secondary)", bg: "var(--sidebar-hover)" },
  projeto: { color: "var(--info)", bg: "var(--info-subtle)" },
  cliente: { color: "var(--success)", bg: "var(--success-subtle)" },
  parcela: { color: "var(--warning)", bg: "var(--warning-subtle)" },
  evento: { color: "var(--accent)", bg: "var(--accent-subtle, var(--info-subtle))" },
  galeria: { color: "var(--purple)", bg: "color-mix(in srgb, var(--purple) 15%, transparent)" },
  contrato: { color: "var(--fg-secondary)", bg: "var(--border-subtle)" },
  lead: { color: "var(--info)", bg: "var(--info-subtle)" },
};

// ═══════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // ── Quick actions ──
  const quickActions: QuickAction[] = [
    {
      id: "qa-novo-projeto",
      title: "Novo Projeto",
      subtitle: "Criar um novo projeto",
      icon: IconAddCircle,
      category: "acao",
      action: () => { router.push("/projetos"); onClose(); },
    },
    {
      id: "qa-novo-cliente",
      title: "Novo Cliente",
      subtitle: "Adicionar um novo cliente",
      icon: IconUserAdd,
      category: "acao",
      action: () => { router.push("/clientes"); onClose(); },
    },
    {
      id: "qa-iris",
      title: "Ir para Iris",
      subtitle: "Assistente inteligente",
      icon: IconIris,
      category: "acao",
      action: () => { router.push("/iris"); onClose(); },
    },
    {
      id: "qa-financeiro",
      title: "Ir para Financeiro",
      subtitle: "Receitas, despesas e parcelas",
      icon: IconFinanceiro,
      category: "acao",
      action: () => { router.push("/financeiro"); onClose(); },
    },
    {
      id: "qa-agenda",
      title: "Ir para Agenda",
      subtitle: "Eventos e compromissos",
      icon: IconAgenda,
      category: "acao",
      action: () => { router.push("/agenda"); onClose(); },
    },
    {
      id: "qa-galeria",
      title: "Ir para Galeria",
      subtitle: "Galerias de fotos",
      icon: IconGaleria,
      category: "acao",
      action: () => { router.push("/galeria"); onClose(); },
    },
    {
      id: "qa-crm",
      title: "Ir para CRM",
      subtitle: "Pipeline de leads",
      icon: IconLeads,
      category: "acao",
      action: () => { router.push("/crm"); onClose(); },
    },
    {
      id: "qa-producao",
      title: "Ir para Produção",
      subtitle: "Kanban de produção",
      icon: IconProducao,
      category: "acao",
      action: () => { router.push("/producao"); onClose(); },
    },
    {
      id: "qa-contratos",
      title: "Ir para Contratos",
      subtitle: "Contratos digitais",
      icon: IconContratos,
      category: "acao",
      action: () => { router.push("/contratos"); onClose(); },
    },
    {
      id: "qa-pedidos",
      title: "Ir para Pedidos",
      subtitle: "Pedidos e catalogo",
      icon: IconPedidos,
      category: "acao",
      action: () => { router.push("/pedidos"); onClose(); },
    },
    {
      id: "qa-time",
      title: "Ir para Time",
      subtitle: "Equipe do estúdio",
      icon: IconTime,
      category: "acao",
      action: () => { router.push("/time"); onClose(); },
    },
    {
      id: "qa-config",
      title: "Ir para Configurações",
      subtitle: "Ajustes do sistema",
      icon: IconConfiguracoes,
      category: "acao",
      action: () => { router.push("/configuracoes"); onClose(); },
    },
  ];

  // ── Items to display ──
  const filteredActions = query.trim() === ""
    ? quickActions
    : quickActions.filter((a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(query.toLowerCase())
      );
  const displayItems: SearchResult[] = query.trim() === ""
    ? quickActions
    : [...filteredActions, ...results];

  // ── Debounced search ──
  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      performSearch(query.trim());
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ── Reset on open ──
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ── Supabase search ──
  const performSearch = useCallback(
    async (q: string) => {
      const supabase = createClient();
      const pattern = `%${q}%`;
      const all: SearchResult[] = [];

      try {
        const [projectsRes, clientsRes, installmentsRes, eventsRes, galleriesRes, contractsRes, leadsRes] =
          await Promise.all([
            supabase
              .from("projects")
              .select("id, name, event_type, clients(name)")
              .ilike("name", pattern)
              .limit(5),
            supabase
              .from("clients")
              .select("id, name, email, phone")
              .or(
                `name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`
              )
              .limit(5),
            supabase
              .from("installments")
              .select("id, description, amount, status")
              .ilike("description", pattern)
              .limit(5),
            supabase
              .from("events")
              .select("id, title, start_at, location")
              .ilike("title", pattern)
              .limit(5),
            supabase
              .from("galleries")
              .select("id, name, status, photo_count, clients(name)")
              .ilike("name", pattern)
              .limit(5),
            supabase
              .from("contracts")
              .select("id, title, status, clients(name)")
              .ilike("title", pattern)
              .limit(5),
            supabase
              .from("leads")
              .select("id, name, email, stage")
              .or(
                `name.ilike.${pattern},email.ilike.${pattern}`
              )
              .limit(5),
          ]);

        // Projects
        if (projectsRes.data) {
          for (const p of projectsRes.data) {
            const clientName =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (p as any).clients?.name ?? "";
            all.push({
              id: `proj-${p.id}`,
              title: p.name,
              subtitle: [clientName, p.event_type].filter(Boolean).join(" · "),
              category: "projeto",
              icon: IconProjetos,
              action: () => {
                openDrawer(p.id);
                onClose();
              },
            });
          }
        }

        // Clients
        if (clientsRes.data) {
          for (const c of clientsRes.data) {
            all.push({
              id: `cli-${c.id}`,
              title: c.name,
              subtitle: c.email || c.phone || "",
              category: "cliente",
              icon: IconLeads,
              action: () => {
                router.push("/clientes");
                onClose();
              },
            });
          }
        }

        // Installments
        if (installmentsRes.data) {
          for (const i of installmentsRes.data) {
            const amount = i.amount
              ? `R$ ${Number(i.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              : "";
            all.push({
              id: `inst-${i.id}`,
              title: i.description || "Parcela",
              subtitle: [amount, i.status].filter(Boolean).join(" · "),
              category: "parcela",
              icon: IconFinanceiro,
              action: () => {
                router.push("/financeiro");
                onClose();
              },
            });
          }
        }

        // Events
        if (eventsRes.data) {
          for (const e of eventsRes.data) {
            const dateStr = e.start_at
              ? new Date(e.start_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })
              : "";
            all.push({
              id: `evt-${e.id}`,
              title: e.title,
              subtitle: [dateStr, e.location].filter(Boolean).join(" · "),
              category: "evento",
              icon: IconAgenda,
              action: () => {
                router.push("/agenda");
                onClose();
              },
            });
          }
        }

        // Galleries
        if (galleriesRes.data) {
          for (const g of galleriesRes.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const clientName = (g as any).clients?.name ?? "";
            all.push({
              id: `gal-${g.id}`,
              title: g.name,
              subtitle: [clientName, `${g.photo_count || 0} fotos`, g.status].filter(Boolean).join(" · "),
              category: "galeria",
              icon: IconGaleria,
              action: () => {
                router.push(`/galeria/${g.id}`);
                onClose();
              },
            });
          }
        }

        // Contracts
        if (contractsRes.data) {
          for (const ct of contractsRes.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const clientName = (ct as any).clients?.name ?? "";
            all.push({
              id: `ctr-${ct.id}`,
              title: ct.title,
              subtitle: [clientName, ct.status].filter(Boolean).join(" · "),
              category: "contrato",
              icon: IconContratos,
              action: () => {
                router.push("/contratos");
                onClose();
              },
            });
          }
        }

        // Leads
        if (leadsRes.data) {
          for (const l of leadsRes.data) {
            all.push({
              id: `lead-${l.id}`,
              title: l.name,
              subtitle: [l.email, l.stage].filter(Boolean).join(" · "),
              category: "lead",
              icon: IconLeads,
              action: () => {
                router.push("/crm");
                onClose();
              },
            });
          }
        }
      } catch {
        // silently fail — show empty state
      }

      setResults(all);
      setSelectedIndex(0);
      setLoading(false);
    },
    [openDrawer, onClose, router]
  );

  // ── Keyboard navigation ──
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, displayItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (displayItems[selectedIndex]) {
          displayItems[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, displayItems, selectedIndex, onClose]);

  // ── Scroll selected item into view ──
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // ── Group results by category ──
  function groupByCategory(items: SearchResult[]) {
    const groups: Record<string, SearchResult[]> = {};
    for (const item of items) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }

  const grouped = groupByCategory(displayItems);

  // Track flat index for keyboard nav
  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] sm:pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            {...springOverlay}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            {...springModalIn}
            className="relative w-full max-w-lg mx-3 sm:mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-xl)] overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
              <IconSearch size={18} className="text-[var(--fg-muted)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar projetos, clientes, parcelas..."
                className="flex-1 h-12 bg-transparent text-[16px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none"
              />
              {loading && (
                <IconLoading size={16} className="text-[var(--fg-muted)] shrink-0" />
              )}
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto">
              {displayItems.length === 0 && query.trim() !== "" && !loading ? (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-[var(--fg-muted)]">
                    Nenhum resultado para &ldquo;{query}&rdquo;
                  </p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    {/* Section header */}
                    <div className="px-4 pt-3 pb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                        {categoryLabels[category] || category}
                      </span>
                    </div>

                    {/* Items */}
                    {items.map((item) => {
                      flatIndex++;
                      const idx = flatIndex;
                      const isSelected = idx === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <motion.button
                          key={item.id}
                          data-index={idx}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            ...springSnappy,
                            delay: Math.min(idx * 0.03, 0.15),
                          }}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isSelected
                              ? "bg-[var(--info-subtle)] border-l-2 border-[var(--info)]"
                              : "border-l-2 border-transparent hover:bg-[var(--sidebar-hover)]"
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor:
                                categoryColors[item.category]?.bg || "var(--sidebar-hover)",
                            }}
                          >
                            <Icon
                              size={16}
                              style={{
                                color:
                                  categoryColors[item.category]?.color || "var(--fg-secondary)",
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[var(--fg)] truncate">
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p className="text-[11px] text-[var(--fg-muted)] truncate">
                                {item.subtitle}
                              </p>
                            )}
                          </div>

                          <span
                            className={PILL_CLS}
                            style={{
                              color:
                                categoryColors[item.category]?.color || "var(--fg-secondary)",
                              backgroundColor:
                                categoryColors[item.category]?.bg || "var(--sidebar-hover)",
                            }}
                          >
                            {categoryLabels[item.category] || item.category}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Keyboard hints */}
            <div className="flex items-center justify-center gap-3 px-4 py-2 border-t border-[var(--border)] bg-[var(--bg)]">
              <span className="text-[10px] text-[var(--fg-muted)]">
                <kbd className="px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[9px] font-mono">
                  &uarr;&darr;
                </kbd>{" "}
                navegar
              </span>
              <span className="text-[10px] text-[var(--fg-muted)]">
                <kbd className="px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[9px] font-mono">
                  &crarr;
                </kbd>{" "}
                abrir
              </span>
              <span className="text-[10px] text-[var(--fg-muted)]">
                <kbd className="px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-elevated)] text-[9px] font-mono">
                  esc
                </kbd>{" "}
                fechar
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
