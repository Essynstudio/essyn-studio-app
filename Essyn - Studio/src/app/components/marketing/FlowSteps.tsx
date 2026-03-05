// FlowSteps v3.0 — "Três Movimentos" editorial redesign 2026-02-26
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import {
  FileSignature, MessageSquare, CalendarCheck,
  Kanban, Users, CreditCard,
  Image, Star, History,
  Send, Clock, Heart, Download, Eye, ArrowRight,
} from "lucide-react";
import { GR, SERIF, SERIF_SWASH, GOLD, INK } from "../ui/editorial";

/* ══════════════════════════════════════════
   Design Tokens
   ══════════════════════════════════════════ */
const T = {
  bg: "#F5F5F7",
  cardBg: "#FFFFFF",
  hairline: "#F2F2F7",
  goldHairline: "#EBE7E4",
  numberColor: "#F8F6F5",
  numberColorActive: "#F3F1EF",
  eyebrow: "#C8BFB5",
  headline: INK,
  body: "#636366",
  muted: "#AEAEB2",
  subtle: "#D1D1D6",
} as const;

/* ══════════════════════════════════════════
   Step Data
   ══════════════════════════════════════════ */
const steps = [
  {
    n: "01",
    roman: "I",
    title: "Feche o evento",
    subtitle: "Do primeiro contato ao contrato assinado",
    desc: "Lead, proposta, agenda e automação WhatsApp — em um clique. O cliente sente profissionalismo desde a primeira mensagem.",
    essence: "Captação",
    chips: [
      { icon: MessageSquare, label: "WhatsApp IA" },
      { icon: FileSignature, label: "Propostas" },
      { icon: CalendarCheck, label: "Agenda" },
    ],
    modules: "Projetos + CRM",
  },
  {
    n: "02",
    roman: "II",
    title: "Trabalhe com clareza",
    subtitle: "Pipeline visual e equipe sincronizada",
    desc: "Tarefas por etapa, cobranças automáticas e zero planilha. Cada projeto avança com ritmo e transparência.",
    essence: "Produção",
    chips: [
      { icon: Kanban, label: "Pipeline" },
      { icon: Users, label: "Equipe" },
      { icon: CreditCard, label: "Cobranças" },
    ],
    modules: "Produção + Financeiro",
  },
  {
    n: "03",
    roman: "III",
    title: "Entregue e receba",
    subtitle: "Galeria premium com seleção e proofing",
    desc: "Download, pagamentos conciliados e histórico completo. A última impressão do cliente é tão memorável quanto a primeira.",
    essence: "Entrega",
    chips: [
      { icon: Image, label: "Galeria" },
      { icon: Star, label: "Seleção" },
      { icon: History, label: "Histórico" },
    ],
    modules: "Galeria + Financeiro",
  },
];

/* ══════════════════════════════════════════
   Preview Components — refined UI mockups
   ══════════════════════════════════════════ */

function PreviewCRM() {
  const leads = [
    { name: "Camila & Rafael", type: "Casamento", status: "Proposta enviada", dot: "#CDC5BC" },
    { name: "Studio TechCorp", type: "Corporativo", status: "Contrato assinado", dot: "#34C759" },
    { name: "Ana Beatriz", type: "Ensaio", status: "Aguardando", dot: "#C7C7CC" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] tracking-[0.10em] uppercase" style={{ fontWeight: 600, color: T.muted }}>
          Leads recentes
        </span>
        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "#F7F5F4", color: GOLD, fontWeight: 600 }}>
          3 novos
        </span>
      </div>
      {leads.map((lead) => (
        <div
          key={lead.name}
          className="flex items-center gap-3 rounded-xl p-3"
          style={{ background: "#FAFAFA", border: "1px solid #F5F5F7" }}
        >
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: "#F7F5F4" }}>
            <span className="text-[10px]" style={{ fontWeight: 700, color: GOLD }}>{lead.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] truncate" style={{ fontWeight: 600, color: "#48484A" }}>{lead.name}</p>
            <p className="text-[9px]" style={{ fontWeight: 400, color: "#AEAEB2" }}>{lead.type}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: lead.dot }} />
            <span className="text-[9px] hidden sm:inline" style={{ fontWeight: 500, color: "#AEAEB2" }}>{lead.status}</span>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2">
        <div className="flex-1 h-px" style={{ background: T.hairline }} />
        <span className="inline-flex items-center gap-1 text-[9px]" style={{ fontWeight: 500, color: T.eyebrow }}>
          <Send className="w-2.5 h-2.5" /> Enviar proposta
        </span>
        <div className="flex-1 h-px" style={{ background: T.hairline }} />
      </div>
    </div>
  );
}

