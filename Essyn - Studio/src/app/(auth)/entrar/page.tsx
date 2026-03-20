"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  );
}

function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturn = searchParams.get("returnUrl") || "/iris";
  const returnUrl = rawReturn.startsWith("/") ? rawReturn : "/iris";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push(returnUrl);
    router.refresh();
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden mb-10 flex flex-col items-center gap-3">
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
          Bem-vindo de volta
        </h2>
        <p className="text-[13px] text-[var(--fg-muted)] mt-1 mb-8">
          Entre na sua conta para continuar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-[var(--error-subtle)] text-[var(--error)] text-[13px]">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-[12px] font-medium text-[var(--fg-secondary)] mb-1.5 tracking-[-0.004em]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoFocus
            className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[16px] sm:text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[#2C444D]/20 focus:border-[#2C444D] transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-[12px] font-medium text-[var(--fg-secondary)] tracking-[-0.004em]">
              Senha
            </label>
            <Link href="/esqueci-senha" className="text-[11px] text-[var(--accent)] hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-12 px-4 pr-12 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[16px] sm:text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[#2C444D]/20 focus:border-[#2C444D] transition-all"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-[#2C444D] text-white text-[14px] font-semibold tracking-[-0.01em] hover:bg-[#1E3239] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 select-none focus-visible:ring-2 focus-visible:ring-[#A58D66] focus-visible:ring-offset-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-[var(--fg-muted)]">
        Não tem uma conta?{" "}
        <Link href="/criar-conta" className="text-[var(--accent)] font-medium hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}
