// v17 editorial premium: contrast + rhythm + narrative chapters 2026-02-25
import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { springToggle, springDefault } from "../../../lib/motion-tokens";
import gsap from "gsap";
import {
  ArrowRight, ChevronDown, Check, Zap, ShieldCheck, Lock, Shield, Eye,
} from "lucide-react";
import { GR, MagBtn, MagLink, SERIF, EASE, GOLD } from "../../../components/ui/editorial";
import { ModuleShowcase } from "../../../components/marketing/ModuleShowcase";
import { HeroSmartScreens } from "../../../components/marketing/SmartScreens";
import { FlowSteps } from "../../../components/marketing/FlowSteps";
import { HeroBirds } from "../../../components/marketing/HeroBirds";
import { TestimonialsSection } from "../../../components/marketing/TestimonialsSection";
import { CTAShowcase } from "../../../components/marketing/CTAShowcase";
import { GalleryShowcase } from "../../../components/marketing/GalleryShowcase";

const serif = SERIF;

const ease = EASE;
const gold = GOLD;
const P = "/v4";

/* ── Discrete section number — editorial marker ── */
function SN({ n, light }: { n: string; light?: boolean }) {
  return (
    <div className="absolute left-6 lg:left-10 top-8 lg:top-10 select-none pointer-events-none z-[20] flex items-center gap-3">
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.08em",
          fontVariantNumeric: "tabular-nums",
          color: light ? "#8E8E93" : "#C3B9AF",
          fontFamily: "var(--font-sans)",
        }}
      >
        {n}
      </span>
      <span
        className="hidden lg:block"
        style={{
          width: 32,
          height: 1,
          background: light ? "#48484A" : "#E1DCD7",
        }}
      />
    </div>
  );
}

/* ── Surface tokens for scroll rhythm ── */
const SURFACE_BASE = "#FFFFFF";
const SURFACE_ALT = "#F5F5F7"; // neutral light gray

/* ── Hero Renaissance painting ── */
import heroRenaissance from "figma:asset/9f1eeb9113a04441720c94aa7af00f5fe811b3ff.png";

/* ── before/after ── */
const beforeTools = [
  { name: "WhatsApp", role: "Comunicação" },
  { name: "Planilhas", role: "Financeiro" },
  { name: "Trello", role: "Produção" },
  { name: "Drive", role: "Arquivos" },
  { name: "PIX manual", role: "Cobrança" },
  { name: "E-mail", role: "Entrega" },
];

/* ── FAQ ── */
const faqs = [
  { q: "Posso testar antes de assinar?", a: "Sim. Todos os planos incluem 14 dias grátis, sem necessidade de cartão de crédito." },
  { q: "Funciona com PIX e Nota Fiscal?", a: "Sim. O financeiro é 100% brasileiro — PIX, boleto, parcelas, NF-e e conciliação bancária integrados." },
  { q: "Posso adicionar minha equipe?", a: "Sim. O plano Studio suporta até 10 membros com 5 papéis e permissões granulares por módulo." },
  { q: "Os clientes recebem link da galeria?", a: "Sim. Cada coleção gera um link privado com senha opcional, seleção de favoritas e download em alta." },
  { q: "Como funciona o armazenamento?", a: "Core inclui 5 GB, Pro 20 GB e Studio 50 GB. Storage extra disponível como add-on de R$19/mês." },
  { q: "Posso migrar de outro sistema?", a: "Sim. Oferecemos importação via CSV e onboarding assistido gratuito no plano Pro e Studio." },
  { q: "E se eu quiser cancelar?", a: "Cancele a qualquer momento em Configurações. Sem multa, sem burocracia. Seus dados ficam disponíveis por 30 dias." },
  { q: "O ESSYN é seguro? E a LGPD?", a: "Criptografia TLS 1.3, backups diários, conformidade total com a LGPD. Seus dados são seus — exporte ou exclua quando quiser." },
];

/* ── plans ── */
const plans = [
  { id: "core", name: "Core", monthly: 49, yearly: 39, tagline: "Para quem está começando", features: ["5 projetos ativos", "Produção + Agenda", "Galeria básica", "5 GB storage"] },
  { id: "pro", name: "Pro", monthly: 99, yearly: 79, tagline: "Para quem faz eventos toda semana", features: ["Projetos ilimitados", "Financeiro BR completo", "CRM + Pipeline", "20 GB storage"], recommended: true },
  { id: "studio", name: "Studio", monthly: 199, yearly: 159, tagline: "Para estúdios e equipes", features: ["Tudo do Pro", "Até 10 membros", "Permissões avançadas", "50 GB storage"] },
];

