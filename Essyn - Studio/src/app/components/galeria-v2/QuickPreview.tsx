import { motion, AnimatePresence } from "motion/react";
import { X, Download, Share2, ExternalLink, Image, Eye, Heart, Calendar, User } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { V2GalleryStatus, V2GalleryPrivacy } from "./gallery-types";
import { useDk } from "../../lib/useDarkColors";

interface QuickPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  collection: {
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
  };
  onOpen: () => void;
}

export function QuickPreview({ isOpen, onClose, collection, onOpen }: QuickPreviewProps) {
  const dk = useDk();
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) setImageLoaded(false);
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") {
        onOpen();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onOpen]);

  return (
    <AnimatePresence>
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#1D1D1F]"
            onClick={onClose}
          />

          {/* Preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{ backgroundColor: dk.bg, boxShadow: dk.shadowModal }}
          >
            {/* Cover image */}
            <div className="relative h-80 overflow-hidden" style={{ backgroundColor: dk.bgSub }}>
              {collection.coverUrl ? (
                <img
                  src={collection.coverUrl}
                  alt={collection.nome}
                  onLoad={() => setImageLoaded(true)}
                  className="w-full h-full object-cover transition-all duration-500"
                  style={{ filter: imageLoaded ? "blur(0)" : "blur(10px)" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-16 h-16 text-[#E5E5EA]" />
                </div>
              )}

              {/* Gradient overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#1D1D1F] via-transparent to-transparent"
                style={{ opacity: 0.6 }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer"
                style={{ backgroundColor: dk.bg, borderColor: dk.border }}
              >
                <X className="w-4 h-4" style={{ color: dk.textSecondary }} />
              </button>

              {/* Title overlay */}
              <div className="absolute inset-x-6 bottom-6">
                <h2 className="text-[24px] text-white mb-2 tracking-[-0.02em]" style={{ fontWeight: 700 }}>
                  {collection.nome}
                </h2>
                <div className="flex items-center gap-3 text-[#D4D0CB]">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-[12px]" style={{ fontWeight: 500 }}>
                      {collection.cliente}
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[12px]" style={{ fontWeight: 500 }}>
                      {collection.dataCriacao}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <StatBox
                  icon={<Image className="w-4 h-4" />}
                  label="Fotos"
                  value={collection.photoCount.toString()}
                  color="#007AFF"
                />
                <StatBox
                  icon={<Eye className="w-4 h-4" />}
                  label="Visualizações"
                  value={collection.views >= 1000 ? `${(collection.views / 1000).toFixed(1)}k` : collection.views.toString()}
                  color="#34C759"
                />
                <StatBox
                  icon={<Download className="w-4 h-4" />}
                  label="Downloads"
                  value={collection.downloads.toString()}
                  color="#34C759"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onOpen();
                    onClose();
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#007AFF] text-white text-[13px] flex items-center justify-center gap-2 hover:bg-[#0066D6] transition-all cursor-pointer"
                  style={{ fontWeight: 600 }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir galeria
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-3 rounded-xl border transition-all cursor-pointer"
                  style={{ backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}
                >
                  <Share2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-3 rounded-xl border transition-all cursor-pointer"
                  style={{ backgroundColor: dk.bg, borderColor: dk.border, color: dk.textSecondary }}
                >
                  <Heart className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Keyboard hint */}
              <div className="mt-4 flex items-center justify-center gap-4 text-[10px]" style={{ fontWeight: 500, color: dk.textMuted }}>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textSecondary }}>↵</kbd>
                  <span>Abrir</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ backgroundColor: dk.bgMuted, borderColor: dk.border, color: dk.textSecondary }}>ESC</kbd>
                  <span>Fechar</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </AnimatePresence>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const dk = useDk();
  return (
    <div className="p-3 rounded-xl border" style={{ backgroundColor: dk.bgSub, borderColor: dk.border }}>
      <div className="flex items-center gap-2 mb-1" style={{ color }}>
        {icon}
      </div>
      <div className="text-[18px] mb-0.5" style={{ fontWeight: 700, color: dk.textPrimary }}>
        {value}
      </div>
      <div className="text-[10px]" style={{ fontWeight: 500, color: dk.textMuted }}>
        {label}
      </div>
    </div>
  );
}