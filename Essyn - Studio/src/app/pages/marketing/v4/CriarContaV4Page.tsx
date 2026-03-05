// v3 criar-conta V4 campaign-premium portal — Tesla editorial 2026-02-25
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { springDefault, springSnappy } from "../../../lib/motion-tokens";
import gsap from "gsap";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Check, ChevronLeft } from "lucide-react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { SERIF, SERIF_SWASH, EASE, GOLD, INK } from "../../../components/ui/editorial";
import teslaImg from "figma:asset/e953bdff71ac66fb2394a9af776da021bd8fdac3.png";

const P = "/v4";

/* ══════════════════════════════════════════
   Design tokens — local to this portal page
   ══════════════════════════════════════════ */
const T = {
  // Typography
  serif: SERIF,
  serifSwash: SERIF_SWASH,
  // Colors — solid equivalents (no rgba)
  ink: INK,                         // #111111
  gold: GOLD,                       // #9C8B7A
  labelColor: "#3A3A3C",            // was 90% ink on white
  placeholderColor: "#AEAEB2",      // was 42% ink on white
  microcopyColor: "#8E8E93",        // was 55% ink on white
  secondaryColor: "#636366",        // was 62% ink on white
  // Surfaces
  inputBorder: "#E5E5EA",
  inputBg: "#FAFAFA",
  inputFocusBorder: "#D2CAC3",
  inputFocusRing: "#F5F3F2",
  inputFocusShadow: "0 0 0 4px #F9F8F7, 0 1px 3px #F5F5F7",
  // Radii
  inputRadius: 12,
  btnRadius: 9999,
} as const;

