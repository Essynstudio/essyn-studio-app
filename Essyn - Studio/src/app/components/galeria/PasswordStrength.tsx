import { useMemo } from "react";
import { motion } from "motion/react";
import { Shield, AlertCircle } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  onStrengthChange?: (strength: "weak" | "medium" | "strong") => void;
}

export function PasswordStrength({ password, onStrengthChange }: PasswordStrengthProps) {
  const analysis = useMemo(() => {
    if (!password) return { score: 0, strength: "weak" as const, label: "", color: "", suggestions: [] };

    let score = 0;
    const suggestions: string[] = [];

    // Comprimento
    if (password.length >= 8) score += 25;
    else suggestions.push("Use pelo menos 8 caracteres");

    if (password.length >= 12) score += 15;

    // Números
    if (/\d/.test(password)) score += 20;
    else suggestions.push("Adicione números");

    // Letras maiúsculas
    if (/[A-Z]/.test(password)) score += 20;
    else suggestions.push("Adicione letras maiúsculas");

    // Caracteres especiais
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
    else suggestions.push("Adicione caracteres especiais");

    // Variedade
    const uniqueChars = new Set(password.split("")).size;
    if (uniqueChars >= password.length * 0.7) score += 10;

    // Penalidades
    if (/^(123|abc|senha|password)/i.test(password)) score -= 30;
    if (/(.)\1{2,}/.test(password)) score -= 20; // caracteres repetidos

    score = Math.max(0, Math.min(100, score));

    let strength: "weak" | "medium" | "strong" = "weak";
    let label = "Fraca";
    let color = "#FF3B30";

    if (score >= 70) {
      strength = "strong";
      label = "Forte";
      color = "#34C759";
    } else if (score >= 40) {
      strength = "medium";
      label = "Média";
      color = "#FF9500";
    }

    onStrengthChange?.(strength);

    return { score, strength, label, color, suggestions: suggestions.slice(0, 2) };
  }, [password, onStrengthChange]);

  if (!password) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Barra de força */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[#E5E5E7] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.score}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: analysis.color }}
          />
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" style={{ color: analysis.color }} />
          <span className="text-[11px] min-w-[44px]" style={{ fontWeight: 600, color: analysis.color }}>
            {analysis.label}
          </span>
        </div>
      </div>

      {/* Sugestões */}
      {analysis.suggestions.length > 0 && analysis.strength !== "strong" && (
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-[#FFF9F0] border border-[#F5E6D3]">
          <AlertCircle className="w-3 h-3 text-[#FF9500] mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[#8E8C8B]" style={{ fontWeight: 500 }}>
              Para fortalecer:
            </span>
            {analysis.suggestions.map((s, i) => (
              <span key={i} className="text-[10px] text-[#A4A3A2]" style={{ fontWeight: 400 }}>
                • {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Senha forte = feedback positivo */}
      {analysis.strength === "strong" && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#F0FAF4] border border-[#D1F0D9]">
          <Shield className="w-3 h-3 text-[#34C759]" />
          <span className="text-[10px] text-[#34C759]" style={{ fontWeight: 500 }}>
            ✓ Senha segura! Seus dados estão protegidos.
          </span>
        </div>
      )}
    </div>
  );
}