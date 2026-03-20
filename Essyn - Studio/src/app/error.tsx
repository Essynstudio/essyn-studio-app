"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center max-w-md px-6">
        <div className="w-14 h-14 rounded-2xl bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-[20px] font-semibold text-[var(--fg)] mb-2">
          Algo deu errado
        </h2>
        <p className="text-[14px] text-[var(--fg-muted)] mb-6 leading-relaxed">
          Ocorreu um erro inesperado. Tente recarregar a pagina.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