/* ── Testimonials ── */
const testimonials = [
  { name: "Marina Campos", studio: "marinacampos.com.br", quote: "Reduzi minhas **horas administrativas** pela metade. Tudo integrado num lugar só — projetos, financeiro e entrega." },
  { name: "Rafael Duarte", studio: "rafaelduarte.foto", quote: "O **financeiro brasileiro** me salvou. PIX, parcelas e NF-e sem planilha, sem dor de cabeça." },
  { name: "Juliana Mendes", studio: "julianamendes.com", quote: "Meus clientes adoram a **galeria de entrega**. Profissional, elegante e com a identidade do meu estúdio." },
  { name: "Thiago Rocha", studio: "thiagorocha.photo", quote: "Antes eram **6 apps diferentes**. Agora é só o ESSYN. Consigo gerenciar tudo de um lugar só — até a agenda." },
  { name: "Camila Azevedo", studio: "camilafotografia.art", quote: "A **produção por etapas** mudou meu workflow. Sei exatamente onde cada trabalho está, sem precisar perguntar." },
  { name: "Bruno Ferreira", studio: "brunoferreira.foto", quote: "O **CRM com pipeline** me ajudou a converter mais leads. Nunca mais esqueci um follow-up." },
];





/* ── Galeria Viva — now handled by GalleryShowcase component ── */

/* ── Três passos data moved to FlowSteps component ── */


/* ═══════════════════════════════════════
   LANDING V17 — Editorial Premium
   ═══════════════════════════════════════ */
