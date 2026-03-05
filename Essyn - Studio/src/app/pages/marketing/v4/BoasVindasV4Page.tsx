// v1 boas-vindas V4 2026-02-24
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ArrowRight, Sparkles } from "lucide-react";
import { SERIF, EASE } from "../../../components/ui/editorial";

const P = "/v4";
const serif = SERIF;
const steps = ["Estúdio", "Preferências", "Pronto"];

export function BoasVindasV4Page() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-w]", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.1, delay: 0.3 });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex items-center justify-center min-h-screen px-6 py-16" style={{ background: "#FFFFFF", fontFamily: "var(--font-sans)" }}>
      {/* DEBUG badge */}
      <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#3A3A3C", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px #3C3C43" }}>
        <span className="text-[11px] text-[#9C8B7A]" style={{ fontWeight: 700 }}>14</span>
        <span className="w-px h-3 bg-[#282828]" />
        <span className="text-[11px] text-[#B7B7B7]" style={{ fontWeight: 500 }}>Boas-Vindas</span>
        <span className="w-px h-3 bg-[#282828]" />
        <span className="text-[9px] text-[#636366]" style={{ fontWeight: 400 }}>/v4/boas-vindas</span>
      </div>
      {/* grain */}
      <div className="pointer-events-none fixed inset-0 z-[999] opacity-[0.012]" aria-hidden="true"><svg width="100%" height="100%"><filter id="gb"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#gb)" /></svg></div>

      <div className="relative z-10 w-full max-w-[480px] text-center">
        <div data-w className="w-16 h-16 rounded-2xl bg-[#111111] flex items-center justify-center mx-auto mb-8">
          <Sparkles className="w-7 h-7" style={{ color: "#72665A" }} />
        </div>
        <h1 data-w className="text-[32px] tracking-[-0.04em] text-[#111111] mb-4" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.12 }}>
          Bem-vindo ao <span className="italic" style={{ color: "#C8BFB5" }}>ESSYN</span>
        </h1>
        <p data-w className="text-[15px] text-[#8E8E93] mb-10 max-w-[360px] mx-auto" style={{ fontWeight: 400, lineHeight: 1.65 }}>
          Vamos configurar seu estudio em 3 passos rapidos. Leva menos de 2 minutos.
        </p>

        {/* AUDIT FIX: Labeled progress */}
        <div data-w className="flex items-center justify-center gap-6 mb-10">
          {steps.map((label, n) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] ${n === 0 ? "bg-[#111111] text-white" : "bg-[#F5F5F7] text-[#AEAEB2]"}`} style={{ fontWeight: 600 }}>{n + 1}</div>
              <span className={`text-[12px] hidden sm:block ${n === 0 ? "text-[#111111]" : "text-[#AEAEB2]"}`} style={{ fontWeight: n === 0 ? 500 : 400 }}>{label}</span>
              {n < steps.length - 1 && <div className="w-8 h-px bg-[#E5E5EA] hidden sm:block" />}
            </div>
          ))}
        </div>

        <Link data-w to={`${P}/criar-studio`} className="group relative inline-flex items-center justify-center gap-2 text-[14px] px-8 py-3.5 rounded-full bg-[#111111] text-white overflow-hidden transition-transform duration-300 hover:scale-[1.03] active:scale-[0.97]" style={{ fontWeight: 500 }}>
          <span className="absolute inset-0 bg-[#9C8B7A] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: EASE }} />
          <span className="relative z-10 flex items-center gap-2">Começar configuração <ArrowRight className="w-4 h-4" /></span>
        </Link>
      </div>
    </div>
  );
}