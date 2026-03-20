"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";

export default function NovaSenhaPage() {
  return (
    <Suspense>
      <NovaSenhaForm />
    </Suspense>
  );
}

function NovaSenhaForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const allChecksPass = Object.values(passwordChecks).every(Boolean);

  // Check if user has an active session (set by /auth/callback)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        setError("Link expirado ou invalido. Solicite um novo.");
      }
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allChecksPass) return;

    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/iris");
  }

  const inputCls = "w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[16px] sm:text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[#2C444D]/20 focus:border-[#2C444D] transition-all";

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-[var(--fg-muted)] mb-4" />
        <p className="text-[14px] text-[var(--fg-muted)]">Verificando...</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="text-center py-12">
        <h2 className="text-[22px] font-[family-name:var(--font-playfair)] font-semibold text-[var(--fg)] tracking-[-0.01em] mb-2">
          Link invalido
        </h2>
        <p className="text-[13px] text-[var(--fg-muted)] mb-6">{error}</p>
        <a
          href="/esqueci-senha"
          className="inline-flex h-12 px-6 rounded-xl bg-[#2C444D] text-white text-[14px] font-semibold items-center justify-center hover:bg-[#1E3239] transition-all"
        >
          Solicitar novo link
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="lg:hidden mb-8 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full border-2 border-[#C2AD90]/40 flex items-center justify-center relative">
          <div className="absolute inset-[3px] rounded-full border border-[#C2AD90]/20" />
          <span className="font-[family-name:var(--font-playfair)] text-[17px] font-normal text-[#2C444D] tracking-[0.05em] relative z-10">ES</span>
        </div>
        <span className="flex items-baseline gap-[5px]">
          <span className="font-[family-name:var(--font-playfair)] text-[14px] font-semibold text-[var(--fg)] tracking-[0.14em] uppercase">ESSYN</span>
          <span className="text-[8px] text-[#A58D66] self-center">·</span>
          <span className="font-[family-name:var(--font-cormorant)] text-[12px] font-light text-[var(--fg-muted)] tracking-[0.22em] uppercase">STUDIO</span>
        </span>
      </div>

      <div className="text-center lg:text-left">
        <h2 className="text-[22px] font-[family-name:var(--font-playfair)] font-semibold text-[var(--fg)] tracking-[-0.01em]">
          Criar nova senha
        </h2>
        <p className="text-[13px] text-[var(--fg-muted)] mt-1 mb-8">
          Escolha uma senha forte para sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-[var(--error-subtle)] text-[var(--error)] text-[13px]">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-[12px] font-medium text-[var(--fg-secondary)] mb-1.5 tracking-[-0.004em]">
            Nova senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              required
              autoFocus
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {password.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { key: "length" as const, label: "8+ caracteres" },
              { key: "upper" as const, label: "Letra maiúscula" },
              { key: "number" as const, label: "Um número" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className={`flex items-center gap-1.5 text-[11px] ${
                  passwordChecks[key] ? "text-[var(--success)]" : "text-[var(--fg-muted)]"
                }`}
              >
                <Check size={11} />
                {label}
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !allChecksPass}
          className="w-full h-12 rounded-xl bg-[#2C444D] text-white text-[14px] font-semibold hover:bg-[#1E3239] active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#A58D66] focus-visible:ring-offset-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar nova senha"
          )}
        </button>
      </form>
    </div>
  );
}
