"use client";

import { useState } from "react";

interface Props {
  galleryId: string;
  studioName: string;
}

export function PasswordGate({ galleryId, studioName }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/gallery/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryId, password }),
      });
      const data = await res.json();

      if (data.ok) {
        // Reload page — cookie is now set
        window.location.reload();
      } else {
        setError("Senha incorreta");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-6">
      <div className="text-center max-w-sm w-full">
        <p className="text-[20px] font-semibold text-[#0C100E] mb-2">Galeria protegida</p>
        <p className="text-[14px] text-[#7A8A8F] mb-6">
          Digite a senha enviada por {studioName} para acessar esta galeria.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha da galeria"
            autoFocus
            className="w-full h-11 px-4 rounded-xl border border-[#E5E1DD] bg-white text-[14px] text-[#0C100E] placeholder:text-[#B5AFA6] focus:outline-none focus:ring-2 focus:ring-[#A58D66]/50 focus:border-[#A58D66]"
          />
          {error && <p className="text-[12px] text-[#B84233]">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full h-11 rounded-xl bg-[#2C444D] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Verificando..." : "Acessar galeria"}
          </button>
        </form>
      </div>
    </div>
  );
}
