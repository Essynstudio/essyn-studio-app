import { useState, useMemo, useEffect, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Images, Eye, Download, Camera, FolderPlus, Share2, Upload, Inbox, Heart, Clock, AlertCircle, Package, ChevronRight } from "lucide-react";
import { GalleryToolbarApple } from "./GalleryToolbarApple";
import { SmartFiltersApple } from "./SmartFiltersApple";
import { GalleryCardApple } from "./GalleryCardApple";
import type { ViewMode } from "./ViewModeSwitcher";
import { TimelineView } from "./TimelineView";
import { MasonryView } from "./MasonryView";
import { BulkActionsBar } from "./BulkActionsBar";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { AdvancedFilterPanel } from "./AdvancedFilterPanel";
import { QuickPreview } from "./QuickPreview";
import { ContextMenu } from "./ContextMenu";
import { useKeyboardNavigation, KeyboardNavigationHint } from "./KeyboardNavigation";
import { SuccessCelebration } from "./Confetti";
import type { V2GalleryStatus, V2GalleryPrivacy } from "./gallery-types";
import { toast } from "sonner";
import { GalleryRowItem, type GalleryRowData } from "../ui/gallery-row-item";
import { FilterChip } from "../ui/filter-chip";
import { useAppStore } from "../../lib/appStore";
import { useDk } from "../../lib/useDarkColors";

/* ── Apple Premium KIT ── */
import {
  WidgetCard,
  WidgetSkeleton,
  WidgetEmptyState,
  WidgetHairline,
  HeaderWidget,
  MetricsSkeleton,
} from "../ui/apple-kit";
import { InlineBanner } from "../ui/inline-banner";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";

interface MockColecao {
  id: string;
  nome: string;
  coverUrl?: string;
  photoCount: number;
  status: V2GalleryStatus;
  privacy: V2GalleryPrivacy;
  views: number;
  downloads: number;
  favoritos: number;
  cliente: string;
  dataCriacao: string;
  tipo: string;
}

const mockColecoes: MockColecao[] = [
  {
    id: "col-1",
    nome: "Casamento Oliveira & Santos",
    coverUrl: "https://images.unsplash.com/photo-1761574044344-394d47e1a96c?w=600&h=400&fit=crop",
    photoCount: 847,
    status: "final",
    privacy: "senha",
    views: 1240,
    downloads: 312,
    favoritos: 89,
    cliente: "Ana Oliveira",
    dataCriacao: "12 Jan 2026",
    tipo: "wedding",
  },
  {
    id: "col-2",
    nome: "Ensaio Newborn — Sofia",
    coverUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=400&fit=crop",
    photoCount: 124,
    status: "proofing",
    privacy: "senha",
    views: 456,
    downloads: 78,
    favoritos: 34,
    cliente: "Mariana Costa",
    dataCriacao: "18 Jan 2026",
    tipo: "newborn",
  },
  {
    id: "col-3",
    nome: "Evento Corporativo TechCorp 2026",
    coverUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop",
    photoCount: 532,
    status: "delivered",
    privacy: "privado",
    views: 2340,
    downloads: 456,
    favoritos: 123,
    cliente: "TechCorp Brasil",
    dataCriacao: "05 Jan 2026",
    tipo: "corporate",
  },
  {
    id: "col-4",
    nome: "Ensaio Gestante — Carolina",
    coverUrl: "https://images.unsplash.com/photo-1493101561940-44fac7e5d35c?w=600&h=400&fit=crop",
    photoCount: 86,
    status: "final",
    privacy: "senha",
    views: 234,
    downloads: 45,
    favoritos: 28,
    cliente: "Carolina Mendes",
    dataCriacao: "22 Jan 2026",
    tipo: "maternity",
  },
  {
    id: "col-5",
    nome: "Festa de 15 Anos — Júlia",
    coverUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop",
    photoCount: 412,
    status: "draft",
    privacy: "privado",
    views: 0,
    downloads: 0,
    favoritos: 0,
    cliente: "Família Rodrigues",
    dataCriacao: "25 Jan 2026",
    tipo: "party",
  },
  {
    id: "col-6",
    nome: "Ensaio de Casal — Lucas & Beatriz",
    coverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop",
    photoCount: 156,
    status: "final",
    privacy: "senha",
    views: 567,
    downloads: 89,
    favoritos: 42,
    cliente: "Lucas Silva",
    dataCriacao: "15 Jan 2026",
    tipo: "portrait",
  },
  {
    id: "col-7",
    nome: "Editorial Fashion Week São Paulo",
    coverUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=400&fit=crop",
    photoCount: 234,
    status: "final",
    privacy: "publico",
    views: 3456,
    downloads: 678,
    favoritos: 234,
    cliente: "Vogue Brasil",
    dataCriacao: "08 Jan 2026",
    tipo: "editorial",
  },
  {
    id: "col-8",
    nome: "Casamento Fernanda & Pedro",
    coverUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop",
    photoCount: 923,
    status: "delivered",
    privacy: "senha",
    views: 1890,
    downloads: 445,
    favoritos: 156,
    cliente: "Fernanda Lima",
    dataCriacao: "02 Jan 2026",
    tipo: "wedding",
  },
];

