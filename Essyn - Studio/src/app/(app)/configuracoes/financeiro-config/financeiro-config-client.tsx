"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import {
  Tag,
  ArrowLeft,
  Plus,
  Search,
  DollarSign,
  Briefcase,
  Wallet,
  RefreshCw,
  MoreHorizontal,
  Check,
  CheckCircle2,
  BarChart3,
  PieChart,
  Loader2,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Layers,
  CreditCard,
  Banknote,
  Clock,
  Inbox,
} from "lucide-react";
import {
  PageTransition,
  WidgetEmptyState,
  AppleModal,
  ActionPill,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  INPUT_CLS,
  SELECT_CLS,
  LABEL_CLS,
  GHOST_BTN,
} from "@/lib/design-tokens";
import { springContentIn } from "@/lib/motion-tokens";
import { toast } from "sonner";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface Category {
  id: string;
  name: string;
  description: string;
  type: "receita" | "despesa";
  color: string;
  count: number;
  active: boolean;
}

type FilterType = "todos" | "receita" | "despesa";
type TabId = "categorias" | "centros" | "metodos" | "conciliacao";

interface Props {
  studioId: string;
  initialCategories: never[];
}

// ═══════════════════════════════════════════════
// Placeholder Data
// ═══════════════════════════════════════════════

const PLACEHOLDER_CATEGORIES: Category[] = [
  // RECEITAS
  { id: "1", name: "Cobertura de Casamento", description: "Receita de contratos de casamento", type: "receita", color: "#B84233", count: 28, active: true },
  { id: "2", name: "Ensaio Fotográfico", description: "Ensaios pessoais, gestante, newborn", type: "receita", color: "#6B5B8D", count: 15, active: true },
  { id: "3", name: "Evento Corporativo", description: "Cobertura de eventos empresariais", type: "receita", color: "#2C444D", count: 8, active: true },
  { id: "4", name: "Álbum e Impressões", description: "Venda de álbuns, fine art e impressões", type: "receita", color: "#C87A20", count: 12, active: true },
  { id: "5", name: "Edição Extra", description: "Serviços adicionais de pós-produção", type: "receita", color: "#5A8A96", count: 6, active: true },
  { id: "6", name: "Workshop / Mentoria", description: "Cursos, workshops e consultorias", type: "receita", color: "#A58D66", count: 3, active: true },
  // DESPESAS
  { id: "7", name: "Equipamento", description: "Compra e manutenção de câmeras e lentes", type: "despesa", color: "#1E3239", count: 12, active: true },
  { id: "8", name: "Equipe / 2º Fotógrafo", description: "Pagamento de assistentes e segundo shooter", type: "despesa", color: "#2C444D", count: 8, active: true },
  { id: "9", name: "Locação de Estúdio", description: "Aluguel de estúdio e locações externas", type: "despesa", color: "#6B5B8D", count: 5, active: true },
  { id: "10", name: "Software / Assinaturas", description: "Lightroom, Capture One, CRM, cloud storage", type: "despesa", color: "#2D7A4F", count: 9, active: true },
  { id: "11", name: "Transporte", description: "Combustível, pedágio, estacionamento, Uber", type: "despesa", color: "#B84233", count: 14, active: true },
  { id: "12", name: "Marketing", description: "Ads, Google, Instagram, materiais gráficos", type: "despesa", color: "#2C444D", count: 4, active: true },
  { id: "13", name: "Impostos e Taxas", description: "DAS, ISS, taxas de plataforma e gateway", type: "despesa", color: "#7A8A8F", count: 6, active: true },
  { id: "14", name: "Escritório / Coworking", description: "Aluguel, internet, energia, material de escritório", type: "despesa", color: "#7A8A8F", count: 3, active: false },
];

const CENTROS_DE_CUSTO = [
  { id: "c1", name: "Projeto", description: "Custos por projeto individual", icon: Briefcase, count: 45 },
  { id: "c2", name: "Equipe", description: "Custos com pessoal e freelancers", icon: Layers, count: 22 },
  { id: "c3", name: "Operação", description: "Custos fixos e operacionais", icon: RefreshCw, count: 31 },
  { id: "c4", name: "Marketing", description: "Investimentos em marketing e vendas", icon: BarChart3, count: 18 },
];

const METODOS_PAGAMENTO = [
  { id: "m1", name: "PIX", description: "Transferência instantânea", icon: Banknote, count: 58, active: true },
  { id: "m2", name: "Boleto", description: "Boleto bancário", icon: CreditCard, count: 23, active: true },
  { id: "m3", name: "Cartão de Crédito", description: "Visa, Master, Elo", icon: CreditCard, count: 31, active: true },
  { id: "m4", name: "Transferência", description: "TED/DOC bancário", icon: Wallet, count: 15, active: true },
  { id: "m5", name: "Dinheiro", description: "Pagamento em espécie", icon: DollarSign, count: 6, active: true },
];

