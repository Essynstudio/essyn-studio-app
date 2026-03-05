import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import {
  Eye,
  Download,
  Heart,
  ExternalLink,
  Copy,
  Archive,
  Trash2,
  Lock,
  Globe,
  Users,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import type { V2GalleryStatus, V2GalleryPrivacy } from "./gallery-types";
import { useDk } from "../../lib/useDarkColors";

interface MasonryCollection {
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
}

interface MasonryViewProps {
  collections: MasonryCollection[];
  onOpenCollection: (id: string) => void;
  onQuickAction: (id: string, action: "share" | "duplicate" | "archive" | "delete") => void;
  onQuickPreview: (id: string) => void;
}

export function MasonryView({ collections, onOpenCollection, onQuickAction, onQuickPreview }: MasonryViewProps) {
  const [columns, setColumns] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsivo: ajusta número de colunas
  useEffect(() => {
    function handleResize() {
      const width = containerRef.current?.offsetWidth || 0;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else if (width < 1280) setColumns(3);
      else setColumns(4);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Distribui cards nas colunas (algoritmo balanceado)
  const columnArrays: MasonryCollection[][] = Array.from({ length: columns }, () => []);
  collections.forEach((col, index) => {
    columnArrays[index % columns].push(col);
  });

  return (
    <div ref={containerRef} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {columnArrays.map((columnCols, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-4">
          {columnCols.map((col, index) => (
            <MasonryCard
              key={col.id}
              {...col}
              index={index}
              onClick={() => onOpenCollection(col.id)}
              onQuickAction={(action) => onQuickAction(col.id, action)}
              onQuickPreview={() => onQuickPreview(col.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface MasonryCardProps extends MasonryCollection {
  index: number;
  onClick: () => void;
  onQuickAction: (action: "share" | "duplicate" | "archive" | "delete") => void;
  onQuickPreview: () => void;
}

function MasonryCard({
  nome,
  coverUrl,
  photoCount,
  status,
  privacy,
  views,
  downloads,
  favoritos,
  cliente,
  dataCriacao,
  index,
  onClick,
  onQuickAction,
  onQuickPreview,
}: MasonryCardProps) {
  const dk = useDk();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const statusConfig = {
    draft: { label: "Rascunho", color: "#D1D1D6", bg: "#F2F2F7" },
    proofing: { label: "Aprovação", color: "#FF9500", bg: "#FFF9F0" },
    final: { label: "Final", color: "#34C759", bg: "#F0FAF4" },
    delivered: { label: "Entregue", color: "#007AFF", bg: "#F2F2F7" },
  };

  const privacyConfig = {
    publico: { icon: Globe, color: "#34C759" },
    senha: { icon: Lock, color: "#FF9500" },
    privado: { icon: Users, color: "#8E8E93" },
    expira: { icon: Calendar, color: "#FF3B30" },
  };

  const currentStatus = statusConfig[status];
  const PrivacyIcon = privacyConfig[privacy].icon;

  // Altura aleatória para efeito masonry (varia entre aspecto 3:4 e 4:3)
  const aspectRatios = ["3/4", "1/1", "4/3", "16/9"];
  const randomAspect = aspectRatios[index % aspectRatios.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative break-inside-avoid"
    >
      <div
        className="relative rounded-2xl border overflow-hidden cursor-pointer transition-colors"
        style={{ borderColor: isHovered ? dk.border : dk.hairline }}
        onClick={onClick}
      >
        {/* Cover Image */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: randomAspect, backgroundColor: dk.bgMuted }}>
          {coverUrl ? (
            <>
              <img
                src={coverUrl}
                alt={nome}
                onLoad={() => setImageLoaded(true)}
                className="w-full h-full object-cover transition-all duration-500"
                style={{
                  transform: isHovered ? "scale(1.04)" : "scale(1)",
                  filter: imageLoaded ? "blur(0)" : "blur(10px)",
                }}
              />
              {/* Dark vignette on hover — CSS opacity (valid) */}
              <div
                className="absolute inset-0 bg-[#1D1D1F] pointer-events-none transition-opacity duration-300"
                style={{ opacity: isHovered ? 0.35 : 0 }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12" style={{ color: dk.textSubtle }} />
            </div>
          )}

          {/* Quick info overlay - sempre visível em masonry */}
          <div className="absolute inset-x-4 bottom-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isHovered ? 1 : 0.9, y: isHovered ? 0 : 5 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl p-3 border"
              style={{ backgroundColor: dk.bg, borderColor: dk.border, boxShadow: dk.shadowCard }}
            >
              <h3 className="text-[13px] mb-1 line-clamp-1 tracking-[-0.01em]" style={{ fontWeight: 600, color: dk.textPrimary }}>
                {nome}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px]" style={{ fontWeight: 500, color: dk.textTertiary }}>
                  {cliente}
                </span>
                <span style={{ color: dk.textDisabled }}>•</span>
                <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                  {dataCriacao}
                </span>
              </div>

              {/* Metrics inline */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <ImageIcon className="w-2.5 h-2.5" style={{ color: dk.textMuted }} />
                  <span className="text-[10px]" style={{ fontWeight: 600, color: dk.textTertiary }}>
                    {photoCount}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-2.5 h-2.5" style={{ color: dk.textMuted }} />
                  <span className="text-[10px]" style={{ fontWeight: 600, color: dk.textTertiary }}>
                    {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-2.5 h-2.5" style={{ color: dk.textMuted }} />
                  <span className="text-[10px]" style={{ fontWeight: 600, color: dk.textTertiary }}>
                    {downloads}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Status badge - canto superior esquerdo */}
          <div
            className="absolute top-3 left-3 px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: currentStatus.bg,
              border: `1px solid ${currentStatus.color}`,
            }}
          >
            <span
              className="text-[9px] uppercase tracking-[0.05em]"
              style={{ fontWeight: 700, color: currentStatus.color }}
            >
              {currentStatus.label}
            </span>
          </div>

          {/* Privacy icon - canto superior direito */}
          <div
            className="absolute top-3 right-3 w-6 h-6 rounded-full border flex items-center justify-center"
            style={{ backgroundColor: dk.bg, borderColor: dk.border }}
          >
            <PrivacyIcon className="w-3 h-3" style={{ color: privacyConfig[privacy].color }} />
          </div>

          {/* Quick Look button — center, on hover */}
          <motion.div
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            style={{ pointerEvents: isHovered ? "auto" : "none" }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickPreview();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border cursor-pointer transition-colors"
              style={{ fontWeight: 600, fontSize: "13px", backgroundColor: dk.bg, borderColor: dk.border, color: dk.textPrimary }}
            >
              <Eye className="w-3.5 h-3.5" />
              Quick Look
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}