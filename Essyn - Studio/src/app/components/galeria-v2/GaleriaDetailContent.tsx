import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Copy, Share2, Package, CalendarPlus, Lock,
  Eye, Download, Heart, Camera, Image, FolderOpen,
  Shield, HardDrive, Star, MessageSquare,
  Activity, CheckCircle2,
  Globe, Users, ChevronRight, MoreHorizontal,
  ExternalLink, X, Check, AlertTriangle,
  Palette, Zap, Crop, Eraser, Sparkles, ClipboardCheck,
  GripVertical, FolderPlus, Trash2, Layers,
  ShoppingBag, Plus, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import type { V2GalleryStatus, V2GalleryPrivacy } from "./gallery-types";
import { useAppStore, type CatalogProduct } from "../../lib/appStore";

/* ── Apple Premium KIT ── */
import {
  WidgetCard,
  WidgetEmptyState,
  WidgetHairline,
  HeaderWidget,
} from "../ui/apple-kit";
import { DashboardKpiGrid } from "../ui/dashboard-kpi-grid";
import { SubnavSegmented, type SubnavTab } from "../ui/subnav-segmented";
import { InlineBanner } from "../ui/inline-banner";
import { OrganizationTabDnd } from "./OrganizationTabDnd";
import { GalleryAnalyticsTab } from "./GalleryAnalyticsTab";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  Gallery Detail — Sub-dashboard (Section 9 of doc) */
/*  Tabs: Overview, Content, Access, Downloads,       */
/*        Favorites, Activity                          */
/* ═══════════════════════════════════════════════════ */

export interface GalleryDetailData {
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

/* ── Status config ── */
const statusConfig: Record<V2GalleryStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: "Rascunho",  color: "#8E8E93", bg: "#F2F2F7" },
  proofing:  { label: "Aprovação", color: "#9A6F30", bg: "#FFF0DC" },
  final:     { label: "Final",     color: "#4E7545", bg: "#E8EFE5" },
  delivered: { label: "Entregue",  color: "#007AFF", bg: "#F2F2F7" },
};

