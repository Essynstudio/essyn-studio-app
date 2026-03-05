// GalleryShowcase v4 — "Quatro Atos" — ESSYN Monochrome Canvas
// Zero floating cards. Zero generic SaaS badges. Zero pill tabs.
// Each feature is shown AS THE PRODUCT — integrated UI inside the gallery mockup.
// Navigation: editorial serif text with accent underline.
// Layout: two-column editorial (text left, product right) on desktop.
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import gsap from "gsap";
import { Heart, Download, MessageCircle, Share2, Check } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { GR, SERIF, GOLD, INK, ACCENT } from "../ui/editorial";

/* ── Photos ── */
const IMG = {
  hero: "https://images.unsplash.com/photo-1700139004825-69f01927d62e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  bride: "https://images.unsplash.com/photo-1678977942600-31161eb22f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  dance: "https://images.unsplash.com/photo-1768611873658-5f041a413341?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  rings: "https://images.unsplash.com/photo-1691258822038-341c84800e95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  kiss: "https://images.unsplash.com/photo-1761211488173-a7154314420a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  baby: "https://images.unsplash.com/photo-1675174131277-04ef8f339dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ── The four acts ── */
const acts = [
  {
    id: "compartilhar",
    num: "I",
    title: "Compartilhar",
    headline: "Um link.\nToda a experiência.",
    body: "Galerias com a identidade do seu estúdio — protegidas por senha, responsivas em qualquer tela. Seu cliente abre e já está imerso no seu trabalho.",
  },
  {
    id: "entrega",
    num: "II",
    title: "Entrega digital",
    headline: "Download sem\nfricção.",
    body: "Alta resolução, web ou RAW. Seu cliente escolhe o formato e salva direto — no dispositivo, Google Photos ou Dropbox. Zero e-mails com WeTransfer.",
  },
  {
    id: "selecao",
    num: "III",
    title: "Seleção",
    headline: "O cliente\nescolhe.",
    body: "Favoritar, comentar, aprovar — tudo dentro da galeria. Você recebe a seleção pronta, sem printscreens no WhatsApp.",
  },
  {
    id: "prints",
    num: "IV",
    title: "Loja de prints",
    headline: "Venda direto\nda galeria.",
    body: "Fine art, canvas, álbuns — com preços que você define. Seu cliente compra na sua loja, com a sua marca. Zero intermediários.",
  },
] as const;

type ActId = (typeof acts)[number]["id"];

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function GalleryShowcase() {
  const [activeAct, setActiveAct] = useState<ActId>("compartilhar");
  const containerRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const current = acts.find((a) => a.id === activeAct)!;

  /* ── Scroll parallax ── */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const showcaseY = useTransform(scrollYProgress, [0, 1], [20, -8]);

  /* ── GSAP entrance ── */
  useEffect(() => {
    if (!showcaseRef.current) return;
    gsap.set(showcaseRef.current, { y: 50, opacity: 0 });
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;
        obs.disconnect();
        gsap.to(showcaseRef.current, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
      },
      { threshold: 0.08 },
    );
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {/* ── Section header — editorial ── */}
      <GR className="mb-16 sm:mb-20">
        <div data-g className="max-w-[700px]">
          <span
            className="text-[11px] tracking-[0.18em] uppercase mb-5 block text-[#C9BFB6]"
            style={{ fontWeight: 600 }}
          >
            A galeria
          </span>
          <h2
            className="text-[clamp(32px,5vw,58px)] tracking-[-0.04em] text-[#111111]"
            style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.06 }}
          >
            Onde a fotografia<br />
            <span className="italic text-[#CEC5BD]">encontra o cliente.</span>
          </h2>
        </div>
      </GR>

      {/* ── Two-column editorial layout ── */}
      <motion.div
        ref={showcaseRef}
        className="grid lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr] gap-12 lg:gap-16 xl:gap-20 items-start"
        style={{ y: showcaseY }}
      >
        {/* ════ LEFT — Navigation + dynamic text ════ */}
        <div className="lg:sticky lg:top-32">
          {/* Act navigation — editorial serif list */}
          <nav className="flex flex-row lg:flex-col gap-0 mb-8 lg:mb-0 overflow-x-auto lg:overflow-visible scrollbar-none">
            {acts.map((act) => {
              const isActive = activeAct === act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => setActiveAct(act.id)}
                  className="relative text-left cursor-pointer group py-3 lg:py-5 flex-shrink-0 transition-all duration-300"
                  style={{ minWidth: "fit-content" }}
                >
                  {/* Accent left border on active (desktop) */}
                  <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[2px]">
                    <motion.div
                      className="absolute top-0 left-0 w-full rounded-full"
                      style={{ background: GOLD }}
                      animate={{
                        height: isActive ? "100%" : "0%",
                        opacity: isActive ? 1 : 0,
                      }}
                      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                    />
                  </div>

                  <div className="lg:pl-6 px-4 lg:px-0">
                    {/* Act number */}
                    <span
                      className="text-[10px] tracking-[0.12em] block mb-1 transition-colors duration-300"
                      style={{
                        fontWeight: 500,
                        color: isActive ? "#BFB4A9" : "#D1D1D6",
                        fontFamily: SERIF,
                        fontStyle: "italic",
                      }}
                    >
                      {act.num}
                    </span>
                    {/* Act title */}
                    <span
                      className="text-[17px] lg:text-[20px] tracking-[-0.01em] transition-colors duration-300"
                      style={{
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? "#3C3C43" : "#AEAEB2",
                        fontFamily: SERIF,
                      }}
                    >
                      {act.title}
                    </span>
                  </div>

                  {/* Accent bottom border on active (mobile) */}
                  <div className="lg:hidden absolute bottom-0 left-4 right-4 h-[2px]">
                    <motion.div
                      className="absolute bottom-0 left-0 h-full rounded-full"
                      style={{ background: GOLD }}
                      animate={{
                        width: isActive ? "100%" : "0%",
                        opacity: isActive ? 1 : 0,
                      }}
                      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                    />
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Dynamic headline + body — desktop only */}
          <div className="hidden lg:block mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAct}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <h3
                  className="text-[clamp(26px,2.5vw,36px)] tracking-[-0.035em] text-[#111111] mb-5 whitespace-pre-line"
                  style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.12 }}
                >
                  {current.headline}
                </h3>
                <p
                  className="text-[14px] sm:text-[15px] text-[#8E8E93] max-w-[320px]"
                  style={{ fontWeight: 400, lineHeight: 1.7 }}
                >
                  {current.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ════ RIGHT — Product showcase (the actual product UI) ════ */}
        <div className="relative">
          {/* Mobile: headline + body above showcase */}
          <div className="lg:hidden mb-6 min-h-[110px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAct}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h3
                  className="text-[28px] tracking-[-0.03em] text-[#111111] mb-3 whitespace-pre-line"
                  style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.12 }}
                >
                  {current.headline}
                </h3>
                <p className="text-[14px] text-[#8E8E93]" style={{ fontWeight: 400, lineHeight: 1.65 }}>
                  {current.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* The gallery mockup — feature UI integrated INSIDE */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAct}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
            >
              {activeAct === "compartilhar" && <ActShare />}
              {activeAct === "entrega" && <ActDelivery />}
              {activeAct === "selecao" && <ActProofing />}
              {activeAct === "prints" && <ActPrints />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════
   ACT I — COMPARTILHAR
   Shows: desktop gallery + phone side by side
   ════════════════════════════════════════ */
function ActShare() {
  return (
    <div className="relative">
      {/* Main gallery card */}
      <GalleryCard
        title="Alessandra & Simon"
        subtitle="Casamento · 324 fotos"
        photos={[IMG.hero, IMG.bride, IMG.dance, IMG.rings, IMG.kiss, IMG.baby]}
        heights={[240, 170, 200, 155, 210, 180]}
      >
        {/* Integrated: share bar inside gallery */}
        <motion.div
          className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-20"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div
            className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-[#F5F5F7]"
            style={{
              backdropFilter: "blur(24px)",
              boxShadow: "0 8px 32px #D1D1D6",
              border: "1px solid #E5E5EA",
            }}
          >
            <div className="flex-1 flex items-center gap-2 overflow-hidden">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#34C759" }} />
              <span className="text-[11px] sm:text-[12px] text-[#AEAEB2] truncate" style={{ fontWeight: 400 }}>
                galeria.essyn.com/alessandra-simon
              </span>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] text-white flex-shrink-0"
              style={{ fontWeight: 600, background: INK }}
            >
              <Share2 className="w-3 h-3" /> Copiar link
            </button>
          </div>
        </motion.div>
      </GalleryCard>

      {/* Phone mockup — overlapping right */}
      <motion.div
        className="hidden lg:block absolute -right-6 xl:-right-10 top-[12%] z-30"
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <div
          className="w-[130px] rounded-2xl overflow-hidden"
          style={{
            background: "#0A0A0A",
            boxShadow: "0 24px 56px #AEAEB2, 0 8px 16px #D1D1D6",
            border: "1px solid #1A1A1A",
          }}
        >
          <div className="flex justify-center py-1.5">
            <div className="w-[34%] h-[3px] rounded-full bg-[#3A3A3C]" />
          </div>
          <div className="relative">
            <ImageWithFallback src={IMG.kiss} alt="Mobile" className="w-full aspect-[9/16] object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #3C3C43 0%, transparent 35%)" }} />
            <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
              <span className="text-[7px] tracking-[0.08em] uppercase block mb-0.5 text-[#C9BFB6]" style={{ fontWeight: 600 }}>Galeria</span>
              <span className="text-[9px] text-[#D1D1D6] block" style={{ fontFamily: SERIF, fontWeight: 400 }}>Alessandra & Simon</span>
            </div>
          </div>
          <div className="px-2.5 py-1.5 flex items-center gap-1">
            <div className="w-1 h-1 rounded-full" style={{ background: "#34C759" }} />
            <span className="text-[6px] text-[#48484A]" style={{ fontWeight: 400 }}>essyn.com</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════
   ACT II — ENTREGA DIGITAL
   Shows: gallery with integrated download panel overlay
   ════════════════════════════════════════ */
function ActDelivery() {
  return (
    <GalleryCard
      title="Família Wasserman"
      subtitle="Ensaio família · 186 fotos"
      photos={[IMG.hero, IMG.bride, IMG.dance, IMG.rings, IMG.kiss, IMG.baby]}
      heights={[220, 180, 200, 160, 230, 170]}
      overlayDim
    >
      {/* Download panel — integrated inside gallery as modal overlay */}
      <motion.div
        className="absolute inset-0 z-20 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.div
          className="w-full max-w-[320px] rounded-2xl bg-white overflow-hidden"
          style={{
            boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA",
          }}
          initial={{ y: 20, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center border-b border-[#F5F5F7]">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-[#F5F5F7]">
              <Download className="w-6 h-6 text-[#636366]" />
            </div>
            <span className="text-[17px] text-[#3C3C43] block" style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>Baixar fotos</span>
            <span className="text-[12px] text-[#AEAEB2] block mt-1" style={{ fontWeight: 400 }}>186 fotos · 3.2 GB</span>
          </div>

          {/* Options */}
          <div className="px-6 py-5">
            {/* Resolution */}
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#AEAEB2] block mb-3" style={{ fontWeight: 600 }}>Resolução</span>
            {["Alta resolução", "Web otimizada"].map((opt, i) => (
              <label key={opt} className="flex items-center gap-3 py-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${i === 0 ? "border-[#636366]" : "border-[#E5E5EA]"}`}>
                  {i === 0 && <div className="w-2 h-2 rounded-full bg-[#636366]" />}
                </div>
                <span className={`text-[13px] ${i === 0 ? "text-[#48484A]" : "text-[#AEAEB2]"}`} style={{ fontWeight: i === 0 ? 500 : 400 }}>{opt}</span>
              </label>
            ))}

            {/* Destination */}
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#AEAEB2] block mt-5 mb-3" style={{ fontWeight: 600 }}>Destino</span>
            {[
              { name: "Meu dispositivo", active: true },
              { name: "Google Photos", active: false },
              { name: "Dropbox", active: false },
            ].map((opt) => (
              <label key={opt.name} className="flex items-center gap-3 py-2 cursor-pointer">
                <div className={`w-4 h-4 rounded flex items-center justify-center ${opt.active ? "bg-[#111111]" : "border-[1.5px] border-[#E5E5EA]"}`}>
                  {opt.active && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-[13px] ${opt.active ? "text-[#48484A]" : "text-[#AEAEB2]"}`} style={{ fontWeight: opt.active ? 500 : 400 }}>{opt.name}</span>
              </label>
            ))}
          </div>

          {/* Button */}
          <div className="px-6 pb-6">
            <button className="w-full py-3 rounded-xl text-[13px] text-white cursor-pointer" style={{ fontWeight: 600, background: INK }}>
              Baixar 186 fotos
            </button>
          </div>
        </motion.div>
      </motion.div>
    </GalleryCard>
  );
}

/* ════════════════════════════════════════
   ACT III — SELEÇÃO & PROOFING
   Shows: gallery with green hearts + inline comment + selection bar
   ════════════════════════════════════════ */
function ActProofing() {
  const favIndices = [0, 2, 4];
  return (
    <GalleryCard
      title="Desert Resort"
      subtitle="Editorial · 92 fotos"
      titleStyle="uppercase"
      photos={[IMG.hero, IMG.bride, IMG.dance, IMG.rings, IMG.kiss, IMG.baby]}
      heights={[250, 175, 210, 155, 220, 185]}
      favIndices={favIndices}
    >
      {/* Selection counter bar — integrated in gallery top-right */}
      <motion.div
        className="absolute top-[70px] sm:top-[78px] right-3 sm:right-5 z-20"
        initial={{ x: 12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E8F5EE]"
          style={{
            border: "1px solid #DCEEE5",
          }}
        >
          <Heart className="w-3 h-3" style={{ color: "#3B9B6D" }} fill="#3B9B6D" />
          <span className="text-[11px]" style={{ fontWeight: 600, color: "#3B9B6D" }}>12 favoritas</span>
        </div>
      </motion.div>

      {/* Inline comment — inside gallery, bottom-right */}
      <motion.div
        className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-20 max-w-[240px]"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        <div
          className="px-4 py-3 rounded-xl bg-[#FAFAFA]"
          style={{
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 24px #D1D1D6",
            border: "1px solid #E5E5EA",
          }}
        >
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden bg-[#F0EDEB]">
              <span className="flex items-center justify-center w-full h-full text-[9px]" style={{ fontWeight: 700, color: ACCENT }}>A</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-[#636366]" style={{ fontWeight: 600 }}>Alessandra</span>
                <span className="text-[8px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>agora</span>
              </div>
              <p className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400, lineHeight: 1.5 }}>
                Amei essa! Quero no álbum.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action bar — dark, bottom-left inside gallery */}
      <motion.div
        className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 z-20"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.4 }}
      >
        <div
          className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-[#1A1A1A]"
          style={{
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 24px #AEAEB2",
          }}
        >
          {[
            { Icon: Heart, active: true, color: "#3B9B6D" },
            { Icon: MessageCircle, active: false, color: "" },
            { Icon: Download, active: false, color: "" },
            { Icon: Share2, active: false, color: "" },
          ].map((btn, i) => (
            <btn.Icon
              key={i}
              className="w-4 h-4"
              style={{ color: btn.active ? btn.color : "#48484A" }}
              fill={btn.active ? btn.color : "none"}
            />
          ))}
        </div>
      </motion.div>
    </GalleryCard>
  );
}

/* ════════════════════════════════════════
   ACT IV — LOJA DE PRINTS
   Shows: gallery with product overlay on selected photo
   ════════════════════════════════════════ */
function ActPrints() {
  return (
    <GalleryCard
      title="Alessandra & Simon"
      subtitle="Casamento · 324 fotos"
      photos={[IMG.hero, IMG.bride, IMG.dance, IMG.rings, IMG.kiss, IMG.baby]}
      heights={[235, 180, 205, 160, 220, 175]}
      priceIndices={[0, 2, 4]}
    >
      {/* Product overlay — integrated as a sidebar inside gallery */}
      <motion.div
        className="absolute top-[70px] sm:top-[78px] right-3 sm:right-5 bottom-4 sm:bottom-6 z-20 w-[200px] sm:w-[230px] hidden md:flex flex-col"
        initial={{ x: 16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <div
          className="rounded-2xl overflow-hidden flex-1 flex flex-col bg-[#FAFAFA]"
          style={{
            backdropFilter: "blur(24px)",
            boxShadow: "0 16px 48px #D1D1D6",
            border: "1px solid #E5E5EA",
          }}
        >
          {/* Selected photo preview */}
          <div className="relative">
            <ImageWithFallback src={IMG.kiss} alt="Selected for print" className="w-full aspect-[4/3] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3C3C43] to-transparent" style={{ opacity: 0.3 }} />
            <span className="absolute bottom-2.5 left-3 text-[8px] text-[#D1D1D6]" style={{ fontWeight: 500 }}>Foto selecionada</span>
          </div>

          {/* Print options */}
          <div className="flex-1 px-4 py-4 flex flex-col">
            <span className="text-[9px] tracking-[0.12em] uppercase text-[#AEAEB2] mb-3 block" style={{ fontWeight: 600 }}>Formatos</span>
            {[
              { name: "Fine Art 30×40", price: "R$ 180" },
              { name: "Canvas 40×60", price: "R$ 280" },
              { name: "Álbum 30×30", price: "R$ 890" },
            ].map((item, i) => (
              <div
                key={item.name}
                className={`flex items-center justify-between py-2.5 ${i > 0 ? "border-t border-[#F5F5F7]" : ""}`}
              >
                <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{item.name}</span>
                <span className="text-[11px] text-[#48484A] tabular-nums" style={{ fontWeight: 600 }}>{item.price}</span>
              </div>
            ))}

            <button className="w-full mt-auto py-2.5 rounded-xl text-[11px] text-white cursor-pointer" style={{ fontWeight: 600, background: INK }}>
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </motion.div>
    </GalleryCard>
  );
}

/* ════════════════════════════════════════
   GALLERY CARD — Shared masonry container
   Clean white frame, no browser chrome.
   ════════════════════════════════════════ */
function GalleryCard({
  title,
  subtitle,
  photos,
  heights,
  children,
  titleStyle,
  overlayDim,
  favIndices,
  priceIndices,
}: {
  title: string;
  subtitle: string;
  photos: string[];
  heights: number[];
  children?: React.ReactNode;
  titleStyle?: "uppercase";
  overlayDim?: boolean;
  favIndices?: number[];
  priceIndices?: number[];
}) {
  return (
    <div
      className="relative rounded-2xl sm:rounded-3xl bg-white overflow-hidden"
      style={{
        boxShadow: "0 1px 3px #E5E5EA, 0 4px 16px #E5E5EA",
        border: "1px solid #E5E5EA",
      }}
    >
      {/* Gallery header */}
      <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4">
        <h3
          className={`text-[20px] sm:text-[26px] text-[#111111] ${titleStyle === "uppercase" ? "tracking-[0.04em] uppercase" : "tracking-[-0.02em]"}`}
          style={{
            fontFamily: titleStyle === "uppercase" ? undefined : SERIF,
            fontWeight: titleStyle === "uppercase" ? 700 : 400,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h3>
        <span className="text-[11px] sm:text-[12px] text-[#AEAEB2] mt-1 block" style={{ fontWeight: 400 }}>
          {subtitle}
        </span>
      </div>

      {/* Masonry grid */}
      <div className="relative px-3 sm:px-4 pb-4 sm:pb-5">
        {/* Dim overlay for delivery */}
        {overlayDim && (
          <motion.div
            className="absolute inset-0 z-10 rounded-lg bg-[#111111]"
            style={{ opacity: 0.35 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          />
        )}

        <div className="columns-2 sm:columns-3 gap-2 sm:gap-2.5" style={{ columnFill: "balance" }}>
          {photos.map((src, i) => (
            <div key={i} className="relative break-inside-avoid mb-2 sm:mb-2.5 overflow-hidden rounded-lg group">
              <ImageWithFallback
                src={src}
                alt={`Photo ${i + 1}`}
                className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ height: `${heights[i] || 180}px` }}
              />

              {/* Green heart for proofing */}
              {favIndices?.includes(i) && (
                <motion.div
                  className="absolute top-2 left-2 z-10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.15 + i * 0.08 }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "#3B9B6D", boxShadow: "0 4px 12px #A5D4BC" }}
                  >
                    <Heart className="w-3.5 h-3.5 text-white" fill="white" />
                  </div>
                </motion.div>
              )}

              {/* Price tag for prints */}
              {priceIndices?.includes(i) && (
                <motion.div
                  className="absolute bottom-2 right-2 z-10"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.2 + i * 0.07 }}
                >
                  <div
                    className="px-2 py-1 rounded-md text-[9px] sm:text-[10px] text-white tabular-nums bg-[#48484A]"
                    style={{ fontWeight: 600, backdropFilter: "blur(8px)" }}
                  >
                    {i === 0 ? "R$ 180" : i === 2 ? "R$ 120" : "R$ 280"}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Children: overlays, panels, etc. */}
        {children}
      </div>
    </div>
  );
}