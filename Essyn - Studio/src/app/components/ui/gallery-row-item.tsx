import { useState, type ReactNode } from "react";
import {
  Eye, Download, Heart, Camera, Copy, Share2, Package,
  CalendarPlus, MoreHorizontal, Lock, Globe, Users,
  ChevronRight,
} from "lucide-react";
import type { V2GalleryStatus, V2GalleryPrivacy } from "../galeria-v2/gallery-types";
import { toast } from "sonner";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  GalleryRowItem — Flat flush row for gallery list  */
/*  Follows ActionRowItem / ProductionActionRowItem   */
/*  pattern: flush inside WidgetCard, hairlines from  */
/*  parent, hover bg, no border/shadow                */
/* ═══════════════════════════════════════════════════ */

/* ── Status config ── */
const statusConfig: Record<V2GalleryStatus, { label: string; dot: string; color: string; bg: string }> = {
  draft:     { label: "Rascunho",  dot: "bg-[#8E8E93]",  color: "#8E8E93", bg: "#F2F2F7" },
  proofing:  { label: "Aprovação", dot: "bg-[#9A6F30]",  color: "#9A6F30", bg: "#FFF0DC" },
  final:     { label: "Final",     dot: "bg-[#4E7545]",  color: "#4E7545", bg: "#E8EFE5" },
  delivered: { label: "Entregue",  dot: "bg-[#007AFF]",  color: "#007AFF", bg: "#F2F2F7" },
};

const privacyConfig: Record<V2GalleryPrivacy, { label: string; icon: ReactNode }> = {
  publico: { label: "Público",  icon: <Globe className="w-3 h-3" /> },
  senha:   { label: "Senha",    icon: <Lock className="w-3 h-3" /> },
  privado: { label: "Privado",  icon: <Users className="w-3 h-3" /> },
  expira:  { label: "Expira",   icon: <Lock className="w-3 h-3" /> },
};

export interface GalleryRowData {
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
  /** Optional expiration date */
  expiracao?: string;
  /** Download state */
  downloadState?: "on" | "off" | "limited" | "paid";
}

interface GalleryRowItemProps {
  gallery: GalleryRowData;
  onClick?: (id: string) => void;
  onCopyLink?: (id: string) => void;
  onShareWhatsApp?: (id: string) => void;
  onGenerateZip?: (id: string) => void;
  onExtendExpiration?: (id: string) => void;
  selected?: boolean;
}

