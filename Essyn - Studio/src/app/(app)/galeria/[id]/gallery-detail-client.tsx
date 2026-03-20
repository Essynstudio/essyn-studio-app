"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Copy,
  Send,
  FileArchive,
  ExternalLink,
  Eye,
  Download,
  Heart,
  Image,
  Images,
  Check,
  Lock,
  Globe,
  KeyRound,
  Clock,
  Link2,
  Share2,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Folder,
  GripVertical,
  Palette,
  Zap,
  ShoppingBag,
  BarChart3,
  Activity,
  Shield,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Pencil,
  Trash2,
  Plus,
  Star,
} from "lucide-react";
import {
  PageTransition,
  StatusBadge,
  ListRow,
  InlineBanner,
  ActionPill,
} from "@/components/ui/apple-kit";
import { PRIMARY_CTA, SECONDARY_CTA, COMPACT_PRIMARY_CTA, COMPACT_SECONDARY_CTA, INPUT_CLS, LABEL_CLS } from "@/lib/design-tokens";
import { springDefault, springContentIn } from "@/lib/motion-tokens";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type GalleryStatus = "rascunho" | "prova" | "final" | "entregue" | "arquivado" | "agendada";
type GalleryPrivacy = "publico" | "privado" | "senha" | "expira";

interface GalleryDetail {
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
  branding: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  projects: { id: string; name: string; event_date?: string; event_type?: string } | null;
  clients: { id: string; name: string; email?: string; phone?: string } | null;
}

interface GalleryPhoto {
  id: string;
  file_url: string;
  thumbnail_url: string | null;
  storage_path: string | null;
  filename: string;
  size_bytes: number;
  width: number;
  height: number;
  sort_order: number;
  folder_id: string | null;
  favorited: boolean;
  selected: boolean;
  created_at: string;
}

type Tab =
  | "visao-geral"
  | "conteudo"
  | "acesso"
  | "downloads"
  | "favoritos"
  | "proofing"
  | "branding"
  | "organizacao"
  | "automacao"
  | "loja"
  | "atividade"
  | "analytics";

const statusConfig: Record<GalleryStatus, { label: string; color: string; bg: string }> = {
  rascunho: { label: "Rascunho", color: "var(--fg-muted)", bg: "var(--border-subtle)" },
  prova: { label: "Aprovação", color: "var(--warning)", bg: "var(--warning-subtle)" },
  final: { label: "Final", color: "var(--accent)", bg: "var(--accent-subtle)" },
  entregue: { label: "Entregue", color: "var(--success)", bg: "var(--success-subtle)" },
  arquivado: { label: "Arquivado", color: "var(--fg-muted)", bg: "var(--border-subtle)" },
  agendada: { label: "Agendada", color: "var(--info)", bg: "var(--info-subtle)" },
};