/* ── Mock photos for content grid ── */
const mockPhotos = [
  { id: "p1", url: "https://images.unsplash.com/photo-1769230385107-bc6eaa7a123e?w=400&h=300&fit=crop", collection: "Cerimônia", favorited: true, hero: true },
  { id: "p2", url: "https://images.unsplash.com/photo-1701743804546-7ffb59e94fc2?w=400&h=300&fit=crop", collection: "Detalhes", favorited: false, hero: false },
  { id: "p3", url: "https://images.unsplash.com/photo-1764269719300-7094d6c00533?w=400&h=300&fit=crop", collection: "Festa", favorited: true, hero: true },
  { id: "p4", url: "https://images.unsplash.com/photo-1768039376092-70e587cb7b94?w=400&h=300&fit=crop", collection: "Making Of", favorited: false, hero: false },
  { id: "p5", url: "https://images.unsplash.com/photo-1761717410058-5a2c296d0893?w=400&h=300&fit=crop", collection: "Detalhes", favorited: true, hero: false },
  { id: "p6", url: "https://images.unsplash.com/photo-1626113850818-c54696645fe4?w=400&h=300&fit=crop", collection: "Cerimônia", favorited: true, hero: true },
  { id: "p7", url: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop", collection: "Festa", favorited: false, hero: false },
  { id: "p8", url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop", collection: "Festa", favorited: false, hero: false },
];

/* ── Mock activity log ── */
const mockActivity = [
  { id: "a1", type: "view" as const, who: "Ana Oliveira", when: "Hoje, 14:23", detail: "Abriu a galeria" },
  { id: "a2", type: "favorite" as const, who: "Ana Oliveira", when: "Hoje, 14:25", detail: "Favoritou 12 fotos" },
  { id: "a3", type: "download" as const, who: "Ana Oliveira", when: "Hoje, 14:30", detail: "Baixou 5 fotos (Web)" },
  { id: "a4", type: "share" as const, who: "Ana Oliveira", when: "Ontem, 18:40", detail: "Compartilhou link com 3 pessoas" },
  { id: "a5", type: "view" as const, who: "Carlos Santos", when: "Ontem, 16:12", detail: "Abriu a galeria (convidado)" },
  { id: "a6", type: "favorite" as const, who: "Carlos Santos", when: "Ontem, 16:20", detail: "Favoritou 8 fotos" },
  { id: "a7", type: "comment" as const, who: "Ana Oliveira", when: "28 Fev, 10:05", detail: "Comentou: \"Pode suavizar a pele nesta?\"" },
  { id: "a8", type: "download" as const, who: "Carlos Santos", when: "27 Fev, 22:14", detail: "Tentou baixar (sem permissão)" },
];

const activityTypeConfig: Record<string, { icon: ReactNode; color: string; bg: string }> = {
  view:     { icon: <Eye className="w-3 h-3" />,           color: "#8E8E93", bg: "#F2F2F7" },
  favorite: { icon: <Heart className="w-3 h-3" />,         color: "#FF2D55", bg: "#FFF0F3" },
  download: { icon: <Download className="w-3 h-3" />,      color: "#007AFF", bg: "#F2F2F7" },
  share:    { icon: <Share2 className="w-3 h-3" />,        color: "#5856D6", bg: "#F3F2FF" },
  comment:  { icon: <MessageSquare className="w-3 h-3" />, color: "#FF9500", bg: "#FFF8F0" },
};

/* ── Mock favorites by person ── */
const mockFavoritesByPerson = [
  { name: "Ana Oliveira", role: "Noiva", count: 89, lastActive: "Hoje" },
  { name: "Carlos Santos", role: "Noivo", count: 45, lastActive: "Ontem" },
  { name: "Maria Oliveira", role: "Mãe da noiva", count: 23, lastActive: "28 Fev" },
  { name: "João Santos", role: "Pai do noivo", count: 12, lastActive: "27 Fev" },
];

/* ── Mock collections/folders ── */
const mockCollections = [
  { id: "c1", name: "Making Of", count: 124, order: 1 },
  { id: "c2", name: "Cerimônia", count: 312, order: 2 },
  { id: "c3", name: "Festa", count: 289, order: 3 },
  { id: "c4", name: "Detalhes", count: 56, order: 4 },
  { id: "c5", name: "Hero Set", count: 20, order: 0 },
];

/* ── Tab definitions ── */
const detailTabs: SubnavTab[] = [
  { id: "overview",    label: "Visão Geral",  icon: <Eye className="w-3.5 h-3.5" /> },
  { id: "content",     label: "Conteúdo",     icon: <Image className="w-3.5 h-3.5" /> },
  { id: "access",      label: "Acesso",       icon: <Shield className="w-3.5 h-3.5" /> },
  { id: "downloads",   label: "Downloads",    icon: <HardDrive className="w-3.5 h-3.5" /> },
  { id: "favorites",   label: "Favoritos",    icon: <Star className="w-3.5 h-3.5" />, badge: 4 },
  { id: "proofing",    label: "Proofing",     icon: <MessageSquare className="w-3.5 h-3.5" />, badge: 3 },
  { id: "branding",    label: "Branding",     icon: <Palette className="w-3.5 h-3.5" /> },
  { id: "organization",label: "Organização",  icon: <Layers className="w-3.5 h-3.5" /> },
  { id: "automation",  label: "Automação",    icon: <Zap className="w-3.5 h-3.5" /> },
  { id: "shop",        label: "Loja",         icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  { id: "activity",    label: "Atividade",    icon: <Activity className="w-3.5 h-3.5" /> },
  { id: "analytics",   label: "Analytics",    icon: <Eye className="w-3.5 h-3.5" /> },
];

interface GaleriaDetailContentProps {
  gallery: GalleryDetailData;
  onBack: () => void;
}

export function GaleriaDetailContent({ gallery, onBack }: GaleriaDetailContentProps) {
  const dk = useDk();
  const [activeTab, setActiveTab] = useState("overview");
  const st = statusConfig[gallery.status];

  function formatNum(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1440px]">
      {/* ════════════════════════════════════════════════
          HEADER — Gallery detail header with back + actions
          ════════════════════════════════════════════════ */}
      <WidgetCard delay={0}>
        {/* Back + Title */}
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0"
            style={{ color: dk.textTertiary }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Cover thumb */}
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: dk.bgMuted }}>
            {gallery.coverUrl ? (
              <img src={gallery.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-4 h-4" style={{ color: dk.textDisabled }} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className="text-[17px] truncate"
                style={{ fontWeight: 600, color: dk.textPrimary }}
              >
                {gallery.nome}
              </h1>
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: st.bg }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                <span
                  className="text-[9px] uppercase tracking-[0.04em]"
                  style={{ fontWeight: 700, color: st.color }}
                >
                  {st.label}
                </span>
              </div>
            </div>
            <p className="text-[12px]" style={{ fontWeight: 400, color: dk.textTertiary }}>
              {gallery.cliente} · {gallery.dataCriacao} · {gallery.photoCount} fotos
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={() => toast.success("Link copiado!")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] transition-colors cursor-pointer"
              style={{ fontWeight: 500, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textSecondary }}
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar link
            </button>
            <button
              onClick={() => toast.info("Enviando link...")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] transition-colors cursor-pointer"
              style={{ fontWeight: 500, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textSecondary }}
            >
              <Share2 className="w-3.5 h-3.5" />
              Enviar
            </button>
            <button
              onClick={() => toast.info("Gerando ZIP...")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] transition-colors cursor-pointer"
              style={{ fontWeight: 500, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textSecondary }}
            >
              <Package className="w-3.5 h-3.5" />
              ZIP
            </button>
            <button
              onClick={() => window.open(`/galeria/cliente/${gallery.id}`, "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007AFF] text-[12px] text-white hover:bg-[#0066D6] transition-colors cursor-pointer"
              style={{ fontWeight: 600 }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Modo Cliente
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
        <div className="px-5 py-3 overflow-x-auto">
          <SubnavSegmented
            tabs={detailTabs}
            active={activeTab}
            onChange={setActiveTab}
            layoutId="gallery-detail-tabs"
          />
        </div>
      </WidgetCard>

      {/* ════════════════════════════════════════════════
          TAB CONTENT
          ════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4"
        >
          {activeTab === "overview" && (
            <OverviewTab gallery={gallery} formatNum={formatNum} />
          )}
          {activeTab === "content" && (
            <ContentTab gallery={gallery} />
          )}
          {activeTab === "access" && (
            <AccessTab gallery={gallery} />
          )}
          {activeTab === "downloads" && (
            <DownloadsTab gallery={gallery} />
          )}
          {activeTab === "favorites" && (
            <FavoritesTab gallery={gallery} formatNum={formatNum} />
          )}
          {activeTab === "proofing" && (
            <ProofingTab />
          )}
          {activeTab === "branding" && (
            <BrandingTab />
          )}
          {activeTab === "organization" && (
            <OrganizationTabDnd />
          )}
          {activeTab === "automation" && (
            <AutomationTab />
          )}
          {activeTab === "shop" && (
            <ShopConfigTab />
          )}
          {activeTab === "activity" && (
            <ActivityTab />
          )}
          {activeTab === "analytics" && (
            <GalleryAnalyticsTab
              galleryId={gallery.id}
              galleryName={gallery.title}
              photoCount={gallery.photoCount}
              views={gallery.views}
              downloads={gallery.downloads}
              favorites={gallery.favorites}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  TAB: Overview (9.1)                                  */
/* ══════════════════════════════════════════════════════ */
function OverviewTab({ gallery, formatNum }: { gallery: GalleryDetailData; formatNum: (n: number) => string }) {
  const dk = useDk();
  const uniqueVisitors = Math.round(gallery.views * 0.65);
  const pendingSelections = gallery.status === "proofing" ? 1 : 0;

  return (
    <>
      {/* KPIs */}
      <WidgetCard title="Métricas" delay={0.03}>
        <DashboardKpiGrid
          flat
          projetos={{ label: "Visualizações", value: formatNum(gallery.views), sub: `${uniqueVisitors} visitantes únicos` }}
          aReceber={{ label: "Downloads", value: formatNum(gallery.downloads), sub: "+15% esta semana" }}
          producao={{ label: "Favoritos", value: formatNum(gallery.favoritos), sub: `${mockFavoritesByPerson.length} pessoas` }}
          compromissos={{ label: "Seleções", value: pendingSelections > 0 ? "1 pendente" : "Aprovada", sub: pendingSelections > 0 ? "Aguardando cliente" : "Concluída" }}
        />
      </WidgetCard>

      {/* Quick actions widget */}
      <WidgetCard title="Ações Rápidas" delay={0.06}>
        <div className="flex flex-col">
          {[
            { icon: <Copy className="w-4 h-4" />, label: "Copiar link da galeria", desc: "Compartilhe com o cliente", action: () => toast.success("Link copiado!") },
            { icon: <Share2 className="w-4 h-4" />, label: "Enviar por WhatsApp", desc: "Mensagem pré-formatada", action: () => toast.info("Abrindo WhatsApp...") },
            { icon: <Package className="w-4 h-4" />, label: "Gerar ZIP completo", desc: `${gallery.photoCount} fotos · ~${Math.round(gallery.photoCount * 3.2)}MB`, action: () => toast.info("Gerando ZIP...") },
            { icon: <CalendarPlus className="w-4 h-4" />, label: "Estender prazo", desc: "Atual: 90 dias · Expira em 45 dias", action: () => toast.info("Estendendo...") },
            { icon: <Lock className="w-4 h-4" />, label: "Bloquear downloads", desc: "Desativar temporariamente", action: () => toast.info("Downloads bloqueados") },
          ].map((item, idx) => (
            <div key={idx}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <button
                onClick={item.action}
                className="flex items-center gap-3 px-5 py-3 w-full transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: dk.bgMuted, color: dk.textSecondary }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>{item.label}</p>
                  <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: dk.textDisabled }} />
              </button>
            </div>
          ))}
        </div>
      </WidgetCard>

      {/* Recent activity preview */}
      <WidgetCard title="Atividade Recente" count={mockActivity.length} delay={0.09}>
        <div className="flex flex-col">
          {mockActivity.slice(0, 4).map((item, idx) => {
            const cfg = activityTypeConfig[item.type];
            return (
              <div key={item.id}>
                {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                <div className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] truncate" style={{ fontWeight: 500, color: dk.textPrimary }}>
                      {item.who}
                    </p>
                    <p className="text-[11px] truncate" style={{ fontWeight: 400, color: dk.textMuted }}>
                      {item.detail}
                    </p>
                  </div>
                  <span className="text-[10px] shrink-0" style={{ fontWeight: 400, color: dk.textSubtle }}>
                    {item.when}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </WidgetCard>
    </>
  );
}

/* ═════════════════════════════════════════════════════�� */
/*  TAB: Content (9.2)                                   */
/* ══════════════════════════════════════════════════════ */
function ContentTab({ gallery }: { gallery: GalleryDetailData }) {
  const dk = useDk();
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [activeCollection, setActiveCollection] = useState("all");

  const filteredPhotos = activeCollection === "all"
    ? mockPhotos
    : mockPhotos.filter(p => p.collection === activeCollection);

  function toggleSelect(id: string) {
    setSelectedPhotos(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  return (
    <>
      {/* Collections filter */}
      <WidgetCard title="Coleções" delay={0.03}>
        <div className="flex flex-col">
          {[{ id: "all", name: "Todas as fotos", count: mockPhotos.length, order: -1 }, ...mockCollections.sort((a, b) => a.order - b.order)].map((col, idx) => (
            <div key={col.id}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <button
                onClick={() => setActiveCollection(col.id === "all" ? "all" : col.name)}
                className="flex items-center gap-3 px-5 py-3 w-full transition-colors cursor-pointer"
                style={{
                  backgroundColor: (col.id === "all" && activeCollection === "all") || activeCollection === col.name
                    ? dk.bgActive : "transparent",
                }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: dk.bgMuted, color: dk.textTertiary }}>
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>{col.name}</p>
                </div>
                <span className="text-[11px] numeric shrink-0" style={{ fontWeight: 500, color: dk.textMuted }}>
                  {col.count}
                </span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: dk.textDisabled }} />
              </button>
            </div>
          ))}
        </div>
      </WidgetCard>

      {/* Photo grid */}
      <WidgetCard title={activeCollection === "all" ? "Todas as Fotos" : activeCollection} count={filteredPhotos.length} delay={0.06}>
        {/* Selection bar */}
        {selectedPhotos.length > 0 && (
          <>
            <div className="flex items-center justify-between px-5 py-2.5">
              <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
                {selectedPhotos.length} selecionada{selectedPhotos.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => toast.info("Movendo...")} className="text-[12px] text-[#007AFF] cursor-pointer" style={{ fontWeight: 500 }}>Mover</button>
                <button onClick={() => toast.info("Definir capa")} className="text-[12px] text-[#007AFF] cursor-pointer" style={{ fontWeight: 500 }}>Capa</button>
                <button onClick={() => toast.info("Destaque")} className="text-[12px] text-[#007AFF] cursor-pointer" style={{ fontWeight: 500 }}>Hero Set</button>
                <button onClick={() => setSelectedPhotos([])} className="text-[12px] cursor-pointer" style={{ fontWeight: 500, color: dk.textMuted }}>Limpar</button>
              </div>
            </div>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
          </>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
          {filteredPhotos.map((photo) => {
            const isSelected = selectedPhotos.includes(photo.id);
            return (
              <div
                key={photo.id}
                className={`relative group rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  isSelected ? "border-[#007AFF] ring-1 ring-[#007AFF]" : "border-transparent"
                }`}
                onClick={() => toggleSelect(photo.id)}
              >
                <div className="aspect-[4/3]" style={{ backgroundColor: dk.bgMuted }}>
                  <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
                {/* Hero badge */}
                {photo.hero && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1D1D1F] text-white text-[8px]" style={{ fontWeight: 700 }}>
                    <Star className="w-2.5 h-2.5" /> HERO
                  </div>
                )}
                {/* Favorite indicator */}
                {photo.favorited && (
                  <div className="absolute top-2 right-2">
                    <Heart className="w-3.5 h-3.5 text-[#FF2D55] fill-[#FF2D55]" />
                  </div>
                )}
                {/* Selection checkbox */}
                <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? "bg-[#007AFF] border-[#007AFF]"
                    : "bg-white border-[#D1D1D6] opacity-0 group-hover:opacity-100"
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                {/* Collection label */}
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-[#1D1D1F] text-white text-[8px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontWeight: 500 }}>
                  {photo.collection}
                </div>
              </div>
            );
          })}
        </div>
      </WidgetCard>
    </>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  TAB: Access (9.4)                                    */
/* ══════════════════════════════════════════════════════ */
function AccessTab({ gallery }: { gallery: GalleryDetailData }) {
  const dk = useDk();
  const [passwordEnabled, setPasswordEnabled] = useState(gallery.privacy === "senha");
  const [shareEnabled, setShareEnabled] = useState(true);
  const [antiIndex, setAntiIndex] = useState(true);

  return (
    <>
      {/* Link config */}
      <WidgetCard title="Configuração do Link" delay={0.03}>
        <div className="flex flex-col">
          {/* Link preview */}
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#007AFF] shrink-0" style={{ backgroundColor: dk.bgMuted }}>
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] truncate" style={{ fontWeight: 500, color: dk.textPrimary }}>
                essyn.com/g/{gallery.id}
              </p>
              <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                {gallery.privacy === "publico" ? "Link público" : gallery.privacy === "senha" ? "Protegido por senha" : "Acesso por convite"}
              </p>
            </div>
            <button onClick={() => toast.success("Link copiado!")} className="px-3 py-1.5 rounded-xl border text-[12px] cursor-pointer transition-colors" style={{ fontWeight: 500, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textSecondary }}>
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Settings rows */}
          {[
            { label: "Senha", desc: passwordEnabled ? "Ativada" : "Desativada", enabled: passwordEnabled, onToggle: () => setPasswordEnabled(!passwordEnabled) },
            { label: "Permitir partilha", desc: shareEnabled ? "Clientes podem re-partilhar" : "Link bloqueado", enabled: shareEnabled, onToggle: () => setShareEnabled(!shareEnabled) },
            { label: "Anti-indexação", desc: antiIndex ? "Buscadores bloqueados" : "Visível a buscadores", enabled: antiIndex, onToggle: () => setAntiIndex(!antiIndex) },
          ].map((item, idx) => (
            <div key={idx}>
              <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>{item.label}</p>
                  <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>{item.desc}</p>
                </div>
                <button
                  onClick={() => { item.onToggle(); toast.success(`${item.label} ${item.enabled ? "desativado" : "ativado"}`); }}
                  className="w-[44px] h-[26px] rounded-full transition-colors cursor-pointer relative"
                  style={{ backgroundColor: item.enabled ? "#34C759" : dk.border }}
                >
                  <div
                    className="absolute top-[2px] w-[22px] h-[22px] rounded-full bg-white transition-all"
                    style={{ left: item.enabled ? "20px" : "2px", boxShadow: dk.shadowCard }}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>

      {/* Invites */}
      <WidgetCard title="Convites" count={4} delay={0.06}>
        <div className="flex flex-col">
          {mockFavoritesByPerson.map((person, idx) => (
            <div key={idx}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] shrink-0" style={{ fontWeight: 600, backgroundColor: dk.bgMuted, color: dk.textSecondary }}>
                  {person.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>{person.name}</p>
                  <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>{person.role} · Ver, Favoritar, Baixar Web</p>
                </div>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer" style={{ color: dk.textMuted }}>
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>
    </>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  TAB: Downloads (9.5)                                 */
/* ══════════════════════════════════════════════════════ */
function DownloadsTab({ gallery }: { gallery: GalleryDetailData }) {
  const dk = useDk();
  const [downloadState, setDownloadState] = useState<"off" | "web" | "alta" | "both">("web");
  const [webQuality, setWebQuality] = useState(85);
  const [webRes, setWebRes] = useState(2048);

  const downloadOptions: { id: "off" | "web" | "alta" | "both"; label: string; desc: string }[] = [
    { id: "off", label: "Desativado", desc: "Nenhum download permitido" },
    { id: "web", label: "Web", desc: "JPG otimizado para tela" },
    { id: "alta", label: "Alta resolução", desc: "JPG alta qualidade para impressão" },
    { id: "both", label: "Web + Alta", desc: "Ambas as opções disponíveis" },
  ];

  return (
    <>
      <WidgetCard title="Estado dos Downloads" delay={0.03}>
        <div className="flex flex-col">
          {downloadOptions.map((opt, idx) => (
            <div key={opt.id}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <button
                onClick={() => { setDownloadState(opt.id); toast.success(`Downloads: ${opt.label}`); }}
                className="flex items-center gap-3 px-5 py-3 w-full transition-colors cursor-pointer"
                style={{ backgroundColor: downloadState === opt.id ? dk.bgActive : "transparent" }}
              >
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{
                  borderColor: downloadState === opt.id ? "#007AFF" : dk.textDisabled,
                  backgroundColor: downloadState === opt.id ? "#007AFF" : "transparent",
                }}>
                  {downloadState === opt.id && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>{opt.label}</p>
                  <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>{opt.desc}</p>
                </div>
              </button>
            </div>
          ))}
        </div>
      </WidgetCard>

      {/* Quality settings */}
      {downloadState !== "off" && (
        <WidgetCard title="Qualidade Web" delay={0.06}>
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>Qualidade JPG</p>
                <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>Compressão web (80–95)</p>
              </div>
              <span className="text-[15px] text-[#007AFF] numeric" style={{ fontWeight: 600 }}>{webQuality}%</span>
            </div>
            <div className="px-5 pb-3">
              <input
                type="range" min={80} max={95} value={webQuality}
                onChange={(e) => setWebQuality(Number(e.target.value))}
                className="w-full accent-[#007AFF]"
              />
            </div>
            <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>Resolução máxima</p>
                <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>Lado mais longo (px)</p>
              </div>
              <span className="text-[15px] text-[#007AFF] numeric" style={{ fontWeight: 600 }}>{webRes}px</span>
            </div>
          </div>
        </WidgetCard>
      )}

      {/* Rules */}
      <WidgetCard title="Regras de Liberação" delay={0.09}>
        <div className="flex flex-col">
          {[
            { label: "Liberar após pagamento", desc: "Download bloqueado até pagamento confirmado", active: false },
            { label: "Liberar após aprovação", desc: "Cliente deve aprovar seleção primeiro", active: true },
            { label: "Bloquear se expirado", desc: "Downloads desativados após data de expiração", active: true },
          ].map((rule, idx) => (
            <div key={idx}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>{rule.label}</p>
                  <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>{rule.desc}</p>
                </div>
                <div className="w-[44px] h-[26px] rounded-full relative" style={{ backgroundColor: rule.active ? "#34C759" : dk.border }}>
                  <div className="absolute top-[2px] w-[22px] h-[22px] rounded-full bg-white transition-all" style={{ left: rule.active ? "20px" : "2px", boxShadow: dk.shadowCard }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>
    </>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  TAB: Favorites & Selections (9.6)                    */
/* ══════════════════════════════════════════════════════ */
function FavoritesTab({ gallery, formatNum }: { gallery: GalleryDetailData; formatNum: (n: number) => string }) {
  const dk = useDk();
  return (
    <>
      {/* By person */}
      <WidgetCard title="Favoritos por Pessoa" count={mockFavoritesByPerson.length} delay={0.03}>
        <div className="flex flex-col">
          {mockFavoritesByPerson.map((person, idx) => (
            <div key={idx}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <div className="flex items-center gap-3 px-5 py-3.5 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] shrink-0" style={{ fontWeight: 600, backgroundColor: dk.bgMuted, color: dk.textSecondary }}>
                  {person.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>{person.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ fontWeight: 500, color: dk.textMuted, backgroundColor: dk.bgMuted }}>{person.role}</span>
                  </div>
                  <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                    {person.count} favoritos · Ativo {person.lastActive}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[#FF2D55] shrink-0">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-[13px] numeric" style={{ fontWeight: 600 }}>{person.count}</span>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: dk.textDisabled }} />
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>

      {/* Album selection */}
      <WidgetCard title="Seleção do Álbum" delay={0.06}>
        <div className="flex flex-col">
          <div className="px-5 py-3">
            <InlineBanner
              variant="info"
              title="Sistema de escolha"
              desc="O cliente marca cada foto como 'Vai pro álbum', 'Não vai' ou 'Em dúvida'. Quando terminar, clica em 'Aprovar seleção final'."
              compact
            />
          </div>
          <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
          {[
            { icon: <CheckCircle2 className="w-4 h-4" />, label: "Vai pro álbum", count: 45, color: "#34C759", bg: "#E8EFE5" },
            { icon: <X className="w-4 h-4" />, label: "Não vai", count: 12, color: "#FF3B30", bg: "#FDEDEF" },
            { icon: <AlertTriangle className="w-4 h-4" />, label: "Em dúvida", count: 8, color: "#FF9500", bg: "#FFF8F0" },
          ].map((item, idx) => (
            <div key={idx}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.bg, color: item.color }}>
                  {item.icon}
                </div>
                <p className="text-[13px] flex-1" style={{ fontWeight: 500, color: dk.textPrimary }}>{item.label}</p>
                <span className="text-[15px] numeric" style={{ fontWeight: 600, color: item.color }}>{item.count}</span>
              </div>
            </div>
          ))}
          <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <button onClick={() => toast.info("Exportando CSV...")} className="text-[12px] text-[#007AFF] cursor-pointer" style={{ fontWeight: 500 }}>Exportar lista (CSV)</button>
              <span className="w-0.5 h-0.5 rounded-full" style={{ backgroundColor: dk.textDisabled }} />
              <button onClick={() => toast.info("Baixando favoritos...")} className="text-[12px] text-[#007AFF] cursor-pointer" style={{ fontWeight: 500 }}>Baixar favoritos</button>
            </div>
            <button
              onClick={() => toast.success("Seleção fechada!")}
              className="px-3 py-1.5 rounded-xl bg-[#007AFF] text-[12px] text-white cursor-pointer hover:bg-[#0066D6] transition-colors"
              style={{ fontWeight: 600 }}
            >
              Fechar seleção
            </button>
          </div>
        </div>
      </WidgetCard>
    </>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  TAB: Proofing (9.7)                                  */
/* ══════════════════════════════════════════════════════ */
function ProofingTab() {
  const dk = useDk();
  const [approvedGallery, setApprovedGallery] = useState(false);

  const mockComments = [
    { id: "pc1", photoUrl: mockPhotos[0].url, author: "Ana Oliveira", tag: "suavizar", text: "Pode suavizar a pele no rosto?", status: "pendente" as const, when: "Hoje, 10:05" },
    { id: "pc2", photoUrl: mockPhotos[2].url, author: "Ana Oliveira", tag: "ajustar", text: "A cor está um pouco fria, aquecer um pouco", status: "resolvido" as const, when: "Ontem, 15:20" },
    { id: "pc3", photoUrl: mockPhotos[5].url, author: "Carlos Santos", tag: "remover", text: "Remover a pessoa no fundo à direita", status: "pendente" as const, when: "Ontem, 16:30" },
    { id: "pc4", photoUrl: mockPhotos[1].url, author: "Ana Oliveira", tag: "recortar", text: "Recortar mais fechado no bouquet", status: "pendente" as const, when: "28 Fev, 11:15" },
    { id: "pc5", photoUrl: mockPhotos[3].url, author: "Ana Oliveira", tag: "trocar", text: "Trocar por outra foto semelhante mas com sorriso", status: "rejeitado" as const, when: "27 Fev, 09:40" },
  ];

  const tagCfg: Record<string, { label: string; icon: ReactNode; color: string; bg: string }> = {
    ajustar:  { label: "Ajustar cor",     icon: <Sparkles className="w-3 h-3" />, color: "#FF9500", bg: "#FFF8F0" },
    remover:  { label: "Remover",         icon: <Eraser className="w-3 h-3" />,   color: "#FF3B30", bg: "#FDEDEF" },
    recortar: { label: "Recortar",        icon: <Crop className="w-3 h-3" />,     color: "#5856D6", bg: "#F3F2FF" },
    suavizar: { label: "Suavizar pele",   icon: <Sparkles className="w-3 h-3" />, color: "#007AFF", bg: "#F2F2F7" },
    trocar:   { label: "Trocar por outra",icon: <Image className="w-3 h-3" />,    color: "#8E8E93", bg: "#F2F2F7" },
  };

  const statusClr: Record<string, { label: string; color: string; bg: string }> = {
    pendente:  { label: "Pendente",  color: "#FF9500", bg: "#FFF8F0" },
    resolvido: { label: "Resolvido", color: "#34C759", bg: "#E8EFE5" },
    rejeitado: { label: "Rejeitado", color: "#FF3B30", bg: "#FDEDEF" },
  };

  const pendingCount = mockComments.filter(c => c.status === "pendente").length;

  const [checklist, setChecklist] = useState([
    { id: "ck1", label: "Nomes corretos", checked: true },
    { id: "ck2", label: "Fotos principais OK", checked: true },
    { id: "ck3", label: "Seleção do álbum finalizada", checked: false },
    { id: "ck4", label: "Pode liberar download alta", checked: false },
  ]);

  function toggleCk(id: string) { setChecklist(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c)); }
  const allChecked = checklist.every(c => c.checked);

  return (
    <>
      {pendingCount > 0 && (
        <WidgetCard delay={0.03}>
          <div className="px-5 py-3">
            <InlineBanner variant="warning" title={`${pendingCount} comentário${pendingCount !== 1 ? "s" : ""} pendente${pendingCount !== 1 ? "s" : ""}`} desc="Revise e resolva antes de aprovar a galeria" compact />
          </div>
        </WidgetCard>
      )}

      <WidgetCard title="Comentários por Foto" count={mockComments.length} delay={0.06}>
        <div className="flex flex-col">
          {mockComments.map((c, idx) => {
            const tg = tagCfg[c.tag] || tagCfg.ajustar;
            const sc = statusClr[c.status];
            return (
              <div key={c.id}>
                {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                <div className="flex items-start gap-3 px-5 py-3.5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: dk.bgMuted }}>
                    <img src={c.photoUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px]" style={{ fontWeight: 600, color: dk.textPrimary }}>{c.author}</span>
                      <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textSubtle }}>{c.when}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px]" style={{ backgroundColor: tg.bg, color: tg.color, fontWeight: 600 }}>
                        {tg.icon} {tg.label}
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px]" style={{ backgroundColor: sc.bg, color: sc.color, fontWeight: 600 }}>
                        {sc.label}
                      </div>
                    </div>
                    <p className="text-[12px]" style={{ fontWeight: 400, color: dk.textSecondary }}>{c.text}</p>
                  </div>
                  {c.status === "pendente" && (
                    <button onClick={() => toast.success("Marcado como resolvido!")} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#34C759] hover:bg-[#E8EFE5] transition-all cursor-pointer shrink-0 mt-1" title="Resolver">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </WidgetCard>

      <WidgetCard title="Checklist de Revisão" delay={0.09}>
        <div className="flex flex-col">
          {checklist.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <button onClick={() => toggleCk(item.id)} className="flex items-center gap-3 px-5 py-3 w-full transition-colors cursor-pointer">
                <div className="w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all" style={{
                  backgroundColor: item.checked ? "#34C759" : "transparent",
                  borderColor: item.checked ? "#34C759" : dk.textDisabled,
                }}>
                  {item.checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <p className={`text-[13px] ${item.checked ? "line-through" : ""}`} style={{ fontWeight: 500, color: item.checked ? dk.textTertiary : dk.textPrimary }}>{item.label}</p>
              </button>
            </div>
          ))}
          <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
              {allChecked ? "Tudo verificado — pode aprovar" : `${checklist.filter(c => !c.checked).length} item(s) pendente(s)`}
            </p>
            <button
              onClick={() => { if (allChecked) { setApprovedGallery(true); toast.success("Galeria aprovada!"); } else { toast.error("Complete o checklist antes de aprovar"); } }}
              className="px-4 py-2 rounded-xl text-[12px] transition-colors cursor-pointer"
              style={{ backgroundColor: allChecked ? "#34C759" : dk.border, color: allChecked ? "#FFFFFF" : dk.textMuted, fontWeight: 600 }}
            >
              <div className="flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5" />
                {approvedGallery ? "Galeria Aprovada" : "Marcar como Aprovada"}
              </div>
            </button>
          </div>
        </div>
      </WidgetCard>
    </>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  TAB: Branding (9.8)                                  */
/* ══════════════════════════════════════════════════════ */
function BrandingTab() {
  const dk = useDk();
  const [layoutMode, setLayoutMode] = useState<"grid" | "masonry">("grid");
  const [welcomeMsg, setWelcomeMsg] = useState("Obrigado por nos escolher para eternizar este momento especial. Aproveite suas fotos!");

  return (
    <>
      <WidgetCard title="Identidade Visual" delay={0.03}>
        <div className="flex flex-col">
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0" style={{ backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textMuted }}>
              <Camera className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>Logo do estúdio</p>
              <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>PNG ou SVG, fundo transparente</p>
            </div>
            <button onClick={() => toast.info("Upload de logo...")} className="px-3 py-1.5 rounded-xl border text-[12px] cursor-pointer transition-colors" style={{ fontWeight: 500, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textSecondary }}>
              Alterar
            </button>
          </div>
          <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="flex items-center gap-1.5 shrink-0">
              {["#007AFF", "#1D1D1F", "#F2F2F7", "#FF9500"].map(color => (
                <div key={color} className="w-6 h-6 rounded-lg border" style={{ backgroundColor: color, borderColor: dk.border }} />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>Paleta de cores</p>
              <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>4 cores do tema</p>
            </div>
            <button onClick={() => toast.info("Editando paleta...")} className="text-[12px] text-[#007AFF] cursor-pointer" style={{ fontWeight: 500 }}>Editar</button>
          </div>
        </div>
      </WidgetCard>

      <WidgetCard title="Layout da Galeria" delay={0.06}>
        <div className="flex flex-col">
          {([{ id: "grid" as const, label: "Grid uniforme", desc: "Fotos em grade regular, clássico e organizado" }, { id: "masonry" as const, label: "Masonry", desc: "Tamanhos variados, dinâmico e editorial" }]).map((opt, idx) => (
            <div key={opt.id}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <button onClick={() => { setLayoutMode(opt.id); toast.success(`Layout: ${opt.label}`); }} className="flex items-center gap-3 px-5 py-3 w-full transition-colors cursor-pointer" style={{ backgroundColor: layoutMode === opt.id ? dk.bgActive : "transparent" }}>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: layoutMode === opt.id ? "#007AFF" : dk.textDisabled, backgroundColor: layoutMode === opt.id ? "#007AFF" : "transparent" }}>
                  {layoutMode === opt.id && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>{opt.label}</p>
                  <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>{opt.desc}</p>
                </div>
              </button>
            </div>
          ))}
        </div>
      </WidgetCard>

      <WidgetCard title="Textos" delay={0.09}>
        <div className="flex flex-col">
          <div className="px-5 py-3">
            <p className="text-[12px] mb-2" style={{ fontWeight: 500, color: dk.textSecondary }}>Mensagem de boas-vindas</p>
            <textarea value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)} className="w-full h-20 px-3 py-2 rounded-xl border text-[13px] resize-none focus:outline-none focus:border-[#007AFF] transition-colors" style={{ fontWeight: 400, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textPrimary }} placeholder="Escreva uma mensagem para o cliente..." />
          </div>
          <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#007AFF] shrink-0" style={{ backgroundColor: dk.bgMuted }}>
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>Domínio próprio</p>
              <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>galeria.seudominio.com</p>
            </div>
            <button onClick={() => toast.info("Configurando domínio...")} className="text-[12px] text-[#007AFF] cursor-pointer" style={{ fontWeight: 500 }}>Configurar</button>
          </div>
        </div>
      </WidgetCard>
    </>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  TAB: Organization — MOVED to OrganizationTabDnd.tsx  */
/* ══════════════════════════════════════════════════════ */
function OrganizationTab_DEPRECATED() {
  const dk = useDk();
  const [collections, setCollections] = useState([
    { id: "c0", name: "Hero Set", count: 20, coverUrl: "https://images.unsplash.com/photo-1767986012138-4893f40932d5?w=200&h=150&fit=crop", isDefault: true },
    { id: "c1", name: "Making Of", count: 124, coverUrl: "https://images.unsplash.com/photo-1642630111276-821681d57568?w=200&h=150&fit=crop", isDefault: false },
    { id: "c2", name: "Cerimônia", count: 312, coverUrl: "https://images.unsplash.com/photo-1719223852076-6981754ebf76?w=200&h=150&fit=crop", isDefault: false },
    { id: "c3", name: "Festa", count: 289, coverUrl: "https://images.unsplash.com/photo-1764269719300-7094d6c00533?w=200&h=150&fit=crop", isDefault: false },
    { id: "c4", name: "Detalhes", count: 56, coverUrl: "https://images.unsplash.com/photo-1561940329-7382e6704231?w=200&h=150&fit=crop", isDefault: false },
    { id: "c5", name: "Pista de Dança", count: 86, coverUrl: "https://images.unsplash.com/photo-1473652502225-6b6af0664e32?w=200&h=150&fit=crop", isDefault: false },
  ]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...collections];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setCollections(updated);
    setDragIdx(idx);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    toast.success("Ordem atualizada");
  };

  const handleAddCollection = () => {
    const newCol = {
      id: `c${Date.now()}`,
      name: `Nova Pasta ${collections.length + 1}`,
      count: 0,
      coverUrl: "",
      isDefault: false,
    };
    setCollections([...collections, newCol]);
    setEditingId(newCol.id);
    setEditName(newCol.name);
    toast.success("Pasta criada");
  };

  const handleDelete = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    toast.success("Pasta removida");
  };

  const handleSaveRename = (id: string) => {
    if (!editName.trim()) return;
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c))
    );
    setEditingId(null);
    toast.success("Nome atualizado");
  };

  const totalPhotos = collections.reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      {/* Summary strip */}
      <WidgetCard title="Estrutura da Galeria" delay={0.03}>
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[18px] tabular-nums" style={{ fontWeight: 600, color: dk.textPrimary }}>
                {collections.length}
              </span>
              <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textTertiary }}>Pastas</span>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: dk.hairline }} />
            <div className="flex flex-col">
              <span className="text-[18px] tabular-nums" style={{ fontWeight: 600, color: dk.textPrimary }}>
                {totalPhotos}
              </span>
              <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textTertiary }}>Fotos</span>
            </div>
          </div>
          <button
            onClick={handleAddCollection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] transition-colors cursor-pointer"
            style={{ fontWeight: 500, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textSecondary }}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Nova pasta
          </button>
        </div>
      </WidgetCard>

      {/* Drag & drop list */}
      <WidgetCard title="Pastas & Coleções" count={collections.length} delay={0.06}>
        <div className="flex items-center gap-2 px-5 py-2.5">
          <GripVertical className="w-3 h-3" style={{ color: dk.textDisabled }} />
          <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
            Arraste para reordenar as pastas. A ordem será reflectida na galeria do cliente.
          </span>
        </div>
        <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />

        <div className="flex flex-col">
          {collections.map((col, idx) => (
            <div key={col.id}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <div
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-3 px-5 py-3 transition-all cursor-grab active:cursor-grabbing"
                style={{ backgroundColor: dragIdx === idx ? dk.bgActive : "transparent" }}
              >
                {/* Drag handle */}
                <div className="shrink-0" style={{ color: dk.textDisabled }}>
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Cover thumbnail */}
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: dk.bgMuted }}>
                  {col.coverUrl ? (
                    <img src={col.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen className="w-4 h-4" style={{ color: dk.textDisabled }} />
                    </div>
                  )}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  {editingId === col.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(col.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="flex-1 border rounded-lg px-2 py-1 text-[13px] focus:outline-none focus:border-[#007AFF]"
                        style={{ fontWeight: 500, backgroundColor: dk.bgActive, borderColor: dk.border, color: dk.textPrimary }}
                      />
                      <button
                        onClick={() => handleSaveRename(col.id)}
                        className="w-6 h-6 rounded-md bg-[#007AFF] text-white flex items-center justify-center cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p
                        className="text-[13px] truncate cursor-pointer hover:text-[#007AFF] transition-colors"
                        style={{ fontWeight: 500, color: dk.textPrimary }}
                        onClick={() => {
                          setEditingId(col.id);
                          setEditName(col.name);
                        }}
                      >
                        {col.name}
                      </p>
                      <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                        {col.count} foto{col.count !== 1 ? "s" : ""}
                        {col.isDefault && " · Destaque"}
                      </p>
                    </>
                  )}
                </div>

                {/* Order badge */}
                <span className="text-[10px] tabular-nums shrink-0 w-5 text-center" style={{ fontWeight: 600, color: dk.textSubtle }}>
                  {idx + 1}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {col.isDefault && (
                    <div className="px-1.5 py-0.5 rounded-md bg-[#1D1D1F] text-white text-[8px]" style={{ fontWeight: 700 }}>
                      HERO
                    </div>
                  )}
                  {!col.isDefault && (
                    <button
                      onClick={() => handleDelete(col.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                      style={{ color: dk.textDisabled }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>

      {/* Cover photo selection */}
      <WidgetCard title="Foto de Capa" delay={0.09}>
        <div className="px-5 py-3">
          <div className="aspect-[16/9] rounded-xl overflow-hidden relative group cursor-pointer" style={{ backgroundColor: dk.bgMuted }}>
            <img
              src="https://images.unsplash.com/photo-1767986012138-4893f40932d5?w=800&h=450&fit=crop"
              alt="Capa"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[11px] text-white" style={{ fontWeight: 500 }}>
                Clique para trocar a foto de capa
              </span>
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_2px_8px_#D1D1D6]">
                <Camera className="w-4 h-4" style={{ color: dk.textSecondary }} />
              </div>
            </div>
          </div>
          <p className="text-[11px] mt-2" style={{ fontWeight: 400, color: dk.textMuted }}>
            A foto de capa será exibida no topo da galeria do cliente e em links compartilhados.
          </p>
        </div>
      </WidgetCard>
    </>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  TAB: Automation (9.9)                                */
/* ══════════════════════════════════════════════════════ */
function AutomationTab() {
  const dk = useDk();
  const [rules, setRules] = useState([
    { id: "r1", trigger: "Ao publicar galeria", action: "Enviar link ao cliente", enabled: true, channel: "WhatsApp" },
    { id: "r2", trigger: "7 dias antes de expirar", action: "Lembrar cliente", enabled: true, channel: "E-mail" },
    { id: "r3", trigger: "Cliente favoritou 20+ fotos", action: "Avisar fotógrafo", enabled: false, channel: "Push" },
    { id: "r4", trigger: "Seleção aprovada pelo cliente", action: "Liberar download alta", enabled: true, channel: "Automático" },
    { id: "r5", trigger: "Galeria expirada", action: "Oferecer renovação paga", enabled: false, channel: "E-mail" },
  ]);

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  return (
    <>
      <WidgetCard title="Regras de Automação" count={rules.filter(r => r.enabled).length} delay={0.03}>
        <div className="flex flex-col">
          {rules.map((rule, idx) => (
            <div key={rule.id}>
              {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: rule.enabled ? "#FFF8F0" : dk.bgMuted, color: rule.enabled ? "#FF9500" : dk.textDisabled }}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px]" style={{ fontWeight: 500, color: rule.enabled ? dk.textPrimary : dk.textMuted }}>{rule.trigger}</p>
                  <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>→ {rule.action} · via {rule.channel}</p>
                </div>
                <button onClick={() => { toggleRule(rule.id); toast.success(rule.enabled ? "Regra desativada" : "Regra ativada"); }} className="w-[44px] h-[26px] rounded-full transition-colors cursor-pointer relative" style={{ backgroundColor: rule.enabled ? "#34C759" : dk.border }}>
                  <div className="absolute top-[2px] w-[22px] h-[22px] rounded-full bg-white transition-all" style={{ left: rule.enabled ? "20px" : "2px", boxShadow: dk.shadowCard }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>

      <WidgetCard title="Renovação Paga" delay={0.06}>
        <div className="flex flex-col">
          <div className="px-5 py-3">
            <InlineBanner variant="info" title="Upsell automático" desc="Quando a galeria expirar, o cliente recebe oferta para reativar por mais 90 dias. Configure o valor abaixo." compact />
          </div>
          <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
          <div className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>Valor da renovação</p>
              <p className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>Reativar por +90 dias</p>
            </div>
            <span className="text-[15px] text-[#34C759] numeric" style={{ fontWeight: 600 }}>R$ 49,90</span>
          </div>
        </div>
      </WidgetCard>
    </>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  TAB: Shop Config (9.9b) — Photographer catalog mgmt  */
/* ══════════════════════════════════════════════════════ */

function ShopConfigTab() {
  const dk = useDk();
  const { catalog, toggleCatalogProduct, updateCatalogPrice } = useAppStore();
  const [shopEnabled, setShopEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const enabledCount = catalog.filter((p) => p.enabled).length;

  const toggleProduct = (id: string) => {
    const prod = catalog.find((p) => p.id === id);
    toggleCatalogProduct(id);
    toast.success(prod?.enabled ? "Produto desativado" : "Produto ativado", {
      description: prod?.name,
    });
  };

  const handleSavePrice = (id: string) => {
    const val = parseFloat(editPrice);
    if (isNaN(val) || val <= 0) return;
    updateCatalogPrice(id, val);
    setEditingId(null);
    toast.success("Preço atualizado");
  };

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const categories = [...new Set(catalog.map((p) => p.category))];

  return (
    <>
      {/* Global shop toggle */}
      <WidgetCard title="Loja desta Galeria" delay={0.03}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>
              Loja ativa para clientes
            </span>
            <span className="text-[11px]" style={{ fontWeight: 400, color: dk.textMuted }}>
              {shopEnabled
                ? `${enabledCount} produto${enabledCount !== 1 ? "s" : ""} visível${enabledCount !== 1 ? "eis" : ""} na galeria do cliente`
                : "Os clientes não vêem a loja nesta galeria"}
            </span>
          </div>
          <button
            onClick={() => {
              setShopEnabled(!shopEnabled);
              toast.success(shopEnabled ? "Loja desativada" : "Loja ativada");
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            {shopEnabled ? (
              <ToggleRight className="w-8 h-8 text-[#34C759]" />
            ) : (
              <ToggleLeft className="w-8 h-8" style={{ color: dk.textDisabled }} />
            )}
          </button>
        </div>

        {/* Stats strip */}
        <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />
        <div className="grid grid-cols-3 gap-0">
          {[
            { label: "Produtos", value: enabledCount.toString(), color: "#007AFF" },
            { label: "Preço Mín.", value: fmtCurrency(Math.min(...catalog.filter((p) => p.enabled).map((p) => p.price)) || 0), color: "#34C759" },
            { label: "Preço Máx.", value: fmtCurrency(Math.max(...catalog.filter((p) => p.enabled).map((p) => p.price)) || 0), color: "#FF9500" },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center py-3" style={{ borderLeft: idx > 0 ? `1px solid ${dk.hairline}` : "none" }}>
              <span className="text-[16px] tabular-nums" style={{ fontWeight: 600, color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </WidgetCard>

      {/* Product catalog per category */}
      {categories.map((cat) => {
        const catProducts = catalog.filter((p) => p.category === cat);
        return (
          <WidgetCard key={cat} title={cat} count={catProducts.filter((p) => p.enabled).length} delay={0.06}>
            <div className="flex flex-col">
              {catProducts.map((prod, idx) => (
                <div key={prod.id}>
                  {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                  <div className="flex items-center gap-3 px-5 py-3 transition-colors">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                      backgroundColor: prod.enabled ? dk.bgMuted : dk.bgSub,
                      color: prod.enabled ? dk.textSecondary : dk.textDisabled,
                    }}>
                      <ShoppingBag className="w-4 h-4" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] truncate" style={{ fontWeight: 500, color: prod.enabled ? dk.textPrimary : dk.textSubtle }}>
                        {prod.name}
                      </p>
                      <p className="text-[11px] truncate" style={{ fontWeight: 400, color: dk.textMuted }}>
                        {prod.desc} · {prod.sizes.length} tamanho{prod.sizes.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Price (editable) */}
                    <div className="shrink-0">
                      {editingId === prod.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSavePrice(prod.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="w-20 border rounded-lg px-2 py-1 text-[12px] text-right tabular-nums focus:outline-none focus:border-[#007AFF]"
                            style={{ fontWeight: 500, backgroundColor: dk.bgActive, borderColor: dk.border, color: dk.textPrimary }}
                          />
                          <button
                            onClick={() => handleSavePrice(prod.id)}
                            className="w-6 h-6 rounded-md bg-[#007AFF] text-white flex items-center justify-center cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(prod.id);
                            setEditPrice(prod.price.toString());
                          }}
                          className="text-[13px] text-[#007AFF] tabular-nums hover:text-[#0066D6] transition-colors cursor-pointer"
                          style={{ fontWeight: 600 }}
                        >
                          {fmtCurrency(prod.price)}
                        </button>
                      )}
                    </div>

                    {/* Sizes */}
                    <div className="hidden md:flex items-center gap-1 shrink-0">
                      {prod.sizes.slice(0, 2).map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded-md text-[9px]" style={{ fontWeight: 500, backgroundColor: dk.bgMuted, color: dk.textTertiary }}>
                          {s}
                        </span>
                      ))}
                      {prod.sizes.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px]" style={{ fontWeight: 500, backgroundColor: dk.bgMuted, color: dk.textTertiary }}>
                          +{prod.sizes.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleProduct(prod.id)}
                      className="shrink-0 cursor-pointer"
                    >
                      {prod.enabled ? (
                        <ToggleRight className="w-7 h-7 text-[#34C759]" />
                      ) : (
                        <ToggleLeft className="w-7 h-7" style={{ color: dk.textDisabled }} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </WidgetCard>
        );
      })}

      {/* Add product hint */}
      <WidgetCard delay={0.09}>
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: dk.bgMuted }}>
            <Plus className="w-5 h-5" style={{ color: dk.textDisabled }} />
          </div>
          <div className="text-center">
            <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textSecondary }}>
              Adicionar produto ao catálogo
            </p>
            <p className="text-[11px] mt-0.5" style={{ fontWeight: 400, color: dk.textMuted }}>
              Gere a página de Pedidos para configurar novos produtos disponíveis em todas as galerias.
            </p>
          </div>
          <button
            onClick={() => toast("Em breve", { description: "Configuração de catálogo global em /pedidos" })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[12px] transition-colors cursor-pointer"
            style={{ fontWeight: 500, backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textSecondary }}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Ir para Pedidos
          </button>
        </div>
      </WidgetCard>
    </>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  TAB: Activity / Logs (9.10)                          */
/* ══════════════════════════════════════════════════════ */
function ActivityTab() {
  const dk = useDk();
  const [filterType, setFilterType] = useState<string>("all");

  const filteredActivity = filterType === "all"
    ? mockActivity
    : mockActivity.filter(a => a.type === filterType);

  return (
    <>
      {/* Filter */}
      <WidgetCard title="Log de Atividade" count={filteredActivity.length} delay={0.03}>
        {/* Filter chips */}
        <div className="flex items-center gap-2 px-5 py-2.5 overflow-x-auto">
          {[
            { id: "all", label: "Todas" },
            { id: "view", label: "Acessos" },
            { id: "download", label: "Downloads" },
            { id: "favorite", label: "Favoritos" },
            { id: "share", label: "Partilhas" },
            { id: "comment", label: "Comentários" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className="px-3 py-1.5 rounded-xl text-[11px] border transition-all cursor-pointer whitespace-nowrap"
              style={{
                fontWeight: 500,
                backgroundColor: filterType === f.id ? dk.textPrimary : dk.bg,
                borderColor: filterType === f.id ? dk.textPrimary : dk.border,
                color: filterType === f.id ? (dk.isDark ? "#0A0A0A" : "#FFFFFF") : dk.textTertiary,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />

        {/* Activity list */}
        <div className="flex flex-col">
          {filteredActivity.map((item, idx) => {
            const cfg = activityTypeConfig[item.type];
            return (
              <div key={item.id}>
                {idx > 0 && <div className="mx-5 h-px" style={{ backgroundColor: dk.hairline }} />}
                <div className="flex items-start gap-3 px-5 py-3.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px]" style={{ fontWeight: 500, color: dk.textPrimary }}>
                        {item.who}
                      </p>
                      <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textSubtle }}>
                        {item.when}
                      </span>
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ fontWeight: 400, color: dk.textTertiary }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredActivity.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-[13px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                Nenhuma atividade deste tipo
              </p>
            </div>
          )}
        </div>
      </WidgetCard>
    </>
  );
}