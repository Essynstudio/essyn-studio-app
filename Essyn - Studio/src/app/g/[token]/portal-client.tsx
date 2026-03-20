"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Images,
  CheckCircle2,
} from "lucide-react";
import { usePortal } from "./portal-context";
import { springDefault, springContentIn, springModalIn, springOverlay } from "@/lib/motion-tokens";
import type { GalleryPhoto, GalleryFolder } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  photos: GalleryPhoto[];
  folders: GalleryFolder[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PHOTOS_PER_PAGE = 24;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/* ------------------------------------------------------------------ */
/*  Photo URL helper                                                   */
/* ------------------------------------------------------------------ */

function getPhotoUrl(photo: GalleryPhoto, studioId: string, galleryId: string): string {
  if (photo.file_url) return photo.file_url;
  if (photo.thumbnail_url) return photo.thumbnail_url;
  return `${SUPABASE_URL}/storage/v1/object/public/gallery-photos/${studioId}/${galleryId}/${photo.storage_path}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PortalGalleryClient({ photos, folders }: Props) {
  const portal = usePortal();
  const { branding, gallery, project, studio, client } = portal;

  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PHOTOS_PER_PAGE);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Load existing favorites/selections from DB on mount
  useEffect(() => {
    fetch(`/api/gallery/interact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "load_selections", token: portal.token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.favorites) setFavorites(new Set(data.favorites));
        if (data.selections) setSelections(data.selections);
      })
      .catch(() => {});
  }, [portal.token]);
  const observerRef = useRef<HTMLDivElement>(null);

  // Filtered photos by folder
  const filteredPhotos = useMemo(() => {
    if (!activeFolder) return photos;
    return photos.filter((p) => p.folder_id === activeFolder);
  }, [photos, activeFolder]);

  const visiblePhotos = filteredPhotos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPhotos.length;

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + PHOTOS_PER_PAGE);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, filteredPhotos.length]);

  // Reset visible count when folder changes
  useEffect(() => {
    setVisibleCount(PHOTOS_PER_PAGE);
  }, [activeFolder]);

  // Toggle favorite — persists to database via API
  const toggleFavorite = useCallback((photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
    // Fire-and-forget API call
    fetch("/api/gallery/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "favorite", token: portal.token, photoId }),
    }).catch(() => {});
  }, [portal.token]);

  // Download single photo — increments counter
  const downloadPhoto = useCallback(
    (photo: GalleryPhoto, e: React.MouseEvent) => {
      e.stopPropagation();
      const url = getPhotoUrl(photo, studio.id, gallery.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = photo.filename || "foto.jpg";
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Track download
      fetch("/api/gallery/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "download", token: portal.token }),
      }).catch(() => {});
    },
    [studio.id, gallery.id, portal.token]
  );

  // Lightbox navigation
  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1 < filteredPhotos.length ? prev + 1 : 0) : null
    );
  }, [filteredPhotos.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 >= 0 ? prev - 1 : filteredPhotos.length - 1) : null
    );
  }, [filteredPhotos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, closeLightbox, goNext, goPrev]);

  // Format event date
  const eventDateFormatted = project?.eventDate
    ? format(new Date(project.eventDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <>
      {/* ═══ Header ═══ */}
      <header
        className="sticky top-0 z-40 flex items-center gap-3 px-5 h-14"
        style={{ backgroundColor: branding.primaryColor, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
      >
        {branding.logoUrl && (
          <img
            src={branding.logoUrl}
            alt={studio.name}
            className="h-7 w-auto rounded-md object-contain"
          />
        )}
        <span className="text-[13px] font-semibold text-white tracking-[0.02em] uppercase">
          {studio.name}
        </span>
      </header>

      {/* ═══ Project Info ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springDefault}
        className="px-5 pt-6 pb-4"
      >
        {branding.welcomeMessage && (
          <p className="text-[13px] font-medium mb-3" style={{ color: branding.primaryColor }}>
            {branding.welcomeMessage}
          </p>
        )}
        <h1 className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.022em]">
          {project?.name || gallery.name}
        </h1>
        <p className="text-[13px] text-[var(--fg-muted)] mt-1">
          {eventDateFormatted && <span>{eventDateFormatted} · </span>}
          {gallery.photoCount} fotos
        </p>
      </motion.div>

      {/* ═══ Folder Filter ═══ */}
      {folders.length > 0 && (
        <div className="px-5 pb-4 flex gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveFolder(null)}
            className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={
              activeFolder === null
                ? { backgroundColor: branding.primaryColor, color: "#FFFFFF" }
                : { backgroundColor: "var(--bg-subtle)", color: "var(--fg-secondary)" }
            }
          >
            Todas
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={
                activeFolder === folder.id
                  ? { backgroundColor: branding.primaryColor, color: "#FFFFFF" }
                  : { backgroundColor: "var(--bg-subtle)", color: "var(--fg-secondary)" }
              }
            >
              {folder.name}
            </button>
          ))}
        </div>
      )}

      {/* ═══ Photo Grid ═══ */}
      {filteredPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <Images size={48} className="text-[var(--fg-muted)] mb-4 opacity-40" />
          <p className="text-[15px] font-semibold text-[var(--fg)] tracking-[-0.012em]">
            Nenhuma foto ainda
          </p>
          <p className="text-[13px] text-[var(--fg-muted)] mt-1">
            As fotos aparecerão aqui quando o fotógrafo publicar.
          </p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-0.5 px-0.5">
          {visiblePhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...springDefault, delay: Math.min(index * 0.03, 0.5) }}
              className="relative mb-0.5 break-inside-avoid group cursor-pointer overflow-hidden"
              onClick={() => openLightbox(index)}
            >
              <img
                src={getPhotoUrl(photo, studio.id, gallery.id)}
                alt={photo.filename || `Foto ${index + 1}`}
                loading="lazy"
                className="w-full block"
                style={{
                  aspectRatio: photo.width && photo.height ? `${photo.width}/${photo.height}` : "4/5",
                  objectFit: "cover",
                  backgroundColor: "var(--bg-subtle)",
                }}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-start justify-end p-2 gap-1.5 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => toggleFavorite(photo.id, e)}
                  className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-transform hover:scale-110"
                >
                  <Heart
                    size={14}
                    className={favorites.has(photo.id) ? "fill-[var(--error)] text-[var(--error)]" : "text-[var(--fg)]"}
                  />
                </button>
                {gallery.downloadEnabled && (
                  <button
                    onClick={(e) => downloadPhoto(photo, e)}
                    className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-transform hover:scale-110"
                  >
                    <Download size={14} className="text-[var(--fg)]" />
                  </button>
                )}
              </div>
              {/* Favorite indicator */}
              {favorites.has(photo.id) && (
                <div className="absolute top-2 left-2">
                  <Heart size={16} className="fill-[var(--error)] text-[var(--error)] drop-shadow" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={observerRef} className="flex justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-[var(--fg-muted)] animate-spin" />
        </div>
      )}

      {/* ═══ Footer ═══ */}
      <footer className="text-center py-6 pb-24">
        <p className="text-[11px] text-[var(--fg-muted)]">
          Galeria por {studio.name}
        </p>
        <a
          href="https://essyn.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          Feito com{" "}
          <span style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic" }}>
            essyn.
          </span>
        </a>
      </footer>

      {/* ═══ Bottom Bar ═══ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] px-5 py-3 flex items-center justify-between"
        style={{
          backgroundColor: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center gap-2">
          {gallery.downloadEnabled && (
            <button
              className="h-8 px-3 rounded-lg text-[11px] font-semibold text-white flex items-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Download size={13} />
              Baixar todas
            </button>
          )}
          {favorites.size > 0 && (
            <span className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1">
              <Heart size={11} className="fill-[var(--error)] text-[var(--error)]" />
              {favorites.size}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="px-3 py-2 text-[11px] font-medium border-b-2 transition-colors"
            style={{ color: branding.primaryColor, borderColor: branding.primaryColor }}
          >
            Galeria
          </button>
          {portal.role !== "viewer" && (
            <button className="px-3 py-2 text-[11px] font-medium text-[var(--fg-muted)] border-b-2 border-transparent hover:text-[var(--fg-secondary)] transition-colors">
              Seleção
            </button>
          )}
        </div>
      </div>

      {/* ═══ Lightbox ═══ */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
          <motion.div
            {...springOverlay}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            {/* Lightbox header */}
            <div
              className="flex items-center justify-between px-4 h-14 shrink-0"
              style={{
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(10px)",
              }}
            >
              <button onClick={closeLightbox} className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-white">
                <ChevronLeft size={24} />
              </button>
              <span className="text-[13px] text-white/80 tabular-nums">
                {lightboxIndex + 1} / {filteredPhotos.length}
              </span>
              <div className="flex items-center gap-1">
                {gallery.downloadEnabled && (
                  <button
                    onClick={(e) => downloadPhoto(filteredPhotos[lightboxIndex], e)}
                    className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-white"
                  >
                    <Download size={18} />
                  </button>
                )}
                <button
                  onClick={(e) => toggleFavorite(filteredPhotos[lightboxIndex].id, e)}
                  className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-white"
                >
                  <Heart
                    size={18}
                    className={favorites.has(filteredPhotos[lightboxIndex].id) ? "fill-[var(--error)] text-[var(--error)]" : ""}
                  />
                </button>
                <button onClick={closeLightbox} className="w-11 h-11 flex items-center justify-center text-white/80 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Lightbox image */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <motion.img
                key={filteredPhotos[lightboxIndex].id}
                {...springModalIn}
                src={getPhotoUrl(filteredPhotos[lightboxIndex], studio.id, gallery.id)}
                alt={filteredPhotos[lightboxIndex].filename || "Foto"}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />

              {/* Nav arrows */}
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            {/* Lightbox footer — selection quick actions (if selector role) */}
            {portal.role === "selector" && lightboxIndex !== null && (
              <div
                className="flex items-center justify-center gap-4 px-4 h-16 shrink-0"
                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)" }}
              >
                {(["aprovada", "rejeitada", "duvida"] as const).map((status) => {
                  const photoId = filteredPhotos[lightboxIndex]?.id;
                  const isActive = selections[photoId] === status;
                  const config = {
                    aprovada: { label: "Aprovar", icon: <CheckCircle2 size={16} />, color: "var(--success)" },
                    rejeitada: { label: "Rejeitar", icon: <X size={16} />, color: "var(--error)" },
                    duvida: { label: "Duvida", icon: <span className="text-[14px] font-bold">?</span>, color: "var(--warning)" },
                  }[status];
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        if (!photoId) return;
                        setSelections((prev) => ({ ...prev, [photoId]: status }));
                        fetch("/api/gallery/interact", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "select", token: portal.token, photoId, selection: status }),
                        }).catch(() => {});
                      }}
                      className="flex items-center gap-1.5 h-11 px-4 rounded-full text-[11px] font-medium transition-all"
                      style={{
                        backgroundColor: isActive ? config.color : `color-mix(in srgb, ${config.color} 20%, transparent)`,
                        color: isActive ? "#FFFFFF" : config.color,
                      }}
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