interface FilterPill {
  id: string;
  label: string;
  value: string;
  color: string;
  count?: number;
}

interface GaleriaContentAppleProps {
  onCreateNew: () => void;
  onOpenCollection: (id: string) => void;
}

export function GaleriaContentApple({ onCreateNew, onOpenCollection }: GaleriaContentAppleProps) {
  const dk = useDk();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterPill[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; collectionId: string } | null>(null);
  const [quickPreview, setQuickPreview] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [statusFilter, setStatusFilter] = useState<V2GalleryStatus | "all">("all");
  const [advancedFilters, setAdvancedFilters] = useState({
    status: [] as V2GalleryStatus[],
    privacy: [] as V2GalleryPrivacy[],
    dateRange: { start: "", end: "" },
    photoCountMin: 0,
    photoCountMax: 0,
    viewsMin: 0,
    cliente: "",
    tipo: [] as string[],
  });

  const { isOpen: commandPaletteOpen, setIsOpen: setCommandPaletteOpen } = useCommandPalette();

  const colecoes = mockColecoes;

  /* ── AppStore sync: projects needing galleries ── */
  const { projects } = useAppStore();
  const projectsNeedingGallery = projects.filter(p => p.status === "ativo" && (p.producaoFase === "entrega" || p.producaoFase === "finalizado"));

  // ── Computed stats from real data ──
  const totalColecoes = colecoes.length;
  const totalViews = colecoes.reduce((s, c) => s + c.views, 0);
  const totalDownloads = colecoes.reduce((s, c) => s + c.downloads, 0);

  // ── Count active advanced filters for badge ──
  const activeAdvancedFilterCount =
    advancedFilters.status.length +
    advancedFilters.privacy.length +
    advancedFilters.tipo.length +
    (advancedFilters.cliente ? 1 : 0) +
    (advancedFilters.photoCountMin > 0 ? 1 : 0) +
    (advancedFilters.photoCountMax > 0 ? 1 : 0) +
    (advancedFilters.viewsMin > 0 ? 1 : 0);
  const totalFilterCount = activeFilters.length + activeAdvancedFilterCount;

  const filteredColecoes = useMemo(() => {
    let result = [...colecoes];

    // ── Status filter chip ──
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // ── Text search ──
    if (searchQuery) {
      result = result.filter(
        (c) =>
          c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.cliente.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ── Quick filter pills ──
    activeFilters.forEach((filter) => {
      if (filter.id.startsWith("status-")) {
        result = result.filter((c) => c.status === filter.value);
      }
      if (filter.id.startsWith("privacy-")) {
        result = result.filter((c) => c.privacy === filter.value);
      }
      if (filter.id.startsWith("tipo-")) {
        result = result.filter((c) => c.tipo === filter.value);
      }
    });

    // ── Advanced filters ──
    if (advancedFilters.status.length > 0) {
      result = result.filter((c) => advancedFilters.status.includes(c.status));
    }
    if (advancedFilters.privacy.length > 0) {
      result = result.filter((c) => advancedFilters.privacy.includes(c.privacy));
    }
    if (advancedFilters.tipo.length > 0) {
      result = result.filter((c) => advancedFilters.tipo.includes(c.tipo));
    }
    if (advancedFilters.cliente) {
      result = result.filter((c) =>
        c.cliente.toLowerCase().includes(advancedFilters.cliente.toLowerCase())
      );
    }
    if (advancedFilters.photoCountMin > 0) {
      result = result.filter((c) => c.photoCount >= advancedFilters.photoCountMin);
    }
    if (advancedFilters.photoCountMax > 0) {
      result = result.filter((c) => c.photoCount <= advancedFilters.photoCountMax);
    }
    if (advancedFilters.viewsMin > 0) {
      result = result.filter((c) => c.views >= advancedFilters.viewsMin);
    }

    return result;
  }, [searchQuery, activeFilters, advancedFilters, colecoes, statusFilter]);

  const { focusedIndex, showHint, setShowHint } = useKeyboardNavigation({
    items: filteredColecoes,
    onSelect: (id) => onOpenCollection(id),
    onPreview: (id) => setQuickPreview(id),
    enabled: !commandPaletteOpen && !showFilterPanel,
  });

  function handleRemoveFilter(id: string) {
    setActiveFilters((prev) => prev.filter((f) => f.id !== id));
  }

  function handleClearAllFilters() {
    setActiveFilters([]);
    setAdvancedFilters({
      status: [],
      privacy: [],
      dateRange: { start: "", end: "" },
      photoCountMin: 0,
      photoCountMax: 0,
      viewsMin: 0,
      cliente: "",
      tipo: [],
    });
  }

  function handleAddFilter() {
    setShowFilterPanel(true);
  }

  function handleSelectionModeToggle() {
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedIds([]);
    } else {
      setIsSelectionMode(true);
    }
  }

  function handleQuickAction(
    collectionId: string,
    action: "share" | "duplicate" | "archive" | "delete"
  ) {
    const collection = colecoes.find((c) => c.id === collectionId);
    if (!collection) return;

    switch (action) {
      case "share":
        toast.success("Link copiado!", { description: `Galeria "${collection.nome}"` });
        break;
      case "duplicate":
        toast.success("Coleção duplicada!", { description: collection.nome });
        break;
      case "archive":
        toast.success("Arquivado", { description: collection.nome });
        break;
      case "delete":
        toast.error("Coleção excluída", { description: collection.nome });
        break;
    }
  }

  const isEmpty = filteredColecoes.length === 0 && activeFilters.length === 0 && !searchQuery && activeAdvancedFilterCount === 0 && statusFilter === "all";

  /* ── Loading state — 1.2s simulated fetch ── */
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const totalPhotos = colecoes.reduce((s, c) => s + c.photoCount, 0);
  const deliveredCount = colecoes.filter((c) => c.status === "delivered").length;
  const draftCount = colecoes.filter((c) => c.status === "draft").length;

  const contextLine = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${totalColecoes} coleções`);
    parts.push(`${totalPhotos.toLocaleString("pt-BR")} fotos`);
    if (draftCount > 0) parts.push(`${draftCount} rascunho${draftCount !== 1 ? "s" : ""}`);
    return parts.join(" · ");
  }, [totalColecoes, totalPhotos, draftCount]);

  const quickActions = useMemo(() => [
    { label: "Nova coleção", icon: <FolderPlus className="w-4 h-4" />, onClick: onCreateNew },
    { label: "Upload", icon: <Upload className="w-4 h-4" />, onClick: () => toast("Upload", { description: "Em desenvolvimento" }) },
    { label: "Compartilhar", icon: <Share2 className="w-4 h-4" />, onClick: () => toast("Partilha em lote", { description: "Em desenvolvimento" }) },
  ], [onCreateNew]);

  function formatStat(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ════════════════════════════════════════════════════
          WIDGET 1 — HEADER (via HeaderWidget KIT)
          ════════════════════════════════════════════════════ */}
      <HeaderWidget
        greeting="Galeria"
        userName=""
        contextLine={contextLine}
        quickActions={quickActions}
        showSearch
        searchPlaceholder="Buscar coleções, clientes..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {/* ─── Alerts ─── */}
        {draftCount > 0 && (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
            <div className="flex flex-col px-2 py-1">
              <InlineBanner
                variant="warning"
                title={`${draftCount} coleção em rascunho`}
                desc="Finalize e publique para os clientes visualizarem"
                compact
              />
            </div>
          </>
        )}

        {/* ─── KPIs ─── */}
        {isLoading ? (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
            <MetricsSkeleton />
          </>
        ) : (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
            <DashboardKpiGrid
              flat
              projetos={{
                label: "Coleções",
                value: String(totalColecoes),
                sub: `${deliveredCount} entregue${deliveredCount !== 1 ? "s" : ""}`,
              }}
              aReceber={{
                label: "Visualizações",
                value: formatStat(totalViews),
                sub: "+8% este mês",
              }}
              producao={{
                label: "Downloads",
                value: formatStat(totalDownloads),
                sub: "+23% este mês",
              }}
              compromissos={{
                label: "Fotos",
                value: totalPhotos.toLocaleString("pt-BR"),
                sub: `em ${totalColecoes} coleções`,
              }}
            />
          </>
        )}
      </HeaderWidget>

      {/* ════════════════════════════════════════════════════
          WIDGET 1.5 — QUICK ACTION CARDS (Section 4)
          ════════════════════════════════════════════════════ */}
      {!isLoading && (
        <WidgetCard title="Para Fazer" delay={0.04}>
          <div className="flex flex-col">
            {[
              { icon: <Package className="w-4 h-4" />, label: "Galerias para entregar", count: colecoes.filter(c => c.status === "final").length, desc: "Prontas para enviar ao cliente", color: "#4E7545", bg: "#E8EFE5", onClick: () => setStatusFilter("final") },
              { icon: <Clock className="w-4 h-4" />, label: "Aguardando seleção", count: colecoes.filter(c => c.status === "proofing").length, desc: "Cliente precisa aprovar fotos", color: "#9A6F30", bg: "#FFF0DC", onClick: () => setStatusFilter("proofing") },
              { icon: <FolderPlus className="w-4 h-4" />, label: "Projetos aguardando galeria", count: projectsNeedingGallery.length, desc: projectsNeedingGallery.length > 0 ? projectsNeedingGallery.map(p => p.nome).join(", ") : "Nenhum", color: "#007AFF", bg: "#F2F2F7", onClick: () => { if (projectsNeedingGallery.length > 0) onCreateNew(); else toast.info("Sem projetos pendentes"); } },
              { icon: <AlertCircle className="w-4 h-4" />, label: "Links vencendo em 7 dias", count: 2, desc: "Renovar ou alertar clientes", color: "#FF3B30", bg: "#FDEDEF", onClick: () => toast.info("Filtro: links vencendo") },
              { icon: <Download className="w-4 h-4" />, label: "Downloads bloqueados", count: 1, desc: "Pagamento pendente", color: "#8E8E93", bg: "#F2F2F7", onClick: () => toast.info("Filtro: downloads bloqueados") },
            ].filter(item => item.count > 0).map((item, idx) => (
              <div key={idx}>
                {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                <button
                  onClick={item.onClick}
                  className={`flex items-center gap-3 px-5 py-3 w-full transition-colors cursor-pointer ${dk.isDark ? "hover:bg-[#2C2C2E]" : "hover:bg-[#FAFAFA]"}`}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.bg, color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>{item.label}</p>
                    <p className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{item.desc}</p>
                  </div>
                  <span className="text-[15px] numeric shrink-0" style={{ fontWeight: 600, color: item.color }}>
                    {item.count}
                  </span>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: dk.textDisabled }} />
                </button>
              </div>
            ))}
          </div>
        </WidgetCard>
      )}

      {/* ════════════════════════════════════════════════════
          WIDGET 2 — COLEÇÕES (toolbar + status chips + grid/list)
          ════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <WidgetSkeleton key="galeria-sk" rows={4} delay={0.06} />
        ) : (
          <WidgetCard key="galeria-content" title="Coleções" count={filteredColecoes.length} delay={0.06}>
            {/* ── Status filter chips ── */}
            <div className="flex items-center gap-2 px-5 py-2.5 overflow-x-auto">
              {([
                { id: "all" as const, label: "Todas", dot: "bg-[#636366]", chipBg: "bg-[#1D1D1F]", chipText: "text-white", chipBorder: "border-[#1D1D1F]" },
                { id: "draft" as const, label: "Rascunho", dot: "bg-[#8E8E93]", chipBg: "bg-[#F2F2F7]", chipText: "text-[#636366]", chipBorder: "border-[#E5E5EA]" },
                { id: "proofing" as const, label: "Aprovação", dot: "bg-[#9A6F30]", chipBg: "bg-[#FFF0DC]", chipText: "text-[#9A6F30]", chipBorder: "border-[#F0DFC0]" },
                { id: "final" as const, label: "Final", dot: "bg-[#4E7545]", chipBg: "bg-[#E8EFE5]", chipText: "text-[#4E7545]", chipBorder: "border-[#C8DCC3]" },
                { id: "delivered" as const, label: "Entregue", dot: "bg-[#007AFF]", chipBg: "bg-[#F2F2F7]", chipText: "text-[#007AFF]", chipBorder: "border-[#E5E5EA]" },
              ] as const).map((chip) => (
                <FilterChip
                  key={chip.id}
                  label={chip.label}
                  count={chip.id === "all" ? colecoes.length : colecoes.filter(c => c.status === chip.id).length}
                  active={statusFilter === chip.id}
                  dot={chip.dot}
                  chipBg={chip.chipBg}
                  chipText={chip.chipText}
                  chipBorder={chip.id === "all" ? "border-[#1D1D1F]" : chip.chipBorder}
                  onClick={() => setStatusFilter(chip.id)}
                />
              ))}
            </div>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />

            {/* ── Toolbar ── */}
            <div className="px-3 pt-2">
              <GalleryToolbarApple
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onFilterToggle={() => setShowFilterPanel(!showFilterPanel)}
                filterCount={totalFilterCount}
                showFilterPanel={showFilterPanel}
                isSelectionMode={isSelectionMode}
                onSelectionModeToggle={handleSelectionModeToggle}
              />
            </div>

            {/* ── Active filter pills ── */}
            <div className="px-3">
              <SmartFiltersApple
                activeFilters={activeFilters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
                onAddFilter={handleAddFilter}
              />
            </div>

            {/* ── Main content area ── */}
            {isEmpty ? (
              <div className="px-4 pb-4 pt-2">
                <WidgetEmptyState
                  icon={<Inbox className="w-5 h-5" />}
                  message="Nenhuma coleção ainda — crie a sua primeira coleção"
                  cta="Nova coleção"
                  onCta={onCreateNew}
                />
              </div>
            ) : filteredColecoes.length === 0 ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <p className="text-[15px] text-[#8E8E93] mb-3" style={{ fontWeight: 500 }}>
                    Nenhuma coleção encontrada
                  </p>
                  <button
                    onClick={() => { handleClearAllFilters(); setStatusFilter("all"); }}
                    className="text-[13px] text-[#007AFF] hover:underline cursor-pointer"
                    style={{ fontWeight: 600 }}
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
            ) : viewMode === "list" ? (
              /* ── FLAT FLUSH LIST VIEW ── */
              <div className="flex flex-col">
                {filteredColecoes.map((colecao, idx) => (
                  <div key={colecao.id}>
                    {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                    <GalleryRowItem
                      gallery={colecao as GalleryRowData}
                      onClick={(id) => onOpenCollection(id)}
                      onCopyLink={() => toast.success("Link copiado!", { description: colecao.nome })}
                      onShareWhatsApp={() => toast.info("Enviando por WhatsApp...", { description: colecao.nome })}
                      onGenerateZip={() => toast.info("Gerando ZIP...", { description: `${colecao.photoCount} fotos` })}
                      onExtendExpiration={() => toast.info("Estendendo expiração...", { description: colecao.nome })}
                    />
                  </div>
                ))}
              </div>
            ) : viewMode === "timeline" ? (
              <div className="px-4 pb-4 pt-2">
                <TimelineView
                  collections={filteredColecoes}
                  onOpenCollection={onOpenCollection}
                  onQuickAction={handleQuickAction}
                  onQuickPreview={(id) => setQuickPreview(id)}
                />
              </div>
            ) : viewMode === "masonry" ? (
              <div className="px-4 pb-4 pt-2">
                <MasonryView
                  collections={filteredColecoes}
                  onOpenCollection={onOpenCollection}
                  onQuickAction={handleQuickAction}
                  onQuickPreview={(id) => setQuickPreview(id)}
                />
              </div>
            ) : (
              <div className="px-4 pb-4 pt-2">
                <motion.div
                  layout
                  className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredColecoes.map((colecao, index) => (
                      <div key={colecao.id}>
                        <GalleryCardApple
                          {...colecao}
                          onClick={() => onOpenCollection(colecao.id)}
                          onQuickAction={(action) => handleQuickAction(colecao.id, action)}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedIds.includes(colecao.id)}
                          onToggleSelect={() => {
                            setSelectedIds((prev) =>
                              prev.includes(colecao.id)
                                ? prev.filter((id) => id !== colecao.id)
                                : [...prev, colecao.id]
                            );
                          }}
                          isFocused={index === focusedIndex}
                          onContextMenu={(e) =>
                            setContextMenu({ x: e.clientX, y: e.clientY, collectionId: colecao.id })
                          }
                          onQuickPreview={() => setQuickPreview(colecao.id)}
                          isListView={false}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </WidgetCard>
        )}
      </AnimatePresence>

      {/* ── Bulk actions bar (appears on selection) ── */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={filteredColecoes.length}
        onClearSelection={() => {
          setSelectedIds([]);
          setIsSelectionMode(false);
        }}
        onSelectAll={() => setSelectedIds(filteredColecoes.map((c) => c.id))}
        onBulkShare={() => {
          toast.success(`${selectedIds.length} coleções compartilhadas!`);
          setSelectedIds([]);
          setIsSelectionMode(false);
        }}
        onBulkDuplicate={() => {
          toast.success(`${selectedIds.length} coleções duplicadas!`);
          setSelectedIds([]);
          setIsSelectionMode(false);
        }}
        onBulkArchive={() => {
          toast.success(`${selectedIds.length} coleções arquivadas!`);
          setSelectedIds([]);
          setIsSelectionMode(false);
        }}
        onBulkDelete={() => {
          toast.error(`${selectedIds.length} coleções excluídas!`);
          setSelectedIds([]);
          setIsSelectionMode(false);
        }}
        onBulkDownload={() => {
          toast.success(`Baixando ${selectedIds.length} coleções...`);
          setSelectedIds([]);
          setIsSelectionMode(false);
        }}
      />

      {/* ── Command Palette (⌘K) ── */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onCreateNew={onCreateNew}
        recentCollections={colecoes.slice(0, 3).map((c) => ({ id: c.id, nome: c.nome }))}
        onOpenCollection={onOpenCollection}
      />

      {/* ── Advanced filter panel ── */}
      <AdvancedFilterPanel
        open={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onApply={() => {
          setShowFilterPanel(false);
          toast.success("Filtros aplicados!");
        }}
        onReset={() => {
          setAdvancedFilters({
            status: [],
            privacy: [],
            dateRange: { start: "", end: "" },
            photoCountMin: 0,
            photoCountMax: 0,
            viewsMin: 0,
            cliente: "",
            tipo: [],
          });
          toast.info("Filtros limpos");
        }}
      />

      {/* ── Quick Preview modal ── */}
      {quickPreview && (
        <QuickPreview
          isOpen={true}
          onClose={() => setQuickPreview(null)}
          collection={filteredColecoes.find((c) => c.id === quickPreview)!}
          onOpen={() => {
            onOpenCollection(quickPreview);
            setQuickPreview(null);
          }}
        />
      )}

      {/* ── Right-click context menu ── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={true}
          onClose={() => setContextMenu(null)}
          onAction={(action) => {
            if (action === "open") onOpenCollection(contextMenu.collectionId);
            if (action === "preview") setQuickPreview(contextMenu.collectionId);
            toast.success(`Ação: ${action}`);
          }}
        />
      )}

      {/* ── Keyboard navigation hint ── */}
      <KeyboardNavigationHint show={showHint} onDismiss={() => setShowHint(false)} />

      {/* ── Activity Feed Widget ── */}
      {!isLoading && (
        <WidgetCard title="Atividade Recente" count={5} delay={0.12}>
          <div className="flex flex-col">
            {[
              { icon: <Eye className="w-3.5 h-3.5" />, who: "Ana Oliveira", detail: "Abriu galeria \"Casamento Oliveira & Santos\"", when: "Hoje, 14:23", color: "#8E8E93", bg: "#F2F2F7" },
              { icon: <Heart className="w-3.5 h-3.5" />, who: "Ana Oliveira", detail: "Favoritou 12 fotos", when: "Hoje, 14:25", color: "#FF2D55", bg: "#FFF0F3" },
              { icon: <Download className="w-3.5 h-3.5" />, who: "Ana Oliveira", detail: "Baixou 5 fotos (Web)", when: "Hoje, 14:30", color: "#007AFF", bg: "#F2F2F7" },
              { icon: <Share2 className="w-3.5 h-3.5" />, who: "TechCorp Brasil", detail: "Compartilhou link com o time", when: "Ontem, 18:40", color: "#5856D6", bg: "#F3F2FF" },
              { icon: <Eye className="w-3.5 h-3.5" />, who: "Mariana Costa", detail: "Abriu galeria \"Ensaio Newborn — Sofia\"", when: "Ontem, 11:05", color: "#8E8E93", bg: "#F2F2F7" },
            ].map((item, idx) => (
              <div key={idx}>
                {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                <div className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: item.bg, color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] truncate" style={{ fontWeight: 500, color: dk.textPrimary }}>{item.who}</p>
                    <p className="text-[11px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>{item.detail}</p>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ fontWeight: 400, color: dk.textSubtle }}>{item.when}</span>
                </div>
              </div>
            ))}
          </div>
        </WidgetCard>
      )}

      {/* ── Success confetti ── */}
      <SuccessCelebration message="Coleção entregue com sucesso!" show={showCelebration} />
    </div>
  );
}