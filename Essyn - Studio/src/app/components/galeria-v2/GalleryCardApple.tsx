import { motion } from "motion/react";
import { useState } from "react";
import { Eye, Lock, Globe, Users, Share2, Copy } from "lucide-react";
import type { V2GalleryStatus, V2GalleryPrivacy } from "./gallery-types";
import { SelectionMode } from "./SelectionMode";
import { FocusRing } from "./KeyboardNavigation";
import type { MouseEvent } from "react";
import { useDk } from "../../lib/useDarkColors";

interface GalleryCardAppleProps {
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
  onClick: () => void;
  onQuickAction: (action: "share" | "duplicate" | "archive" | "delete") => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isFocused?: boolean;
  onContextMenu?: (e: MouseEvent, id: string) => void;
  onQuickPreview?: () => void;
  isListView?: boolean;
}

const statusConfig: Record<V2GalleryStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: "Rascunho", color: "#8E8E93", bg: "#F2F2F7" },
  proofing:  { label: "Aprovação", color: "#9A6F30", bg: "#FFF0DC" },
  final:     { label: "Final",    color: "#4E7545", bg: "#E8EFE5" },
  delivered: { label: "Entregue", color: "#007AFF", bg: "#F2F2F7" },
};

const privacyIconMap: Record<V2GalleryPrivacy, React.ReactNode> = {
  publico: <Globe className="w-3 h-3" />,
  senha:   <Lock className="w-3 h-3" />,
  privado: <Users className="w-3 h-3" />,
  expira:  <Lock className="w-3 h-3" />,
};

