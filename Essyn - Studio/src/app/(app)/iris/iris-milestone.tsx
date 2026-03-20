"use client";

import { motion } from "motion/react";
import type { Milestone } from "@/lib/iris/milestones";

const TYPE_COLORS: Record<string, string> = {
  revenue: "var(--success,#2D7A4F)",
  projects: "var(--info,#007AFF)",
  galleries: "#6B5B8D",
  clients: "var(--warning,#C87A20)",
  streak: "var(--gold,#A58D66)",
};

export function MilestoneCard({ milestone, onDismiss }: { milestone: Milestone; onDismiss: () => void }) {
  const color = TYPE_COLORS[milestone.type] || "var(--gold)";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative rounded-xl overflow-hidden mb-4"
      style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)`, border: `1px solid ${color}20` }}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-[var(--fg)]" style={{ color }}>
              {milestone.message}
            </p>
            <p className="text-[12px] text-[var(--fg-muted)] mt-1 leading-relaxed">
              {milestone.subtext}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] shrink-0 mt-0.5"
          >
            fechar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
