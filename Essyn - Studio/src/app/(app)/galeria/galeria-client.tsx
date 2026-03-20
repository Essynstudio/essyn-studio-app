"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "motion/react";
import {
  Plus,
  Search,
  Upload,
  Share2,
  Image,
  Eye,
  Download,
  Globe,
  Lock,
  KeyRound,
  Clock,
  Link2,
  Loader2,
  Images,
  AlertTriangle,
  Send,
  Hourglass,
  ShieldBan,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Grid3X3,
  Grid2X2,
  Heart,
  MessageSquare,
  ExternalLink,
  CalendarClock,
  X,
  SearchX,
} from "lucide-react";
import {
  PageTransition,
  AppleModal,
  StatusBadge,
  WidgetEmptyState,
  ActionPill,
  ListRow,
  HelpTip,
} from "@/components/ui/apple-kit";
import {
  PRIMARY_CTA,
  SECONDARY_CTA,
  COMPACT_PRIMARY_CTA,
  COMPACT_SECONDARY_CTA,
  INPUT_CLS,
  SELECT_CLS,
  LABEL_CLS,
} from "@/lib/design-tokens";
import { springContentIn, springDefault } from "@/lib/motion-tokens";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type GalleryStatus = "rascunho" | "prova" | "final" | "entregue" | "arquivado" | "agendada";
type GalleryPrivacy = "publico" | "privado" | "senha" | "expira";

interface Gallery {
  id: string;
  name: string;
  slug: string;
  cover_url: string | null;
  photo_count: number;
  status: GalleryStatus;
  privacy: GalleryPrivacy;
  password_hash: string | null;
  expires_at: string | null;
  download_enabled: boolean;
  watermark_enabled: boolean;
  views: number;
  downloads: number;
  delivery_deadline_days: number | null;
  delivery_deadline_date: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  projects: { id: string; name: string; event_date?: string } | null;
  clients: { id: string; name: string } | null;
}

interface ProjectOption { id: string; name: string }
interface ClientOption { id: string; name: string }

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const statusConfig: Record<GalleryStatus, { label: string; color: string; bg: string }> = {
  rascunho: { label: "Rascunho", color: "var(--fg-muted)", bg: "var(--border-subtle)" },
  prova: { label: "Aprovação", color: "var(--warning)", bg: "var(--warning-subtle)" },
  final: { label: "Final", color: "var(--accent)", bg: "var(--accent-subtle)" },
  entregue: { label: "Entregue", color: "var(--success)", bg: "var(--success-subtle)" },
  arquivado: { label: "Arquivado", color: "var(--fg-muted)", bg: "var(--border-subtle)" },
  agendada: { label: "Agendada", color: "var(--info)", bg: "var(--info-subtle)" },
};

const privacyConfig: Record<GalleryPrivacy, { label: string; icon: typeof Globe }> = {
  publico: { label: "Público", icon: Globe },
  privado: { label: "Privado", icon: Lock },
  senha: { label: "Com senha", icon: KeyRound },
  expira: { label: "Expira", icon: Clock },
};

