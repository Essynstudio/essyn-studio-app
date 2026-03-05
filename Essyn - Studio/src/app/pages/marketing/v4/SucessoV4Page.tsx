// SucessoV4 — editorial film studio identity
import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import gsap from "gsap";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { SERIF, GOLD, EASE } from "../../../components/ui/editorial";

const INK = "#111111";
const planNames: Record<string, string> = { core: "Core", pro: "Pro", studio: "Studio" };

export function SucessoV4Page() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const total = searchParams.get("total") || "79";
  const billing = searchParams.get("billing") || "yearly";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-s]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.1, delay: 0.3 });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex items-center justify-center min-h-[calc(100vh-72px)] px-6 py-16" style={{ background: "#F7F5F0" }}>
      <div className="w-full max-w-[440px] text-center">
        {/* Icon */}
        <div data-s className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: `${GOLD}10`, border: `2px solid ${GOLD}20` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: GOLD }}>
            <Check className="w-6 h-6 text-white" />
          </div>
        </div>

        <h1 data-s className="text-[28px] tracking-[-0.03em] mb-3" style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.15, color: INK }}>
          Assinatura <span className="italic" style={{ color: `${INK}50` }}>confirmada</span>
        </h1>
        <p data-s className="text-[14px] mb-10" style={{ fontWeight: 400, lineHeight: 1.6, color: "#8E8E93" }}>
          Sua conta está pronta. Vamos configurar seu estúdio.
        </p>

        {/* Summary card */}
        <div data-s className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: "#F2F2F7", background: "#FFFFFF" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: INK }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
              <span className="text-[14px] text-white" style={{ fontWeight: 600 }}>Plano {planNames[plan] || "Pro"}</span>
            </div>
            <span className="text-[12px] text-[#636366]" style={{ fontWeight: 400 }}>{billing === "yearly" ? "Anual" : "Mensal"}</span>
          </div>
          <div className="px-6 py-5">
            {[
              { label: "Valor", value: `R$${total}/mês`, color: INK },
              { label: "Período de teste", value: "14 dias grátis", color: GOLD },
              { label: "Primeira cobrança", value: "10 mar 2026", color: "#AEAEB2" },
            ].map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between ${i < 2 ? "mb-3" : ""}`}>
                <span className="text-[13px]" style={{ fontWeight: 400, color: "#AEAEB2" }}>{row.label}</span>
                <span className="text-[13px]" style={{ fontWeight: 500, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <Link
          data-s
          to="/v4/boas-vindas"
          className="group relative inline-flex items-center justify-center gap-2 text-[14px] px-8 py-3.5 rounded-full text-white overflow-hidden transition-transform duration-300 hover:scale-[1.03] active:scale-[0.97]"
          style={{ fontWeight: 500, background: INK }}
        >
          <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ background: GOLD, transitionTimingFunction: EASE }} />
          <span className="relative z-10 flex items-center gap-2">Acessar ESSYN <ArrowRight className="w-4 h-4" /></span>
        </Link>
      </div>
    </div>
  );
}