// CTAShowcase v4 — Editorial film studio identity. Autoral, not generic SaaS.
// Tight composition, devices fill the space, badges reference real photographer workflows.
// 3D perspective, GSAP stagger, ambient gold glow, real Unsplash photography.
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import gsap from "gsap";
import { Camera, Heart, Check, Send, Aperture } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { SERIF, GOLD } from "../ui/editorial";

/* ── Real Unsplash images ── */
const IMG_GALLERY = "https://images.unsplash.com/photo-1769038933441-2457038f8dda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcGhvdG9ncmFwaHklMjBlbGVnYW50JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcyMDYzOTY3fDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_MOBILE = "https://images.unsplash.com/photo-1758810410699-2dc1daec82dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBzdW5zZXQlMjBnb2xkZW4lMjBob3VyJTIwcm9tYW50aWN8ZW58MXx8fHwxNzcyMDY0Mjg2fDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_THUMB1 = "https://images.unsplash.com/photo-1753703986156-46e2b962c012?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwYnJpZGUlMjBlbGVnYW50JTIwdmVpbHxlbnwxfHx8fDE3NzIwNjQyODV8MA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_THUMB2 = "https://images.unsplash.com/photo-1707294285115-bbbef91a6f7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcmluZ3MlMjBkZXRhaWxzJTIwZmxvd2Vyc3xlbnwxfHx8fDE3NzIwNjQyODZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_THUMB3 = "https://images.unsplash.com/photo-1768039375889-b3a8ff6fc3cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBob3RvZ3JhcGhlciUyMGVkaXRvcmlhbCUyMGNvdXBsZXxlbnwxfHx8fDE3NzIwNjM5Njh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_THUMB4 = "https://images.unsplash.com/photo-1761891950106-3276efeef9d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXdib3JuJTIwYmFieSUyMHBob3RvZ3JhcGh5JTIwc3R1ZGlvfGVufDF8fHx8MTc3MjAzOTk4M3ww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_THUMB5 = "https://images.unsplash.com/photo-1769812344337-ec16a1b7cef8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwY2VyZW1vbnklMjBlbGVnYW50JTIwb3V0ZG9vcnxlbnwxfHx8fDE3NzIwNDcyOTR8MA&ixlib=rb-4.1.0&q=80&w=1080";

const thumbs = [IMG_THUMB1, IMG_THUMB2, IMG_THUMB3, IMG_THUMB4, IMG_THUMB5];

/* ── Floating badges — contextual photographer workflow, not generic SaaS metrics ── */
const floatingBadges = [
  { icon: Heart, label: "Seleção concluída", detail: "48 favoritas", color: "#E85D75", x: "right-[2%] lg:right-[4%]", y: "top-[6%]" },
  { icon: Send, label: "Galeria entregue", detail: "há 2 min", color: "#3B9B6D", x: "left-[0%] lg:left-[2%]", y: "top-[20%]" },
  { icon: Aperture, label: "Álbum aprovado", detail: "30×30 premium", color: GOLD, x: "right-[0%] lg:right-[2%]", y: "bottom-[30%]" },
];