type ViewMode = "grid-lg" | "grid-md" | "grid-sm" | "list";
type FilterTab = "todos" | GalleryStatus;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}k`;
  return String(n);
}

function getDeadlineStatus(gallery: Gallery): "overdue" | "approaching" | null {
  const deadline = gallery.delivery_deadline_date ?? undefined;
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  if (d < now && gallery.status !== "entregue") return "overdue";
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (d <= sevenDays && gallery.status !== "entregue") return "approaching";
  return null;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function GaleriaClient({
  galleries: initialGalleries,
  projects,
  clients,
  studioId,
}: {
  galleries: Gallery[];
  projects: ProjectOption[];
  clients: ClientOption[];
  studioId: string;
}) {
  const router = useRouter();
  const [galleries, setGalleries] = useState(initialGalleries);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("todos");
  const [viewMode, setViewMode] = useState<ViewMode>("grid-lg");
  const [showNewModal, setShowNewModal] = useState(false);

  /* -- Stats -- */
  const stats = useMemo(() => {
    const totalFotos = galleries.reduce((s, g) => s + Number(g.photo_count || 0), 0);
    const totalViews = galleries.reduce((s, g) => s + Number(g.views || 0), 0);
    const totalDownloads = galleries.reduce((s, g) => s + Number(g.downloads || 0), 0);
    const rascunhoCount = galleries.filter((g) => g.status === "rascunho").length;
    const provaCount = galleries.filter((g) => g.status === "prova").length;
    const finalCount = galleries.filter((g) => g.status === "final").length;
    const entregueCount = galleries.filter((g) => g.status === "entregue").length;
    const agendadaCount = galleries.filter((g) => g.status === "agendada").length;

    return { totalFotos, totalViews, totalDownloads, rascunhoCount, provaCount, finalCount, entregueCount, agendadaCount };
  }, [galleries]);

  /* -- "Para Fazer" items -- */
  const todoItems = useMemo(() => {
    const items: { icon: typeof Send; label: string; desc: string; count: number; color: string }[] = [];

    const readyToDeliver = galleries.filter((g) => g.status === "final").length;
    if (readyToDeliver > 0)
      items.push({ icon: Send, label: "Galerias para entregar", desc: "Prontas para enviar ao cliente", count: readyToDeliver, color: "var(--success)" });

    const awaitingSelection = galleries.filter((g) => g.status === "prova").length;
    if (awaitingSelection > 0)
      items.push({ icon: Hourglass, label: "Aguardando seleção", desc: "Cliente precisa aprovar fotos", count: awaitingSelection, color: "var(--warning)" });

    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon = galleries.filter(
      (g) => g.expires_at && new Date(g.expires_at) <= sevenDays && new Date(g.expires_at) > now
    ).length;
    if (expiringSoon > 0)
      items.push({ icon: Clock, label: "Links vencendo em 7 dias", desc: "Renovar ou alertar clientes", count: expiringSoon, color: "var(--error)" });

    const blockedDownloads = galleries.filter((g) => !g.download_enabled && g.status !== "rascunho" && g.status !== "arquivado").length;
    if (blockedDownloads > 0)
      items.push({ icon: ShieldBan, label: "Downloads bloqueados", desc: "Pagamento pendente", count: blockedDownloads, color: "var(--fg-muted)" });

    const overdueCount = galleries.filter((g) => {
      const deadline = g.delivery_deadline_date ?? undefined;
      return deadline && new Date(deadline) < now && g.status !== "entregue";
    }).length;
    if (overdueCount > 0)
      items.push({ icon: AlertTriangle, label: "Prazos vencidos", desc: "Galerias com entrega atrasada", count: overdueCount, color: "var(--error)" });

    const approachingDeadline = galleries.filter((g) => {
      const deadline = g.delivery_deadline_date ?? undefined;
      if (!deadline) return false;
      const d = new Date(deadline);
      return d >= now && d <= sevenDays && g.status !== "entregue";
    }).length;
    if (approachingDeadline > 0)
      items.push({ icon: Clock, label: "Prazo de entrega próximo", desc: "Entrega nos próximos 7 dias", count: approachingDeadline, color: "var(--warning)" });

    return items;
  }, [galleries]);

  /* -- Filter -- */
  const filtered = useMemo(() => {
    return galleries.filter((g) => {
      const matchesSearch =
        !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.clients?.name.toLowerCase().includes(search.toLowerCase()) ||
        g.projects?.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterTab === "todos"
        ? g.status !== "agendada"
        : g.status === filterTab;
      return matchesSearch && matchesStatus;
    });
  }, [galleries, search, filterTab]);

  /* -- Tab counts -- */
  const tabCounts: Record<FilterTab, number> = {
    todos: galleries.filter((g) => g.status !== "agendada").length,
    rascunho: stats.rascunhoCount,
    prova: stats.provaCount,
    final: stats.finalCount,
    entregue: stats.entregueCount,
    agendada: stats.agendadaCount,
    arquivado: galleries.filter((g) => g.status === "arquivado").length,
  };

  const gridCols =
    viewMode === "grid-lg"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : viewMode === "grid-md"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : viewMode === "grid-sm"
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1";

  return (
    <PageTransition>
      {/* ---- Unified Panel ---- */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.02em] flex items-center gap-2">
                Galeria
                <HelpTip text="Galerias sao criadas automaticamente ao criar um projeto. Compartilhe o link com seu cliente para ele selecionar e baixar fotos." />
              </h1>
              <p className="text-[13px] text-[var(--fg-muted)] mt-1">
                {galleries.length} coleções · {formatNum(stats.totalFotos)} fotos · {stats.rascunhoCount > 0 ? `${stats.rascunhoCount} rascunho` : `${formatNum(stats.totalViews)} visualizações`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toast.info("Upload em breve")} className={COMPACT_SECONDARY_CTA}>
                <Upload size={14} />
                Upload
              </button>
              <button onClick={() => toast.info("Compartilhamento em breve")} className={COMPACT_SECONDARY_CTA}>
                <Share2 size={14} />
                Compartilhar
              </button>
              <button onClick={() => setShowNewModal(true)} className={COMPACT_PRIMARY_CTA}>
                <Plus size={14} />
                Nova coleção
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              placeholder="Buscar coleções, clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${INPUT_CLS} !pl-10 !border-[var(--border-subtle)] w-full`}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Draft Banner (alert) */}
        {stats.rascunhoCount > 0 && (
          <div className="mx-6 mb-3 rounded-xl px-4 py-3 flex items-start gap-3 bg-[var(--warning-subtle)]">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
            <div>
              <span className="text-[13px] font-medium text-[var(--fg)]">{stats.rascunhoCount} coleção em rascunho</span>
              <span className="text-[13px] text-[var(--fg-muted)] ml-1">— Finalize e publique para os clientes visualizarem</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
          <div className="p-5">
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{galleries.length}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Coleções</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{stats.entregueCount} entregues</p>
          </div>
          <div className="p-5">
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{formatNum(stats.totalViews)}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Visualizações</p>
            <p className="text-[10px] text-[var(--success)] mt-0.5">+8% este mês</p>
          </div>
          <div className="p-5">
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{formatNum(stats.totalDownloads)}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Downloads</p>
            <p className="text-[10px] text-[var(--success)] mt-0.5">+23% este mês</p>
          </div>
          <div className="p-5">
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{formatNum(stats.totalFotos)}</p>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mt-1.5">Fotos</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">em {galleries.length} coleções</p>
          </div>
        </div>

        {/* Para Fazer (inside unified card) */}
        {todoItems.length > 0 && (
          <div className="border-t border-[var(--border-subtle)]">
            <div className="px-6 pt-4 pb-2">
              <h2 className="text-[13px] font-semibold text-[var(--fg)]">Para Fazer</h2>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {todoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="px-6 py-3 flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer">
                    <Icon size={16} className="shrink-0" style={{ color: item.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--fg)] truncate">{item.label}</p>
                      <p className="text-[11px] text-[var(--fg-muted)]">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-semibold" style={{ color: item.color }}>{item.count}</span>
                      <ChevronRight size={14} className="text-[var(--fg-muted)]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters (tabs + view mode) */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {(["todos", "rascunho", "prova", "final", "entregue", "agendada", "arquivado"] as FilterTab[]).map((tab) => (
              <ActionPill
                key={tab}
                label={tab === "todos" ? "Todas" : statusConfig[tab as GalleryStatus]?.label || tab}
                count={tabCounts[tab]}
                active={filterTab === tab}
                onClick={() => setFilterTab(tab)}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {([
              { mode: "list" as ViewMode, icon: LayoutList },
              { mode: "grid-sm" as ViewMode, icon: Grid2X2 },
              { mode: "grid-md" as ViewMode, icon: Grid3X3 },
              { mode: "grid-lg" as ViewMode, icon: LayoutGrid },
            ]).map(({ mode, icon: ViewIcon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded-md transition-colors ${viewMode === mode ? "bg-[var(--bg-subtle)] text-[var(--fg)]" : "text-[var(--fg-muted)] hover:text-[var(--fg)]"}`}
              >
                <ViewIcon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Empty state (inside unified card) */}
        {filtered.length === 0 && (
          <div className="border-t border-[var(--border-subtle)] px-6 py-12 flex flex-col items-center justify-center text-center">
            {galleries.length === 0 ? (
              <>
                <Images size={40} className="text-[var(--fg-muted)] opacity-30 mb-3" />
                <p className="text-[15px] font-medium text-[var(--fg)]">Nenhuma galeria ainda</p>
                <p className="text-[13px] text-[var(--fg-muted)] mt-1 mb-4">Crie sua primeira coleção para começar a compartilhar fotos com clientes.</p>
                <button onClick={() => setShowNewModal(true)} className={PRIMARY_CTA}>
                  <Plus size={16} />
                  Criar primeira galeria
                </button>
              </>
            ) : (
              <>
                <SearchX size={40} className="text-[var(--fg-muted)] opacity-30 mb-3" />
                <p className="text-[15px] font-medium text-[var(--fg)]">Nenhuma galeria encontrada</p>
                <p className="text-[13px] text-[var(--fg-muted)] mt-1">Tente ajustar os filtros ou a busca.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ---- Gallery Grid or List (separate card) ---- */}
      {filtered.length > 0 && (
        viewMode === "list" ? (
          <div className="bg-[var(--card)] rounded-2xl overflow-hidden divide-y divide-[var(--border-subtle)]" style={{ boxShadow: "var(--shadow-sm)" }}>
            {filtered.map((gallery, i) => (
              <GalleryListRow key={gallery.id} gallery={gallery} index={i} />
            ))}
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4`}>
            {filtered.map((gallery, i) => (
              <motion.div
                key={gallery.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springDefault, delay: i * 0.03 }}
              >
                <GalleryCard gallery={gallery} compact={viewMode === "grid-sm"} />
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* ---- Atividade Recente ---- */}
      <RecentActivity galleries={galleries} />

      {/* ---- Modal Nova Galeria ---- */}
      <AppleModal open={showNewModal} onClose={() => setShowNewModal(false)} title="Nova coleção">
        <NewGalleryForm
          projects={projects}
          clients={clients}
          studioId={studioId}
          onClose={() => setShowNewModal(false)}
          onCreated={(gallery) => {
            setGalleries([gallery, ...galleries]);
            setShowNewModal(false);
            toast.success("Galeria criada com sucesso!");
            router.refresh();
          }}
        />
      </AppleModal>
    </PageTransition>
  );
}

/* ------------------------------------------------------------------ */
/*  Gallery Card (Grid view)                                           */
/* ------------------------------------------------------------------ */

function GalleryCard({ gallery, compact }: { gallery: Gallery; compact?: boolean }) {
  const router = useRouter();
  const status = statusConfig[gallery.status];
  const privacy = privacyConfig[gallery.privacy];
  const PrivacyIcon = privacy.icon;
  const deadlineStatus = getDeadlineStatus(gallery);

  const eventDate = gallery.projects?.event_date || gallery.created_at;

  return (
    <div
      className="rounded-2xl bg-[var(--card)] overflow-hidden cursor-pointer transition-shadow hover:shadow-[var(--shadow-md)]"
      style={{ boxShadow: "var(--shadow-sm)" }}
      onClick={() => router.push(`/galeria/${gallery.id}`)}
    >
      {/* Cover */}
      <div className={`relative ${compact ? "aspect-[16/9]" : "aspect-[16/10]"} bg-[var(--bg)] flex items-center justify-center`}>
        {gallery.cover_url ? (
          <img src={gallery.cover_url} alt={gallery.name} className="w-full h-full object-cover" />
        ) : (
          <Images size={32} className="text-[var(--fg-muted)] opacity-30" />
        )}
        {/* Status badge top-left */}
        <div className="absolute top-2.5 left-2.5">
          <StatusBadge label={status.label} color={status.color} bg={status.bg} />
        </div>
        {/* Privacy badge top-right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-black/40 text-white backdrop-blur-sm">
          <PrivacyIcon size={10} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2">
        <div>
          <h3 className="text-[13px] font-medium text-[var(--fg)] truncate">{gallery.name}</h3>
          <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 truncate">
            {gallery.clients?.name || "Sem cliente"}
            {eventDate && ` · ${format(new Date(eventDate), "dd MMM yyyy", { locale: ptBR })}`}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--fg-muted)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Image size={11} />
              <span className="font-medium text-[var(--fg)]">{gallery.photo_count}</span> fotos
            </span>
            {gallery.views > 0 && (
              <span className="flex items-center gap-1">
                {formatNum(gallery.views)} views
              </span>
            )}
          </div>
          {deadlineStatus === "overdue" && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--error)]">
              <AlertTriangle size={10} /> Atrasado
            </span>
          )}
          {deadlineStatus === "approaching" && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--warning)]">
              <Clock size={10} /> Prazo próximo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Gallery List Row                                                   */
/* ------------------------------------------------------------------ */

function GalleryListRow({ gallery, index }: { gallery: Gallery; index: number }) {
  const router = useRouter();
  const status = statusConfig[gallery.status];
  const deadlineStatus = getDeadlineStatus(gallery);
  const eventDate = gallery.projects?.event_date || gallery.created_at;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springDefault, delay: index * 0.02 }}
    >
      <ListRow onClick={() => router.push(`/galeria/${gallery.id}`)} className="px-4 py-3">
        {/* Thumbnail */}
        <div className="w-14 h-10 rounded-lg bg-[var(--bg)] overflow-hidden shrink-0 flex items-center justify-center">
          {gallery.cover_url ? (
            <img src={gallery.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Images size={16} className="text-[var(--fg-muted)] opacity-30" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-medium text-[var(--fg)] truncate">{gallery.name}</h3>
            <StatusBadge label={status.label} color={status.color} bg={status.bg} />
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 truncate">
            {gallery.clients?.name || "Sem cliente"}
            {eventDate && ` · ${format(new Date(eventDate), "dd MMM yyyy", { locale: ptBR })}`}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[11px] text-[var(--fg-muted)] shrink-0">
          {deadlineStatus === "overdue" && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--error)]">
              <AlertTriangle size={10} /> Atrasado
            </span>
          )}
          {deadlineStatus === "approaching" && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--warning)]">
              <Clock size={10} /> Prazo próximo
            </span>
          )}
          <span className="flex items-center gap-1"><Image size={11} /> {gallery.photo_count}</span>
          <span className="flex items-center gap-1"><Eye size={11} /> {formatNum(gallery.views)}</span>
          <span className="flex items-center gap-1"><Download size={11} /> {formatNum(gallery.downloads)}</span>
        </div>

        <ChevronRight size={14} className="text-[var(--fg-muted)] shrink-0" />
      </ListRow>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent Activity                                                    */
/* ------------------------------------------------------------------ */

function RecentActivity({ galleries }: { galleries: Gallery[] }) {
  // Generate mock activity from gallery data
  const activities = useMemo(() => {
    const items: { icon: typeof Eye; color: string; name: string; action: string; time: string }[] = [];

    // Generate realistic activity from galleries that have views/downloads
    const activeGalleries = galleries
      .filter((g) => g.views > 0 || g.downloads > 0)
      .slice(0, 3);

    activeGalleries.forEach((g) => {
      const clientName = g.clients?.name || "Visitante";
      if (g.views > 0) {
        items.push({ icon: Eye, color: "var(--fg-muted)", name: clientName, action: `Abriu galeria "${g.name}"`, time: "Recente" });
      }
      if (g.downloads > 0) {
        items.push({ icon: Download, color: "var(--info)", name: clientName, action: `Baixou fotos de "${g.name}"`, time: "Recente" });
      }
    });

    return items.slice(0, 5);
  }, [galleries]);

  if (activities.length === 0) return null;

  return (
    <div>
      <div className="px-1 mb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--fg)]">Atividade Recente</h2>
          <span className="text-[12px] text-[var(--fg-muted)]">{activities.length}</span>
        </div>
      </div>
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden divide-y divide-[var(--border-subtle)]" style={{ boxShadow: "var(--shadow-sm)" }}>
        {activities.map((activity, i) => {
          const Icon = activity.icon;
          return (
            <ListRow key={i} className="px-4 py-3">
              <Icon size={16} className="shrink-0" style={{ color: activity.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[var(--fg)]">
                  <span className="font-medium">{activity.name}</span>
                </p>
                <p className="text-[11px] text-[var(--fg-muted)]">{activity.action}</p>
              </div>
              <span className="text-[10px] text-[var(--fg-muted)] shrink-0">{activity.time}</span>
            </ListRow>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  New Gallery Form                                                   */
/* ------------------------------------------------------------------ */

function NewGalleryForm({
  projects,
  clients,
  studioId,
  onClose,
  onCreated,
}: {
  projects: ProjectOption[];
  clients: ClientOption[];
  studioId: string;
  onClose: () => void;
  onCreated: (gallery: Gallery) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    project_id: "",
    client_id: "",
    privacy: "privado" as GalleryPrivacy,
    download_enabled: true,
    watermark_enabled: false,
  });

  function handleNameChange(name: string) {
    setForm({ ...form, name, slug: slugify(name) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("galleries")
      .insert({
        studio_id: studioId,
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        project_id: form.project_id || null,
        client_id: form.client_id || null,
        privacy: form.privacy,
        download_enabled: form.download_enabled,
        watermark_enabled: form.watermark_enabled,
      })
      .select(`
        id, name, slug, cover_url, photo_count,
        status, privacy, password_hash, expires_at,
        download_enabled, watermark_enabled,
        views, downloads, settings,
        created_at, updated_at,
        projects (id, name, event_date),
        clients (id, name)
      `)
      .single();

    if (error) {
      toast.error("Erro ao criar galeria: " + error.message);
      setLoading(false);
      return;
    }

    onCreated(data as unknown as Gallery);
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className={LABEL_CLS}>Nome da coleção *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ex: Casamento Maria e Joao"
          required
          className={INPUT_CLS}
        />
      </div>

      <div>
        <label className={LABEL_CLS}>Slug (URL)</label>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--fg-muted)] shrink-0">essyn.com/g/</span>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            placeholder="casamento-ana-pedro"
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Projeto</label>
          <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className={`w-full ${SELECT_CLS}`}>
            <option value="">Nenhum</option>
            {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Cliente</label>
          <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className={`w-full ${SELECT_CLS}`}>
            <option value="">Nenhum</option>
            {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      </div>

      <div>
        <label className={LABEL_CLS}>Privacidade</label>
        <select
          value={form.privacy}
          onChange={(e) => setForm({ ...form, privacy: e.target.value as GalleryPrivacy })}
          className={`w-full ${SELECT_CLS}`}
        >
          {Object.entries(privacyConfig).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-[13px] font-medium text-[var(--fg)]">
          <input type="checkbox" checked={form.download_enabled} onChange={(e) => setForm({ ...form, download_enabled: e.target.checked })} className="rounded border-[var(--border)] text-[var(--info)] focus:ring-[var(--info)]" />
          Download habilitado
        </label>
        <label className="flex items-center gap-2 text-[13px] font-medium text-[var(--fg)]">
          <input type="checkbox" checked={form.watermark_enabled} onChange={(e) => setForm({ ...form, watermark_enabled: e.target.checked })} className="rounded border-[var(--border)] text-[var(--info)] focus:ring-[var(--info)]" />
          Marca d&apos;água
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className={SECONDARY_CTA}>Cancelar</button>
        <button type="submit" disabled={loading || !form.name.trim()} className={PRIMARY_CTA}>
          {loading ? (<><Loader2 size={14} className="animate-spin" /> Criando...</>) : "Criar coleção"}
        </button>
      </div>
    </form>
  );
}
