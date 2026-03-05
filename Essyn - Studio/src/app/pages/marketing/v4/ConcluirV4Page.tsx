// ConcluirV4 — editorial film studio identity (onboarding step 3/3)
// Enhanced: reads onboardingStore, success animation, summary display
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ArrowRight, Check, Rocket, Sparkles, Camera, CreditCard, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SERIF, GOLD, EASE } from "../../../components/ui/editorial";
import { getOnboarding, clearOnboarding } from "../../../components/onboarding/onboardingStore";
import { springDefault } from "../../../lib/motion-tokens";

const INK = "#111111";
const steps = ["Estudio", "Preferencias", "Pronto"];

export function ConcluirV4Page() {
  const ref = useRef<HTMLDivElement>(null);
  const data = getOnboarding();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-c]", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.1, delay: 0.3 });
    }, ref);

    /* Trigger confetti after a short delay */
    const timer = setTimeout(() => setShowConfetti(true), 800);
    const timer2 = setTimeout(() => setShowConfetti(false), 3500);

    return () => {
      ctx.revert();
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  /* Summary items from onboarding data */
  const summaryItems = [
    { icon: <Check className="w-3 h-3 text-white" />, label: "Conta criada", done: true },
    {
      icon: <Camera className="w-3 h-3 text-white" />,
      label: data.studioName ? `Estudio: ${data.studioName}` : "Estudio configurado",
      detail: data.city && data.uf ? `${data.city}, ${data.uf}` : undefined,
      done: true,
    },
    {
      icon: <CreditCard className="w-3 h-3 text-white" />,
      label: "Preferencias salvas",
      detail: data.paymentMethods.length > 0
        ? `${data.paymentMethods.join(", ")} | ${data.deliveryDays} dias`
        : undefined,
      done: true,
    },
  ];

  return (
    <div ref={ref} className="flex items-center justify-center min-h-screen px-6 py-16 relative overflow-hidden" style={{ background: "#F7F5F0" }}>
      {/* Success particles */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  x: "50vw",
                  y: "40vh",
                  scale: 0,
                }}
                animate={{
                  opacity: 0,
                  x: `${20 + Math.random() * 60}vw`,
                  y: `${10 + Math.random() * 70}vh`,
                  scale: 1,
                  rotate: Math.random() * 360,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5 + Math.random() * 1,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: [GOLD, "#34C759", "#007AFF", "#E5E5EA", "#B0A295"][i % 5],
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[480px] text-center relative z-10">
        {/* Progress complete */}
        <div data-c className="flex items-center justify-center gap-6 mb-10">
          {steps.map((label, n) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] transition-all duration-300"
                style={{ fontWeight: 600, background: "#34C759", color: "#FFFFFF" }}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
              <span
                className="text-[12px] hidden sm:block"
                style={{ fontWeight: 400, color: "#34C759" }}
              >
                {label}
              </span>
              {n < steps.length - 1 && <div className="w-8 h-px hidden sm:block" style={{ background: "#34C759" }} />}
            </div>
          ))}
        </div>

        {/* Icon with pulse */}
        <div data-c className="relative w-20 h-20 mx-auto mb-8">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "#F5F3F1", border: "2px solid #EBE7E4" }}
          >
            <Rocket className="w-8 h-8" style={{ color: GOLD }} />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...springDefault, delay: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "#34C759" }}
          >
            <Sparkles className="w-3 h-3 text-white" />
          </motion.div>
        </div>

        <h1 data-c className="text-[32px] tracking-[-0.04em] mb-4" style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.12, color: INK }}>
          Tudo <span className="italic" style={{ color: "#8E8E93" }}>pronto!</span>
        </h1>
        <p data-c className="text-[15px] mb-10 max-w-[340px] mx-auto" style={{ fontWeight: 400, lineHeight: 1.65, color: "#8E8E93" }}>
          {data.studioName
            ? `${data.studioName} esta configurado. Agora e so comecar!`
            : "Seu estudio esta configurado. Agora e so comecar a organizar seus projetos."}
        </p>

        {/* Summary checklist */}
        <div data-c className="rounded-xl border p-5 mb-10 text-left max-w-[340px] mx-auto" style={{ borderColor: "#F2F2F7", background: "#FFFFFF" }}>
          {summaryItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springDefault, delay: 0.8 + idx * 0.15 }}
              className="flex items-start gap-3 py-2.5"
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#34C759" }}>
                {item.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px]" style={{ fontWeight: 500, color: "#636366" }}>{item.label}</span>
                {item.detail && (
                  <span className="text-[11px]" style={{ fontWeight: 400, color: "#AEAEB2" }}>{item.detail}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats preview */}
        {data.studioName && (
          <div data-c className="flex items-center justify-center gap-6 mb-10">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F5F5F7" }}>
                <Camera className="w-4 h-4 text-[#8E8E93]" />
              </div>
              <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                {data.workflowTemplate.split(",").filter(Boolean).length || 0} tipos
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F5F5F7" }}>
                <CreditCard className="w-4 h-4 text-[#8E8E93]" />
              </div>
              <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                {data.paymentMethods.length} pagamentos
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F5F5F7" }}>
                <Clock className="w-4 h-4 text-[#8E8E93]" />
              </div>
              <span className="text-[10px] text-[#AEAEB2]" style={{ fontWeight: 400 }}>
                {data.deliveryDays} dias
              </span>
            </div>
          </div>
        )}

        <Link data-c to="/dashboard"
          onClick={() => clearOnboarding()}
          className="group relative inline-flex items-center justify-center gap-2 text-[15px] px-10 py-4 rounded-full text-white overflow-hidden transition-transform duration-300 hover:scale-[1.03] active:scale-[0.97]"
          style={{ fontWeight: 500, background: INK }}
        >
          <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ background: GOLD, transitionTimingFunction: EASE }} />
          <span className="relative z-10 flex items-center gap-2">Ir para o Dashboard <ArrowRight className="w-4 h-4" /></span>
        </Link>

        <p data-c className="text-[12px] mt-6" style={{ fontWeight: 400, color: "#AEAEB2" }}>
          Voce pode alterar tudo isso depois em Configuracoes
        </p>
      </div>
    </div>
  );
}