export function GalleryRowItem({
  gallery,
  onClick,
  onCopyLink,
  onShareWhatsApp,
  onGenerateZip,
  onExtendExpiration,
  selected = false,
}: GalleryRowItemProps) {
  const [hovered, setHovered] = useState(false);
  const st = statusConfig[gallery.status];
  const pr = privacyConfig[gallery.privacy];

  function formatNum(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  }

  const { isDark } = useDk();

  /* ── Dark status config overrides ── */
  const darkStatusBg: Record<V2GalleryStatus, string> = {
    draft: "#2C2C2E",
    proofing: "#3A2A14",
    final: "#1E2E1A",
    delivered: "#1A2A3A",
  };

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3.5 transition-colors cursor-pointer ${
        selected
          ? isDark ? "bg-[#2C2C2E]" : "bg-[#F5F5F7]"
          : hovered
          ? isDark ? "bg-[#1C1C1E]" : "bg-[#FAFAFA]"
          : ""
      }`}
      onClick={() => onClick?.(gallery.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
    >
      {/* ── Thumbnail ── */}
      <div className={`relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 ${isDark ? "bg-[#2C2C2E]" : "bg-[#F2F2F7]"}`}>
        {gallery.coverUrl ? (
          <img
            src={gallery.coverUrl}
            alt={gallery.nome}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className={`w-4 h-4 ${isDark ? "text-[#636366]" : "text-[#D1D1D6]"}`} />
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Name + Status */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[13px] truncate flex-1 min-w-0 ${isDark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
            style={{ fontWeight: 500 }}
          >
            {gallery.nome}
          </span>

          {/* Status badge */}
          <div
            className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: isDark ? darkStatusBg[gallery.status] : st.bg }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${st.dot}`}
            />
            <span
              className="text-[9px] uppercase tracking-[0.04em]"
              style={{ fontWeight: 700, color: st.color }}
            >
              {st.label}
            </span>
          </div>
        </div>

        {/* Row 2: Meta line */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[11px] truncate ${isDark ? "text-[#8E8E93]" : "text-[#8E8E93]"}`} style={{ fontWeight: 400 }}>
            {gallery.cliente}
          </span>
          <span className={`w-0.5 h-0.5 rounded-full shrink-0 ${isDark ? "bg-[#3C3C43]" : "bg-[#D1D1D6]"}`} />
          <span className={`text-[11px] shrink-0 ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`} style={{ fontWeight: 400 }}>
            {gallery.dataCriacao}
          </span>
          <span className={`w-0.5 h-0.5 rounded-full shrink-0 ${isDark ? "bg-[#3C3C43]" : "bg-[#D1D1D6]"}`} />
          <span className={`shrink-0 ${isDark ? "text-[#636366]" : "text-[#C7C7CC]"}`}>{pr.icon}</span>
        </div>
      </div>

      {/* ── Stats (hidden on small screens) ── */}
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
        <div className={`flex items-center gap-1 text-[11px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`} style={{ fontWeight: 400 }}>
          <Camera className={`w-3 h-3 ${isDark ? "text-[#3C3C43]" : "text-[#D1D1D6]"}`} />
          {gallery.photoCount}
        </div>
        <div className={`flex items-center gap-1 text-[11px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`} style={{ fontWeight: 400 }}>
          <Eye className={`w-3 h-3 ${isDark ? "text-[#3C3C43]" : "text-[#D1D1D6]"}`} />
          {formatNum(gallery.views)}
        </div>
        <div className={`flex items-center gap-1 text-[11px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`} style={{ fontWeight: 400 }}>
          <Download className={`w-3 h-3 ${isDark ? "text-[#3C3C43]" : "text-[#D1D1D6]"}`} />
          {formatNum(gallery.downloads)}
        </div>
        <div className={`flex items-center gap-1 text-[11px] ${isDark ? "text-[#636366]" : "text-[#AEAEB2]"}`} style={{ fontWeight: 400 }}>
          <Heart className={`w-3 h-3 ${isDark ? "text-[#3C3C43]" : "text-[#D1D1D6]"}`} />
          {formatNum(gallery.favoritos)}
        </div>
      </div>

      {/* ── Quick actions (appear on hover) ── */}
      <div
        className="flex items-center gap-1 flex-shrink-0 transition-opacity"
        style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none" }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onCopyLink?.(gallery.id); }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${isDark ? "text-[#636366] hover:text-[#AEAEB2] hover:bg-[#2C2C2E]" : "text-[#AEAEB2] hover:text-[#636366] hover:bg-[#F2F2F7]"}`}
          title="Copiar link"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onShareWhatsApp?.(gallery.id); }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${isDark ? "text-[#636366] hover:text-[#AEAEB2] hover:bg-[#2C2C2E]" : "text-[#AEAEB2] hover:text-[#636366] hover:bg-[#F2F2F7]"}`}
          title="Enviar WhatsApp"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onGenerateZip?.(gallery.id); }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${isDark ? "text-[#636366] hover:text-[#AEAEB2] hover:bg-[#2C2C2E]" : "text-[#AEAEB2] hover:text-[#636366] hover:bg-[#F2F2F7]"}`}
          title="Gerar ZIP"
        >
          <Package className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onExtendExpiration?.(gallery.id); }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${isDark ? "text-[#636366] hover:text-[#AEAEB2] hover:bg-[#2C2C2E]" : "text-[#AEAEB2] hover:text-[#636366] hover:bg-[#F2F2F7]"}`}
          title="Estender expiração"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Chevron ── */}
      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-[#3C3C43]" : "text-[#D1D1D6]"}`} />
    </div>
  );
}