export function GalleryCardApple({
  id,
  nome,
  coverUrl,
  photoCount,
  status,
  privacy,
  views,
  cliente,
  dataCriacao,
  onClick,
  onQuickAction,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  isFocused,
  onContextMenu,
  onQuickPreview,
  isListView,
}: GalleryCardAppleProps) {
  const dk = useDk();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const currentStatus = statusConfig[status];

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (isListView) {
    return (
      <motion.div
        layout
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="group relative"
      >
        <FocusRing isFocused={isFocused || false} />
        <div
          className="flex items-center gap-4 px-4 py-3 rounded-2xl border cursor-pointer transition-colors"
          style={{ backgroundColor: dk.bg, borderColor: isHovered ? dk.border : dk.hairline }}
          onClick={onClick}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu?.(e as unknown as MouseEvent, id);
          }}
        >
          {/* Thumbnail */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: dk.bgMuted }}>
            <SelectionMode
              isSelectionMode={isSelectionMode || false}
              isSelected={isSelected || false}
              onToggleSelect={onToggleSelect || (() => {})}
            />
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={nome}
                onLoad={() => setImageLoaded(true)}
                className="w-full h-full object-cover"
                style={{
                  filter: imageLoaded ? "blur(0)" : "blur(4px)",
                  transition: "filter 0.3s",
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Eye className="w-6 h-6" style={{ color: dk.textDisabled }} />
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Title + status */}
            <div className="flex items-center gap-2 mb-1">
              <h3
                className="text-[15px] truncate tracking-[-0.01em]"
                style={{ fontWeight: 600, color: dk.textPrimary }}
              >
                {nome}
              </h3>
              <div
                className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: currentStatus.bg }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: currentStatus.color }}
                />
                <span
                  className="text-[10px] uppercase tracking-[0.04em]"
                  style={{ fontWeight: 700, color: currentStatus.color }}
                >
                  {currentStatus.label}
                </span>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-1.5 text-[12px] flex-wrap" style={{ fontWeight: 400, color: dk.textTertiary }}>
              <span>{cliente}</span>
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: dk.textDisabled }} />
              <span>{dataCriacao}</span>
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: dk.textDisabled }} />
              <span>{photoCount} fotos</span>
              {views > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: dk.textDisabled }} />
                  <span>
                    {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views} views
                  </span>
                </>
              )}
              {/* Privacy */}
              <div className="ml-1 flex items-center gap-1" style={{ color: dk.textSubtle }}>
                {privacyIconMap[privacy]}
              </div>
            </div>
          </div>

          {/* Hover actions */}
          <motion.div
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 flex-shrink-0"
            style={{ pointerEvents: isHovered ? "auto" : "none" }}
          >
            {onQuickPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickPreview();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-colors"
                style={{ fontWeight: 600, fontSize: "12px", backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textPrimary }}
              >
                <Eye className="w-3 h-3" />
                Quick Look
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction("share");
              }}
              className="w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer"
              style={{ backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textTertiary }}
              title="Partilhar"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction("duplicate");
              }}
              className="w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer"
              style={{ backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textTertiary }}
              title="Duplicar"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ── GRID VIEW (default) ────────────────────────────────────────────────────
  return (
    <motion.div
      layout
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <FocusRing isFocused={isFocused || false} />

      {/* ── Card shell: NO shadow, NO lift — flat Apple style ── */}
      <div
        className="relative rounded-[18px] overflow-hidden cursor-pointer border transition-colors"
        style={{ borderColor: isHovered ? dk.border : dk.hairline }}
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu?.(e as unknown as MouseEvent, id);
        }}
      >
        {/* ── Cover Image ── */}
        <div className="relative w-full aspect-[4/3] overflow-hidden" style={{ backgroundColor: dk.bgMuted }}>
          {/* Selection checkbox */}
          <SelectionMode
            isSelectionMode={isSelectionMode || false}
            isSelected={isSelected || false}
            onToggleSelect={onToggleSelect || (() => {})}
          />

          {/* Status badge — top-left */}
          {!isSelectionMode && (
            <div className="absolute top-3 left-3 z-10">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ backgroundColor: currentStatus.bg }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: currentStatus.color }}
                />
                <span
                  className="text-[10px] uppercase tracking-[0.04em]"
                  style={{ fontWeight: 700, color: currentStatus.color }}
                >
                  {currentStatus.label}
                </span>
              </div>
            </div>
          )}

          {/* Cover image — subtle zoom only, no glow */}
          {coverUrl ? (
            <motion.img
              src={coverUrl}
              alt={nome}
              onLoad={() => setImageLoaded(true)}
              animate={{
                scale: isHovered ? 1.04 : 1,
                opacity: imageLoaded ? 1 : 0,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#EDE9E3] flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#C4C2BF]" />
              </div>
            </div>
          )}

          {/* Privacy icon — top-right on hover */}
          <motion.div
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.18 }}
            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full border flex items-center justify-center"
            style={{ backgroundColor: dk.bgMuted, borderColor: dk.border }}
          >
            <div style={{ color: dk.textTertiary }}>{privacyIconMap[privacy]}</div>
          </motion.div>

          {/* Dark vignette on hover — controlled via CSS opacity (valid) */}
          <div
            className="absolute inset-0 z-[1] bg-[#1D1D1F] pointer-events-none transition-opacity duration-300"
            style={{ opacity: isHovered ? 0.18 : 0 }}
          />

          {/* Hover action bar — bottom of image */}
          <motion.div
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 6,
            }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2"
            style={{ pointerEvents: isHovered ? "auto" : "none" }}
          >
            {/* Quick Look */}
            {onQuickPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickPreview();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-colors"
                style={{ fontWeight: 600, fontSize: "12px", backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textPrimary }}
              >
                <Eye className="w-3.5 h-3.5" />
                Quick Look
              </button>
            )}

            {/* Quick actions — right */}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction("share");
                }}
                className="w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer"
                style={{ backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textTertiary }}
                title="Partilhar"
              >
                <Share2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction("duplicate");
                }}
                className="w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer"
                style={{ backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textTertiary }}
                title="Duplicar"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── Content area ── */}
        <div className="px-4 py-3.5 border-t" style={{ backgroundColor: dk.bg, borderColor: dk.hairline }}>
          <h3
            className="text-[15px] mb-0.5 tracking-[-0.01em] line-clamp-1"
            style={{ fontWeight: 600, color: dk.textPrimary }}
          >
            {nome}
          </h3>

          <div className="flex items-center gap-1.5 text-[12px] mb-2.5" style={{ fontWeight: 400, color: dk.textTertiary }}>
            <span>{cliente}</span>
            <span className="w-0.5 h-0.5 rounded-full" style={{ backgroundColor: dk.textDisabled }} />
            <span>{dataCriacao}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span
                className="text-[18px] tracking-[-0.02em]"
                style={{ fontWeight: 600, color: dk.textPrimary }}
              >
                {photoCount}
              </span>
              <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textTertiary }}>
                fotos
              </span>
            </div>
            {views > 0 && (
              <span className="text-[12px]" style={{ fontWeight: 400, color: dk.textTertiary }}>
                {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views} views
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}