"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { springSnappy } from "@/lib/motion-tokens";

const STEPS = [
  { label: "Cliente", short: "Cli" },
  { label: "Evento", short: "Evt" },
  { label: "Pack", short: "Pck" },
  { label: "Produção", short: "Prod" },
  { label: "Equipe", short: "Eqp" },
  { label: "Financeiro", short: "Fin" },
  { label: "Contrato", short: "Ctr" },
  { label: "Produtos", short: "Pdt" },
  { label: "Revisão", short: "Rev" },
];

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="py-3 px-3 sm:px-6">
      {/* Mobile: compact pill bar */}
      <div className="flex sm:hidden items-center gap-1.5 justify-center">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;

          return (
            <motion.div
              key={step.label}
              layout
              transition={springSnappy}
              className="relative flex items-center justify-center rounded-full transition-all"
              style={{
                width: isActive ? "auto" : 24,
                height: 24,
                paddingLeft: isActive ? 8 : 0,
                paddingRight: isActive ? 10 : 0,
                backgroundColor: isCompleted
                  ? "var(--success)"
                  : isActive
                  ? "var(--info)"
                  : "var(--bg-subtle)",
              }}
            >
              {isCompleted ? (
                <Check size={11} className="text-white" strokeWidth={3} />
              ) : (
                <span
                  className="text-[9px] font-bold whitespace-nowrap"
                  style={{ color: isActive ? "white" : "var(--fg-muted)" }}
                >
                  {isActive ? step.label : i + 1}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Desktop: compact progress bar (no labels — step title shown in content) */}
      <div className="hidden sm:flex items-center justify-center gap-0">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;

          return (
            <div key={step.label} className="flex items-center">
              <motion.div
                layout
                transition={springSnappy}
                className="relative flex items-center justify-center rounded-full border-2 transition-colors"
                style={{
                  width: isActive ? "auto" : 26,
                  height: 26,
                  minWidth: 26,
                  paddingLeft: isActive ? 10 : 0,
                  paddingRight: isActive ? 12 : 0,
                  borderColor: isCompleted
                    ? "var(--success)"
                    : isActive
                    ? "var(--info)"
                    : "var(--border)",
                  backgroundColor: isCompleted
                    ? "var(--success)"
                    : isActive
                    ? "var(--info)"
                    : "transparent",
                }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springSnappy}
                  >
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={springSnappy}
                    className="text-[10px] font-semibold whitespace-nowrap"
                    style={{
                      color: isActive ? "white" : "var(--fg-muted)",
                    }}
                  >
                    {isActive ? step.label : i + 1}
                  </motion.span>
                )}
              </motion.div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="relative w-5 h-0.5 mx-0.5">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: "var(--success)" }}
                    initial={{ width: "0%" }}
                    animate={{ width: i < currentStep ? "100%" : "0%" }}
                    transition={springSnappy}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
