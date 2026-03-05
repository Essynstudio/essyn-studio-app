import { springDefault, springSnappy, springBounce } from "../lib/motion-tokens";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Images,
  KeyRound,
  Lock,
  X,
  Check,
  Send,
  Trash2,
  MessageSquare,
  Play,
  Pause,
  Download,
  Info,
  Share2,
  Maximize2,
  ShoppingBag,
  Plus,
  Minus,
  ShoppingCart,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";

/* ── Primitives ── */
import { GalleryMetricPill } from "../components/ui/gallery-metric-pill";
import { AppStoreProvider, useAppStore } from "../lib/appStore";

/* ═══════════════════════════════════════════════════ */
/*  ClientGalleryPage — MODO CLIENTE / CONVIDADO      */
/*                                                     */
/*  Rota: /galeria/cliente/:id                         */
/*  Experiência premium mobile-first + desktop         */
/*  Masonry de fotos reais, password gate, lightbox,   */
/*  favoritar/selecionar, painel de seleção, estados   */
/*  ready/locked/expired/empty                         */
/*  + Comentários por foto, slideshow, download dialog */
/*                                                     */
/*  CTA primário: SEMPRE preto. Spring transitions.    */
/* ═══════════════════════════════════════════════════ */

/* ── Spring presets ── */
const spring = springDefault;
const springStiff = springSnappy;

/* ── Types ── */
type ViewState = "locked" | "expired" | "empty" | "ready";
type GallerySet = { id: string; name: string; count: number };

interface MockPhoto {
  id: string;
  url: string;
  /** aspect ratio expressed as width/height */
  aspect: number;
  set: string;
}

interface PhotoComment {
  id: string;
  photoId: string;
  author: string;
  text: string;
  when: string;
  isPhotographer: boolean;
}

/* ── Mock collection data ── */
const COLLECTION = {
  nome: "Casamento Oliveira & Santos",
  client: "Ana Oliveira",
  fotografo: "ESSYN Studio",
  totalFotos: 20,
  privacy: "senha" as const,
  password: "1234",
  expiraEm: "15 Mar 2026",
  welcomeMsg: "Obrigado por nos escolher para eternizar este momento especial. Aproveite suas fotos!",
  sets: [
    { id: "all", name: "Todas", count: 20 },
    { id: "making-of", name: "Making Of", count: 5 },
    { id: "cerimonia", name: "Cerimônia", count: 6 },
    { id: "recepcao", name: "Recepção", count: 5 },
    { id: "pista", name: "Pista de Dança", count: 4 },
  ] as GallerySet[],
};

const MOCK_PHOTOS: MockPhoto[] = [
  { id: "p01", url: "https://images.unsplash.com/photo-1642630111276-821681d57568?w=600&h=800&fit=crop", aspect: 3 / 4, set: "making-of" },
  { id: "p02", url: "https://images.unsplash.com/photo-1627432329408-57ab6b57157e?w=600&h=400&fit=crop", aspect: 3 / 2, set: "making-of" },
  { id: "p03", url: "https://images.unsplash.com/photo-1769868800959-533a3f907d60?w=600&h=600&fit=crop", aspect: 1, set: "making-of" },
  { id: "p04", url: "https://images.unsplash.com/photo-1764380751140-79f44e409a46?w=600&h=800&fit=crop", aspect: 3 / 4, set: "making-of" },
  { id: "p05", url: "https://images.unsplash.com/photo-1766043373136-f2566b286edc?w=600&h=400&fit=crop", aspect: 3 / 2, set: "making-of" },
  { id: "p06", url: "https://images.unsplash.com/photo-1767986012138-4893f40932d5?w=600&h=800&fit=crop", aspect: 3 / 4, set: "cerimonia" },
  { id: "p07", url: "https://images.unsplash.com/photo-1588849538263-fbc2b7b8965f?w=600&h=400&fit=crop", aspect: 3 / 2, set: "cerimonia" },
  { id: "p08", url: "https://images.unsplash.com/photo-1762216444731-802dcf3da009?w=600&h=600&fit=crop", aspect: 1, set: "cerimonia" },
  { id: "p09", url: "https://images.unsplash.com/photo-1630326844982-9b35b01cfe59?w=600&h=800&fit=crop", aspect: 3 / 4, set: "cerimonia" },
  { id: "p10", url: "https://images.unsplash.com/photo-1722436394310-1af3e0c3aff6?w=600&h=400&fit=crop", aspect: 3 / 2, set: "cerimonia" },
  { id: "p11", url: "https://images.unsplash.com/photo-1769812343890-4e406a33cfbe?w=600&h=800&fit=crop", aspect: 3 / 4, set: "cerimonia" },
  { id: "p12", url: "https://images.unsplash.com/photo-1719223852076-6981754ebf76?w=600&h=400&fit=crop", aspect: 3 / 2, set: "recepcao" },
  { id: "p13", url: "https://images.unsplash.com/photo-1561940329-7382e6704231?w=600&h=600&fit=crop", aspect: 1, set: "recepcao" },
  { id: "p14", url: "https://images.unsplash.com/photo-1646075514021-398d0925d4a9?w=600&h=400&fit=crop", aspect: 3 / 2, set: "recepcao" },
  { id: "p15", url: "https://images.unsplash.com/photo-1761671612949-8c8bbda9b2bb?w=600&h=800&fit=crop", aspect: 3 / 4, set: "recepcao" },
  { id: "p16", url: "https://images.unsplash.com/photo-1766104804419-0f66016716de?w=600&h=400&fit=crop", aspect: 3 / 2, set: "recepcao" },
  { id: "p17", url: "https://images.unsplash.com/photo-1764269719300-7094d6c00533?w=600&h=800&fit=crop", aspect: 3 / 4, set: "pista" },
  { id: "p18", url: "https://images.unsplash.com/photo-1766113483422-7c871de23591?w=600&h=400&fit=crop", aspect: 3 / 2, set: "pista" },
  { id: "p19", url: "https://images.unsplash.com/photo-1473652502225-6b6af0664e32?w=600&h=600&fit=crop", aspect: 1, set: "pista" },
  { id: "p20", url: "https://images.unsplash.com/photo-1768333220670-c8f7fd39d2f7?w=600&h=400&fit=crop", aspect: 3 / 2, set: "pista" },
];

