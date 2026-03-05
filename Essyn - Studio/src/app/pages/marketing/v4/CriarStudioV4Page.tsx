// CriarStudioV4 — editorial film studio identity (onboarding step 1/3)
// Enhanced: form validation, onboardingStore persistence, animated transitions
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { springDefault } from "../../../lib/motion-tokens";
import { ArrowRight, ArrowLeft, AlertCircle, Check } from "lucide-react";
import { SERIF, GOLD, EASE } from "../../../components/ui/editorial";
import { getOnboarding, setOnboarding } from "../../../components/onboarding/onboardingStore";
import { toast } from "sonner";

const INK = "#111111";
const steps = ["Estudio", "Preferencias", "Pronto"];

const ufList = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const currencies = [
  { code: "BRL", label: "Real (BRL)", symbol: "R$" },
  { code: "USD", label: "Dolar (USD)", symbol: "$" },
  { code: "EUR", label: "Euro (EUR)", symbol: "€" },
];

export function CriarStudioV4Page() {
  const navigate = useNavigate();

  /* Load persisted state */
  const saved = getOnboarding();
  const [studioName, setStudioName] = useState(saved.studioName);
  const [city, setCity] = useState(saved.city);
  const [uf, setUf] = useState(saved.uf || "");
  const [currency, setCurrency] = useState(saved.currency || "BRL");

  /* Validation */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [shaking, setShaking] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!studioName.trim()) errs.studioName = "Nome do estudio e obrigatorio";
    else if (studioName.trim().length < 3) errs.studioName = "Minimo 3 caracteres";
    if (!city.trim()) errs.city = "Cidade e obrigatoria";
    if (!uf) errs.uf = "Selecione o estado";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleBlur(field: string) {
    setTouched((prev) => new Set(prev).add(field));
  }

  /* Re-validate on change when field was touched */
  useEffect(() => {
    if (touched.size > 0) validate();
  }, [studioName, city, uf]);

  function handleNext() {
    setTouched(new Set(["studioName", "city", "uf"]));
    if (!validate()) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }
    setOnboarding({ studioName: studioName.trim(), city: city.trim(), uf, currency });
    navigate("/v4/preferencias");
  }

  const fieldBorder = (field: string) =>
    touched.has(field) && errors[field] ? "#FF3B30" : "#E5E5EA";

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
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] transition-all duration-300 ${
                  n < 1
                    ? "bg-[#34C759] text-white"
                    : n === 0
                    ? `bg-[${INK}] text-white`
                    : "bg-[#F5F5F7] text-[#AEAEB2]"
                }`}
                style={{
                  fontWeight: 600,
                  background: n === 0 ? INK : n < 0 ? "#34C759" : "#F5F5F7",
                  color: n <= 0 ? "#FFFFFF" : "#AEAEB2",
                }}
              >
                {n < 0 ? <Check className="w-3.5 h-3.5" /> : n + 1}
              </div>
              <span
                className="text-[12px] hidden sm:block"
                style={{ fontWeight: n === 0 ? 500 : 400, color: n === 0 ? INK : "#AEAEB2" }}
              >
                {label}
              </span>
              {n < steps.length - 1 && <div className="w-8 h-px bg-[#E5E5EA] hidden sm:block" />}
            </div>
          ))}
        </div>

        <span className="text-[11px] tracking-[0.12em] uppercase mb-3 block" style={{ fontWeight: 600, color: "#B0A295" }}>
          Passo 1 de 3
        </span>
        <h1 className="text-[24px] tracking-[-0.03em] mb-2" style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.2, color: INK }}>
          Seu estudio
        </h1>
        <p className="text-[14px] mb-8" style={{ fontWeight: 400, lineHeight: 1.6, color: "#8E8E93" }}>
          Como se chama seu negocio de fotografia?
        </p>

        <div className="flex flex-col gap-5 mb-8">
          {/* Studio Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px]" style={{ fontWeight: 500, color: "#8E8E93" }}>
              Nome do estudio <span style={{ color: "#FF3B30" }}>*</span>
            </label>
            <input
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              onBlur={() => handleBlur("studioName")}
              placeholder="Ex.: Marina Costa Fotografia"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border text-[14px] outline-none transition-all focus:bg-white"
              style={{ borderColor: fieldBorder("studioName"), background: "#FAFAFA", color: INK, fontWeight: 400 }}
            />
            {touched.has("studioName") && errors.studioName && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1 text-[11px] text-[#FF3B30]"
                style={{ fontWeight: 400 }}
              >
                <AlertCircle className="w-3 h-3" /> {errors.studioName}
              </motion.span>
            )}
          </div>

          {/* City + UF */}
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px]" style={{ fontWeight: 500, color: "#8E8E93" }}>
                Cidade <span style={{ color: "#FF3B30" }}>*</span>
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => handleBlur("city")}
                placeholder="Ex.: Belo Horizonte"
                className="w-full px-4 py-3 rounded-xl border text-[14px] outline-none transition-all focus:bg-white"
                style={{ borderColor: fieldBorder("city"), background: "#FAFAFA", color: INK, fontWeight: 400 }}
              />
              {touched.has("city") && errors.city && (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-[11px] text-[#FF3B30]"
                  style={{ fontWeight: 400 }}
                >
                  <AlertCircle className="w-3 h-3" /> {errors.city}
                </motion.span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px]" style={{ fontWeight: 500, color: "#8E8E93" }}>
                UF <span style={{ color: "#FF3B30" }}>*</span>
              </label>
              <select
                value={uf}
                onChange={(e) => { setUf(e.target.value); handleBlur("uf"); }}
                className="w-full px-3 py-3 rounded-xl border text-[14px] outline-none transition-all appearance-none cursor-pointer"
                style={{ borderColor: fieldBorder("uf"), background: "#FAFAFA", color: uf ? INK : "#AEAEB2", fontWeight: 400 }}
              >
                <option value="">UF</option>
                {ufList.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Currency */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px]" style={{ fontWeight: 500, color: "#8E8E93" }}>Moeda</label>
            <div className="flex gap-2">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className="flex-1 px-3 py-2.5 rounded-xl border text-[13px] transition-all cursor-pointer"
                  style={{
                    borderColor: currency === c.code ? "#E5E5EA" : "#F2F2F7",
                    background: currency === c.code ? "#FFFFFF" : "#FAFAFA",
                    color: currency === c.code ? INK : "#AEAEB2",
                    fontWeight: currency === c.code ? 500 : 400,
                  }}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => navigate("/v4/boas-vindas")} className="inline-flex items-center gap-1.5 text-[13px] transition-colors cursor-pointer" style={{ fontWeight: 400, color: "#AEAEB2" }}>
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

        {/* Completion hint */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="flex gap-1.5">
            {[studioName.trim().length >= 3, city.trim().length > 0, uf.length > 0].map((ok, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: ok ? "#34C759" : "#E5E5EA" }}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#C7C7CC]" style={{ fontWeight: 400 }}>
            {[studioName.trim().length >= 3, city.trim().length > 0, uf.length > 0].filter(Boolean).length}/3 campos
          </span>
        </div>
      </motion.div>
    </div>
  );
}