interface TabItem {
  id: Tab;
  label: string;
  icon: typeof Eye;
  badge?: number;
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}k`;
  return String(n);
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function GalleryDetailClient({
  gallery: initialGallery,
  photos,
  studioId,
  studioName,
  shareToken,
}: {
  gallery: GalleryDetail;
  photos: GalleryPhoto[];
  studioId: string;
  studioName: string;
  shareToken: string | null;
}) {
  const router = useRouter();
  const [gallery, setGallery] = useState(initialGallery);
  const [activeTab, setActiveTab] = useState<Tab>("visao-geral");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMoreTabs, setShowMoreTabs] = useState(false);

  const status = statusConfig[gallery.status];
  const eventDate = gallery.projects?.event_date || gallery.created_at;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.essyn.studio";
  const galleryUrl = shareToken ? `${appUrl}/g/${shareToken}` : `${appUrl}/galeria/${gallery.id}`;

  const tabs: TabItem[] = [
    { id: "visao-geral", label: "Visão Geral", icon: Eye },
    { id: "conteudo", label: "Conteúdo", icon: Images },
    { id: "acesso", label: "Acesso", icon: Lock },
    { id: "downloads", label: "Downloads", icon: Download },
    { id: "favoritos", label: "Favoritos", icon: Heart, badge: photos.filter((p) => p.favorited).length || undefined },
    { id: "proofing", label: "Proofing", icon: MessageSquare },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "organizacao", label: "Organização", icon: Folder },
    { id: "automacao", label: "Automação", icon: Zap },
    { id: "loja", label: "Loja", icon: ShoppingBag },
    { id: "atividade", label: "Atividade", icon: Activity },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(galleryUrl);
    setCopiedLink(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  }, [galleryUrl]);

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* ═══ Unified Panel — header + actions + tabs in one card ═══ */}
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => router.push("/galeria")}
                className="mt-1 p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors shrink-0"
              >
                <ArrowLeft size={18} className="text-[var(--fg-muted)]" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  {/* Cover thumbnail */}
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] overflow-hidden shrink-0 flex items-center justify-center">
                    {gallery.cover_url ? (
                      <img src={gallery.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Images size={16} className="text-[var(--fg-muted)] opacity-40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-[16px] sm:text-[18px] font-bold text-[var(--fg)] truncate">{gallery.name}</h1>
                      <StatusBadge label={status.label} color={status.color} bg={status.bg} />
                    </div>
                    <p className="text-[11px] sm:text-[12px] text-[var(--fg-muted)]">
                      {gallery.clients?.name || "Sem cliente"}
                      {eventDate && ` · ${format(new Date(eventDate), "dd MMM yyyy", { locale: ptBR })}`}
                      {` · ${gallery.photo_count} fotos`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons — wrap on mobile */}
            <div className="flex items-center gap-2 flex-wrap mt-4">
              <button onClick={handleCopyLink} className={COMPACT_SECONDARY_CTA}>
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span className="hidden sm:inline">{copiedLink ? "Copiado" : "Copiar link"}</span>
              </button>
              <button onClick={() => toast.info("Envio em breve")} className={COMPACT_SECONDARY_CTA}>
                <Send size={14} />
                <span className="hidden sm:inline">Enviar</span>
              </button>
              <button onClick={() => toast.info("Download ZIP em breve")} className={COMPACT_SECONDARY_CTA}>
                <FileArchive size={14} />
                <span className="hidden sm:inline">ZIP</span>
              </button>
              <button onClick={() => window.open(galleryUrl, "_blank")} className={COMPACT_PRIMARY_CTA}>
                <ExternalLink size={14} />
                <span className="hidden sm:inline">Ver como cliente</span>
              </button>
            </div>
          </div>

          {/* Tabs — inside unified card */}
          {(() => {
            const essentialTabs = tabs.slice(0, 6);
            const advancedTabs = tabs.slice(6);
            const isAdvancedActive = advancedTabs.some((t) => t.id === activeTab);
            const activeAdvancedTab = advancedTabs.find((t) => t.id === activeTab);

            return (
              <div className="border-t border-[var(--border-subtle)] overflow-x-auto">
                <div className="flex items-center gap-0 px-6 min-w-max">
                  {essentialTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setShowMoreTabs(false); }}
                        className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                          isActive
                            ? "border-[var(--fg)] text-[var(--fg)]"
                            : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]"
                        }`}
                      >
                        <Icon size={13} />
                        {tab.label}
                        {tab.badge && (
                          <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--info-subtle)] text-[var(--info)]">
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* More dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMoreTabs(!showMoreTabs)}
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                        isAdvancedActive
                          ? "border-[var(--fg)] text-[var(--fg)]"
                          : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]"
                      }`}
                    >
                      {activeAdvancedTab ? (
                        <>
                          {(() => { const AIcon = activeAdvancedTab.icon; return <AIcon size={13} />; })()}
                          {activeAdvancedTab.label}
                        </>
                      ) : (
                        <>
                          <MoreHorizontal size={13} />
                          Mais
                        </>
                      )}
                      <ChevronDown size={11} className={`transition-transform ${showMoreTabs ? "rotate-180" : ""}`} />
                    </button>

                    {showMoreTabs && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMoreTabs(false)} />
                        <div
                          className="absolute top-full left-0 mt-1 z-20 bg-[var(--card)] rounded-xl py-1.5 min-w-[160px] overflow-hidden"
                          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)" }}
                        >
                          {advancedTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setShowMoreTabs(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors ${
                                  isActive
                                    ? "text-[var(--fg)] bg-[var(--bg-subtle)] font-medium"
                                    : "text-[var(--fg-secondary)] hover:bg-[var(--bg-subtle)]"
                                }`}
                              >
                                <Icon size={13} />
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ═══ Tab Content — separate area ═══ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "visao-geral" && <TabVisaoGeral gallery={gallery} photos={photos} onCopyLink={handleCopyLink} galleryUrl={galleryUrl} />}
            {activeTab === "conteudo" && <TabConteudo gallery={gallery} photos={photos} studioId={studioId} />}
            {activeTab === "acesso" && <TabAcesso gallery={gallery} galleryUrl={galleryUrl} onCopyLink={handleCopyLink} />}
            {activeTab === "downloads" && <TabDownloads gallery={gallery} />}
            {activeTab === "favoritos" && <TabFavoritos gallery={gallery} photos={photos} />}
            {activeTab === "proofing" && <TabProofing gallery={gallery} />}
            {activeTab === "branding" && <TabBranding gallery={gallery} studioName={studioName} />}
            {activeTab === "organizacao" && <TabOrganizacao gallery={gallery} photos={photos} />}
            {activeTab === "automacao" && <TabAutomacao gallery={gallery} />}
            {activeTab === "loja" && <TabLoja gallery={gallery} />}
            {activeTab === "atividade" && <TabAtividade gallery={gallery} />}
            {activeTab === "analytics" && <TabAnalytics gallery={gallery} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

/* ================================================================== */
/*  TAB: Visão Geral                                                   */
/* ================================================================== */

function TabVisaoGeral({
  gallery,
  photos,
  onCopyLink,
  galleryUrl,
}: {
  gallery: GalleryDetail;
  photos: GalleryPhoto[];
  onCopyLink: () => void;
  galleryUrl: string;
}) {
  const favCount = photos.filter((p) => p.favorited).length;
  const selectedCount = photos.filter((p) => p.selected).length;

  const daysUntilExpiry = gallery.expires_at
    ? Math.max(0, Math.ceil((new Date(gallery.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-5">
      {/* Métricas */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)]">
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Visualizações</p>
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{formatNum(gallery.views)}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">visitantes únicos</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Downloads</p>
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{formatNum(gallery.downloads)}</p>
            <p className="text-[10px] text-[var(--success)] mt-1.5">+15% esta semana</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Favoritos</p>
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{favCount}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">pessoas</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Seleções</p>
            <p className={`text-[24px] font-bold tracking-[-0.026em] leading-none ${selectedCount > 0 ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>{selectedCount > 0 ? "Aprovada" : "Pendente"}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">{selectedCount > 0 ? "Concluída" : "Aguardando"}</p>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Ações Rápidas</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          <QuickAction icon={Copy} label="Copiar link da galeria" desc="Compartilhe com o cliente" onClick={onCopyLink} />
          <QuickAction icon={Send} label="Enviar por WhatsApp" desc="Mensagem pré-formatada" />
          <QuickAction
            icon={FileArchive}
            label="Gerar ZIP completo"
            desc={`${gallery.photo_count} fotos · ~${Math.round(gallery.photo_count * 3.2)}MB`}
          />
          {daysUntilExpiry !== null && (
            <QuickAction
              icon={Clock}
              label="Estender prazo"
              desc={`Expira em ${daysUntilExpiry} dias`}
              valueColor={daysUntilExpiry <= 7 ? "var(--error)" : undefined}
            />
          )}
          <QuickAction
            icon={Shield}
            label={gallery.download_enabled ? "Bloquear downloads" : "Liberar downloads"}
            desc={gallery.download_enabled ? "Desativar temporariamente" : "Reativar downloads"}
          />
        </div>
      </div>

      {/* Atividade Recente (preview) */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Atividade Recente</h2>
          <span className="text-[12px] text-[var(--fg-muted)]">8</span>
        </div>
        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          <ActivityRow icon={Eye} color="var(--fg-muted)" name={gallery.clients?.name || "Visitante"} action="Abriu a galeria" time="Recente" />
          {favCount > 0 && <ActivityRow icon={Heart} color="var(--error)" name={gallery.clients?.name || "Visitante"} action={`Favoritou ${favCount} fotos`} time="Recente" />}
          {gallery.downloads > 0 && <ActivityRow icon={Download} color="var(--info)" name={gallery.clients?.name || "Visitante"} action="Baixou fotos (Web)" time="Recente" />}
          {0 > 0 && <ActivityRow icon={Share2} color="var(--accent)" name={gallery.clients?.name || "Visitante"} action={`Compartilhou link com ${0} pessoas`} time="Recente" />}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, onClick, valueColor }: {
  icon: typeof Copy; label: string; desc: string; onClick?: () => void; valueColor?: string;
}) {
  return (
    <ListRow onClick={onClick} className="px-4 py-3">
      <Icon size={16} className="text-[var(--fg-secondary)] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--fg)]">{label}</p>
        <p className="text-[11px] text-[var(--fg-muted)]" style={valueColor ? { color: valueColor } : undefined}>{desc}</p>
      </div>
      <ChevronRight size={14} className="text-[var(--fg-muted)] shrink-0" />
    </ListRow>
  );
}

function ActivityRow({ icon: Icon, color, name, action, time }: {
  icon: typeof Eye; color: string; name: string; action: string; time: string;
}) {
  return (
    <ListRow className="px-4 py-3">
      <Icon size={16} className="shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[var(--fg)]"><span className="font-medium">{name}</span></p>
        <p className="text-[11px] text-[var(--fg-muted)]">{action}</p>
      </div>
      <span className="text-[10px] text-[var(--fg-muted)] shrink-0">{time}</span>
    </ListRow>
  );
}

/* ================================================================== */
/*  TAB: Conteúdo                                                      */
/* ================================================================== */

function TabConteudo({ gallery, photos, studioId }: { gallery: GalleryDetail; photos: GalleryPhoto[]; studioId: string }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [localPhotos, setLocalPhotos] = useState(photos);
  const supabase = createClient(); // usado para inserir metadados no DB após upload

  // Group photos by a mock folder structure (since we don't have folders yet)
  const folders = [
    { name: "Todas as fotos", count: localPhotos.length },
  ];

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      toast.error("Selecione apenas arquivos de imagem.");
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: fileArray.length });

    const uploaded: GalleryPhoto[] = [];
    let errorCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadProgress({ current: i + 1, total: fileArray.length });

      // Pede presigned URL ao servidor → faz PUT direto no R2
      let fileUrl: string;
      let filePath: string;
      try {
        const urlRes = await fetch("/api/storage/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            galleryId: gallery.id,
          }),
        });

        if (!urlRes.ok) throw new Error("Falha ao obter URL de upload");
        const { uploadUrl, publicUrl, path } = await urlRes.json();
        filePath = path;
        fileUrl = publicUrl;

        // Upload direto ao R2 via presigned URL
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) throw new Error("Falha no upload para R2");
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        errorCount++;
        continue;
      }

      const { data: insertedPhoto, error: insertError } = await supabase
        .from("gallery_photos")
        .insert({
          gallery_id: gallery.id,
          studio_id: studioId,
          file_url: fileUrl,
          thumbnail_url: fileUrl,
          storage_path: filePath,
          filename: file.name,
          size_bytes: file.size,
          width: 0,
          height: 0,
          sort_order: localPhotos.length + uploaded.length,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Insert failed for ${file.name}:`, insertError);
        errorCount++;
        continue;
      }

      uploaded.push({
        ...insertedPhoto,
        favorited: insertedPhoto.favorited ?? false,
        selected: insertedPhoto.selected ?? false,
      });
    }

    // photo_count is auto-updated by DB trigger (sync_gallery_photo_count)
    if (uploaded.length > 0) {
      setLocalPhotos((prev) => [...prev, ...uploaded]);
    }

    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });

    if (errorCount > 0 && uploaded.length > 0) {
      toast.warning(`${uploaded.length} foto(s) enviada(s), ${errorCount} erro(s).`);
    } else if (errorCount > 0) {
      toast.error("Falha ao enviar fotos. Verifique se o bucket existe no Supabase Storage.");
    } else {
      toast.success(`${uploaded.length} foto(s) enviada(s) com sucesso!`);
    }
  }, [supabase, studioId, gallery.id, localPhotos.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-5">
      {/* Upload Area */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Upload</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] p-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex flex-col items-center justify-center py-10 gap-3 border-2 border-dashed border-[var(--border-subtle)] rounded-lg cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)]/30 transition-colors"
            onClick={() => document.getElementById("photo-upload-input")?.click()}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--accent)] border-t-transparent" />
                <p className="text-[13px] text-[var(--fg-muted)]">
                  Enviando {uploadProgress.current} de {uploadProgress.total}...
                </p>
              </>
            ) : (
              <>
                <Upload size={28} className="text-[var(--fg-muted)] opacity-50" />
                <p className="text-[13px] text-[var(--fg)]">Arraste fotos ou clique para selecionar</p>
                <p className="text-[11px] text-[var(--fg-muted)]">JPG, PNG, WEBP</p>
              </>
            )}
          </div>
          <input
            id="photo-upload-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={uploading}
          />
        </div>
      </div>

      {/* Folders */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Coleções</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          {folders.map((folder) => (
            <ListRow key={folder.name} className="px-4 py-3">
              <Folder size={16} className="text-[var(--fg-muted)] shrink-0" />
              <span className="text-[13px] font-medium text-[var(--fg)] flex-1">{folder.name}</span>
              <span className="text-[12px] text-[var(--fg-muted)]">{folder.count}</span>
              <ChevronRight size={14} className="text-[var(--fg-muted)]" />
            </ListRow>
          ))}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Todas as Fotos</h2>
          <span className="text-[12px] text-[var(--fg-muted)]">{localPhotos.length}</span>
        </div>
        <div className="border-t border-[var(--border-subtle)]">
          {localPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
              {localPhotos.slice(0, 20).map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="relative aspect-square rounded-lg overflow-hidden bg-[var(--bg-subtle)] group"
                >
                  <img
                    src={photo.thumbnail_url || photo.file_url}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                  {/* Badges */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                    {photo.favorited && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[var(--error)]/80 text-[var(--fg-light)] backdrop-blur-sm">
                        <Heart size={8} fill="currentColor" /> HERO
                      </span>
                    )}
                  </div>
                  {photo.favorited && (
                    <div className="absolute top-1.5 right-1.5">
                      <Heart size={14} fill="currentColor" className="text-[var(--error)] drop-shadow" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end opacity-0 group-hover:opacity-100">
                    <span className="text-[10px] text-white font-medium p-2 truncate">{photo.filename}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Upload size={32} className="text-[var(--fg-muted)] opacity-40" />
              <p className="text-[13px] text-[var(--fg-muted)]">Nenhuma foto ainda</p>
              <p className="text-[11px] text-[var(--fg-muted)]">Use a area de upload acima para adicionar fotos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB: Acesso                                                        */
/* ================================================================== */

function TabAcesso({ gallery, galleryUrl, onCopyLink }: {
  gallery: GalleryDetail; galleryUrl: string; onCopyLink: () => void;
}) {
  const [passwordEnabled, setPasswordEnabled] = useState(!!gallery.password_hash);
  const [shareEnabled, setShareEnabled] = useState(true);
  const [noIndexEnabled, setNoIndexEnabled] = useState(true);

  return (
    <div className="space-y-5">
      {/* Link Configuration */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Configuração do Link</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Globe size={16} className="text-[var(--fg-secondary)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--fg)] truncate">{galleryUrl.replace(/^https?:\/\//, "")}</p>
              <p className="text-[11px] text-[var(--fg-muted)]">{passwordEnabled ? "Protegido por senha" : "Acesso direto"}</p>
            </div>
            <button onClick={onCopyLink} className="p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors">
              <Copy size={15} className="text-[var(--fg-muted)]" />
            </button>
          </div>

          <div className="space-y-0 divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            <ToggleRow label="Senha" desc="Ativada" enabled={passwordEnabled} onChange={setPasswordEnabled} />
            <ToggleRow label="Permitir partilha" desc="Clientes podem re-partilhar" enabled={shareEnabled} onChange={setShareEnabled} />
            <ToggleRow label="Anti-indexação" desc="Buscadores bloqueados" enabled={noIndexEnabled} onChange={setNoIndexEnabled} />
          </div>
        </div>
      </div>

      {/* Convites */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Convites</h2>
          <span className="text-[12px] text-[var(--fg-muted)]">{gallery.clients ? 1 : 0}</span>
        </div>
        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          {gallery.clients ? (
            <ListRow className="px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center shrink-0 text-[11px] font-bold text-[var(--accent)]">
                {gallery.clients.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--fg)]">{gallery.clients.name}</p>
                <p className="text-[11px] text-[var(--fg-muted)]">Ver, Favoritar, Baixar Web</p>
              </div>
              <button className="p-1 rounded hover:bg-[var(--card-hover)]">
                <span className="text-[var(--fg-muted)]">···</span>
              </button>
            </ListRow>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-[13px] text-[var(--fg-muted)]">Nenhum convite enviado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, enabled, onChange }: {
  label: string; desc: string; enabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[13px] font-medium text-[var(--fg)]">{label}</p>
        <p className="text-[11px] text-[var(--fg-muted)]">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
      >
        <div className={`w-5 h-5 rounded-full bg-[var(--bg-elevated)] shadow-sm absolute top-0.5 transition-transform ${enabled ? "translate-x-5.5 left-[1px]" : "left-[2px]"}`}
          style={{ transform: enabled ? "translateX(21px)" : "translateX(0px)" }}
        />
      </button>
    </div>
  );
}

/* ================================================================== */
/*  TAB: Downloads                                                     */
/* ================================================================== */

function TabDownloads({ gallery }: { gallery: GalleryDetail }) {
  const [downloadMode, setDownloadMode] = useState<"disabled" | "web" | "high" | "both">(
    gallery.download_enabled ? "web" : "disabled"
  );
  const [jpgQuality, setJpgQuality] = useState(85);
  const [maxResolution, setMaxResolution] = useState(2048);
  const [releaseAfterPayment, setReleaseAfterPayment] = useState(false);
  const [releaseAfterApproval, setReleaseAfterApproval] = useState(true);
  const [blockIfExpired, setBlockIfExpired] = useState(true);

  return (
    <div className="space-y-5">
      {/* Estado dos Downloads */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Estado dos Downloads</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] p-4 space-y-1">
          {([
            { value: "disabled", label: "Desativado", desc: "Nenhum download permitido" },
            { value: "web", label: "Web", desc: "JPG otimizado para tela" },
            { value: "high", label: "Alta resolução", desc: "JPG alta qualidade para impressão" },
            { value: "both", label: "Web + Alta", desc: "Ambas as opções disponíveis" },
          ] as const).map((opt) => (
            <label key={opt.value} className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${downloadMode === opt.value ? "bg-[var(--info-subtle)]" : "hover:bg-[var(--card-hover)]"}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${downloadMode === opt.value ? "border-[var(--info)]" : "border-[var(--border)]"}`}>
                {downloadMode === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-[var(--info)]" />}
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--fg)]">{opt.label}</p>
                <p className="text-[11px] text-[var(--fg-muted)]">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Qualidade Web */}
      {downloadMode !== "disabled" && (
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4">
            <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Qualidade Web</h2>
          </div>
          <div className="border-t border-[var(--border-subtle)] p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[13px] font-medium text-[var(--fg)]">Qualidade JPG</p>
                  <p className="text-[11px] text-[var(--fg-muted)]">Compressão web (80-95)</p>
                </div>
                <span className="text-[15px] font-semibold text-[var(--info)]">{jpgQuality}%</span>
              </div>
              <input
                type="range"
                min={80}
                max={95}
                value={jpgQuality}
                onChange={(e) => setJpgQuality(Number(e.target.value))}
                className="w-full accent-[var(--info)]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-[var(--fg)]">Resolução máxima</p>
                <p className="text-[11px] text-[var(--fg-muted)]">Lado mais longo (px)</p>
              </div>
              <span className="text-[15px] font-semibold text-[var(--info)]">{maxResolution}px</span>
            </div>
          </div>
        </div>
      )}

      {/* Regras de Liberação */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Regras de Liberação</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] p-4 divide-y divide-[var(--border-subtle)]">
          <ToggleRow label="Liberar após pagamento" desc="Download bloqueado até pagamento confirmado" enabled={releaseAfterPayment} onChange={setReleaseAfterPayment} />
          <ToggleRow label="Liberar após aprovação" desc="Cliente deve aprovar seleção primeiro" enabled={releaseAfterApproval} onChange={setReleaseAfterApproval} />
          <ToggleRow label="Bloquear se expirado" desc="Downloads desativados após data de expiração" enabled={blockIfExpired} onChange={setBlockIfExpired} />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB: Favoritos                                                     */
/* ================================================================== */

function TabFavoritos({ gallery, photos }: { gallery: GalleryDetail; photos: GalleryPhoto[] }) {
  const favCount = photos.filter((p) => p.favorited).length;
  const selectedCount = photos.filter((p) => p.selected).length;

  // Simulated per-person favorites since we don't have this data yet
  const people = gallery.clients
    ? [{ name: gallery.clients.name, role: "Cliente", count: favCount, active: "Ativo Hoje" }]
    : [];

  return (
    <div className="space-y-5">
      {/* Favoritos por Pessoa */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Favoritos por Pessoa</h2>
          <span className="text-[12px] text-[var(--fg-muted)]">{people.length}</span>
        </div>
        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          {people.length > 0 ? people.map((person) => (
            <ListRow key={person.name} className="px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center shrink-0 text-[11px] font-bold text-[var(--accent)]">
                {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-[var(--fg)]">{person.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--fg-muted)]">{person.role}</span>
                </div>
                <p className="text-[11px] text-[var(--fg-muted)]">{person.count} favoritos · {person.active}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Heart size={13} className="text-[var(--error)]" fill="currentColor" />
                <span className="text-[13px] font-semibold text-[var(--error)]">{person.count}</span>
              </div>
              <ChevronRight size={14} className="text-[var(--fg-muted)]" />
            </ListRow>
          )) : (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-[var(--fg-muted)]">Nenhum favorito ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Seleção do Álbum */}
      <div>
        <InlineBanner variant="info">
          <div>
            <p className="font-medium text-[13px]">Sistema de escolha</p>
            <p className="text-[12px] mt-0.5">O cliente marca cada foto como &apos;Vai pro álbum&apos;, &apos;Não vai&apos; ou &apos;Em dúvida&apos;. Quando terminar, clica em &apos;Aprovar seleção final&apos;.</p>
          </div>
        </InlineBanner>
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden mt-3" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4">
            <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Seleção do Álbum</h2>
          </div>
          <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            <ListRow className="px-4 py-3">
              <CheckCircle2 size={16} className="text-[var(--success)] shrink-0" />
              <span className="text-[13px] font-medium text-[var(--fg)] flex-1">Vai pro álbum</span>
              <span className="text-[13px] font-semibold text-[var(--success)]">{selectedCount}</span>
            </ListRow>
            <ListRow className="px-4 py-3">
              <XCircle size={16} className="text-[var(--error)] shrink-0" />
              <span className="text-[13px] font-medium text-[var(--fg)] flex-1">Não vai</span>
              <span className="text-[13px] font-semibold text-[var(--error)]">0</span>
            </ListRow>
            <ListRow className="px-4 py-3">
              <HelpCircle size={16} className="text-[var(--warning)] shrink-0" />
              <span className="text-[13px] font-medium text-[var(--fg)] flex-1">Em dúvida</span>
              <span className="text-[13px] font-semibold text-[var(--warning)]">0</span>
            </ListRow>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button className="text-[12px] text-[var(--info)] hover:underline">Exportar lista (CSV)</button>
          <span className="text-[var(--fg-muted)]">·</span>
          <button className="text-[12px] text-[var(--info)] hover:underline">Baixar favoritos</button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB: Proofing                                                      */
/* ================================================================== */

function TabProofing({ gallery }: { gallery: GalleryDetail }) {
  // Mock proofing data — will be backed by real data later
  const comments: { name: string; date: string; tag: string; tagColor: string; status: string; statusColor: string; text: string }[] = [];

  const checklistItems = [
    { label: "Nomes corretos", done: true },
    { label: "Fotos principais OK", done: true },
    { label: "Seleção do álbum finalizada", done: false },
    { label: "Pode liberar download alta", done: false },
  ];

  const pendingCount = checklistItems.filter((c) => !c.done).length;

  return (
    <div className="space-y-5">
      {comments.length > 0 && (
        <InlineBanner variant="warning">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} />
            <span className="font-medium">{comments.length} comentários pendentes</span>
            <span className="text-[var(--fg-muted)]">— Revise e resolva antes de aprovar a galeria</span>
          </div>
        </InlineBanner>
      )}

      {/* Comentários */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Comentários por Foto</h2>
          <span className="text-[12px] text-[var(--fg-muted)]">{comments.length}</span>
        </div>
        {comments.length === 0 ? (
          <div className="border-t border-[var(--border-subtle)]">
            <div className="px-4 py-8 text-center">
              <MessageSquare size={24} className="mx-auto mb-2 text-[var(--fg-muted)] opacity-40" />
              <p className="text-[13px] text-[var(--fg-muted)]">Nenhum comentário de prova ainda</p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">Comentários dos clientes sobre as fotos aparecerão aqui</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Checklist */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Checklist de Revisão</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          {checklistItems.map((item) => (
            <ListRow key={item.label} className="px-4 py-3">
              {item.done ? (
                <CheckCircle2 size={18} className="text-[var(--success)] shrink-0" />
              ) : (
                <div className="w-[18px] h-[18px] rounded-full border-2 border-[var(--border)] shrink-0" />
              )}
              <span className={`text-[13px] flex-1 ${item.done ? "text-[var(--fg-muted)] line-through" : "font-medium text-[var(--fg)]"}`}>
                {item.label}
              </span>
            </ListRow>
          ))}
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-[var(--fg-muted)]">{pendingCount} item(s) pendente(s)</span>
            <button className={COMPACT_PRIMARY_CTA} disabled={pendingCount > 0}>
              <Check size={14} /> Marcar como Aprovada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB: Branding                                                      */
/* ================================================================== */

function TabBranding({ gallery, studioName }: { gallery: GalleryDetail; studioName: string }) {
  const [layout, setLayout] = useState<"grid" | "masonry">("grid");
  const [welcomeMsg, setWelcomeMsg] = useState(
    (gallery.settings as Record<string, string>)?.welcomeMessage ||
    "Obrigado por nos escolher para eternizar este momento especial. Aproveite suas fotos!"
  );

  return (
    <div className="space-y-5">
      {/* Identidade Visual */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Identidade Visual</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center">
                <Image size={20} className="text-[var(--fg-muted)] opacity-40" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--fg)]">Logo do estúdio</p>
                <p className="text-[11px] text-[var(--fg-muted)]">PNG ou SVG, fundo transparente</p>
              </div>
            </div>
            <button className="text-[12px] text-[var(--info)] hover:underline">Alterar</button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-[var(--info)]" />
                <div className="w-6 h-6 rounded-full bg-[var(--fg)]" />
                <div className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" />
                <div className="w-6 h-6 rounded-full bg-[var(--warning)]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--fg)]">Paleta de cores</p>
                <p className="text-[11px] text-[var(--fg-muted)]">4 cores do tema</p>
              </div>
            </div>
            <button className="text-[12px] text-[var(--info)] hover:underline">Editar</button>
          </div>
        </div>
      </div>

      {/* Layout da Galeria */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Layout da Galeria</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] p-4 space-y-1">
          <label className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${layout === "grid" ? "bg-[var(--info-subtle)]" : "hover:bg-[var(--card-hover)]"}`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${layout === "grid" ? "border-[var(--info)]" : "border-[var(--border)]"}`}>
              {layout === "grid" && <div className="w-2.5 h-2.5 rounded-full bg-[var(--info)]" />}
            </div>
            <div>
              <p className="text-[13px] font-medium text-[var(--fg)]">Grid uniforme</p>
              <p className="text-[11px] text-[var(--fg-muted)]">Fotos em grade regular, clássico e organizado</p>
            </div>
          </label>
          <label className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${layout === "masonry" ? "bg-[var(--info-subtle)]" : "hover:bg-[var(--card-hover)]"}`} onClick={() => setLayout("masonry")}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${layout === "masonry" ? "border-[var(--info)]" : "border-[var(--border)]"}`}>
              {layout === "masonry" && <div className="w-2.5 h-2.5 rounded-full bg-[var(--info)]" />}
            </div>
            <div>
              <p className="text-[13px] font-medium text-[var(--fg)]">Masonry</p>
              <p className="text-[11px] text-[var(--fg-muted)]">Tamanhos variados, dinâmico e editorial</p>
            </div>
          </label>
        </div>
      </div>

      {/* Textos */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Textos</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] p-4 space-y-4">
          <div>
            <label className={LABEL_CLS}>Mensagem de boas-vindas</label>
            <textarea
              value={welcomeMsg}
              onChange={(e) => setWelcomeMsg(e.target.value)}
              rows={2}
              className={INPUT_CLS + " !h-auto resize-none"}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={16} className="text-[var(--fg-muted)]" />
              <div>
                <p className="text-[13px] font-medium text-[var(--fg)]">Domínio próprio</p>
                <p className="text-[11px] text-[var(--fg-muted)]">galeria.seudominio.com</p>
              </div>
            </div>
            <button className="text-[12px] text-[var(--info)] hover:underline">Configurar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB: Organização                                                   */
/* ================================================================== */

function TabOrganizacao({ gallery, photos }: { gallery: GalleryDetail; photos: GalleryPhoto[] }) {
  // Mock folders
  const folders = [
    { name: "Hero Set", count: 20, isHero: true },
    { name: "Making Of", count: Math.round(gallery.photo_count * 0.15) },
    { name: "Cerimônia", count: Math.round(gallery.photo_count * 0.37) },
    { name: "Festa", count: Math.round(gallery.photo_count * 0.34) },
    { name: "Detalhes", count: Math.round(gallery.photo_count * 0.07) },
  ].filter((f) => gallery.photo_count > 0);

  const totalFolders = folders.length;

  return (
    <div className="space-y-5">
      {/* Estrutura */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Estrutura da Galeria</h2>
          <button className={COMPACT_SECONDARY_CTA}>
            <Folder size={13} /> Nova pasta
          </button>
        </div>

        {gallery.photo_count > 0 && (
          <div className="flex items-center gap-6 px-6 pb-3 border-t border-[var(--border-subtle)] pt-3">
            <div>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{totalFolders}</p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">Pastas</p>
            </div>
            <div>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{gallery.photo_count}</p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">Fotos</p>
            </div>
          </div>
        )}

        <div className="border-t border-[var(--border-subtle)]">
          {folders.length > 0 ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              <div className="px-4 py-2">
                <p className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
                  <GripVertical size={10} /> Arraste para reordenar as pastas. A ordem será refletida na galeria do cliente.
                </p>
              </div>
              {folders.map((folder, i) => (
                <ListRow key={folder.name} className="px-4 py-3">
                  <GripVertical size={14} className="text-[var(--fg-muted)] opacity-40 shrink-0 cursor-grab" />
                  <Folder size={16} className="text-[var(--fg-secondary)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--fg)]">{folder.name}</p>
                    <p className="text-[11px] text-[var(--fg-muted)]">{folder.count} fotos{folder.isHero ? " · Destaque" : ""}</p>
                  </div>
                  <span className="text-[11px] text-[var(--fg-muted)] shrink-0">{i + 1}</span>
                  {folder.isHero && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--warning-subtle)] text-[var(--warning)] shrink-0">HERO</span>
                  )}
                  <button className="p-1 rounded hover:bg-[var(--card-hover)] shrink-0">
                    <Trash2 size={13} className="text-[var(--fg-muted)]" />
                  </button>
                </ListRow>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <Folder size={24} className="mx-auto mb-2 text-[var(--fg-muted)] opacity-40" />
              <p className="text-[13px] text-[var(--fg-muted)]">Crie pastas para organizar as fotos</p>
            </div>
          )}
        </div>
      </div>

      {/* Foto de Capa */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Foto de Capa</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)]">
          {gallery.cover_url ? (
            <div className="aspect-[21/9] relative">
              <img src={gallery.cover_url} alt="Capa" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-[21/9] flex flex-col items-center justify-center bg-[var(--bg-subtle)] gap-2">
              <Image size={32} className="text-[var(--fg-muted)] opacity-30" />
              <p className="text-[12px] text-[var(--fg-muted)]">Arraste uma foto ou clique para selecionar a capa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB: Automação                                                     */
/* ================================================================== */

function TabAutomacao({ gallery }: { gallery: GalleryDetail }) {
  const [rules, setRules] = useState([
    { id: 1, trigger: "Ao publicar galeria", action: "Enviar link ao cliente", via: "WhatsApp", enabled: true },
    { id: 2, trigger: "7 dias antes de expirar", action: "Lembrar cliente", via: "E-mail", enabled: true },
    { id: 3, trigger: "Cliente favoritou 20+ fotos", action: "Avisar fotógrafo", via: "Push", enabled: false },
    { id: 4, trigger: "Seleção aprovada pelo cliente", action: "Liberar download alta", via: "Automático", enabled: true },
    { id: 5, trigger: "Galeria expirada", action: "Oferecer renovação paga", via: "E-mail", enabled: false },
  ]);

  const [renewalPrice, setRenewalPrice] = useState("49.90");

  function toggleRule(id: number) {
    setRules(rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  return (
    <div className="space-y-5">
      {/* Regras */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Regras de Automação</h2>
          <span className="text-[12px] text-[var(--fg-muted)]">{rules.filter((r) => r.enabled).length}</span>
        </div>
        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Zap size={16} className={rule.enabled ? "text-[var(--warning)]" : "text-[var(--fg-muted)] opacity-40"} />
                <div>
                  <p className={`text-[13px] font-medium ${rule.enabled ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"}`}>{rule.trigger}</p>
                  <p className="text-[11px] text-[var(--fg-muted)]">→ {rule.action} · via {rule.via}</p>
                </div>
              </div>
              <button
                onClick={() => toggleRule(rule.id)}
                className={`w-11 h-6 rounded-full transition-colors relative ${rule.enabled ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
              >
                <div
                  className="w-5 h-5 rounded-full bg-[var(--bg-elevated)] shadow-sm absolute top-0.5"
                  style={{ left: rule.enabled ? undefined : "2px", right: rule.enabled ? "2px" : undefined }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Renovação Paga */}
      <div>
        <InlineBanner variant="info">
          <div>
            <p className="font-medium text-[13px]">Upsell automático</p>
            <p className="text-[12px] mt-0.5">Quando a galeria expirar, o cliente recebe oferta para reativar por mais 90 dias. Configure o valor abaixo.</p>
          </div>
        </InlineBanner>
        <div className="bg-[var(--card)] rounded-2xl overflow-hidden mt-3" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4">
            <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Renovação Paga</h2>
          </div>
          <div className="border-t border-[var(--border-subtle)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-[var(--fg)]">Valor da renovação</p>
                <p className="text-[11px] text-[var(--fg-muted)]">Reativar por +90 dias</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[13px] text-[var(--fg-muted)]">R$</span>
                <input
                  type="text"
                  value={renewalPrice}
                  onChange={(e) => setRenewalPrice(e.target.value)}
                  className="w-20 text-right text-[15px] font-semibold text-[var(--error)] bg-transparent border-b border-[var(--border-subtle)] focus:border-[var(--info)] outline-none py-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB: Loja                                                          */
/* ================================================================== */

function TabLoja({ gallery }: { gallery: GalleryDetail }) {
  const [storeEnabled, setStoreEnabled] = useState(false);

  const products = [
    { category: "Impressões", items: [
      { name: "Impressão Fine Art", desc: "Papel algodão 300g, cores ricas e duradouras", sizes: ["20×30", "30×40"], price: 120, enabled: true },
      { name: "Canvas Premium", desc: "Tela esticada em chassis de madeira maciça", sizes: ["30×40", "40×60"], price: 280, enabled: true },
      { name: "Quadro Flutuante", desc: "Moldura com vidro museum glass", sizes: ["30×40", "40×60"], price: 350, enabled: false },
    ]},
    { category: "Digital", items: [
      { name: "Download Digital HD", desc: "Alta resolução sem marca d'água", sizes: ["Pack 10", "Pack 25"], price: 80, enabled: true },
    ]},
    { category: "Álbuns", items: [
      { name: "Álbum Fotográfico", desc: "Capa dura personalizada, 40 páginas", sizes: ["20×20", "25×25"], price: 450, enabled: true },
      { name: "Fotolivro Pocket", desc: "Formato 15×15 softcover compacto", sizes: ["20pag", "40pag"], price: 180, enabled: false },
    ]},
  ];

  return (
    <div className="space-y-5">
      {/* Store Toggle */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Loja desta Galeria</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)] p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-medium text-[var(--fg)]">Loja ativa para clientes</p>
              <p className="text-[11px] text-[var(--fg-muted)]">
                {storeEnabled ? "Produtos visíveis na galeria do cliente" : "Loja desativada"}
              </p>
            </div>
            <button
              onClick={() => setStoreEnabled(!storeEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${storeEnabled ? "bg-[var(--success)]" : "bg-[var(--border)]"}`}
            >
              <div className="w-5 h-5 rounded-full bg-[var(--bg-elevated)] shadow-sm absolute top-0.5" style={{ left: storeEnabled ? undefined : "2px", right: storeEnabled ? "2px" : undefined }} />
            </button>
          </div>

          {storeEnabled && (
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[var(--border-subtle)]">
              <div className="text-center">
                <p className="text-[24px] font-bold text-[var(--info)] tracking-[-0.026em] leading-none tabular-nums">{products.reduce((s, c) => s + c.items.filter((i) => i.enabled).length, 0)}</p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-1">Produtos</p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-bold text-[var(--success)] tracking-[-0.026em] leading-none tabular-nums">R$ 80</p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-1">Preco Min.</p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-bold text-[var(--error)] tracking-[-0.026em] leading-none tabular-nums">R$ 450</p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-1">Preco Max.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      {products.map((category) => (
        <div key={category.category} className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">{category.category}</h2>
            <span className="text-[12px] text-[var(--fg-muted)]">{category.items.length}</span>
          </div>
          <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {category.items.map((item) => (
              <ListRow key={item.name} className="px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                  <ShoppingBag size={14} className="text-[var(--fg-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium ${item.enabled ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"}`}>{item.name}</p>
                  <p className="text-[11px] text-[var(--fg-muted)]">{item.desc} · {item.sizes.length} tamanhos</p>
                </div>
                <span className="text-[13px] font-semibold text-[var(--success)] shrink-0">R$ {item.price}</span>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {item.sizes.map((s) => (
                    <span key={s} className="px-1.5 py-0.5 text-[9px] rounded bg-[var(--bg-subtle)] text-[var(--fg-muted)]">{s}</span>
                  ))}
                  <span className="text-[9px] text-[var(--fg-muted)]">+1</span>
                </div>
                <div className={`w-5 h-5 rounded-full ${item.enabled ? "bg-[var(--success)]" : "bg-[var(--border)]"} shrink-0 ml-2`}>
                  <Eye size={11} className={`m-auto mt-[5px] ${item.enabled ? "text-white" : "text-[var(--fg-muted)]"}`} />
                </div>
              </ListRow>
            ))}
          </div>
        </div>
      ))}

      {/* Add Product CTA */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
            <Plus size={20} className="text-[var(--fg-muted)]" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium text-[var(--fg)]">Adicionar produto ao catalogo</p>
            <p className="text-[11px] text-[var(--fg-muted)]">Gere a pagina de Pedidos para configurar novos produtos disponiveis em todas as galerias.</p>
          </div>
          <button className={COMPACT_SECONDARY_CTA}>
            <ShoppingBag size={14} /> Ir para Pedidos
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB: Atividade                                                     */
/* ================================================================== */

function TabAtividade({ gallery }: { gallery: GalleryDetail }) {
  const [filter, setFilter] = useState("todas");

  const filters = ["Todas", "Acessos", "Downloads", "Favoritos", "Partilhas", "Comentários"];

  // Mock activity log
  const activities = [
    { icon: Eye, color: "var(--fg-muted)", name: gallery.clients?.name || "Visitante", action: "Abriu a galeria", time: "Recente" },
    ...(gallery.downloads > 0 ? [{ icon: Download, color: "var(--info)", name: gallery.clients?.name || "Visitante", action: "Baixou fotos (Web)", time: "Recente" }] : []),
    ...(0 > 0 ? [{ icon: Share2, color: "var(--accent)", name: gallery.clients?.name || "Visitante", action: `Compartilhou link com ${0} pessoas`, time: "Recente" }] : []),
  ];

  return (
    <div className="space-y-5">
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Log de Atividade</h2>
          <span className="text-[12px] text-[var(--fg-muted)]">{activities.length}</span>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {filters.map((f) => (
              <ActionPill
                key={f}
                label={f}
                active={filter === f.toLowerCase()}
                onClick={() => setFilter(f.toLowerCase())}
              />
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          {activities.length > 0 ? activities.map((act, i) => {
            const Icon = act.icon;
            return (
              <ListRow key={i} className="px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                  <Icon size={14} style={{ color: act.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--fg)]"><span className="font-medium">{act.name}</span></p>
                  <p className="text-[11px] text-[var(--fg-muted)]">{act.action}</p>
                </div>
                <span className="text-[10px] text-[var(--fg-muted)] shrink-0">{act.time}</span>
              </ListRow>
            );
          }) : (
            <div className="px-4 py-8 text-center">
              <Activity size={24} className="mx-auto mb-2 text-[var(--fg-muted)] opacity-40" />
              <p className="text-[13px] text-[var(--fg-muted)]">Nenhuma atividade registrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB: Analytics                                                     */
/* ================================================================== */

function TabAnalytics({ gallery }: { gallery: GalleryDetail }) {
  return (
    <div className="space-y-5">
      {/* Overview Stats */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-[var(--border-subtle)]">
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Visualizações</p>
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{formatNum(gallery.views)}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">total</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Downloads</p>
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">{formatNum(gallery.downloads)}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">total</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Favoritos</p>
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">0</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">pessoas</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-medium text-[var(--fg-muted)] mb-1">Tempo medio</p>
            <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.026em] leading-none tabular-nums">4:32</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">por sessao</p>
          </div>
        </div>
      </div>

      {/* Placeholder for future charts */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Engajamento</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)]">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BarChart3 size={32} className="text-[var(--fg-muted)] opacity-30" />
            <p className="text-[13px] text-[var(--fg-muted)]">Graficos de analytics em breve</p>
            <p className="text-[11px] text-[var(--fg-muted)]">Visualizacoes por dia, fotos mais vistas, dispositivos e mais</p>
          </div>
        </div>
      </div>

      {/* Top Photos */}
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="px-6 py-4">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.006em]">Fotos Mais Populares</h2>
        </div>
        <div className="border-t border-[var(--border-subtle)]">
          <div className="px-4 py-8 text-center">
            <Star size={24} className="mx-auto mb-2 text-[var(--fg-muted)] opacity-40" />
            <p className="text-[13px] text-[var(--fg-muted)]">Ranking das fotos mais vistas e favoritadas aparecera aqui</p>
          </div>
        </div>
      </div>
    </div>
  );
}