export function CTAShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const devicesRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  /* ── Scroll-driven parallax ── */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const desktopY = useTransform(scrollYProgress, [0, 1], [40, -15]);
  const mobileY = useTransform(scrollYProgress, [0, 1], [70, -30]);
  const invoiceY = useTransform(scrollYProgress, [0, 1], [55, -10]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5], [0.85, 1.1]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.35, 0.7], [0, 0.06, 0.02]);

  /* ── GSAP stagger entrance ── */
  useEffect(() => {
    if (!devicesRef.current) return;
    const els = devicesRef.current.querySelectorAll("[data-device]");
    const badges = devicesRef.current.querySelectorAll("[data-badge]");

    gsap.set(els, { y: 60, opacity: 0, scale: 0.97 });
    gsap.set(badges, { y: 20, opacity: 0, scale: 0.92 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;
        observer.disconnect();

        gsap.to(els, {
          y: 0, opacity: 1, scale: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.18,
        });
        gsap.to(badges, {
          y: 0, opacity: 1, scale: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.14,
          delay: 0.65,
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(devicesRef.current);
    return () => observer.disconnect();
  }, []);

  /* ── Animated photo counter ── */
  const [counter, setCounter] = useState(0);
  const counterStarted = useRef(false);

  const startCounter = useCallback(() => {
    if (counterStarted.current) return;
    counterStarted.current = true;
    let current = 0;
    const interval = setInterval(() => {
      current += Math.ceil((324 - current) / 10);
      if (current >= 324) { current = 324; clearInterval(interval); }
      setCounter(current);
    }, 45);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { startCounter(); observer.disconnect(); }
      },
      { threshold: 0.15 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startCounter]);

  return (
    <div ref={containerRef} className="relative mt-8 sm:mt-10 lg:mt-12">
      {/* ── Ambient gold glow ── */}
      <motion.div
        className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${GOLD} 0%, transparent 70%)`,
          scale: glowScale,
          opacity: glowOpacity,
          filter: "blur(100px)",
        }}
        aria-hidden="true"
      />

      {/* ── Film grain ── */}
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
        aria-hidden="true"
      />

      <div ref={devicesRef} className="relative max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6" style={{ perspective: "2200px" }}>
        <div className="relative" style={{ minHeight: "clamp(360px, 50vw, 640px)" }}>

          {/* ════════ DESKTOP — main gallery (center, dominant) ════════ */}
          <motion.div
            data-device
            className="relative z-20 mx-auto"
            style={{
              width: "clamp(380px, 66%, 880px)",
              y: desktopY,
              transformStyle: "preserve-3d",
              transform: "rotateX(2deg) rotateY(-0.5deg)",
            }}
          >
            <div
              className="rounded-t-2xl sm:rounded-t-3xl border border-b-0 border-[#D1D1D6] bg-white overflow-hidden"
              style={{ boxShadow: "0 40px 100px -20px #C7C7CC, 0 12px 32px -8px #E5E5EA" }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#E5E5EA] bg-[#FAFAF9]">
                <div className="flex gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ background: "#FF5F57" }} />
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ background: "#FEBC2E" }} />
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ background: "#34C759" }} />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-4 sm:px-5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#F5F5F7]">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#34C759]" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a.75.75 0 01.75.75v3.69l2.03 2.03a.75.75 0 11-1.06 1.06L7.47 7.78A.75.75 0 017.25 7V3.25A.75.75 0 018 2.5z"/></svg>
                    <span className="text-[9px] sm:text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>galeria.essyn.com/maria-joao</span>
                  </div>
                </div>
              </div>

              {/* Gallery hero image */}
              <div className="relative">
                <ImageWithFallback
                  src={IMG_GALLERY}
                  alt="Galeria ESSYN — Casamento editorial"
                  className="w-full aspect-[16/9] object-cover"
                  style={{ transformOrigin: "50% 60%" }}
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #111111 0%, transparent 40%)", opacity: 0.55 }} />

                {/* Gallery overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 lg:px-10 pb-5 sm:pb-8">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[8px] sm:text-[11px] text-[#9C8B7A] block mb-1.5" style={{ fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>Galeria Online</span>
                      <span className="text-[20px] sm:text-[30px] lg:text-[38px] text-[#F5F5F7] tracking-[-0.03em] block" style={{ fontFamily: SERIF, fontWeight: 400 }}>Maria & João</span>
                      <span className="hidden sm:block text-[12px] sm:text-[14px] text-[#636366] mt-1.5" style={{ fontWeight: 400, fontStyle: "italic" }}>Casamento · 12 de Outubro, 2025</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ background: "#303030", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
                        <Camera className="w-3.5 h-3.5 text-[#8E8E93]" />
                        <span className="text-[11px] text-[#AEAEB2] tabular-nums" style={{ fontWeight: 500 }}>{counter} fotos</span>
                      </div>
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ background: "#303030", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
                        <Heart className="w-3.5 h-3.5 text-[#E85D75]" style={{ opacity: 0.8 }} />
                        <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>48</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thumbnails strip */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[#E5E5EA] flex items-center gap-2 sm:gap-3 bg-white">
                {thumbs.map((src, i) => (
                  <div key={i} className={`rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300 ${i === 0 ? "ring-2 ring-[#9C8B7A] shadow-[0_0_0_1px_#E8E4DF]" : "opacity-50 hover:opacity-80"}`} style={{ width: "clamp(36px, 6vw, 68px)", height: "clamp(26px, 4.2vw, 48px)", opacity: i === 0 ? 1 : undefined }}>
                    <ImageWithFallback src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                <span className="text-[8px] sm:text-[11px] text-[#AEAEB2] ml-auto" style={{ fontWeight: 400 }}>
                  <span className="hidden sm:inline">+320 mais</span>
                  <span className="sm:hidden">+320</span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* ════════ MOBILE — gallery phone (right, overlapping) ════════ */}
          <motion.div
            data-device
            className="absolute right-[1%] sm:right-[3%] lg:right-[5%] bottom-0 z-30"
            style={{
              width: "clamp(115px, 19%, 230px)",
              y: mobileY,
              transformStyle: "preserve-3d",
              transform: "rotateX(2deg) rotateY(3deg)",
            }}
          >
            <div
              className="rounded-t-2xl sm:rounded-t-3xl border border-b-0 border-[#C7C7CC] bg-[#0A0A0A] overflow-hidden"
              style={{ boxShadow: "0 40px 80px -16px #48484A, 0 12px 32px -8px #48484A" }}
            >
              <div className="relative flex justify-center py-1.5 sm:py-2.5 bg-[#0A0A0A]">
                <div className="w-[40%] h-[3px] sm:h-[4px] rounded-full bg-[#282828]" />
              </div>
              <div className="relative">
                <ImageWithFallback
                  src={IMG_MOBILE}
                  alt="ESSYN Mobile — Galeria sunset"
                  className="w-full aspect-[9/15] object-cover"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #111111 0%, transparent 50%)", opacity: 0.65 }} />
                <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-3 sm:pb-5">
                  <span className="text-[7px] sm:text-[10px] text-[#9C8B7A] block" style={{ fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.6 }}>Ensaio</span>
                  <span className="text-[10px] sm:text-[14px] text-[#E5E5EA] block" style={{ fontFamily: SERIF, fontWeight: 400 }}>Pré-wedding</span>
                  <span className="text-[6px] sm:text-[9px] text-[#636366] mt-0.5 block" style={{ fontWeight: 400 }}>96 fotos · Golden hour</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1 py-1.5 sm:py-2 bg-[#0A0A0A]">
                {[0, 1, 2, 3].map((n) => (
                  <span 
                    key={n} 
                    className={`rounded-full bg-white ${n === 0 ? "w-3 sm:w-4 h-[2px] sm:h-[3px]" : "w-[3px] sm:w-[4px] h-[2px] sm:h-[3px]"}`}
                    style={{ background: n === 0 ? GOLD : "#FFFFFF", opacity: n === 0 ? 1 : 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ════════ INVOICE — financial card (left, overlapping) ════════ */}
          <motion.div
            data-device
            className="absolute left-[0%] sm:left-[1%] lg:left-[3%] bottom-0 z-10"
            style={{
              width: "clamp(190px, 32%, 380px)",
              y: invoiceY,
              transformStyle: "preserve-3d",
              transform: "rotateX(2deg) rotateY(4deg)",
            }}
          >
            <div
              className="rounded-t-xl sm:rounded-t-2xl border border-b-0 border-[#C7C7CC] bg-white overflow-hidden"
              style={{ boxShadow: "0 32px 72px -12px #D1D1D6, 0 6px 20px -4px #E5E5EA" }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[#E5E5EA] bg-[#FAFAF9]">
                <div className="flex gap-1 sm:gap-1.5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ background: "#FF5F57" }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ background: "#FEBC2E" }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ background: "#34C759" }} />
                </div>
                <span className="text-[6px] sm:text-[9px] text-[#C7C7CC] mx-auto" style={{ fontWeight: 400 }}>app.essyn.com/financeiro</span>
              </div>

              {/* Invoice content */}
              <div className="p-3.5 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <span className="text-[6px] sm:text-[9px] text-[#9C8B7A] block" style={{ fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6 }}>Fatura</span>
                    <span className="text-[9px] sm:text-[13px] text-[#111111]" style={{ fontWeight: 700 }}>#1247</span>
                  </div>
                  <span className="text-[6px] sm:text-[9px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1" style={{ background: "#EBF7F0", color: "#3B9B6D", fontWeight: 600 }}>
                    <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> Pago
                  </span>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  {[
                    { label: "Casamento completo", value: "R$ 4.800" },
                    { label: "Ensaio pré-wedding", value: "R$ 1.200" },
                    { label: "Álbum premium 30×30", value: "R$ 2.400" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1 sm:py-1.5 border-b border-[#E5E5EA]">
                      <span className="text-[6px] sm:text-[9px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{item.label}</span>
                      <span className="text-[7px] sm:text-[10px] text-[#636366] tabular-nums" style={{ fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-[#C7C7CC]">
                  <span className="text-[7px] sm:text-[10px] text-[#8E8E93]" style={{ fontWeight: 600 }}>Total</span>
                  <span className="text-[10px] sm:text-[14px] text-[#111111] tabular-nums" style={{ fontWeight: 800 }}>R$ 8.400</span>
                </div>

                {/* Payment timeline — photographer-specific, not generic chart */}
                <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-[#E5E5EA]">
                  <span className="text-[5px] sm:text-[8px] text-[#C7C7CC] block mb-2" style={{ fontWeight: 500 }}>Parcelas</span>
                  <div className="space-y-1.5 sm:space-y-2">
                    {[
                      { date: "15/ago", label: "Sinal", value: "R$ 2.800", done: true },
                      { date: "12/out", label: "Evento", value: "R$ 2.800", done: true },
                      { date: "12/nov", label: "Entrega", value: "R$ 2.800", done: true },
                    ].map((p) => (
                      <div key={p.date} className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: p.done ? "#F2F8F4" : "#F5F5F7" }}>
                          {p.done && <Check className="w-[7px] h-[7px] sm:w-[9px] sm:h-[9px]" style={{ color: "#3B9B6D" }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[5px] sm:text-[7px] text-[#AEAEB2] block" style={{ fontWeight: 400 }}>{p.date} · {p.label}</span>
                        </div>
                        <span className="text-[5px] sm:text-[8px] text-[#8E8E93] tabular-nums flex-shrink-0" style={{ fontWeight: 600 }}>{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ════════ Floating glassmorphism badges — photographer workflow context ════════ */}
          {floatingBadges.map((badge, i) => (
            <motion.div
              key={i}
              data-badge
              className={`absolute ${badge.x} ${badge.y} z-40 hidden md:flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl`}
              style={{
                background: "#F2F2F7",
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                boxShadow: "0 8px 32px #E5E5EA, 0 1px 2px #F5F5F7",
                border: "1px solid #E5E5EA",
              }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.2 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: 1 + i * 0.3 }}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center" style={{ background: `${badge.color}14` }}>
                <badge.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: badge.color }} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-[12px] text-[#636366]" style={{ fontWeight: 600 }}>{badge.label}</span>
                <span className="text-[7px] sm:text-[9px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>{badge.detail}</span>
              </div>
            </motion.div>
          ))}

          {/* ════════ Film frame marker — editorial detail, not metric ════════ */}
          <motion.div
            data-badge
            className="absolute left-[0%] sm:left-[1%] bottom-[10%] z-40 hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{
              background: "#F2F2F7",
              backdropFilter: "blur(12px) saturate(160%)",
              WebkitBackdropFilter: "blur(12px) saturate(160%)",
              boxShadow: "0 4px 20px #F5F5F7",
              border: "1px solid #E5E5EA",
            }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
          >
            <span className="text-[10px] text-[#C7C7CC] tabular-nums tracking-[0.08em]" style={{ fontWeight: 600 }}>FRM</span>
            <span className="w-px h-3 bg-[#E5E5EA]" />
            <span className="text-[10px] tabular-nums" style={{ fontWeight: 500, color: "#CDC5BC" }}>324 / 324</span>
          </motion.div>

          {/* ════════ Delivery confirmation — bottom-right ════════ */}
          <motion.div
            data-badge
            className="absolute right-[0%] sm:right-[1%] bottom-[8%] z-40 hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{
              background: "#F2F2F7",
              backdropFilter: "blur(12px) saturate(160%)",
              WebkitBackdropFilter: "blur(12px) saturate(160%)",
              boxShadow: "0 4px 20px #F5F5F7",
              border: "1px solid #E5E5EA",
            }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#EBF7F0" }}>
              <Check className="w-3 h-3" style={{ color: "#3B9B6D" }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#8E8E93]" style={{ fontWeight: 600 }}>Entrega confirmada</span>
              <span className="text-[7px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>Cliente visualizou a galeria</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom bleed ── */}
      <div className="h-6 sm:h-8" style={{ background: "#F7F5F0" }} />
    </div>
  );
}