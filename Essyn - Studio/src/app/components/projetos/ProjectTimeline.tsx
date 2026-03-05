/**
 * ProjectTimeline — Visual Phase Timeline for Project Drawer
 *
 * Shows the full lifecycle of a project:
 * Lead → Contrato → Pagamento → Captação → Edição → Revisão → Entrega → Finalizado
 *
 * Reads from the Projeto data model to derive step statuses.
 *
 * Apple Premium design, zero transparency rule.
 */
import { motion } from "motion/react";
import {
  Users, FileText, CreditCard, Camera,
  Palette, CheckCircle2, Image, Star,
} from "lucide-react";
import { springDefault } from "../../lib/motion-tokens";
import type { Projeto } from "./projetosData";
import { useDk } from "../../lib/useDarkColors";

/* ═══════════════════════════════════════════════════ */
/*  TYPES                                              */
/* ═══════════════════════════════════════════════════ */

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "done" | "active" | "upcoming";
  date?: string;
  detail?: string;
}

/* ═══════════════════════════════════════════════════ */
/*  COMPONENT                                          */
/* ═══════════════════════════════════════════════════ */

export function ProjectTimeline({ projeto }: { projeto: Projeto }) {
  const dk = useDk();
  const { producao, financeiro, status, dataEvento, fotos } = projeto;

  // Derive production progress as ratio
  const prodProgress = producao.etapasTotal > 0 ? producao.etapasConcluidas / producao.etapasTotal : 0;
  const hasPaid = financeiro.pagas > 0;
  const isCompleted = status === "entregue";
  const hasGallery = fotos > 0;

  const steps: TimelineStep[] = [
    {
      id: "lead",
      label: "Lead",
      icon: <Users className="w-3.5 h-3.5" />,
      status: "done",
      detail: "Lead convertido",
    },
    {
      id: "contrato",
      label: "Contrato",
      icon: <FileText className="w-3.5 h-3.5" />,
      status: "done",
      detail: "Assinado",
    },
    {
      id: "pagamento",
      label: "Pagamento",
      icon: <CreditCard className="w-3.5 h-3.5" />,
      status: hasPaid ? "done" : "active",
      detail: hasPaid
        ? `${financeiro.pagas}/${financeiro.parcelas} parcelas pagas`
        : `${financeiro.vencidas} vencida${financeiro.vencidas !== 1 ? "s" : ""}`,
    },
    {
      id: "captacao",
      label: "Captação",
      icon: <Camera className="w-3.5 h-3.5" />,
      status: prodProgress >= 0.3 ? "done" : prodProgress > 0 ? "active" : hasPaid ? "active" : "upcoming",
      date: dataEvento,
      detail: prodProgress >= 0.3 ? "Concluída" : prodProgress > 0 ? "Em andamento" : "Agendada",
    },
    {
      id: "edicao",
      label: "Edição",
      icon: <Palette className="w-3.5 h-3.5" />,
      status: prodProgress >= 0.6 ? "done" : prodProgress >= 0.3 ? "active" : "upcoming",
      detail: prodProgress >= 0.6 ? "Concluída" : prodProgress >= 0.3 ? "Editando" : "Pendente",
    },
    {
      id: "revisao",
      label: "Revisão",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      status: prodProgress >= 0.8 ? "done" : prodProgress >= 0.6 ? "active" : "upcoming",
      detail: prodProgress >= 0.8 ? "Aprovada" : prodProgress >= 0.6 ? "Em revisão" : "Pendente",
    },
    {
      id: "entrega",
      label: "Entrega",
      icon: <Image className="w-3.5 h-3.5" />,
      status: hasGallery && prodProgress >= 0.9 ? "done" : prodProgress >= 0.8 ? "active" : "upcoming",
      detail: hasGallery ? `${fotos} fotos entregues` : prodProgress >= 0.8 ? "Pronto para entrega" : "Pendente",
    },
    {
      id: "finalizado",
      label: "Finalizado",
      icon: <Star className="w-3.5 h-3.5" />,
      status: isCompleted ? "done" : "upcoming",
      detail: isCompleted ? "Projeto concluído" : "—",
    },
  ];

  const STATUS_COLORS = {
    done: {
      color: "#34C759",
      bg: dk.isDark ? "#1A2C1E" : "#E8EFE5",
      line: "#34C759",
    },
    active: {
      color: "#007AFF",
      bg: dk.isDark ? "#1A2030" : "#E8F0FE",
      line: "#007AFF",
    },
    upcoming: {
      color: dk.textDisabled,
      bg: dk.isDark ? "#2C2C2E" : "#F5F5F7",
      line: dk.isDark ? "#3C3C43" : "#E5E5EA",
    },
  };

  // Calculate overall progress
  const doneCount = steps.filter((s) => s.status === "done").length;
  const progressPct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Progress header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px]" style={{ fontWeight: 500, color: dk.textTertiary }}>
            Progresso do projeto
          </span>
          <span className="text-[13px] tabular-nums" style={{ fontWeight: 600, color: dk.textPrimary }}>
            {progressPct}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: dk.bgMuted }}>
          <motion.div
            className="h-full rounded-full bg-[#007AFF]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ ...springDefault, delay: 0.2 }}
          />
        </div>
        <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>
          {doneCount} de {steps.length} etapas concluídas
        </span>
      </div>

      {/* Timeline steps */}
      <div className="flex flex-col gap-0">
        {steps.map((step, idx) => {
          const sc = STATUS_COLORS[step.status];
          const isLast = idx === steps.length - 1;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springDefault, delay: idx * 0.04 }}
              className="flex gap-3"
            >
              {/* Connector column */}
              <div className="flex flex-col items-center w-8 shrink-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10"
                  style={{ backgroundColor: sc.bg, color: sc.color }}
                >
                  {step.status === "done" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : step.status === "active" ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      {step.icon}
                    </motion.div>
                  ) : (
                    step.icon
                  )}
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 min-h-[20px]" style={{ backgroundColor: sc.line }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[12px]"
                    style={{
                      fontWeight: step.status === "active" ? 600 : 500,
                      color: step.status === "upcoming" ? dk.textSubtle : dk.textPrimary,
                    }}
                  >
                    {step.label}
                  </span>
                  {step.status === "active" && (
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[9px] text-[#007AFF]"
                      style={{ fontWeight: 600, backgroundColor: dk.isDark ? "#1A2030" : "#E8F0FE" }}
                    >
                      Atual
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px]"
                    style={{
                      fontWeight: 400,
                      color: step.status === "upcoming" ? dk.textDisabled : dk.textTertiary,
                    }}
                  >
                    {step.detail}
                  </span>
                  {step.date && (
                    <span className="text-[10px]" style={{ fontWeight: 400, color: dk.textMuted }}>
                      · {step.date}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