function PreviewPipeline() {
  const columns = [
    { label: "Briefing", items: [{ title: "Maria & João", tag: "Casamento", p: 25 }, { title: "Ensaio Ana", tag: "Ensaio", p: 10 }] },
    { label: "Produção", items: [{ title: "TechCorp", tag: "Corporativo", p: 60 }, { title: "Edu & Carol", tag: "Casamento", p: 55 }] },
    { label: "Revisão", items: [{ title: "Batizado Theo", tag: "Batizado", p: 90 }] },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-[0.10em] uppercase" style={{ fontWeight: 600, color: T.muted }}>Pipeline</span>
        <span className="text-[9px]" style={{ fontWeight: 500, color: T.muted }}>5 projetos</span>
      </div>
      <div className="flex gap-2">
        {columns.map((col) => (
          <div key={col.label} className="flex-1 rounded-xl p-2" style={{ background: "#FAFAFA", border: "1px solid #F5F5F7" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px]" style={{ fontWeight: 600, color: "#8E8E93" }}>{col.label}</span>
              <span className="text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "#F5F5F7", color: T.muted, fontWeight: 700 }}>{col.items.length}</span>
            </div>
            <div className="space-y-1.5">
              {col.items.map((item) => (
                <div key={item.title} className="rounded-lg p-2" style={{ background: "#FFFFFF", border: "1px solid #F5F5F7" }}>
                  <p className="text-[9px] truncate mb-1" style={{ fontWeight: 600, color: "#48484A" }}>{item.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px]" style={{ fontWeight: 400, color: T.muted }}>{item.tag}</span>
                    <div className="w-8 h-[3px] rounded-full overflow-hidden" style={{ background: "#F5F5F7" }}>
                      <div className="h-full rounded-full" style={{ width: `${item.p}%`, background: item.p > 70 ? "#34C759" : "#D7D0C9" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewGallery() {
  const photos = [
    { id: 1, sel: true }, { id: 2, sel: true }, { id: 3, sel: false },
    { id: 4, sel: true }, { id: 5, sel: false }, { id: 6, sel: true },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-[0.10em] uppercase" style={{ fontWeight: 600, color: T.muted }}>Galeria — Maria & João</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "#F2F8F4", color: "#34C759", fontWeight: 600 }}>Entregue</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {photos.map((p) => (
          <div
            key={p.id}
            className="relative aspect-[4/3] rounded-lg overflow-hidden"
            style={{
              background: `linear-gradient(135deg, #F8F6F5 0%, #F5F5F7 100%)`,
              border: p.sel ? "1.5px solid #E1DCD7" : "1px solid #F5F5F7",
            }}
          >
            {p.sel && (
              <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "#AFA294" }}>
                <Heart className="w-2 h-2 text-white" fill="white" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-0.5">
        <span className="inline-flex items-center gap-1 text-[9px]" style={{ fontWeight: 500, color: T.muted }}>
          <Eye className="w-2.5 h-2.5" /> 324 fotos
        </span>
        <span className="inline-flex items-center gap-1 text-[9px]" style={{ fontWeight: 500, color: T.eyebrow }}>
          <Heart className="w-2.5 h-2.5" /> 86 selecionadas
        </span>
        <span className="inline-flex items-center gap-1 text-[9px] text-[#34C759]" style={{ fontWeight: 500, opacity: 0.5 }}>
          <Download className="w-2.5 h-2.5" /> Pronto
        </span>
      </div>
    </div>
  );
}

const previews = [PreviewCRM, PreviewPipeline, PreviewGallery];

/* ══════════════════════════════════════════
   MovementCard — each "act" of the workflow
   ══════════════════════════════════════════ */
function MovementCard({
  step,
  index,
  isActive,
  onActivate,
}: {
  step: (typeof steps)[0];
  index: number;
  isActive: boolean;
  onActivate: () => void;
}) {
  const Preview = previews[index];
  const isEven = index % 2 === 0;

  return (
    <div data-flow-card className="relative">
      {/* ── Golden connector between cards ── */}
      {index > 0 && (
        <div className="flex items-center justify-center py-6 md:py-10">
          <div className="flex items-center gap-4">
            <div className="w-16 md:w-24 h-px" style={{ background: "linear-gradient(90deg, transparent, #EDEAE7)" }} />
            <div className="w-[5px] h-[5px] rotate-45" style={{ background: "#E6E2DD" }} />
            <div className="w-16 md:w-24 h-px" style={{ background: "linear-gradient(90deg, #EDEAE7, transparent)" }} />
          </div>
        </div>
      )}

      {/* ── Card container ── */}
      <button
        onClick={onActivate}
        className="relative w-full text-left cursor-pointer group"
      >
        <div
          className="relative overflow-hidden transition-all duration-700"
          style={{
            borderRadius: 28,
            border: `1px solid ${isActive ? "#EBE7E4" : "#F2F2F7"}`,
            background: T.cardBg,
            boxShadow: isActive
              ? "0 20px 60px #F2F2F7, 0 1px 3px #F5F5F7"
              : "0 1px 3px #FAFAFA",
          }}
        >
          {/* ── Top gold hairline on active ── */}
          <div
            className="absolute top-0 left-8 right-8 h-px transition-opacity duration-700"
            style={{
              background: "linear-gradient(90deg, transparent, #E6E2DD, transparent)",
              opacity: isActive ? 1 : 0,
            }}
          />

          {/* ── Watermark number ── */}
          <span
            className="absolute select-none pointer-events-none transition-all duration-700"
            style={{
              fontFamily: SERIF_SWASH,
              fontSize: "clamp(140px, 20vw, 260px)",
              fontWeight: 300,
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
              color: isActive ? T.numberColorActive : T.numberColor,
              ...(isEven
                ? { right: "clamp(20px, 4vw, 60px)", top: "clamp(10px, 2vw, 30px)" }
                : { left: "clamp(20px, 4vw, 60px)", top: "clamp(10px, 2vw, 30px)" }),
            }}
            aria-hidden="true"
          >
            {step.roman}
          </span>

          {/* ── Content grid ── */}
          <div className={`relative z-10 flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} min-h-[320px] sm:min-h-[360px] md:min-h-[400px]`}>

            {/* ── Text side ── */}
            <div className={`flex-1 flex flex-col justify-center p-7 sm:p-10 md:p-14 ${isEven ? "md:pr-8" : "md:pl-8"}`}>
              {/* Eyebrow: step number + essence */}
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="text-[13px]"
                  style={{
                    fontWeight: 600,
                    fontFeatureSettings: "'tnum'",
                    color: isActive ? GOLD : "#D2CAC3",
                    opacity: 0.55,
                  }}
                >
                  {step.n}
                </span>
                <div className="w-5 h-px" style={{ background: T.goldHairline }} />
                <span
                  className="text-[10px] tracking-[0.14em] uppercase"
                  style={{ fontWeight: 600, color: T.eyebrow }}
                >
                  {step.essence}
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-[clamp(24px,3.5vw,38px)] tracking-[-0.03em] mb-2"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: T.headline,
                }}
              >
                {step.title}
              </h3>

              {/* Subtitle */}
              <p
                className="text-[13px] sm:text-[14px] italic mb-4"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 400,
                  color: "#D2CAC3",
                }}
              >
                {step.subtitle}
              </p>

              {/* Description */}
              <p
                className="text-[13px] sm:text-[14px] max-w-[380px] mb-6"
                style={{ fontWeight: 400, lineHeight: 1.75, color: T.body }}
              >
                {step.desc}
              </p>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-2 mb-5">
                {step.chips.map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full transition-all duration-500"
                    style={{
                      fontWeight: 500,
                      background: isActive ? "#F9F8F7" : "#F5F5F7",
                      color: isActive ? "#BEB3A8" : "#AEAEB2",
                    }}
                  >
                    <chip.icon
                      className="w-3 h-3"
                      style={{ color: isActive ? "#CDC5BC" : "#C7C7CC" }}
                    />
                    {chip.label}
                  </span>
                ))}
              </div>

              {/* Module tag */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-px" style={{ background: T.goldHairline }} />
                <span
                  className="text-[10px] tracking-[0.06em]"
                  style={{ fontWeight: 500, color: T.subtle }}
                >
                  {step.modules}
                </span>
              </div>
            </div>

            {/* ── Preview side ── */}
            <div className={`flex-1 flex items-center justify-center p-5 sm:p-8 md:p-10 ${isEven ? "md:pl-4" : "md:pr-4"}`}>
              <div
                className="w-full max-w-[380px] transition-all duration-700"
                style={{
                  borderRadius: 20,
                  border: "1px solid #F2F2F7",
                  background: "#FFFFFF",
                  padding: "clamp(16px, 2vw, 24px)",
                  boxShadow: isActive
                    ? "0 12px 40px #F2F2F7, 0 1px 3px #FAFAFA"
                    : "0 2px 8px #F5F5F7",
                  transform: isActive ? "translateY(-4px)" : "translateY(0)",
                }}
              >
                <Preview />
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   FlowSteps — Main Section Export
   ══════════════════════════════════════════ */
export function FlowSteps() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInteractedRef = useRef(false);

  /* ── GSAP scroll-triggered stagger ── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const cards = el.querySelectorAll("[data-flow-card]");
    if (!cards.length) return;

    gsap.set(cards, { y: 48, opacity: 0 });

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(cards, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            stagger: 0.2,
            delay: 0.15,
          });
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── Auto-advance stepper ── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasInteractedRef.current) {
          intervalRef.current = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % steps.length);
          }, 4000);
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      },
      { threshold: 0.25 },
    );

    obs.observe(el);
    return () => {
      obs.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /* ── Manual selection stops auto-cycle ── */
  const handleSelect = useCallback((index: number) => {
    hasInteractedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveStep(index);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        background: T.bg,
        padding: "clamp(72px, 10vh, 120px) clamp(16px, 5vw, 40px)",
      }}
    >
      {/* ── Top hairline ── */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: T.hairline }} />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-[1080px] mx-auto">

        {/* ── Section header ── */}
        <GR>
          <div className="text-center mb-16 md:mb-20">
            {/* Eyebrow */}
            <div data-g className="flex items-center justify-center gap-3 mb-5">
              <div className="w-8 h-px" style={{ background: T.goldHairline }} />
              <span
                className="text-[10px] tracking-[0.18em] uppercase"
                style={{ fontWeight: 600, color: T.eyebrow }}
              >
                Seu fluxo
              </span>
              <div className="w-8 h-px" style={{ background: T.goldHairline }} />
            </div>

            {/* Headline */}
            <h2
              data-g
              className="text-[clamp(30px,5vw,56px)] tracking-[-0.035em] mb-5"
              style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.08, color: T.headline }}
            >
              Três movimentos,<br />
              <span className="italic" style={{ color: "#D2CAC3" }}>
                uma cadência.
              </span>
            </h2>

            {/* Subline */}
            <p
              data-g
              className="text-[14px] sm:text-[15px] max-w-[440px] mx-auto"
              style={{ fontWeight: 400, lineHeight: 1.7, color: T.body }}
            >
              Do primeiro lead à última foto entregue — tudo conectado,
              rastreável e automático.
            </p>
          </div>
        </GR>

        {/* ── Step navigation pills ── */}
        <div className="flex items-center justify-center gap-2 mb-12 md:mb-16">
          {steps.map((step, i) => (
            <button
              key={step.n}
              onClick={() => handleSelect(i)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-500"
              style={{
                background: activeStep === i ? "#F7F5F4" : "transparent",
                border: `1px solid ${activeStep === i ? "#EDEAE7" : "#F2F2F7"}`,
              }}
            >
              <span
                className="text-[11px] transition-colors duration-500"
                style={{
                  fontWeight: 600,
                  fontFeatureSettings: "'tnum'",
                  color: activeStep === i ? GOLD : T.subtle,
                }}
              >
                {step.n}
              </span>
              <span
                className="text-[12px] hidden sm:inline transition-colors duration-500"
                style={{
                  fontWeight: 500,
                  color: activeStep === i ? "#636366" : T.muted,
                }}
              >
                {step.essence}
              </span>
            </button>
          ))}
        </div>

        {/* ── Movement cards ── */}
        {steps.map((step, i) => (
          <MovementCard
            key={step.n}
            step={step}
            index={i}
            isActive={activeStep === i}
            onActivate={() => handleSelect(i)}
          />
        ))}

        {/* ── Bottom closing flourish ── */}
        <div className="flex flex-col items-center mt-12 md:mt-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-px" style={{ background: "linear-gradient(90deg, transparent, #F0EDEB)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#E6E2DD" }} />
            <div className="w-12 h-px" style={{ background: "linear-gradient(90deg, #F0EDEB, transparent)" }} />
          </div>
          <span
            className="text-[10px] tracking-[0.16em] uppercase"
            style={{ fontWeight: 500, color: "#E1DCD7" }}
          >
            fluxo contínuo
          </span>
        </div>
      </div>

      {/* ── Bottom hairline ── */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: T.hairline }} />
    </section>
  );
}