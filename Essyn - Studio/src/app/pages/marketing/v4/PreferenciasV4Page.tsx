// PreferenciasV4 — editorial film studio identity (onboarding step 2/3)
// Enhanced: onboardingStore persistence, validation, animated chip selections
import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { springDefault } from "../../../lib/motion-tokens";
import { ArrowRight, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { SERIF, GOLD, EASE } from "../../../components/ui/editorial";
import { getOnboarding, setOnboarding } from "../../../components/onboarding/onboardingStore";
import { toast } from "sonner";

const INK = "#111111";

const workflows = [
  { id: "casamento", label: "Casamento", emoji: "" },
  { id: "ensaio", label: "Ensaio", emoji: "" },
  { id: "corporativo", label: "Corporativo", emoji: "" },
  { id: "15anos", label: "15 Anos", emoji: "" },
  { id: "batizado", label: "Batizado", emoji: "" },
  { id: "formatura", label: "Formatura", emoji: "" },
  { id: "newborn", label: "Newborn", emoji: "" },
  { id: "gestante", label: "Gestante", emoji: "" },
];

const payments = [
  { id: "pix", label: "PIX" },
  { id: "cartao", label: "Cartao" },
  { id: "boleto", label: "Boleto" },
  { id: "transferencia", label: "Transferencia" },
];

const steps = ["Estudio", "Preferencias", "Pronto"];

export function PreferenciasV4Page() {
  const navigate = useNavigate();
  const saved = getOnboarding();

  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(
    new Set(saved.workflowTemplate ? saved.workflowTemplate.split(",").filter(Boolean) : ["casamento", "ensaio"])
  );
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(
    new Set(saved.paymentMethods.length > 0 ? saved.paymentMethods : ["pix"])
  );
  const [defaultDeadline, setDefaultDeadline] = useState(String(saved.deliveryDays || 30));
  const [shaking, setShaking] = useState(false);

  const toggle = (set: Set<string>, item: string, setter: (s: Set<string>) => void) => {
    const n = new Set(set);
    n.has(item) ? n.delete(item) : n.add(item);
    setter(n);
  };

  function handleNext() {
    if (selectedWorkflows.size === 0) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      toast.error("Selecione pelo menos um tipo de evento");
      return;
    }
    if (selectedPayments.size === 0) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      toast.error("Selecione pelo menos um metodo de pagamento");
      return;
    }
    setOnboarding({
      workflowTemplate: Array.from(selectedWorkflows).join(","),
      paymentMethods: Array.from(selectedPayments),
      deliveryDays: parseInt(defaultDeadline, 10),
    });
    navigate("/v4/concluir");
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-6 py-16" style={{ background: "#F7F5F0" }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0, x: shaking ? [0, -6, 6, -4, 4, 0] : 0 }}
        transition={shaking ? { duration: 0.4, ease: "easeInOut" } : springDefault}
        className="w-full max-w-[420px]"
      >
        {/* Progress with labels */}
        <div className="flex items-center justify-center gap-6 mb-10">
          {steps.map((label, n) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] transition-all duration-300"
                style={{
                  fontWeight: 600,
                  background: n < 1 ? "#34C759" : n === 1 ? INK : "#F5F5F7",
                  color: n <= 1 ? "#FFFFFF" : "#AEAEB2",
                }}
              >
                {n < 1 ? <Check className="w-3.5 h-3.5" /> : n + 1}
              </div>
              <span
                className="text-[12px] hidden sm:block"
                style={{ fontWeight: n === 1 ? 500 : 400, color: n === 1 ? INK : n < 1 ? "#34C759" : "#AEAEB2" }}
              >
                {label}
              </span>
              {n < steps.length - 1 && <div className="w-8 h-px bg-[#E5E5EA] hidden sm:block" />}
            </div>
          ))}
        </div>

        <span className="text-[11px] tracking-[0.12em] uppercase mb-3 block" style={{ fontWeight: 600, color: "#B0A295" }}>
          Passo 2 de 3
        </span>
        <h1 className="text-[24px] tracking-[-0.03em] mb-2" style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.2, color: INK }}>
          Preferencias
        </h1>
        <p className="text-[14px] mb-8" style={{ fontWeight: 400, lineHeight: 1.6, color: "#8E8E93" }}>
          Personalize os templates iniciais do seu estudio
        </p>

        {/* Workflows */}
        <div className="mb-6">
          <label className="text-[12px] mb-3 block" style={{ fontWeight: 500, color: "#8E8E93" }}>
            Tipos de evento que voce fotografa <span style={{ color: "#FF3B30" }}>*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {workflows.map((w) => {
              const active = selectedWorkflows.has(w.id);
              return (
                <motion.button
                  key={w.id}
                  onClick={() => toggle(selectedWorkflows, w.id, setSelectedWorkflows)}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] border transition-all duration-200"
                  style={{
                    borderColor: active ? "#E5E5EA" : "#F2F2F7",
                    background: active ? "#FFFFFF" : "#FAFAFA",
                    color: active ? INK : "#8E8E93",
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    {active && (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, width: 0 }}
                        animate={{ scale: 1, width: "auto" }}
                        exit={{ scale: 0, width: 0 }}
                        transition={springDefault}
                      >
                        <Check className="w-3 h-3" style={{ color: "#34C759" }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {w.label}
                </motion.button>
              );
            })}
          </div>
          {selectedWorkflows.size === 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[#FF3B30] mt-2" style={{ fontWeight: 400 }}>
              <AlertCircle className="w-3 h-3" /> Selecione pelo menos um
            </span>
          )}
        </div>

        {/* Payment methods */}
        <div className="mb-6">
          <label className="text-[12px] mb-3 block" style={{ fontWeight: 500, color: "#8E8E93" }}>
            Metodos de pagamento aceitos <span style={{ color: "#FF3B30" }}>*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {payments.map((p) => {
              const active = selectedPayments.has(p.id);
              return (
                <motion.button
                  key={p.id}
                  onClick={() => toggle(selectedPayments, p.id, setSelectedPayments)}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] border transition-all duration-200"
                  style={{
                    borderColor: active ? "#E5E5EA" : "#F2F2F7",
                    background: active ? "#FFFFFF" : "#FAFAFA",
                    color: active ? INK : "#8E8E93",
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    {active && (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, width: 0 }}
                        animate={{ scale: 1, width: "auto" }}
                        exit={{ scale: 0, width: 0 }}
                        transition={springDefault}
                      >
                        <Check className="w-3 h-3" style={{ color: "#34C759" }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {p.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Default deadline */}
        <div className="mb-8">
          <label className="text-[12px] mb-3 block" style={{ fontWeight: 500, color: "#8E8E93" }}>Prazo padrao de entrega (dias)</label>
          <div className="flex gap-2">
            {["15", "30", "45", "60", "90"].map((d) => (
              <button
                key={d}
                onClick={() => setDefaultDeadline(d)}
                className="cursor-pointer flex-1 py-2.5 rounded-xl text-[13px] border transition-all duration-200"
                style={{
                  borderColor: defaultDeadline === d ? INK : "#F2F2F7",
                  background: defaultDeadline === d ? INK : "#FFFFFF",
                  color: defaultDeadline === d ? "#FFFFFF" : "#8E8E93",
                  fontWeight: defaultDeadline === d ? 500 : 400,
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => navigate("/v4/criar-studio")} className="inline-flex items-center gap-1.5 text-[13px] transition-colors cursor-pointer" style={{ fontWeight: 400, color: "#AEAEB2" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>
          <button
            onClick={handleNext}
            className="group relative inline-flex items-center gap-2 text-[14px] px-7 py-3.5 rounded-full text-white overflow-hidden transition-transform duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            style={{ fontWeight: 500, background: INK }}
          >
            <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ background: GOLD, transitionTimingFunction: EASE }} />
            <span className="relative z-10 flex items-center gap-2">Proximo <ArrowRight className="w-4 h-4" /></span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