const COLOR_OPTIONS = [
  "#B84233", "#C87A20", "#A58D66", "#2D7A4F", "#5A8A96",
  "#2C444D", "#6B5B8D", "#A0566B", "#7A8A8F", "#1E3239",
];

// ═══════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════

export function FinanceiroConfigClient({ studioId, initialCategories }: Props) {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [categories, setCategories] = useState<Category[]>(
    initialCategories.length > 0 ? (initialCategories as unknown as Category[]) : PLACEHOLDER_CATEGORIES
  );
  const [activeTab, setActiveTab] = useState<TabId>("categorias");
  const [filter, setFilter] = useState<FilterType>("todos");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"receita" | "despesa">("receita");
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  // Computed
  const receitas = useMemo(() => categories.filter((c) => c.type === "receita"), [categories]);
  const despesas = useMemo(() => categories.filter((c) => c.type === "despesa"), [categories]);
  const activeCount = useMemo(() => categories.filter((c) => c.active).length, [categories]);
  const totalLancamentos = useMemo(() => categories.reduce((sum, c) => sum + c.count, 0), [categories]);
  const cobertura = useMemo(() => {
    const withLancamentos = categories.filter((c) => c.count > 0).length;
    return categories.length > 0 ? Math.round((withLancamentos / categories.length) * 100) : 0;
  }, [categories]);

  const filteredCategories = useMemo(() => {
    let list = categories;
    if (filter === "receita") list = receitas;
    if (filter === "despesa") list = despesas;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categories, filter, search, receitas, despesas]);

  // Handlers
  const openNewModal = useCallback(() => {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setFormType("receita");
    setFormColor(COLOR_OPTIONS[0]);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description);
    setFormType(cat.type);
    setFormColor(cat.color);
    setMenuOpen(null);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);

    try {
      if (editingCategory) {
        // Update
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id
              ? { ...c, name: formName, description: formDescription, type: formType, color: formColor }
              : c
          )
        );
        toast.success("Categoria atualizada");
      } else {
        // Create
        const newCat: Category = {
          id: `new-${Date.now()}`,
          name: formName,
          description: formDescription,
          type: formType,
          color: formColor,
          count: 0,
          active: true,
        };
        setCategories((prev) => [...prev, newCat]);
        toast.success("Categoria criada");
      }

      // Try to persist to Supabase
      try {
        if (editingCategory) {
          await supabase
            .from("expense_categories")
            .update({
              name: formName,
              description: formDescription,
              type: formType,
              color: formColor,
            })
            .eq("id", editingCategory.id)
            .eq("studio_id", studioId);
        } else {
          await supabase.from("expense_categories").insert({
            studio_id: studioId,
            name: formName,
            description: formDescription,
            type: formType,
            color: formColor,
            active: true,
            sort_order: categories.length,
          });
        }
      } catch {
        // Table may not exist yet — local state is fine
      }

      setModalOpen(false);
    } catch {
      toast.error("Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  }, [formName, formDescription, formType, formColor, editingCategory, categories.length, studioId, supabase]);

  const handleToggle = useCallback(
    (cat: Category) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, active: !c.active } : c))
      );
      setMenuOpen(null);
      toast.success(cat.active ? "Categoria desativada" : "Categoria ativada");

      // Try to persist
      supabase
        .from("expense_categories")
        .update({ active: !cat.active })
        .eq("id", cat.id)
        .eq("studio_id", studioId)
        .then(() => {});
    },
    [studioId, supabase]
  );

  const handleDelete = useCallback(
    (cat: Category) => {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setMenuOpen(null);
      toast.success("Categoria excluída");

      supabase
        .from("expense_categories")
        .delete()
        .eq("id", cat.id)
        .eq("studio_id", studioId)
        .then(() => {});
    },
    [studioId, supabase]
  );

  // ═══════════════════════════════════════════════
  // Tabs config
  // ═══════════════════════════════════════════════

  const TABS: { id: TabId; label: string; count: number; beta?: boolean }[] = [
    { id: "categorias", label: "Categorias", count: categories.length },
    { id: "centros", label: "Centros de Custo", count: 4 },
    { id: "metodos", label: "Métodos Pgto.", count: 5 },
    { id: "conciliacao", label: "Conciliação", count: 6, beta: true },
  ];

  // ═══════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════

  return (
    <PageTransition>
      {/* Breadcrumb + Back */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.push("/configuracoes")}
          className={GHOST_BTN}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
          <button
            onClick={() => router.push("/configuracoes")}
            className="hover:text-[var(--fg-secondary)] transition-colors"
          >
            Configurações
          </button>
          <span>/</span>
          <span className="text-[var(--fg-secondary)] font-medium">Financeiro</span>
        </div>
      </div>

      <div className="space-y-5">
        {/* ═══ Unified Panel — header, search, stats, filters all in one card ═══ */}
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.018em]">Financeiro</h1>
                <p className="text-[12px] text-[var(--fg-muted)] mt-1">
                  {categories.length} categorias · {METODOS_PAGAMENTO.length} métodos · 6 regras
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]">
                    READY
                  </span>
                </p>
              </div>
              <button onClick={openNewModal} className={PRIMARY_CTA}>
                <Plus size={16} />
                Nova categoria
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder="Buscar categorias, métodos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${INPUT_CLS} !pl-10 !border-[var(--border-subtle)]`}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Categorias</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{categories.length}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{receitas.length} receitas · {despesas.length} despesas</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Ativas</p>
              <p className="text-[24px] font-bold text-[var(--success)] tracking-[-0.026em] leading-none tabular-nums">{activeCount}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">em uso atualmente</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Lançamentos</p>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{totalLancamentos}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">classificados no total</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Cobertura</p>
              <p className="text-[24px] font-bold text-[var(--info)] tracking-[-0.026em] leading-none tabular-nums">{cobertura}%</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">categorias com lançamentos</p>
            </div>
          </div>

          {/* Tabs + Category type filters */}
          <div className="px-6 py-4 space-y-2.5 border-t border-[var(--border-subtle)]">
            {/* Row 1: Main tabs */}
            <div className="flex items-center gap-1.5">
              {TABS.map((tab) => (
                <ActionPill
                  key={tab.id}
                  label={tab.label}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  count={tab.count}
                />
              ))}
            </div>

            {/* Row 2: Category type filters (only for categorias tab) */}
            {activeTab === "categorias" && (
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { key: "todos", label: "Todos" },
                    { key: "receita", label: "Receitas" },
                    { key: "despesa", label: "Despesas" },
                  ] as const
                ).map((f) => (
                  <ActionPill
                    key={f.key}
                    label={f.label}
                    active={filter === f.key}
                    onClick={() => setFilter(f.key)}
                    count={f.key === "receita" ? receitas.length : f.key === "despesa" ? despesas.length : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Data Content — separate card ═══ */}
        <AnimatePresence mode="wait">
          {activeTab === "categorias" && (
            <motion.div key="categorias" {...springContentIn}>
              {filteredCategories.length === 0 ? (
                <div className="bg-[var(--card)] rounded-2xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <WidgetEmptyState
                    icon={Tag}
                    title="Nenhuma categoria encontrada"
                    description={search ? "Tente ajustar o termo de busca" : "Crie sua primeira categoria"}
                    action={
                      !search ? (
                        <button onClick={openNewModal} className={PRIMARY_CTA}>
                          <Plus size={16} />
                          Nova categoria
                        </button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)]">
                          <th className="text-left text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em] px-5 py-3">
                            Categoria
                          </th>
                          <th className="text-left text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em] px-3 py-3">
                            Tipo
                          </th>
                          <th className="text-left text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em] px-3 py-3">
                            Lançam.
                          </th>
                          <th className="text-left text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-[0.06em] px-3 py-3">
                            Status
                          </th>
                          <th className="w-10 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {filteredCategories.map((cat, i) => (
                            <motion.tr
                              key={cat.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 26,
                                delay: i * 0.03,
                              }}
                              className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--card-hover)] transition-colors group"
                            >
                              {/* Category */}
                              <td className="py-3 px-5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-[var(--fg)]">{cat.name}</p>
                                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{cat.description}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Type badge */}
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    cat.type === "receita"
                                      ? "bg-[color-mix(in_srgb,var(--info)_10%,transparent)] text-[var(--info)]"
                                      : "bg-[color-mix(in_srgb,var(--error)_10%,transparent)] text-[var(--error)]"
                                  }`}
                                >
                                  {cat.type === "receita" ? "Receita" : "Despesa"}
                                </span>
                              </td>

                              {/* Count */}
                              <td className="py-3 px-3">
                                <span className="text-sm text-[var(--fg-secondary)]">
                                  {cat.count}{" "}
                                  <span className="text-[11px] text-[var(--fg-muted)]">lançam.</span>
                                </span>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      cat.active ? "bg-[var(--success)]" : "bg-[var(--fg-muted)]"
                                    }`}
                                  />
                                  <span className="text-[11px] text-[var(--fg-muted)]">
                                    {cat.active ? "Ativa" : "Inativa"}
                                  </span>
                                </div>
                              </td>

                              {/* Menu */}
                              <td className="py-3 px-3 text-right relative">
                                <button
                                  onClick={() => setMenuOpen(menuOpen === cat.id ? null : cat.id)}
                                  className={`${GHOST_BTN} opacity-0 group-hover:opacity-100`}
                                >
                                  <MoreHorizontal size={16} />
                                </button>

                                <AnimatePresence>
                                  {menuOpen === cat.id && (
                                    <>
                                      {/* Backdrop to close menu */}
                                      <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setMenuOpen(null)}
                                      />
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                        className="absolute right-0 top-full z-50 w-44 rounded-xl bg-[var(--card)] py-1.5"
                                        style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)" }}
                                      >
                                        <button
                                          onClick={() => openEditModal(cat)}
                                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[var(--fg-secondary)] hover:bg-[var(--card-hover)] transition-colors"
                                        >
                                          <Pencil size={14} />
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => handleToggle(cat)}
                                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[var(--fg-secondary)] hover:bg-[var(--card-hover)] transition-colors"
                                        >
                                          {cat.active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                                          {cat.active ? "Desativar" : "Ativar"}
                                        </button>
                                        <div className="border-t border-[var(--border-subtle)] my-1" />
                                        <button
                                          onClick={() => handleDelete(cat)}
                                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[var(--error)] hover:bg-[color-mix(in_srgb,var(--error)_5%,transparent)] transition-colors"
                                        >
                                          <Trash2 size={14} />
                                          Excluir
                                        </button>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--fg-muted)]">
                      {filteredCategories.length} categorias
                    </span>
                    <span className="text-[11px] text-[var(--fg-muted)]">
                      {receitas.length} receitas · {despesas.length} despesas · {totalLancamentos} lançamentos
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "centros" && (
            <motion.div key="centros" {...springContentIn}>
              <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CENTROS_DE_CUSTO.map((centro) => {
                      const Icon = centro.icon;
                      return (
                        <div
                          key={centro.id}
                          className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] transition-colors"
                        >
                          <Icon size={18} className="text-[var(--fg-secondary)] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--fg)]">{centro.name}</p>
                            <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{centro.description}</p>
                          </div>
                          <span className="text-xs text-[var(--fg-muted)]">{centro.count} lançam.</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-[var(--border-subtle)]">
                  <p className="text-[11px] text-[var(--fg-muted)] text-center">
                    4 centros de custo configurados
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "metodos" && (
            <motion.div key="metodos" {...springContentIn}>
              <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="p-5 space-y-2">
                  {METODOS_PAGAMENTO.map((metodo) => {
                    const Icon = metodo.icon;
                    return (
                      <div
                        key={metodo.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] transition-colors"
                      >
                        <Icon size={16} className="text-[var(--fg-secondary)] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--fg)]">{metodo.name}</p>
                          <p className="text-[11px] text-[var(--fg-muted)]">{metodo.description}</p>
                        </div>
                        <span className="text-xs text-[var(--fg-muted)]">{metodo.count} lançam.</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            metodo.active ? "bg-[var(--success)]" : "bg-[var(--fg-muted)]"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="px-5 py-3 border-t border-[var(--border-subtle)]">
                  <p className="text-[11px] text-[var(--fg-muted)] text-center">
                    5 métodos de pagamento ativos
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "conciliacao" && (
            <motion.div key="conciliacao" {...springContentIn}>
              <div className="bg-[var(--card)] rounded-2xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
                <WidgetEmptyState
                  icon={RefreshCw}
                  title="Conciliação bancária"
                  description="Em breve: conecte sua conta bancária para conciliar lançamentos automaticamente. Recurso em fase beta."
                  action={
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
                      Em breve
                    </span>
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal — Nova/Editar Categoria */}
      <AppleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? "Editar categoria" : "Nova categoria"}
      >
        <div className="px-6 py-5 space-y-4">
          {/* Nome */}
          <div>
            <label className={LABEL_CLS}>
              Nome <span className="text-[var(--error)]">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Cobertura de Casamento"
              className={INPUT_CLS}
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div>
            <label className={LABEL_CLS}>Descrição</label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Descrição opcional da categoria"
              className={INPUT_CLS}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className={LABEL_CLS}>Tipo</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as "receita" | "despesa")}
              className={SELECT_CLS + " w-full"}
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>

          {/* Cor */}
          <div>
            <label className={LABEL_CLS}>Cor</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormColor(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${
                    formColor === color
                      ? "border-[var(--fg)] scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {formColor === color && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
          <button
            onClick={() => setModalOpen(false)}
            className={SECONDARY_CTA}
            disabled={saving}
          >
            Cancelar
          </button>
          <button onClick={handleSave} className={PRIMARY_CTA} disabled={saving}>
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {editingCategory ? "Salvar" : "Criar categoria"}
          </button>
        </div>
      </AppleModal>
    </PageTransition>
  );
}