export function LandingV4Page() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const planosRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  /* ── Hero GSAP entrance ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo("[data-hero-line]", { width: 0 }, { width: "100%", duration: 1.2 }, 0)
        .fromTo("[data-hero-eyebrow]", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.3)
        .fromTo("[data-hero-h1]", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 0.4)
        .fromTo("[data-hero-sub]", { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.7)
        .fromTo("[data-hero-ctas]", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.9)
        .fromTo("[data-hero-trust]", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 1.1)
        .fromTo("[data-hero-scroll]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 1.3);
    }, heroRef);
    return () => ctx.revert();
  }, []);

  /* ── Cinematic parallax ── */
  const baseLayerRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const scrollWrapRef = useRef<HTMLDivElement>(null);

  /* ── Ken Burns subtle drift (GSAP only — acts on baseLayer, not camera) ── */
  useEffect(() => {
    const base = baseLayerRef.current;
    if (!base) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(base, { scale: 1 }, { scale: 1.04, duration: 50, ease: "none", yoyo: true, repeat: -1 });
      gsap.to(base, { y: 2, duration: 18, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });
    return () => ctx.revert();
  }, []);

  /* ── Scroll parallax (RAF only — acts on scrollWrap + heroText, no GSAP conflict) ── */
  useEffect(() => {
    const hero = heroRef.current;
    const scrollWrap = scrollWrapRef.current;
    const textBlock = heroTextRef.current;
    if (!hero || !scrollWrap) return;
    let raf = 0;
    const update = () => {
      const rect = hero.getBoundingClientRect();
      const heroH = rect.height || 1;
      const progress = Math.max(0, Math.min(1, -rect.top / heroH));
      // Background scroll parallax via wrapper (separate from Ken Burns on base)
      const bgShiftY = progress * heroH * 0.04;
      const bgScale = 1 + progress * 0.015;
      scrollWrap.style.transform = `translateY(${bgShiftY}px) scale(${bgScale})`;
      // Text parallax — moves UP faster than background
      if (textBlock) {
        const textShift = progress * heroH * 0.08;
        const textOpacity = Math.max(0, 1 - progress * 1.8);
        textBlock.style.transform = `translateY(-${textShift}px)`;
        textBlock.style.opacity = `${textOpacity}`;
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  const scrollTo = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="relative" style={{ background: SURFACE_BASE }}>
      {/* ══════ A) HERO — CINEMATIC ══════ */}
      <section ref={heroRef} className="relative min-h-[100dvh] flex flex-col overflow-hidden" style={{ background: "#1a1814" }}>
        <SN n="01" light />
        <div ref={scrollWrapRef} className="absolute inset-0 z-0" style={{ willChange: "transform" }}>
          <div ref={baseLayerRef} className="absolute inset-0" style={{ willChange: "transform" }}>
            <img src={heroRenaissance} alt="" className="w-full h-full object-cover" style={{ objectPosition: "center 35%" }} />
          </div>
        </div>
        <div className="absolute inset-0 z-[1]" aria-hidden="true"><HeroSmartScreens /></div>

        {/* ── Vignette — selective: light top, heavier bottom-right where text sits ── */}
        <div className="absolute inset-0 z-[2] pointer-events-none" aria-hidden="true">
          {/* Top edge subtle darkening */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to bottom, #111111 0%, transparent 18%)",
            opacity: 0.25,
          }} />
          {/* Bottom fade */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, #111111 0%, #111111 30%, transparent 55%)",
            opacity: 0.7,
          }} />
          {/* Right vignette desktop only */}
          <div className="absolute inset-0 hidden lg:block" style={{
            background: "linear-gradient(to left, #111111 0%, transparent 50%)",
            opacity: 0.2,
          }} />
        </div>

        {/* ── Birds layer ── */}
        <div className="absolute inset-0 z-[5] pointer-events-none" aria-hidden="true">
          <HeroBirds />
        </div>

        {/* ── Bottom gold frame line — cinematic letterbox accent ── */}
        <div className="absolute bottom-0 left-0 right-0 z-[8] pointer-events-none" aria-hidden="true">
          <div className="h-px" style={{ background: "linear-gradient(90deg, transparent 5%, #F3F1EF 20%, #EBE7E4 50%, #F3F1EF 80%, transparent 95%)" }} />
        </div>

        {/* ── Content — asymmetric gallery composition ── */}
        <div className="relative z-[10] flex-1 flex flex-col justify-end w-full">

          {/* ── Editorial vertical aside — left edge, desktop only ── */}
          <div
            className="hidden lg:flex absolute left-5 bottom-0 top-0 z-[12] items-center pointer-events-none select-none"
            aria-hidden="true"
          >
            <div
              className="flex items-center gap-4"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              <span
                className="text-[9px] tracking-[0.25em] uppercase"
                style={{
                  fontWeight: 500,
                  color: "#323232",
                  letterSpacing: "0.25em",
                }}
              >
                Plataforma para fotógrafos de eventos
              </span>
              <div
                className="w-px"
                style={{
                  height: 40,
                  background: "linear-gradient(to bottom, #2C2926, transparent)",
                }}
              />
            </div>
          </div>

          {/* Desktop: bottom-right. Mobile: bottom-center */}
          <div className="w-full max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-14 pb-14 sm:pb-16 lg:pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 lg:gap-16">

              {/* ── Left spacer on desktop (lets the painting breathe) ── */}
              <div className="hidden lg:block lg:flex-1" />

              {/* ── Text block — right-aligned on desktop ── */}
              <div className="lg:max-w-[560px] lg:text-right" ref={heroTextRef} style={{ willChange: "transform, opacity" }}>

                {/* Brand eyebrow + gold line */}
                <div data-hero-eyebrow className="flex items-center gap-4 mb-6 lg:justify-end" style={{ opacity: 0 }}>
                  <span
                    className="text-[10px] tracking-[0.22em] uppercase"
                    style={{ fontWeight: 600, color: "#564E45" }}
                  >
                    ESSYN
                  </span>
                  <div
                    data-hero-line
                    className="h-px"
                    style={{ background: "linear-gradient(90deg, #48413B, #211F1D)", width: 0, maxWidth: 110 }}
                  />
                </div>

                {/* Headline — dramatic scale play */}
                <h1
                  data-hero-h1
                  className="mb-5 sm:mb-6 relative"
                  style={{
                    opacity: 0,
                    textShadow: "0 4px 60px #3C3C43, 0 1px 3px #48484A",
                  }}
                >
                  {/* Ambient warm glow behind headline */}
                  <div
                    className="absolute -inset-16 -z-10 pointer-events-none"
                    aria-hidden="true"
                    style={{
                      background: "radial-gradient(ellipse 60% 50% at 70% 60%, #191817 0%, transparent 70%)",
                    }}
                  />
                  <span
                    className="block text-[clamp(14px,1.5vw,18px)] tracking-[0.10em] uppercase mb-3 sm:mb-4"
                    style={{ fontWeight: 500, color: "#636366", letterSpacing: "0.10em" }}
                  >
                    Menos caos,
                  </span>
                  {/* Gold losango separator */}
                  <span
                    className="inline-block mb-3 sm:mb-4 lg:ml-auto"
                    style={{
                      width: 6,
                      height: 6,
                      background: "#413B35",
                      transform: "rotate(45deg)",
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="block text-[clamp(48px,7.5vw,88px)] tracking-[-0.04em]"
                    style={{
                      fontFamily: serif,
                      fontWeight: 400,
                      lineHeight: 0.95,
                      color: "#F0EDEB",
                    }}
                  >
                    mais{" "}
                    <span className="italic" style={{ color: "#87786A" }}>
                      fotografia.
                    </span>
                  </span>
                </h1>

                {/* Subtitle — editorial em-dash prefix, right-aligned on desktop */}
                <p
                  data-hero-sub
                  className="text-[clamp(13px,1.1vw,16px)] mb-8 sm:mb-10 lg:ml-auto"
                  style={{
                    fontWeight: 400,
                    lineHeight: 1.75,
                    opacity: 0,
                    color: "#8E8E93",
                    maxWidth: 420,
                    textShadow: "0 2px 16px #48484A",
                  }}
                >
                  <span style={{ color: "#48413B" }}>—&nbsp;</span>
                  Do primeiro lead à entrega final — projetos,
                  financeiro, galeria e WhatsApp em um único fluxo.
                </p>

                {/* CTAs — right-aligned on desktop */}
                <div data-hero-ctas className="flex flex-col sm:flex-row items-start lg:items-end lg:justify-end gap-3 mb-5" style={{ opacity: 0 }}>
                  <Link
                    to={`${P}/criar-conta`}
                    className="group relative inline-flex items-center gap-2.5 text-[14px] px-8 py-[13px] rounded-full overflow-hidden bg-[#F2F2F7] text-[#111111] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_8px_40px_#3C3C43]"
                    style={{ fontWeight: 600, transitionTimingFunction: ease, backdropFilter: "blur(8px)" }}
                  >
                    <span className="absolute inset-0 bg-[#9C8B7A] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: ease }} />
                    <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                      Começar agora <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                  <button
                    onClick={() => scrollTo(howRef)}
                    className="inline-flex items-center gap-2 text-[14px] px-8 py-[13px] rounded-full border border-[#3A3A3C] text-[#8E8E93] hover:text-[#C7C7CC] hover:border-[#48484A] transition-all duration-300 cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
                    <Eye className="w-3.5 h-3.5" /> Explorar
                  </button>
                </div>

                {/* Trust — subtle, integrated */}
                <p
                  data-hero-trust
                  className="text-[10px] sm:text-[11px] lg:text-right"
                  style={{ fontWeight: 400, opacity: 0, letterSpacing: "0.05em", color: "#48484A" }}
                >
                  14 dias grátis &nbsp;·&nbsp; Sem cartão &nbsp;·&nbsp; Suporte humano
                </p>
              </div>
            </div>
          </div>

          {/* Scroll indicator — editorial micro-text + line */}
          <div data-hero-scroll className="flex justify-center pb-7" style={{ opacity: 0 }}>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2.5"
            >
              <span
                className="text-[8px] tracking-[0.20em] uppercase"
                style={{
                  writingMode: "vertical-rl",
                  fontWeight: 500,
                  color: "#2F2F2F",
                  letterSpacing: "0.20em",
                }}
              >
                scroll
              </span>
              <div className="w-px h-4" style={{ background: "linear-gradient(to bottom, #2F2F2F, transparent)" }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════ ATO 2 — ModuleShowcase ══════ */}
      <section className="relative z-[11]" style={{ background: SURFACE_BASE }}>
        <SN n="02" />
        <ModuleShowcase />
      </section>


      {/* ══════ 01 — COMO FUNCIONA (FlowSteps component) ══════ */}
      <div ref={howRef} id="como-funciona" className="relative">
        <SN n="03" />
        <FlowSteps />
      </div>


      {/* ══════ 02 — GALERIA (Base surface) — Tab showcase ══════ */}
      <section className="relative py-28 sm:py-32 px-6 overflow-hidden" style={{ background: SURFACE_BASE }}>
        <SN n="04" />
        <div className="relative z-20 max-w-[1200px] mx-auto">
          <GalleryShowcase />
        </div>
      </section>


      {/* ══════ 03 — POR QUE ESSYN (Alt surface) — Editorial Typographic Statement ══════ */}
      <section className="relative py-32 sm:py-36 px-6 overflow-hidden" style={{ background: SURFACE_ALT }}>
        <SN n="05" />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "#F2F2F7" }} />

        <div className="max-w-[900px] mx-auto">
          <GR>
            <div data-g>
              <span className="text-[11px] tracking-[0.18em] uppercase mb-8 block" style={{ fontWeight: 600, color: "#C3B9AF" }}>
                O que muda
              </span>
            </div>
          </GR>

          {/* Typographic editorial statement — numbers woven into prose */}
          <div className="space-y-10 sm:space-y-14">
            {[
              {
                number: "6",
                before: "",
                highlight: "módulos",
                after: "— projetos, produção, financeiro, galeria, agenda e CRM — numa interface só. Sem alt-tab. Sem planilha paralela.",
              },
              {
                number: "100%",
                before: "Financeiro",
                highlight: "brasileiro.",
                after: "PIX, boleto, parcelas, NF-e e conciliação bancária. Feito pra quem emite nota, cobra em real e precisa que funcione.",
              },
              {
                number: "10",
                before: "Até",
                highlight: "pessoas",
                after: "por equipe com papéis e permissões granulares. Cada membro vê exatamente o que precisa — nada mais, nada menos.",
              },
            ].map((item, i) => (
              <GR key={i} delay={i * 0.08}>
                <div data-g className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-baseline">
                  <span
                    className="text-[clamp(48px,8vw,88px)] tracking-[-0.06em] select-none"
                    style={{
                      fontWeight: 200,
                      fontFeatureSettings: "'tnum'",
                      color: "#EBE7E4",
                      fontFamily: serif,
                      lineHeight: 1,
                    }}
                  >
                    {item.number}
                  </span>
                  <p
                    className="text-[clamp(18px,2.2vw,24px)] tracking-[-0.02em] text-[#636366] max-w-[600px]"
                    style={{ fontWeight: 400, lineHeight: 1.55 }}
                  >
                    {item.before && <>{item.before}{" "}</>}
                    <span style={{ fontFamily: serif, fontWeight: 500, fontStyle: "italic", color: "#2D2D2D" }}>
                      {item.highlight}
                    </span>{" "}
                    {item.after}
                  </p>
                </div>
              </GR>
            ))}
          </div>

          <GR delay={0.3}>
            <div data-g className="mt-16 pt-8 flex items-center gap-4" style={{ borderTop: "1px solid #F2F2F7" }}>
              <span className="text-[13px] text-[#111111]" style={{ fontWeight: 700, letterSpacing: "0.06em" }}>ESSYN</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: gold }} />
              <span className="text-[12px] text-[#AEAEB2]" style={{ fontWeight: 400, fontStyle: "italic" }}>A plataforma completa para fotógrafos de eventos</span>
            </div>
          </GR>
        </div>
      </section>


      {/* ══════ 05 — ANTES vs DEPOIS (Alt surface) — Editorial Reduction ══════ */}
      <section className="relative py-32 sm:py-36 px-6 overflow-hidden" style={{ background: SURFACE_ALT }}>
        <SN n="06" />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "#F2F2F7" }} />

        <div className="relative z-10 max-w-[900px] mx-auto">
          <GR className="mb-16">
            <div data-g className="max-w-[500px]">
              <span className="text-[11px] tracking-[0.18em] uppercase mb-5 block" style={{ fontWeight: 600, color: "#C3B9AF" }}>
                Simplificação
              </span>
              <h2 className="text-[clamp(32px,4.5vw,52px)] tracking-[-0.04em] text-[#111111]" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.08 }}>
                Seis ferramentas.<br /><span className="italic" style={{ color: "#C8BFB5" }}>Uma decisão.</span>
              </h2>
            </div>
          </GR>

          <GR>
            <div data-g className="grid md:grid-cols-[1fr_60px_1fr] gap-0 md:gap-0 items-stretch">
              {/* ANTES — strikethrough list */}
              <div className="py-8 md:py-10">
                <span className="text-[10px] tracking-[0.14em] uppercase text-[#C7C7CC] block mb-6" style={{ fontWeight: 600 }}>Antes</span>
                <div className="space-y-4">
                  {beforeTools.map((t, i) => (
                    <GR key={t.name} delay={0.05 + i * 0.04}>
                      <div data-g className="flex items-center gap-4">
                        <span
                          className="text-[clamp(16px,1.8vw,20px)] text-[#AEAEB2] line-through decoration-[#D1D1D6]"
                          style={{ fontWeight: 400, textDecorationThickness: "1.5px" }}
                        >
                          {t.name}
                        </span>
                        <span className="text-[10px] text-[#C7C7CC]" style={{ fontWeight: 400, fontStyle: "italic" }}>{t.role}</span>
                      </div>
                    </GR>
                  ))}
                </div>
                <p className="text-[12px] text-[#AEAEB2] mt-8" style={{ fontWeight: 400, fontStyle: "italic", lineHeight: 1.6 }}>
                  Informação espalhada. Retrabalho. Contexto perdido entre apps.
                </p>
              </div>

              {/* Divider — vertical accent line */}
              <div className="hidden md:flex items-stretch justify-center">
                <div className="w-px h-full" style={{ background: "linear-gradient(to bottom, transparent, #E6E2DD 20%, #E6E2DD 80%, transparent)" }} />
              </div>
              <div className="md:hidden h-px my-6" style={{ background: "linear-gradient(to right, transparent, #EBE7E4, transparent)" }} />

              {/* DEPOIS — single block */}
              <div className="py-8 md:py-10 md:pl-10">
                <span className="text-[10px] tracking-[0.14em] uppercase block mb-6" style={{ fontWeight: 600, color: "#C3B9AF" }}>Depois</span>
                <div className="mb-6">
                  <span
                    className="text-[clamp(36px,5vw,56px)] tracking-[-0.04em] text-[#111111]"
                    style={{ fontWeight: 700, lineHeight: 1 }}
                  >
                    ESSYN
                  </span>
                  <span className="inline-block w-2 h-2 rounded-full ml-2 -translate-y-3" style={{ background: gold }} />
                </div>
                <div className="space-y-2">
                  {["Projetos", "Produção", "Financeiro", "Galeria", "Agenda", "CRM"].map((m, i) => (
                    <GR key={m} delay={0.1 + i * 0.04}>
                      <div data-g className="flex items-center gap-3">
                        <span className="w-4 h-px" style={{ background: "#DCD6D0" }} />
                        <span className="text-[15px] text-[#636366]" style={{ fontWeight: 400 }}>{m}</span>
                      </div>
                    </GR>
                  ))}
                </div>
                <p className="text-[12px] text-[#8E8E93] mt-8" style={{ fontWeight: 400, fontStyle: "italic", lineHeight: 1.6 }}>
                  Um sistema. Tudo conectado. Nenhum dado perdido.
                </p>
              </div>
            </div>
          </GR>
        </div>
      </section>


      {/* ══════ 06 — TESTIMONIALS (Warm ivory + Philosophers) ══════ */}
      <div className="relative">
        <SN n="07" />
        <TestimonialsSection testimonials={testimonials} serif={serif} />
      </div>


      {/* ══════ 07 — SEGURANÇA (Base surface) ══════ */}
      <section className="relative py-28 px-6" style={{ background: SURFACE_BASE }}>
        <SN n="08" />
        <div className="max-w-[1100px] mx-auto">
          <GR className="mb-12 text-center">
            <span data-g className="text-[11px] tracking-[0.12em] uppercase text-[#C3B9AF] mb-4 block" style={{ fontWeight: 600 }}>Confiança</span>
            <h2 data-g className="text-[clamp(28px,4vw,48px)] tracking-[-0.035em] text-[#111111]" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.12 }}>
              Segurança que você<br /><span className="italic" style={{ color: "#C8BFB5" }}>pode verificar</span>
            </h2>
          </GR>
          <GR>
            <div data-g className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: ShieldCheck, label: "TLS 1.3", desc: "Dados criptografados em trânsito e em repouso" },
                { icon: Lock, label: "LGPD", desc: "Conformidade total. Exporte ou exclua seus dados" },
                { icon: Zap, label: "99.9% uptime", desc: "Infraestrutura redundante com monitoramento 24/7" },
                { icon: Shield, label: "Backups diários", desc: "Recuperação ponto-a-ponto com retenção de 30 dias" },
              ].map((b) => (
                <div key={b.label} className="group rounded-2xl border border-[#E5E5EA] bg-white p-6 hover:border-[#E5E5EA] hover:shadow-[0_6px_24px_#F5F5F7] transition-all duration-300" style={{ boxShadow: "0 1px 4px #F5F5F7" }}>
                  <div className="w-10 h-10 rounded-xl bg-[#F7F5F4] flex items-center justify-center mb-4 group-hover:bg-[#F3F1EF] transition-colors duration-300">
                    <b.icon className="w-[18px] h-[18px] text-[#CDC5BC]" />
                  </div>
                  <span className="text-[14px] text-[#111111] block mb-1.5" style={{ fontWeight: 600 }}>{b.label}</span>
                  <span className="text-[12px] text-[#8E8E93] block" style={{ fontWeight: 400, lineHeight: 1.6 }}>{b.desc}</span>
                </div>
              ))}
            </div>
          </GR>
        </div>
      </section>


      {/* ══════ 08 — PLANOS (Alt surface) ══════ */}
      <section ref={planosRef} id="planos" className="relative py-32 px-6" style={{ background: SURFACE_ALT }}>
        <SN n="09" />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "#F2F2F7" }} />

        <div className="max-w-[1100px] mx-auto px-6">
          <GR className="mb-12 text-center">
            <span data-g className="text-[11px] tracking-[0.12em] uppercase text-[#C3B9AF] mb-4 block" style={{ fontWeight: 600 }}>Seu plano</span>
            <h2 data-g className="text-[clamp(28px,4vw,48px)] tracking-[-0.035em] text-[#111111]" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.12 }}>
              Escolha o tamanho<br /><span className="italic" style={{ color: "#C8BFB5" }}>do seu controle</span>
            </h2>
          </GR>

          <GR className="flex justify-center mb-10">
            <div data-g className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] p-1">
              {(["monthly", "yearly"] as const).map((b) => (
                <button key={b} onClick={() => setBilling(b)} className={`relative px-5 py-2 rounded-full text-[13px] transition-all cursor-pointer ${billing === b ? "text-white" : "text-[#8E8E93]"}`} style={{ fontWeight: billing === b ? 500 : 400 }}>
                  {billing === b && <motion.div layoutId="bp14" className="absolute inset-0 bg-[#111111] rounded-full" transition={springToggle} style={{ zIndex: 0 }} />}
                  <span className="relative z-10">{b === "monthly" ? "Mensal" : "Anual"}</span>
                </button>
              ))}
              {billing === "yearly" && <span className="px-2.5 py-1 rounded-full bg-[#F5F3F1] text-[11px] text-[#9C8B7A] ml-1" style={{ fontWeight: 600 }}>-20%</span>}
            </div>
          </GR>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <GR key={plan.id} delay={i * 0.1}>
                <div data-g className={`relative rounded-2xl border p-8 flex flex-col h-full transition-all duration-300 overflow-hidden ${plan.recommended ? "border-[#E6E2DD] bg-white shadow-[0_12px_40px_#F0EDEB]" : "border-[#E5E5EA] bg-white hover:shadow-[0_6px_24px_#F5F5F7]"}`} style={{ boxShadow: plan.recommended ? undefined : "0 1px 4px #F5F5F7" }}>
                  {plan.recommended && <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #CDC5BC, transparent)" }} />}
                  {plan.recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] text-white" style={{ fontWeight: 600, background: gold }}>RECOMENDADO</span>}
                  <span className={`text-[12px] mb-1 ${plan.recommended ? "text-[#B5A99E]" : "text-[#8E8E93]"}`} style={{ fontWeight: 500 }}>{plan.tagline}</span>
                  <h3 className="text-[22px] tracking-[-0.02em] mb-4 text-[#111111]" style={{ fontWeight: 600 }}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-7">
                    <span className="text-[38px] tracking-[-0.04em] text-[#111111]" style={{ fontWeight: 700 }}>R${billing === "monthly" ? plan.monthly : plan.yearly}</span>
                    <span className="text-[13px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>/mês</span>
                  </div>
                  <div className="flex flex-col gap-3.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2.5">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 ${plan.recommended ? "text-[#9C8B7A]" : "text-[#CDC5BC]"}`} />
                        <span className={`text-[13px] ${plan.recommended ? "text-[#636366]" : "text-[#636366]"}`} style={{ fontWeight: 400 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={`${P}/planos`} className={`group relative flex items-center justify-center gap-2 text-[14px] py-3.5 rounded-full overflow-hidden transition-all duration-300 ${plan.recommended ? "bg-[#9C8B7A] text-white" : "border border-[#E5E5EA] text-[#111111] hover:border-[#C7C7CC]"}`} style={{ fontWeight: 500 }}>
                    <span className={`absolute inset-0 ${plan.recommended ? "bg-[#8A7B6B]" : "bg-[#9C8B7A]"} translate-y-full group-hover:translate-y-0 transition-transform duration-500`} style={{ transitionTimingFunction: ease }} />
                    <span className="relative z-10 group-hover:text-white transition-colors duration-300">Ver detalhes</span>
                    <ArrowRight className="w-3.5 h-3.5 relative z-10 group-hover:text-white transition-colors duration-300" />
                  </Link>
                </div>
              </GR>
            ))}
          </div>

          <GR className="text-center mt-6">
            <p data-g className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 400 }}>Todos os planos incluem 14 dias grátis · Cancele quando quiser · Sem multa</p>
          </GR>
        </div>
      </section>


      {/* ══════ FAQ (Base surface) ══════ */}
      <section ref={faqRef} id="faq" className="relative py-28 px-6" style={{ background: SURFACE_BASE }}>
        <SN n="10" />
        <div className="max-w-[680px] mx-auto">
          <GR className="mb-12 text-center">
            <span data-g className="text-[11px] tracking-[0.12em] uppercase text-[#C3B9AF] mb-4 block" style={{ fontWeight: 600 }}>Perguntas</span>
            <h2 data-g className="text-[clamp(28px,4vw,48px)] tracking-[-0.035em] text-[#111111]" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.12 }}>
              Perguntas <span className="italic" style={{ color: "#C8BFB5" }}>&amp; respostas</span>
            </h2>
          </GR>

          <div className="flex flex-col gap-2">
            {faqs.map((faq, i) => (
              <GR key={i} delay={i * 0.04}>
                <button data-g onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left rounded-2xl border border-[#E5E5EA] bg-white px-6 py-5 transition-all duration-300 hover:border-[#E5E5EA] hover:shadow-[0_4px_16px_#F5F5F7] cursor-pointer" style={{ boxShadow: "0 1px 4px #FAFAFA" }}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[14px] text-[#111111]" style={{ fontWeight: 500, lineHeight: 1.4 }}>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#AEAEB2] flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                  </div>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={springDefault} className="overflow-hidden">
                        <p className="text-[13px] text-[#636366] pt-3" style={{ fontWeight: 400, lineHeight: 1.65 }}>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </GR>
            ))}
          </div>

          <GR className="text-center mt-6">
            <Link data-g to={`${P}/faq`} className="inline-flex items-center gap-2 text-[13px] text-[#8E8E93] hover:text-[#B0A295] transition-colors" style={{ fontWeight: 500 }}>
              Ver todas as perguntas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </GR>
        </div>
      </section>


      {/* ══════ CTA FINAL (Alt surface) — Editorial closing chapter ══════ */}
      <section className="relative pt-20 sm:pt-24 lg:pt-28 pb-0 px-6 overflow-hidden" style={{ background: SURFACE_ALT }}>
        <SN n="11" />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "#F2F2F7" }} />

        <div className="max-w-[800px] mx-auto text-center">
          <GR>
            <h2 data-g className="text-[clamp(32px,5.2vw,60px)] tracking-[-0.035em] text-[#111111] mb-5" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.08 }}>
              Seu próximo capítulo<br /><span className="italic" style={{ color: "#C8BFB5" }}>começa aqui.</span>
            </h2>
            <div data-g className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <MagLink to={`${P}/criar-conta`} variant="dark">
                <span className="relative z-10 flex items-center gap-2.5 text-[16px]">Criar meu estúdio <ArrowRight className="w-5 h-5" /></span>
              </MagLink>
              <MagBtn onClick={() => scrollTo(planosRef)} variant="outline">
                <span className="relative z-10 flex items-center gap-2.5 text-[16px]">Ver planos <ChevronDown className="w-5 h-5" /></span>
              </MagBtn>
            </div>
            <p data-g className="text-[13px] text-[#AEAEB2] mb-0" style={{ fontWeight: 400 }}>Sem cartão · Sem compromisso · Suporte humano</p>
          </GR>
        </div>

        {/* Product Showcase — Cinematic device mockups */}
        <CTAShowcase />
      </section>
    </div>
  );
}