/* ── Mock comments ── */
const INITIAL_COMMENTS: PhotoComment[] = [
  { id: "c1", photoId: "p06", author: "Ana Oliveira", text: "Adorei esta foto! Pode aumentar o brilho?", when: "Hoje, 14:32", isPhotographer: false },
  { id: "c2", photoId: "p06", author: "ESSYN Studio", text: "Claro! Vou ajustar na versão final.", when: "Hoje, 15:10", isPhotographer: true },
  { id: "c3", photoId: "p09", author: "Ana Oliveira", text: "Esta ficou perfeita, obrigada!", when: "Ontem, 18:22", isPhotographer: false },
  { id: "c4", photoId: "p12", author: "Carlos Santos", text: "Pode recortar um pouco mais à esquerda?", when: "Ontem, 16:45", isPhotographer: false },
];

/* ═══════════════════════════════════════════════════ */
/*  PASSWORD GATE                                      */
/* ══════════════════════════════���════════════════════ */

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (pw === COLLECTION.password) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPw("");
      inputRef.current?.focus();
    }
  };

  return (
    <motion.div
      key="locked"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={spring}
      className="flex-1 flex items-center justify-center px-6"
    >
      <motion.div
        animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : {}}
        transition={springBounce}
        className="w-full max-w-[360px] flex flex-col items-center gap-8"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] flex items-center justify-center">
          <Lock className="w-6 h-6 text-[#D1D1D6]" />
        </div>

        {/* Copy */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2
            className="text-[18px] text-[#48484A] tracking-tight"
            style={{ fontWeight: 600 }}
          >
            Galeria protegida
          </h2>
          <p
            className="text-[13px] text-[#AEAEB2] max-w-[280px]"
            style={{ fontWeight: 400 }}
          >
            Insira a senha fornecida pelo fotógrafo para acessar as fotos.
          </p>
        </div>

        {/* Input */}
        <div className="w-full flex flex-col gap-3">
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D1D1D6]" />
            <input
              ref={inputRef}
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Senha de acesso"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-[14px] text-[#636366] placeholder:text-[#C7C7CC] focus:outline-none transition-all ${
                error
                  ? "border-[#FF3B30] focus:ring-2 focus:ring-[#F2F2F7]"
                  : "border-[#E5E5EA] focus:border-[#C7C7CC] focus:ring-2 focus:ring-[#F5F5F7]"
              }`}
              style={{ fontWeight: 400 }}
            />
          </div>
          {error && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="text-[12px] text-[#FF3B30] text-center"
              style={{ fontWeight: 400 }}
            >
              Senha incorreta. Tente novamente.
            </motion.span>
          )}
          <button
            onClick={handleSubmit}
            disabled={!pw.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0a0a0a] text-white text-[14px] hover:bg-[#1a1a1a] active:scale-[0.98] transition-all cursor-pointer shadow-[0_1px_3px_#D1D1D6] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontWeight: 500 }}
          >
            Acessar galeria
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  EXPIRED STATE                                      */
/* ═══════════════════════════════════════════════════ */

function ExpiredState() {
  return (
    <motion.div
      key="expired"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={spring}
      className="flex-1 flex items-center justify-center px-6"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F2F2F7] flex items-center justify-center">
          <Clock className="w-6 h-6 text-[#FF3B30]" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2
            className="text-[18px] text-[#48484A] tracking-tight"
            style={{ fontWeight: 600 }}
          >
            Galeria expirada
          </h2>
          <p
            className="text-[13px] text-[#AEAEB2] max-w-[300px]"
            style={{ fontWeight: 400 }}
          >
            O link de acesso a esta galeria expirou. Entre em contato com o
            fotógrafo para solicitar um novo acesso.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  EMPTY STATE                                        */
/* ═══════════════════════════════════════════════════ */

function EmptyState() {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={spring}
      className="flex-1 flex items-center justify-center px-6"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] flex items-center justify-center">
          <Images className="w-6 h-6 text-[#D1D1D6]" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2
            className="text-[18px] text-[#48484A] tracking-tight"
            style={{ fontWeight: 600 }}
          >
            Nenhuma foto disponível
          </h2>
          <p
            className="text-[13px] text-[#AEAEB2] max-w-[300px]"
            style={{ fontWeight: 400 }}
          >
            O fotógrafo ainda não adicionou fotos a esta coleção. Volte em
            breve.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  COMMENT PANEL (inside lightbox)                    */
/* ═══════════════════════════════════════════════════ */

function CommentPanel({
  photoId,
  comments,
  onAddComment,
  onClose,
}: {
  photoId: string;
  comments: PhotoComment[];
  onAddComment: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const photoComments = comments.filter((c) => c.photoId === photoId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [photoComments.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText("");
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={springStiff}
      className="absolute right-0 top-0 bottom-0 w-[320px] md:w-[360px] bg-[#1D1D1F] border-l border-[#3A3A3C] flex flex-col z-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3A3A3C]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#8E8E93]" />
          <span className="text-[13px] text-[#E5E5EA]" style={{ fontWeight: 600 }}>
            Comentários
          </span>
          {photoComments.length > 0 && (
            <span className="text-[10px] text-[#636366] bg-[#3A3A3C] px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
              {photoComments.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#636366] hover:text-[#AEAEB2] hover:bg-[#3A3A3C] transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {photoComments.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 text-[#3A3A3C] mx-auto mb-2" />
              <p className="text-[12px] text-[#636366]" style={{ fontWeight: 400 }}>
                Nenhum comentário nesta foto
              </p>
              <p className="text-[11px] text-[#48484A] mt-1" style={{ fontWeight: 400 }}>
                Escreva abaixo para iniciar
              </p>
            </div>
          </div>
        )}
        {photoComments.map((c) => (
          <div
            key={c.id}
            className={`flex flex-col gap-1 ${c.isPhotographer ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl ${
                c.isPhotographer
                  ? "bg-[#3A3A3C] rounded-br-md"
                  : "bg-[#2C2C2E] rounded-bl-md"
              }`}
            >
              <p className="text-[12px] text-[#E5E5EA]" style={{ fontWeight: 400 }}>
                {c.text}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[9px] text-[#636366]" style={{ fontWeight: 500 }}>
                {c.author}
              </span>
              <span className="text-[9px] text-[#48484A]" style={{ fontWeight: 400 }}>
                {c.when}
              </span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#3A3A3C]">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escreva um comentário..."
            className="flex-1 bg-[#2C2C2E] border border-[#3A3A3C] rounded-xl px-3 py-2 text-[13px] text-[#E5E5EA] placeholder:text-[#48484A] focus:outline-none focus:border-[#636366] transition-colors"
            style={{ fontWeight: 400 }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-8 h-8 rounded-xl bg-white text-[#1D1D1F] flex items-center justify-center cursor-pointer hover:bg-[#F2F2F7] active:scale-[0.95] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  DOWNLOAD DIALOG                                    */
/* ═══════════════════════════════════════════════════ */

function DownloadDialog({
  photoCount,
  onClose,
  onDownload,
}: {
  photoCount: number;
  onClose: () => void;
  onDownload: (quality: "web" | "alta") => void;
}) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        key="dl-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={spring}
        className="fixed inset-0 z-[9998] bg-[#1D1D1F]"
        onClick={onClose}
      />
      <motion.div
        key="dl-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={springStiff}
        className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[400px] bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
          <div className="flex items-center gap-2">
            <Download className="w-4.5 h-4.5 text-[#636366]" />
            <span className="text-[15px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
              Baixar fotos
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:bg-[#F2F2F7] transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Options */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
            {photoCount} foto{photoCount !== 1 ? "s" : ""} selecionada{photoCount !== 1 ? "s" : ""} para download
          </p>

          {/* Web quality */}
          <button
            onClick={() => onDownload("web")}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E5EA] hover:border-[#D1D1D6] hover:bg-[#FAFAFA] transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-[#636366]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Qualidade Web</p>
              <p className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                JPG otimizado · 2048px · ~{Math.round(photoCount * 1.2)}MB
              </p>
            </div>
          </button>

          {/* High quality */}
          <button
            onClick={() => onDownload("alta")}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E5EA] hover:border-[#D1D1D6] hover:bg-[#FAFAFA] transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
              <Maximize2 className="w-4 h-4 text-[#636366]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Alta resolução</p>
              <p className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                JPG full-res · impressão · ~{Math.round(photoCount * 4.5)}MB
              </p>
            </div>
          </button>
        </div>

        {/* Footer note */}
        <div className="px-5 pb-4">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F5F5F7]">
            <Info className="w-3.5 h-3.5 text-[#8E8E93] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
              O download será iniciado automaticamente. Para grandes quantidades, será gerado um arquivo ZIP.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  SHOP PANEL — Client-facing product store           */
/* ═══════════════════════════════════════════════════ */

interface ShopProduct {
  id: string;
  name: string;
  desc: string;
  sizes: { label: string; price: number }[];
  icon: React.ReactNode;
}

/** Price multipliers per size index — base price × multiplier */
const SIZE_MULTIPLIERS = [1, 1.5, 2.2, 3];

function catalogToShop(catalog: { id: string; name: string; desc: string; price: number; sizes: string[]; category: string; enabled: boolean }[]): ShopProduct[] {
  const iconMap: Record<string, React.ReactNode> = {
    "Digital": <Download className="w-5 h-5" />,
    "Álbuns": <Images className="w-5 h-5" />,
  };
  return catalog
    .filter((p) => p.enabled)
    .map((p) => ({
      id: p.id,
      name: p.name,
      desc: p.desc,
      icon: iconMap[p.category] || <Package className="w-5 h-5" />,
      sizes: p.sizes.map((s, i) => ({
        label: s,
        price: Math.round(p.price * (SIZE_MULTIPLIERS[i] ?? SIZE_MULTIPLIERS[SIZE_MULTIPLIERS.length - 1])),
      })),
    }));
}

interface CartItem {
  productId: string;
  productName: string;
  size: string;
  price: number;
  qty: number;
}

function ShopPanel({
  open,
  onClose,
  galleryId,
  clienteName,
  onOrderCreated,
  catalogProducts,
}: {
  open: boolean;
  onClose: () => void;
  galleryId: string;
  clienteName: string;
  onOrderCreated?: (items: CartItem[], total: number) => void;
  catalogProducts: ShopProduct[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeProduct, setActiveProduct] = useState<string | null>(null);

  const addToCart = (product: ShopProduct, sizeIdx: number) => {
    const size = product.sizes[sizeIdx];
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id && c.size === size.label);
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id && c.size === size.label
            ? { ...c, qty: c.qty + 1 }
            : c
        );
      }
      return [...prev, { productId: product.id, productName: product.name, size: size.label, price: size.price, qty: 1 }];
    });
    toast.success("Adicionado ao carrinho", { description: `${product.name} — ${size.label}` });
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId && c.size === size);
      if (existing && existing.qty > 1) {
        return prev.map((c) =>
          c.productId === productId && c.size === size
            ? { ...c, qty: c.qty - 1 }
            : c
        );
      }
      return prev.filter((c) => !(c.productId === productId && c.size === size));
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const handleCheckout = () => {
    if (onOrderCreated) {
      onOrderCreated(cart, cartTotal);
    }
    toast.success("Pedido enviado!", {
      description: `${cartCount} item${cartCount !== 1 ? "ns" : ""} · R$ ${cartTotal.toLocaleString("pt-BR")}. O fotógrafo irá contactá-lo para pagamento e entrega.`,
    });
    setCart([]);
    onClose();
  };

  const fmtPrice = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="shop-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={spring}
        className="fixed inset-0 z-[9998] bg-[#1D1D1F]"
        onClick={onClose}
      />
      <motion.div
        key="shop-panel"
        initial={{ opacity: 0, x: 320 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 320 }}
        transition={springStiff}
        className="fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-[420px] bg-white border-l border-[#F2F2F7] shadow-[0_8px_32px_#E5E5EA] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#1D1D1F]" />
            <h2 className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Loja</h2>
          </div>
          <div className="flex items-center gap-2">
            {cartCount > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-[#1D1D1F] text-white text-[10px] tabular-nums" style={{ fontWeight: 600 }}>
                {cartCount}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#AEAEB2] hover:text-[#636366] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3">
            <p className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>
              Escolha produtos para suas fotos favoritas. O fotógrafo receberá o pedido.
            </p>
          </div>

          {catalogProducts.map((prod, idx) => (
            <div key={prod.id}>
              {idx > 0 && <div className="mx-5 h-px bg-[#F2F2F7]" />}
              <button
                onClick={() => setActiveProduct(activeProduct === prod.id ? null : prod.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#636366] shrink-0">
                  {prod.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{prod.name}</p>
                  <p className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{prod.desc}</p>
                </div>
                <span className="text-[12px] text-[#8E8E93] shrink-0" style={{ fontWeight: 500 }}>
                  a partir de {fmtPrice(prod.sizes[0].price)}
                </span>
              </button>
              <AnimatePresence>
                {activeProduct === prod.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={spring}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-3 flex flex-wrap gap-2">
                      {prod.sizes.map((size, sIdx) => {
                        const inCart = cart.find((c) => c.productId === prod.id && c.size === size.label);
                        return (
                          <button
                            key={size.label}
                            onClick={() => addToCart(prod, sIdx)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] transition-all cursor-pointer ${
                              inCart
                                ? "border-[#007AFF] bg-[#F2F2F7] text-[#007AFF]"
                                : "border-[#E5E5EA] bg-white text-[#636366] hover:border-[#D1D1D6]"
                            }`}
                            style={{ fontWeight: 500 }}
                          >
                            <span>{size.label}</span>
                            <span className="text-[11px] tabular-nums" style={{ fontWeight: 600 }}>
                              {fmtPrice(size.price)}
                            </span>
                            {inCart && (
                              <span className="text-[9px] bg-[#007AFF] text-white px-1 rounded" style={{ fontWeight: 700 }}>
                                x{inCart.qty}
                              </span>
                            )}
                            <Plus className="w-3 h-3" />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Cart summary */}
        {cart.length > 0 && (
          <div className="border-t border-[#F2F2F7]">
            <div className="max-h-[180px] overflow-y-auto">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 px-5 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>
                      {item.productName} — {item.size}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => removeFromCart(item.productId, item.size)}
                      className="w-6 h-6 rounded-md border border-[#E5E5EA] flex items-center justify-center text-[#AEAEB2] hover:text-[#FF3B30] transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[12px] text-[#1D1D1F] tabular-nums w-5 text-center" style={{ fontWeight: 600 }}>{item.qty}</span>
                    <button
                      onClick={() => {
                        const prod = catalogProducts.find((p) => p.id === item.productId);
                        const sIdx = prod?.sizes.findIndex((s) => s.label === item.size) ?? 0;
                        if (prod) addToCart(prod, sIdx);
                      }}
                      className="w-6 h-6 rounded-md border border-[#E5E5EA] flex items-center justify-center text-[#AEAEB2] hover:text-[#007AFF] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[12px] text-[#1D1D1F] tabular-nums w-16 text-right" style={{ fontWeight: 500 }}>
                    {fmtPrice(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 flex items-center gap-3">
              <div className="flex-1">
                <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Total</span>
                <p className="text-[18px] text-[#1D1D1F] tabular-nums" style={{ fontWeight: 700 }}>{fmtPrice(cartTotal)}</p>
              </div>
              <button
                onClick={handleCheckout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a0a0a] text-white text-[13px] hover:bg-[#1a1a1a] active:scale-[0.98] transition-all cursor-pointer shadow-[0_1px_3px_#D1D1D6]"
                style={{ fontWeight: 500 }}
              >
                <ShoppingCart className="w-4 h-4" />
                Enviar Pedido
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════ */
/*  LIGHTBOX (enhanced with comments + slideshow)      */
/* ═══════════════════════════════════════════════════ */

function Lightbox({
  photos,
  currentIndex,
  isFav,
  isSel,
  comments,
  onClose,
  onNav,
  onToggleFav,
  onToggleSel,
  onAddComment,
}: {
  photos: MockPhoto[];
  currentIndex: number;
  isFav: boolean;
  isSel: boolean;
  comments: PhotoComment[];
  onClose: () => void;
  onNav: (dir: -1 | 1) => void;
  onToggleFav: () => void;
  onToggleSel: () => void;
  onAddComment: (photoId: string, text: string) => void;
}) {
  const photo = photos[currentIndex];
  const [showComments, setShowComments] = useState(false);
  const [slideshow, setSlideshow] = useState(false);
  const slideshowRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const photoCommentCount = comments.filter((c) => c.photoId === photo.id).length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showComments) setShowComments(false);
        else onClose();
      }
      if (e.key === "ArrowLeft") onNav(-1);
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "f") onToggleFav();
      if (e.key === "s") onToggleSel();
      if (e.key === "c") setShowComments((p) => !p);
      if (e.key === " ") { e.preventDefault(); setSlideshow((p) => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNav, onToggleFav, onToggleSel, showComments]);

  /* Slideshow timer */
  useEffect(() => {
    if (slideshow) {
      slideshowRef.current = setInterval(() => {
        onNav(1);
      }, 3000);
    } else {
      if (slideshowRef.current) clearInterval(slideshowRef.current);
    }
    return () => {
      if (slideshowRef.current) clearInterval(slideshowRef.current);
    };
  }, [slideshow, onNav]);

  /* Stop slideshow at end */
  useEffect(() => {
    if (currentIndex >= photos.length - 1 && slideshow) {
      setSlideshow(false);
    }
  }, [currentIndex, photos.length, slideshow]);

  return (
    <>
      <motion.div
        key="lightbox-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.95 }}
        exit={{ opacity: 0 }}
        transition={spring}
        className="fixed inset-0 z-[80] bg-[#111111]"
        onClick={onClose}
      />
      <motion.div
        key="lightbox-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={springStiff}
        className="fixed inset-0 z-[81] flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="text-[13px] text-[#636366] tabular-nums"
              style={{ fontWeight: 400 }}
            >
              {currentIndex + 1} / {photos.length}
            </span>
            {/* Slideshow progress */}
            {slideshow && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                <span className="text-[10px] text-[#636366]" style={{ fontWeight: 500 }}>
                  Slideshow
                </span>
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Slideshow */}
            <button
              onClick={() => setSlideshow(!slideshow)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                slideshow
                  ? "bg-[#3A3A3C] text-[#34C759]"
                  : "bg-[#1D1D1D] text-[#636366] hover:text-[#AEAEB2] hover:bg-[#3A3A3C]"
              }`}
              title={slideshow ? "Pausar slideshow" : "Iniciar slideshow"}
            >
              {slideshow ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            {/* Comment */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                showComments
                  ? "bg-[#3A3A3C] text-white"
                  : "bg-[#1D1D1D] text-[#636366] hover:text-[#AEAEB2] hover:bg-[#3A3A3C]"
              }`}
              title="Comentários"
            >
              <MessageSquare className="w-4 h-4" />
              {photoCommentCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[8px] flex items-center justify-center" style={{ fontWeight: 700 }}>
                  {photoCommentCount}
                </span>
              )}
            </button>
            {/* Fav */}
            <button
              onClick={onToggleFav}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isFav
                  ? "bg-[#3A3A3C] text-[#FF3B30]"
                  : "bg-[#1D1D1D] text-[#636366] hover:text-[#AEAEB2] hover:bg-[#3A3A3C]"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${isFav ? "fill-current" : ""}`}
              />
            </button>
            {/* Sel */}
            <button
              onClick={onToggleSel}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isSel
                  ? "bg-[#0a0a0a] text-white"
                  : "bg-[#1D1D1D] text-[#636366] hover:text-[#AEAEB2] hover:bg-[#3A3A3C]"
              }`}
            >
              <Check className="w-4 h-4" />
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#1D1D1D] text-[#636366] hover:text-[#AEAEB2] hover:bg-[#3A3A3C] flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image + optional comments panel */}
        <div className="flex-1 flex relative overflow-hidden">
          <div className={`flex-1 flex items-center justify-center px-4 pb-4 relative transition-all ${showComments ? "pr-[320px] md:pr-[360px]" : ""}`}>
            {/* Nav: prev */}
            {currentIndex > 0 && (
              <button
                onClick={() => onNav(-1)}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#1D1D1D] text-[#636366] hover:text-[#AEAEB2] hover:bg-[#3A3A3C] flex items-center justify-center transition-all cursor-pointer z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {/* Nav: next */}
            {currentIndex < photos.length - 1 && (
              <button
                onClick={() => onNav(1)}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#1D1D1D] text-[#636366] hover:text-[#AEAEB2] hover:bg-[#3A3A3C] flex items-center justify-center transition-all cursor-pointer z-10"
                style={showComments ? { right: "340px" } : undefined}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <AnimatePresence mode="wait">
              <motion.img
                key={photo.id}
                src={photo.url.replace("w=600", "w=1200").replace("h=800", "h=1600").replace("h=400", "h=800").replace("h=600", "h=1200")}
                alt={`Foto ${currentIndex + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={springSnappy}
                className="max-w-full max-h-full object-contain rounded-lg select-none"
                draggable={false}
              />
            </AnimatePresence>
          </div>

          {/* Comments panel */}
          <AnimatePresence>
            {showComments && (
              <CommentPanel
                photoId={photo.id}
                comments={comments}
                onAddComment={(text) => onAddComment(photo.id, text)}
                onClose={() => setShowComments(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom info bar */}
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-3 text-[10px] text-[#48484A]" style={{ fontWeight: 400 }}>
            <span>← → Navegar</span>
            <span className="text-[#3A3A3C]">·</span>
            <span>F Favoritar</span>
            <span className="text-[#3A3A3C]">·</span>
            <span>S Selecionar</span>
            <span className="text-[#3A3A3C]">·</span>
            <span>C Comentar</span>
            <span className="text-[#3A3A3C]">·</span>
            <span>Espaço Slideshow</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  SELECTION PANEL (bottom sheet)                     */
/* ═══════════════════════════════════════════════════ */

function SelectionPanel({
  favs,
  selected,
  photos,
  onRemoveSel,
  onClearAll,
  onSend,
}: {
  favs: Set<string>;
  selected: Set<string>;
  photos: MockPhoto[];
  onRemoveSel: (id: string) => void;
  onClearAll: () => void;
  onSend: () => void;
}) {
  const selPhotos = photos.filter((p) => selected.has(p.id));

  return (
    <motion.div
      key="selection-panel"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={springStiff}
      className="fixed bottom-0 left-0 right-0 z-[50] bg-white border-t border-[#E5E5EA] shadow-[0_-8px_32px_#E5E5EA] rounded-t-2xl max-h-[45vh] flex flex-col"
    >
      {/* Handle */}
      <div className="flex justify-center py-2">
        <div className="w-8 h-1 rounded-full bg-[#E5E5EA]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[14px] text-[#48484A]"
            style={{ fontWeight: 600 }}
          >
            Seleção do cliente
          </span>
          <span
            className="text-[11px] text-[#AEAEB2]"
            style={{ fontWeight: 400 }}
          >
            {selected.size} foto{selected.size !== 1 ? "s" : ""} selecionada
            {selected.size !== 1 ? "s" : ""} · {favs.size} favorita
            {favs.size !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="text-[11px] text-[#AEAEB2] hover:text-[#8E8E93] transition-colors cursor-pointer underline underline-offset-2"
          style={{ fontWeight: 400 }}
        >
          Limpar tudo
        </button>
      </div>

      {/* Photo strip */}
      <div className="flex-1 overflow-y-auto px-5 pb-3">
        <div className="flex gap-2 flex-wrap">
          {selPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#E5E5EA] shrink-0 group/sel"
            >
              <img
                src={photo.url.replace("w=600", "w=120").replace(/h=\d+/, "h=120")}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onRemoveSel(photo.id)}
                className="absolute inset-0 bg-transparent group-hover/sel:bg-[#111111] flex items-center justify-center transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-white opacity-0 group-hover/sel:opacity-100 transition-opacity" />
              </button>
              {favs.has(photo.id) && (
                <Heart className="absolute top-1 right-1 w-2.5 h-2.5 text-[#FF3B30] fill-current" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 py-3 border-t border-[#f5f5f7]">
        <button
          onClick={onSend}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a0a0a] text-white text-[13px] hover:bg-[#1a1a1a] active:scale-[0.98] transition-all cursor-pointer shadow-[0_1px_3px_#D1D1D6]"
          style={{ fontWeight: 500 }}
        >
          <Send className="w-3.5 h-3.5" />
          Enviar seleção ao fotógrafo
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  PHOTO CARD                                         */
/* ═══════════════════════════════════════════════════ */

function PhotoCard({
  photo,
  index,
  isFav,
  isSel,
  commentCount,
  onToggleFav,
  onToggleSel,
  onClick,
}: {
  photo: MockPhoto;
  index: number;
  isFav: boolean;
  isSel: boolean;
  commentCount: number;
  onToggleFav: () => void;
  onToggleSel: () => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: Math.min(index * 0.03, 0.4) }}
      className={`relative rounded-xl overflow-hidden bg-[#E5E5EA] group/photo cursor-pointer border-2 transition-all ${
        isSel
          ? "border-[#AEAEB2] shadow-[0_0_0_1px_#C7C7CC]"
          : "border-transparent hover:border-[#E5E5EA]"
      }`}
      onClick={onClick}
    >
      <img
        src={photo.url}
        alt={`Foto ${index + 1}`}
        className="w-full block"
        style={{ aspectRatio: photo.aspect }}
        loading="lazy"
      />

      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent opacity-0 group-hover/photo:opacity-20 transition-opacity pointer-events-none" />

      {/* Fav button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav();
        }}
        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          isFav
            ? "bg-white text-[#FF3B30] shadow-[0_2px_8px_#D1D1D6]"
            : "bg-[#E5E5EA] text-[#C7C7CC] opacity-0 group-hover/photo:opacity-100 hover:text-[#FF3B30] shadow-[0_1px_4px_#E5E5EA]"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
      </button>

      {/* Select checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSel();
        }}
        className={`absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
          isSel
            ? "bg-[#0a0a0a] text-white shadow-[0_2px_8px_#D1D1D6]"
            : "bg-[#E5E5EA] border border-[#E5E5EA] text-transparent opacity-0 group-hover/photo:opacity-100 shadow-[0_1px_4px_#E5E5EA]"
        }`}
      >
        {isSel && (
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        )}
      </button>

      {/* Comment indicator */}
      {commentCount > 0 && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1D1D1F] text-white">
          <MessageSquare className="w-2.5 h-2.5" />
          <span className="text-[8px]" style={{ fontWeight: 600 }}>{commentCount}</span>
        </div>
      )}

      {/* Number label */}
      <span
        className="absolute bottom-2 right-2 text-[10px] text-[#636366] tabular-nums opacity-0 group-hover/photo:opacity-100 transition-opacity pointer-events-none"
        style={{ fontWeight: 500 }}
      >
        #{index + 1}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  WELCOME BANNER                                     */
/* ═══════════════════════════════════════════════════ */

function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={spring}
      className="max-w-[1200px] w-full mx-auto px-4 md:px-6 pt-4"
    >
      <div className="relative bg-white rounded-2xl border border-[#F2F2F7] p-5 shadow-[0_1px_3px_#F2F2F7]">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-[#AEAEB2]" />
          </div>
          <div>
            <p className="text-[14px] text-[#1D1D1F] mb-1" style={{ fontWeight: 600 }}>
              Bem-vindo à sua galeria
            </p>
            <p className="text-[12px] text-[#8E8E93] max-w-[480px]" style={{ fontWeight: 400 }}>
              {COLLECTION.welcomeMsg}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                <Heart className="w-3 h-3" /> Favoritar
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                <Check className="w-3 h-3" /> Selecionar
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                <MessageSquare className="w-3 h-3" /> Comentar
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                <Download className="w-3 h-3" /> Baixar
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN — ClientGalleryPage                          */
/* ═══════════════════════════════════════════════════ */

export function ClientGalleryPage() {
  return (
    <AppStoreProvider>
      <ClientGalleryPageInner />
    </AppStoreProvider>
  );
}

function ClientGalleryPageInner() {
  const navigate = useNavigate();
  const { id: _collectionId } = useParams();
  const { createOrder, addNotification, catalog } = useAppStore();
  const shopProducts = useMemo(() => catalogToShop(catalog), [catalog]);
  const [viewState, setViewState] = useState<ViewState>(
    COLLECTION.privacy === "senha" ? "locked" : "ready"
  );

  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeSet, setActiveSet] = useState("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [comments, setComments] = useState<PhotoComment[]>(INITIAL_COMMENTS);
  const [showDownload, setShowDownload] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showShop, setShowShop] = useState(false);

  /* ── Filtered photos ── */
  const filtered =
    activeSet === "all"
      ? MOCK_PHOTOS
      : MOCK_PHOTOS.filter((p) => p.set === activeSet);

  /* ── Comment counts per photo ── */
  const commentCounts = MOCK_PHOTOS.reduce<Record<string, number>>((acc, p) => {
    acc[p.id] = comments.filter((c) => c.photoId === p.id).length;
    return acc;
  }, {});

  /* ── Handlers ── */
  const toggleFav = useCallback((pid: string) => {
    setFavs((prev) => {
      const n = new Set(prev);
      if (n.has(pid)) n.delete(pid);
      else n.add(pid);
      return n;
    });
  }, []);

  const toggleSelect = useCallback((pid: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(pid)) n.delete(pid);
      else n.add(pid);
      return n;
    });
  }, []);

  const handleUnlock = useCallback(() => {
    setViewState("ready");
  }, []);

  const handleSendSelection = useCallback(() => {
    toast.success("Seleção enviada!", {
      description: `${selected.size} foto${selected.size !== 1 ? "s" : ""} enviada${selected.size !== 1 ? "s" : ""} ao fotógrafo`,
    });
    setShowPanel(false);
  }, [selected.size]);

  const handleLightboxNav = useCallback(
    (dir: -1 | 1) => {
      setLightboxIdx((prev) => {
        if (prev === null) return null;
        const next = prev + dir;
        if (next < 0 || next >= filtered.length) return prev;
        return next;
      });
    },
    [filtered.length]
  );

  const handleAddComment = useCallback((photoId: string, text: string) => {
    const newComment: PhotoComment = {
      id: `c${Date.now()}`,
      photoId,
      author: "Você",
      text,
      when: "Agora",
      isPhotographer: false,
    };
    setComments((prev) => [...prev, newComment]);
    toast.success("Comentário enviado");
  }, []);

  const handleDownload = useCallback((quality: "web" | "alta") => {
    const count = selected.size > 0 ? selected.size : filtered.length;
    toast.success("Download iniciado", {
      description: `${count} foto${count !== 1 ? "s" : ""} em qualidade ${quality === "web" ? "web" : "alta resolução"}`,
    });
    setShowDownload(false);
  }, [selected.size, filtered.length]);

  /* ── Auto-show panel when selections exist ── */
  useEffect(() => {
    if (selected.size > 0 && !showPanel) setShowPanel(true);
    if (selected.size === 0 && showPanel) setShowPanel(false);
  }, [selected.size]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Dev state switcher (only visible to photographer) ── */
  const devSwitcher = (
    <div className="flex items-center gap-1 bg-[#f5f5f7] rounded-xl p-0.5">
      {(["locked", "expired", "empty", "ready"] as ViewState[]).map((s) => (
        <button
          key={s}
          onClick={() => setViewState(s)}
          className={`px-2 py-1 rounded-lg text-[9px] uppercase tracking-[0.06em] transition-all cursor-pointer ${
            viewState === s
              ? "bg-white text-[#636366] shadow-[0_1px_3px_#F2F2F7]"
              : "text-[#C7C7CC] hover:text-[#AEAEB2]"
          }`}
          style={{ fontWeight: 500 }}
        >
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#fafafa] flex flex-col"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#F2F2F7]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back — discrete, for photographer */}
            <button
              onClick={() => navigate("/galeria")}
              className="w-8 h-8 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#C7C7CC] hover:text-[#8E8E93] hover:border-[#D1D1D6] transition-all cursor-pointer shadow-[0_1px_2px_#F5F5F7] shrink-0"
              title="Voltar ao painel"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex flex-col gap-0 min-w-0">
              <span
                className="text-[14px] md:text-[15px] text-[#48484A] tracking-tight truncate"
                style={{ fontWeight: 600 }}
              >
                {COLLECTION.nome}
              </span>
              <span
                className="text-[10px] md:text-[11px] text-[#C7C7CC] truncate"
                style={{ fontWeight: 400 }}
              >
                por {COLLECTION.fotografo} · {COLLECTION.totalFotos} fotos
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowShop(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1D1D1F] text-white text-[12px] hover:bg-[#3A3A3C] transition-all cursor-pointer shadow-[0_1px_3px_#D1D1D6]"
              style={{ fontWeight: 500 }}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Loja
            </button>
            {devSwitcher}
          </div>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {viewState === "locked" && (
          <PasswordGate key="locked" onUnlock={handleUnlock} />
        )}

        {viewState === "expired" && <ExpiredState key="expired" />}

        {viewState === "empty" && <EmptyState key="empty" />}

        {viewState === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className="flex-1 flex flex-col"
          >
            {/* ── Welcome banner ── */}
            <AnimatePresence>
              {showWelcome && (
                <WelcomeBanner onDismiss={() => setShowWelcome(false)} />
              )}
            </AnimatePresence>

            {/* ── Toolbar area ── */}
            <div className="sticky top-[57px] z-20 bg-[#fafafa] border-b border-[#FAFAFA]">
              <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
                {/* Set chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {COLLECTION.sets.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSet(s.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer ${
                        activeSet === s.id
                          ? "bg-[#0a0a0a] text-white shadow-[0_1px_3px_#D1D1D6]"
                          : "bg-white border border-[#E5E5EA] text-[#AEAEB2] hover:text-[#636366] hover:border-[#D1D1D6]"
                      }`}
                      style={{ fontWeight: 500 }}
                    >
                      {s.name}
                      <span
                        className={`text-[10px] tabular-nums ${
                          activeSet === s.id ? "text-[#8E8E93]" : "text-[#C7C7CC]"
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {s.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Actions (desktop) */}
                <div className="hidden md:flex items-center gap-2">
                  {/* Download button */}
                  <button
                    onClick={() => setShowDownload(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E5EA] text-[12px] text-[#636366] hover:bg-[#FAFAFA] hover:border-[#D1D1D6] transition-all cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar{selected.size > 0 ? ` (${selected.size})` : ""}
                  </button>
                  {/* Share */}
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success("Link copiado!");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E5EA] text-[12px] text-[#636366] hover:bg-[#FAFAFA] hover:border-[#D1D1D6] transition-all cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Partilhar
                  </button>
                  <div className="hidden lg:flex items-center gap-1.5 ml-1">
                    <GalleryMetricPill metric="favoritos" value={favs.size} size="xs" />
                    <GalleryMetricPill metric="selecoes" value={selected.size} size="xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Photo grid ── */}
            <main className="flex-1 max-w-[1200px] w-full mx-auto px-3 md:px-6 py-4 md:py-6">
              <ResponsiveMasonry
                columnsCountBreakPoints={{ 350: 2, 640: 3, 1024: 4 }}
              >
                <Masonry gutter="10px">
                  {filtered.map((photo, i) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      index={i}
                      isFav={favs.has(photo.id)}
                      isSel={selected.has(photo.id)}
                      commentCount={commentCounts[photo.id] || 0}
                      onToggleFav={() => toggleFav(photo.id)}
                      onToggleSel={() => toggleSelect(photo.id)}
                      onClick={() => setLightboxIdx(i)}
                    />
                  ))}
                </Masonry>
              </ResponsiveMasonry>

              {/* Footer count */}
              <div className="flex items-center justify-center py-8">
                <span
                  className="text-[11px] text-[#C7C7CC]"
                  style={{ fontWeight: 400 }}
                >
                  {filtered.length} foto{filtered.length !== 1 ? "s" : ""} ·{" "}
                  {COLLECTION.nome}
                </span>
              </div>
            </main>

            {/* ── Mobile bottom toolbar ── */}
            <div className="md:hidden sticky bottom-0 z-20 bg-white border-t border-[#F2F2F7] px-4 py-2 safe-area-bottom">
              <div className="flex items-center justify-around">
                <button
                  onClick={() => {
                    if (favs.size > 0)
                      toast.info(`${favs.size} favorita${favs.size !== 1 ? "s" : ""}`);
                  }}
                  className="flex flex-col items-center gap-0.5 py-1 px-3 cursor-pointer"
                >
                  <Heart className={`w-5 h-5 ${favs.size > 0 ? "text-[#FF3B30] fill-[#FF3B30]" : "text-[#AEAEB2]"}`} />
                  <span className="text-[9px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>
                    {favs.size > 0 ? favs.size : "Favoritar"}
                  </span>
                </button>
                <button
                  onClick={() => setShowPanel(!showPanel)}
                  className="flex flex-col items-center gap-0.5 py-1 px-3 cursor-pointer"
                >
                  <Check className={`w-5 h-5 ${selected.size > 0 ? "text-[#1D1D1F]" : "text-[#AEAEB2]"}`} />
                  <span className="text-[9px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>
                    {selected.size > 0 ? selected.size : "Selecionar"}
                  </span>
                </button>
                <button
                  onClick={() => setShowDownload(true)}
                  className="flex flex-col items-center gap-0.5 py-1 px-3 cursor-pointer"
                >
                  <Download className="w-5 h-5 text-[#AEAEB2]" />
                  <span className="text-[9px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Baixar</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    toast.success("Link copiado!");
                  }}
                  className="flex flex-col items-center gap-0.5 py-1 px-3 cursor-pointer"
                >
                  <Share2 className="w-5 h-5 text-[#AEAEB2]" />
                  <span className="text-[9px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Partilhar</span>
                </button>
                <button
                  onClick={() => setShowShop(true)}
                  className="flex flex-col items-center gap-0.5 py-1 px-3 cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5 text-[#AEAEB2]" />
                  <span className="text-[9px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Loja</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ LIGHTBOX ═══ */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            photos={filtered}
            currentIndex={lightboxIdx}
            isFav={favs.has(filtered[lightboxIdx]?.id)}
            isSel={selected.has(filtered[lightboxIdx]?.id)}
            comments={comments}
            onClose={() => setLightboxIdx(null)}
            onNav={handleLightboxNav}
            onToggleFav={() => toggleFav(filtered[lightboxIdx]?.id)}
            onToggleSel={() => toggleSelect(filtered[lightboxIdx]?.id)}
            onAddComment={handleAddComment}
          />
        )}
      </AnimatePresence>

      {/* ═══ SELECTION PANEL ═══ */}
      <AnimatePresence>
        {showPanel && selected.size > 0 && lightboxIdx === null && (
          <SelectionPanel
            favs={favs}
            selected={selected}
            photos={MOCK_PHOTOS}
            onRemoveSel={(id) => toggleSelect(id)}
            onClearAll={() => setSelected(new Set())}
            onSend={handleSendSelection}
          />
        )}
      </AnimatePresence>

      {/* ═══ DOWNLOAD DIALOG ═══ */}
      {showDownload && (
        <DownloadDialog
          photoCount={selected.size > 0 ? selected.size : filtered.length}
          onClose={() => setShowDownload(false)}
          onDownload={handleDownload}
        />
      )}

      {/* ═══ SHOP PANEL ═══ */}
      <ShopPanel
        open={showShop}
        onClose={() => setShowShop(false)}
        galleryId="g1"
        clienteName={COLLECTION.client}
        catalogProducts={shopProducts}
        onOrderCreated={(items, total) => {
          const order = createOrder({
            galleryId: "g1",
            cliente: COLLECTION.client,
            items: items.map((ci) => ({
              photoId: `ph-${ci.productId}`,
              product: ci.productName,
              size: ci.size,
              qty: ci.qty,
              price: ci.price,
            })),
            total,
            status: "pendente",
          });
          addNotification({
            type: "order_received",
            title: "Novo pedido recebido",
            description: `${COLLECTION.client} fez um pedido de ${items.length} item${items.length !== 1 ? "ns" : ""} · R$ ${total.toLocaleString("pt-BR")}`,
            timestamp: new Date().toISOString(),
            read: false,
            route: "/pedidos",
          });
        }}
      />
    </div>
  );
}
