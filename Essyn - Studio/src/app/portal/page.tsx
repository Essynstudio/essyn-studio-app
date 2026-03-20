"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, ArrowRight, Loader2, AlertCircle, KeyRound, User } from "lucide-react";
import { springDefault, springSnappy } from "@/lib/motion-tokens";
import { INPUT_CLS } from "@/lib/design-tokens";
import { useRouter, useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  token_missing: "Link inválido. Solicite um novo acesso.",
  token_invalid: "Link inválido. Solicite um novo acesso.",
  token_used: "Este link já foi utilizado. Faça login abaixo.",
  token_expired: "Este link expirou. Faça login abaixo.",
  session_failed: "Erro ao criar sessão. Tente novamente.",
  session_expired: "Sua sessão expirou. Faça login novamente.",
};

export default function PortalLoginPage() {
  return (
    <Suspense>
      <PortalLoginContent />
    </Suspense>
  );
}

function PortalLoginContent() {
  const [mode, setMode] = useState<"login" | "magic">("login");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Format CPF input: 000.000.000-00
  const handleCpfChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 3) formatted = digits.slice(0, 3) + "." + digits.slice(3);
    if (digits.length > 6) formatted = formatted.slice(0, 7) + "." + digits.slice(6);
    if (digits.length > 9) formatted = formatted.slice(0, 11) + "-" + digits.slice(9);
    setCpf(formatted);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !cpf.trim() || loading) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          cpf: cpf.replace(/\D/g, ""),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao fazer login");
        return;
      }

      router.push("/portal/meu");
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/portal/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.ok) {
        router.push("/portal/verificar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springDefault}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-[22%] bg-[var(--fg)] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-[8%] rounded-full border border-[rgba(194,173,144,0.33)]" />
              <span className="font-[family-name:var(--font-playfair)] text-[11px] font-normal text-[var(--accent)] tracking-[0.05em] relative z-10">
                ES
              </span>
            </div>
          </div>
          <div className="flex items-baseline justify-center gap-[6px]">
            <span className="font-[family-name:var(--font-playfair)] text-[16px] font-semibold text-[var(--fg)] tracking-[0.12em] uppercase">
              ESSYN
            </span>
            <span className="text-[8px] text-[var(--accent)]">·</span>
            <span className="font-[family-name:var(--font-cormorant)] text-[12px] font-light text-[var(--fg-muted)] tracking-[0.2em] uppercase">
              STUDIO
            </span>
          </div>
          <p className="text-[13px] text-[var(--fg-muted)] mt-2">Portal do Cliente</p>
        </div>

        {/* Error banners */}
        {(error || errorMsg) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--error-subtle)] mb-4"
          >
            <AlertCircle size={16} className="text-[var(--error)] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[var(--error)] leading-relaxed">
              {errorMsg || ERROR_MESSAGES[error!] || "Erro desconhecido. Tente novamente."}
            </p>
          </motion.div>
        )}

        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] mb-4">
          <button
            type="button"
            onClick={() => { setMode("login"); setErrorMsg(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all ${
              mode === "login"
                ? "bg-[var(--card)] text-[var(--fg)] shadow-sm"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
            }`}
          >
            <User size={13} />
            Email e CPF
          </button>
          <button
            type="button"
            onClick={() => { setMode("magic"); setErrorMsg(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all ${
              mode === "magic"
                ? "bg-[var(--card)] text-[var(--fg)] shadow-sm"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
            }`}
          >
            <Mail size={13} />
            Link por email
          </button>
        </div>

        {/* Card */}
        <div className="bg-[var(--card)] rounded-2xl p-6" style={{ boxShadow: "var(--shadow-md)" }}>
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={springSnappy}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
                    <KeyRound size={16} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-[var(--fg)] tracking-[-0.012em]">
                      Acesse seu portal
                    </h2>
                    <p className="text-[11px] text-[var(--fg-muted)]">
                      Digite seu email e CPF para entrar
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1 block">Email</label>
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={INPUT_CLS}
                      required
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1 block">CPF</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      className={INPUT_CLS}
                      required
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email.trim() || cpf.replace(/\D/g, "").length < 4}
                    className="w-full h-11 px-5 rounded-[10px] bg-[var(--accent)] text-white text-[13px] font-semibold tracking-[-0.01em] hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        Entrar
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="magic"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={springSnappy}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
                    <Mail size={16} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-[var(--fg)] tracking-[-0.012em]">
                      Receber link de acesso
                    </h2>
                    <p className="text-[11px] text-[var(--fg-muted)]">
                      Enviaremos um link seguro para seu email
                    </p>
                  </div>
                </div>

                <form onSubmit={handleMagicLink} className="space-y-3">
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLS}
                    required
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full h-11 px-5 rounded-[10px] bg-[var(--accent)] text-white text-[13px] font-semibold tracking-[-0.01em] hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        Enviar link de acesso
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[var(--fg-muted)] mt-6">
          Não tem acesso? Entre em contato com seu fotógrafo.
        </p>
      </motion.div>
    </div>
  );
}
