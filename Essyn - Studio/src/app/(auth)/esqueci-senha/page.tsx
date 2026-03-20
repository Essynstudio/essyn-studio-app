"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/nova-senha`,
      }
    );

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div>
        <div className="lg:hidden mb-8 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full border-2 border-[var(--accent)]/40 flex items-center justify-center relative">
            <div className="absolute inset-[3px] rounded-full border border-[var(--accent)]/20" />
            <span className="font-[family-name:var(--font-playfair)] text-[17px] font-normal text-[var(--fg)] tracking-[0.05em] relative z-10">ES</span>
          </div>
          <span className="flex items-baseline gap-[5px]">
            <span className="font-[family-name:var(--font-playfair)] text-[14px] font-semibold text-[var(--fg)] tracking-[0.14em] uppercase">ESSYN</span>
            <span className="text-[8px] text-[var(--accent)] self-center">·</span>
            <span className="font-[family-name:var(--font-cormorant)] text-[12px] font-light text-[var(--fg-muted)] tracking-[0.22em] uppercase">STUDIO</span>
          </span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--success-subtle)] flex items-center justify-center mb-5">
            <CheckCircle size={28} className="text-[var(--success)]" />
          </div>
          <h2 className="text-[22px] font-[family-name:var(--font-playfair)] font-semibold text-[var(--fg)] tracking-[-0.01em] mb-2">
            E-mail enviado
          </h2>
          <p className="text-sm text-[var(--fg-secondary)] mb-1">
            Enviamos um link para
          </p>
          <p className="text-sm font-medium text-[var(--fg)] mb-6">
            {email}
          </p>
          <p className="text-sm text-[var(--fg-muted)] mb-8">
            Clique no link do e-mail para criar uma nova senha. O link expira em
            1 hora.
          </p>
          <button
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Usar outro e-mail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="lg:hidden mb-8 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full border-2 border-[var(--accent)]/40 flex items-center justify-center relative">
          <div className="absolute inset-[3px] rounded-full border border-[var(--accent)]/20" />
          <span className="font-[family-name:var(--font-playfair)] text-[17px] font-normal text-[var(--fg)] tracking-[0.05em] relative z-10">ES</span>
        </div>
        <span className="flex items-baseline gap-[5px]">
          <span className="font-[family-name:var(--font-playfair)] text-[14px] font-semibold text-[var(--fg)] tracking-[0.14em] uppercase">ESSYN</span>
          <span className="text-[8px] text-[var(--accent)] self-center">·</span>
          <span className="font-[family-name:var(--font-cormorant)] text-[12px] font-light text-[var(--fg-muted)] tracking-[0.22em] uppercase">STUDIO</span>
        </span>
      </div>

      <Link
        href="/entrar"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] mb-8 transition-colors"
      >
        <ArrowLeft size={15} />
        Voltar ao login
      </Link>

      <h2 className="text-[22px] font-[family-name:var(--font-playfair)] font-semibold text-[var(--fg)] tracking-[-0.01em] mb-1">
        Esqueceu a senha?
      </h2>
      <p className="text-sm text-[var(--fg-secondary)] mb-8">
        Digite seu e-mail e enviaremos um link para criar uma nova senha.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-[var(--error-subtle)] text-[var(--error)] text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-[12px] font-medium text-[var(--fg-secondary)] mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[16px] sm:text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--fg)]/20 focus:border-[var(--fg)] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-[var(--fg)] text-white text-[14px] font-semibold hover:bg-[var(--fg)]/90 active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar link de recuperação"
          )}
        </button>
      </form>
    </div>
  );
}