/* ── Password Strength ────────────────── */
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "6+ caracteres", pass: password.length >= 6 },
    { label: "Letra maiúscula", pass: /[A-Z]/.test(password) },
    { label: "Número", pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  if (!password) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={springDefault}
      className="overflow-hidden pt-1"
    >
      {/* Strength bars */}
      <div className="flex gap-1.5 mb-2.5">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-[2.5px] flex-1 rounded-full transition-colors duration-400"
            style={{
              background: score >= n
                ? score === 3 ? T.gold : score === 2 ? "#C8BFB5" : "#E3DDD7"
                : "#F5F5F7",
            }}
          />
        ))}
      </div>
      {/* Check items */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {checks.map((c) => (
          <span
            key={c.label}
            className="text-[11px] flex items-center gap-1.5 transition-colors duration-200"
            style={{ fontWeight: 400, color: c.pass ? T.gold : "#AEAEB2" }}
          >
            {c.pass
              ? <Check className="w-3 h-3" strokeWidth={2.5} />
              : <span className="w-3 h-3 rounded-full border inline-block" style={{ borderColor: "#E5E5EA" }} />
            }
            {c.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Input component ──────────────────── */
function FormInput({
  label, type = "text", value, onChange, placeholder, disabled, autoFocus, rightSlot,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  autoFocus?: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div data-auth-el className="flex flex-col gap-2">
      <label
        className="text-[12px] tracking-[0.01em]"
        style={{ fontWeight: 500, color: T.labelColor }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="w-full text-[14px] outline-none transition-all duration-200"
          style={{
            fontWeight: 400,
            color: T.ink,
            padding: rightSlot ? "14px 44px 14px 16px" : "14px 16px",
            borderRadius: T.inputRadius,
            border: `1px solid ${T.inputBorder}`,
            background: T.inputBg,
            // placeholder via CSS-in-JS doesn't work — handled by class below
          }}
          // Focus styles applied via onFocus/onBlur for precise control
          onFocus={(e) => {
            e.currentTarget.style.borderColor = T.inputFocusBorder;
            e.currentTarget.style.background = "#FFFFFF";
            e.currentTarget.style.boxShadow = T.inputFocusShadow;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = T.inputBorder;
            e.currentTarget.style.background = T.inputBg;
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>
      {/* Placeholder color via style tag */}
      <style>{`
        input::placeholder { color: ${T.placeholderColor} !important; }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════
   Page Component
   ══════════════════════════════════════════ */
export function CriarContaV4Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);

  /* ── GSAP entrance choreography ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Form elements — staggered cascade
      gsap.fromTo(
        "[data-auth-el]",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.065, delay: 0.12 },
      );
    }, formRef);
    return () => ctx.revert();
  }, []);

  /* ── Quote entrance (desktop) ── */
  useEffect(() => {
    if (!quoteRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-quote-el]",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.5 },
      );
    }, quoteRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) { setError("Preencha todos os campos."); return; }
    if (password.length < 6) { setError("Senha deve ter no mínimo 6 caracteres."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate(`${P}/verificar-email?email=${encodeURIComponent(email)}`); }, 1200);
  };

  /* ── Plan label helper ── */
  const planLabel = planParam
    ? ` no plano ${planParam.charAt(0).toUpperCase() + planParam.slice(1)}`
    : "";

  return (
    <div
      className="min-h-screen flex flex-col lg:grid lg:grid-cols-2"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* DEBUG badge */}
      <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#3A3A3C", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px #3C3C43" }}>
        <span className="text-[11px] text-[#9C8B7A]" style={{ fontWeight: 700 }}>13</span>
        <span className="w-px h-3 bg-[#48484A]" />
        <span className="text-[11px] text-[#AEAEB2]" style={{ fontWeight: 500 }}>Criar Conta</span>
        <span className="w-px h-3 bg-[#48484A]" />
        <span className="text-[9px] text-[#636366]" style={{ fontWeight: 400 }}>/v4/criar-conta</span>
      </div>

      {/* ── Film grain ── */}
      <div className="pointer-events-none fixed inset-0 z-[999] opacity-[0.012]" aria-hidden="true">
        <svg width="100%" height="100%">
          <filter id="grainCriar"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#grainCriar)" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════
          PANEL A — Form (left)
          50% width desktop · full width mobile
          ══════════════════════════════════════════════════════ */}
      <div className="relative flex flex-col bg-white order-2 lg:order-1">

        {/* ── Portal Navbar ── 64px, product-grade ── */}
        <nav
          className="flex items-center justify-between shrink-0"
          style={{ height: 64, padding: "0 clamp(24px, 4vw, 40px)" }}
        >
          {/* Logo */}
          <Link to={P} className="flex items-center gap-1.5 group" aria-label="ESSYN home">
            <span
              className="text-[16px] tracking-[-0.05em]"
              style={{ fontWeight: 700, color: T.ink }}
            >
              ESSYN
            </span>
            <span
              className="w-[5px] h-[5px] rounded-full transition-transform duration-300 group-hover:scale-[1.3]"
              style={{ background: T.gold }}
            />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <Link
              to={P}
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-[#F5F5F7]"
              style={{ fontWeight: 400, color: "#8E8E93" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Voltar ao site</span>
            </Link>
            {/* Separator dot */}
            <span className="hidden sm:block w-[3px] h-[3px] rounded-full mx-2" style={{ background: "#E5E5EA" }} />
            <Link
              to={`${P}/entrar`}
              className="text-[13px] px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-[#F5F5F7]"
              style={{ fontWeight: 500, color: T.secondaryColor }}
            >
              Entrar
            </Link>
          </div>
        </nav>

        {/* ── Hairline under nav ── */}
        <div className="h-px mx-6 lg:mx-10" style={{ background: "#F2F2F7" }} />

        {/* ── Mobile: Tesla hero strip (40vh) ── */}
        <div className="lg:hidden relative w-full overflow-hidden" style={{ height: "38vh", minHeight: 220, maxHeight: 340 }}>
          <ImageWithFallback
            src={teslaImg}
            alt="Nikola Tesla — retrato editorial"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 20%" }}
          />
          {/* Warm gradient — 3-stop for smooth falloff */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(0deg, #111111 0%, transparent 70%)",
              opacity: 0.6,
            }}
          />
          {/* Quote — compact mobile version */}
          <div className="absolute bottom-5 left-6 right-6 z-10">
            <span
              className="text-[9px] tracking-[0.2em] uppercase block mb-1.5"
              style={{ fontWeight: 500, color: "#636366", fontVariant: "small-caps" }}
            >
              NIKOLA TESLA
            </span>
            <p
              className="text-[17px] tracking-[-0.015em]"
              style={{ fontFamily: T.serifSwash, fontWeight: 400, lineHeight: 1.25, color: "#D1D1D6" }}
            >
              "O <em style={{ fontStyle: "italic", color: "#62584E" }}>futuro</em> pertence a mim."
            </p>
          </div>
        </div>

        {/* ── Form container ──
            Vertically centered with slight upward bias (-2vh)
            to align visually with Tesla's upper-chest / face area ── */}
        <div
          ref={formRef}
          className="flex-1 flex items-center justify-center"
          style={{ padding: "clamp(32px, 5vh, 56px) clamp(24px, 5vw, 48px)" }}
        >
          <div className="w-full" style={{ maxWidth: 420 }}>
            {/* ── Headline ── */}
            <h1
              data-auth-el
              className="text-[28px] sm:text-[30px] tracking-[-0.035em] mb-3"
              style={{ fontWeight: 600, lineHeight: 1.15, color: T.ink }}
            >
              Crie sua conta
            </h1>

            {/* ── Subtitle ── */}
            <p
              data-auth-el
              className="text-[14px] mb-9"
              style={{
                fontWeight: 400,
                lineHeight: 1.6,
                color: T.secondaryColor,
              }}
            >
              14 dias grátis{planLabel}. Sem cartão de crédito.
            </p>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
              <FormInput
                label="Nome completo"
                value={name}
                onChange={(v) => { setName(v); setError(""); }}
                placeholder="Como prefere ser chamado"
                disabled={loading}
                autoFocus
              />

              <FormInput
                label="E-mail"
                type="email"
                value={email}
                onChange={(v) => { setEmail(v); setError(""); }}
                placeholder="seu@email.com"
                disabled={loading}
              />

              <div data-auth-el className="flex flex-col gap-2">
                <label
                  className="text-[12px] tracking-[0.01em]"
                  style={{ fontWeight: 500, color: T.labelColor }}
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                    className="w-full text-[14px] outline-none transition-all duration-200"
                    style={{
                      fontWeight: 400,
                      color: T.ink,
                      padding: "14px 44px 14px 16px",
                      borderRadius: T.inputRadius,
                      border: `1px solid ${T.inputBorder}`,
                      background: T.inputBg,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = T.inputFocusBorder;
                      e.currentTarget.style.background = "#FFFFFF";
                      e.currentTarget.style.boxShadow = T.inputFocusShadow;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = T.inputBorder;
                      e.currentTarget.style.background = T.inputBg;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150 cursor-pointer"
                    style={{ color: "#AEAEB2" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#8E8E93")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#AEAEB2")}
                    aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={springSnappy}
                    className="flex items-center gap-2 text-[12px]"
                    style={{ color: "#FF3B30" }}
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── CTA — full-width pill ── */}
              <button
                data-auth-el
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-2 overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-default"
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  padding: "15px 24px",
                  borderRadius: T.btnRadius,
                  background: T.ink,
                  color: "#FFFFFF",
                  marginTop: 4,
                  transition: `transform 300ms ${EASE}, box-shadow 300ms ${EASE}`,
                }}
                onMouseEnter={(e) => {
                  if (loading) return;
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 20px #D1D1D6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(0) scale(0.985)"; }}
                onMouseUp={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              >
                {/* Gold flood-fill on hover */}
                <span
                  className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500"
                  style={{ background: T.gold, transitionTimingFunction: EASE }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</>
                    : <>Criar conta <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" /></>
                  }
                </span>
              </button>
            </form>

            {/* ── Footer microcopy ── */}
            <div className="mt-8 space-y-4">
              <p
                data-auth-el
                className="text-[13px] text-center"
                style={{ fontWeight: 400, color: T.microcopyColor }}
              >
                Já tem conta?{" "}
                <Link
                  to={`${P}/entrar`}
                  className="transition-colors duration-200"
                  style={{ fontWeight: 500, color: "#48484A" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.ink)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#48484A")}
                >
                  Entrar
                </Link>
              </p>
              <p
                data-auth-el
                className="text-[11px] text-center"
                style={{
                  fontWeight: 400,
                  lineHeight: 1.65,
                  color: "#8E8E93",
                }}
              >
                Ao criar sua conta, você concorda com os{" "}
                <a href="#termos" onClick={(e) => e.preventDefault()} className="underline underline-offset-2 transition-colors duration-200 hover:text-[#636366]">Termos</a> e{" "}
                <a href="#privacidade" onClick={(e) => e.preventDefault()} className="underline underline-offset-2 transition-colors duration-200 hover:text-[#636366]">Privacidade</a>.
                {" "}Conformidade LGPD.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PANEL B — Tesla Image (right)
          Full-bleed, no card, no border — editorial immersion

          object-position: center 22% ensures Tesla's face + notebook
          remain visible across 1280→1920 and safe crop on aspect
          changes. The warm charcoal (#16120f) fallback prevents
          any flash of pure black during load.
          ══════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:block relative overflow-hidden order-1 lg:order-2"
        style={{ background: "#1e1a17" }}
      >
        {/* Image — full bleed */}
        <ImageWithFallback
          src={teslaImg}
          alt="Nikola Tesla — retrato editorial, caderno e anotações"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 22%" }}
        />

        {/* ── Gradient overlay system ──
            3 layers for depth without killing the image:
            1) Bottom fade — long, warm, for quote readability
            2) Left edge vignette — seam with white form panel
            3) Subtle top vignette — atmosphere ── */}

        {/* Layer 1: Bottom gradient — warm charcoal, 65% floor, long fade to 65% height */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(0deg, #111111 0%, transparent 65%)",
            opacity: 0.55,
          }}
        />

        {/* Layer 2: Left seam — subtle 12% fade at the split edge */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, #111111 0%, transparent 12%)",
            opacity: 0.15,
          }}
        />

        {/* Layer 3: Top atmospheric vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #111111 0%, transparent 20%)",
            opacity: 0.1,
          }}
        />

        {/* ── Quote block ──
            Positioned bottom-left with 56px padding (safe area).
            Raised 20px from absolute bottom to prevent mobile-bar crop
            and give the composition breathing room. ── */}
        <div
          ref={quoteRef}
          className="absolute bottom-0 left-0 right-0 z-10"
          style={{ padding: "0 clamp(40px, 4vw, 56px) clamp(48px, 5vh, 64px)" }}
        >
          {/* Eyebrow — small-caps, very delicate */}
          <span
            data-quote-el
            className="block mb-4"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              fontWeight: 500,
              color: "#636366",
              fontVariant: "all-small-caps",
            }}
          >
            NIKOLA TESLA
          </span>

          {/* Hairline accent — 32px gold line */}
          <div
            data-quote-el
            className="mb-5"
            style={{ width: 32, height: 1, background: "#3B3631" }}
          />

          {/* Quote — Cormorant Garamond, warm white */}
          <p
            data-quote-el
            className="mb-5"
            style={{
              fontFamily: T.serifSwash,
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              color: "#D1D1D6",
              maxWidth: 380,
            }}
          >
            "O{" "}
            <em style={{ fontStyle: "italic", color: "#595047" }}>futuro</em>
            {" "}pertence a mim."
          </p>

          {/* Subtitle — editorial microcopy */}
          <p
            data-quote-el
            style={{
              fontSize: 12,
              fontWeight: 400,
              lineHeight: 1.65,
              color: "#636366",
              maxWidth: 320,
            }}
          >
            Construa o futuro do seu estúdio — do lead à entrega, em um só fluxo.
          </p>
        </div>
      </div>
    </div>
  );
}