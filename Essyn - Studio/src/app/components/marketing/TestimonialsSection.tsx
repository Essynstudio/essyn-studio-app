/**
 * TestimonialsSection.tsx — Editorial testimonials with Greek philosophers
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Classical engraving of two philosophers debating sits behind the
 * testimonial cards, creating a "discourse about craft" metaphor.
 *
 * Visual layers (back → front):
 *   1. Warm ivory background (#FBFAF6)
 *   2. Philosophers illustration — sepia-toned, low opacity, parallax
 *   3. Radial vignette fade so edges dissolve into background
 *   4. Testimonial cards with glassmorphism-ish warm borders
 */
import { useRef, useEffect } from "react";
import { GR, SERIF } from "../../components/ui/editorial";
import philosophersImg from "figma:asset/0fae4e547ef401d33fc93a24c6989b099b4ad8ca.png";

interface Testimonial {
  name: string;
  studio: string;
  quote: string;
}

interface Props {
  testimonials: Testimonial[];
  serif: string;
}

export function TestimonialsSection({ testimonials, serif }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  /* ── Parallax: philosophers drift upward slower than scroll ── */
  useEffect(() => {
    const section = sectionRef.current;
    const img = imgRef.current;
    if (!section || !img) return;

    let raf = 0;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0 = section entering viewport, 1 = section leaving
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      // subtle parallax: philosophers shift 30px range
      const shiftY = (progress - 0.5) * -30;
      const scale = 1 + progress * 0.02;
      img.style.transform = `translateY(${shiftY}px) scale(${scale})`;
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-32 px-6 overflow-hidden"
      style={{ background: "#FBFAF6" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "#F2F2F7" }} />

      {/* ── Philosophers illustration (behind everything) ── */}
      <div
        ref={imgRef}
        className="absolute pointer-events-none select-none"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "clamp(600px, 70vw, 1000px)",
          willChange: "transform",
          zIndex: 1,
        }}
      >
        <img
          src={philosophersImg}
          alt=""
          aria-hidden="true"
          className="w-full h-auto"
          style={{
            opacity: 0.09,
            filter: "sepia(0.35) contrast(1.05) brightness(1.1)",
            mixBlendMode: "multiply",
          }}
        />
        {/* Radial vignette: soft dissolve only at outer edges */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 85% 80% at 50% 50%, transparent 55%, #FBFAF6 95%)`,
          }}
        />
      </div>

      {/* ── Content (above illustration) ── */}
      <div className="relative z-10 max-w-[1100px] mx-auto">
        <GR className="mb-16 text-center">
          <span data-g className="text-[11px] tracking-[0.14em] uppercase text-[#9C8B7A] mb-4 block" style={{ fontWeight: 600, opacity: 0.6 }}>Comunidade</span>
          <h2 data-g className="text-[clamp(28px,4vw,48px)] tracking-[-0.035em] text-[#111111]" style={{ fontFamily: serif, fontWeight: 400, lineHeight: 1.12 }}>
            {'"'}A plataforma que todo<br />fotógrafo <span className="italic" style={{ color: "#9C8B7A", opacity: 0.6 }}>precisava.{'"'}</span>
          </h2>
          <p data-g className="text-[15px] text-[#636366] max-w-[460px] mx-auto mt-5" style={{ fontWeight: 400, lineHeight: 1.7 }}>
            Junte-se a uma comunidade crescente de fotógrafos e criadores.
          </p>
        </GR>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <GR key={t.name} delay={i * 0.06}>
              <div
                data-g
                className="rounded-3xl border border-[#C7C7CC] p-7 flex flex-col h-full hover:shadow-[0_8px_32px_#E5E5EA] hover:border-[#AEAEB2] transition-all duration-300"
                style={{
                  background: "#FFFFFF",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 2px 12px #F5F5F7",
                }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-[#E5E5EA] flex items-center justify-center flex-shrink-0">
                    <span className="text-[12px] text-[#8E8E93]" style={{ fontWeight: 600 }}>{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <span className="text-[13px] text-[#3C3C43] block" style={{ fontWeight: 500, opacity: 0.85 }}>{t.name}</span>
                    <span className="text-[11px] text-[#8E8E93]" style={{ fontWeight: 400 }}>{t.studio}</span>
                  </div>
                </div>
                <p className="text-[14px] text-[#8E8E93] flex-1" style={{ fontWeight: 400, lineHeight: 1.7 }}>
                  {'"'}
                  {t.quote.split(/\*\*(.*?)\*\*/).map((part, pi) =>
                    pi % 2 === 1
                      ? <strong key={pi} className="text-[#9C8B7A]" style={{ fontWeight: 600 }}>{part}</strong>
                      : <span key={pi}>{part}</span>
                  )}
                  {'"'}
                </p>
              </div>
            </GR>
          ))}
        </div>
      </div>
    </section>
  );
}