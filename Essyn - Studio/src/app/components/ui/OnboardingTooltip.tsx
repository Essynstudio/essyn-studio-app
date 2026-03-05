/**
 * OnboardingTooltip — First-run contextual tips
 *
 * Shows a dismissible tooltip on first visit to a page.
 * Persists dismissed state in localStorage.
 *
 * Usage:
 *   <OnboardingTooltip id="relatorios" title="Novo!" message="Explore seus relatórios..." />
 *
 * Apple Premium design, zero transparency rule.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles } from "lucide-react";
import { springDefault } from "../../lib/motion-tokens";

const STORAGE_KEY = "essyn_onboarding_dismissed";

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function setDismissed(id: string) {
  const set = getDismissed();
  set.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

interface OnboardingTooltipProps {
  id: string;
  title: string;
  message: string;
  delay?: number;
}

export function OnboardingTooltip({ id, title, message, delay = 0.5 }: OnboardingTooltipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = getDismissed();
    if (!dismissed.has(id)) {
      const timer = setTimeout(() => setVisible(true), delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [id, delay]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(id);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={springDefault}
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#007AFF] shadow-[0_4px_16px_#D1D1D6] max-w-[380px]"
        >
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0" style={{ opacity: 0.9 }}>
            <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-white" style={{ fontWeight: 600 }}>{title}</p>
            <p className="text-[11px] text-white mt-0.5" style={{ fontWeight: 400, opacity: 0.85, lineHeight: "1.4" }}>
              {message}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white hover:bg-white hover:text-[#007AFF] transition-colors cursor-pointer shrink-0"
            style={{ opacity: 0.7 }}
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * OnboardingBanner — Wider first-run banner
 */
export function OnboardingBanner({ id, title, message, delay = 0.3 }: OnboardingTooltipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = getDismissed();
    if (!dismissed.has(id)) {
      const timer = setTimeout(() => setVisible(true), delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [id, delay]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(id);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={springDefault}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#F0F5FF] border border-[#D1D1D6]"
        >
          <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#007AFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{title}</p>
            <p className="text-[11px] text-[#636366]" style={{ fontWeight: 400, lineHeight: "1.4" }}>
              {message}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-[11px] text-[#007AFF] hover:bg-[#E8F0FE] transition-colors cursor-pointer"
            style={{ fontWeight: 600 }}
          >
            Entendi
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
