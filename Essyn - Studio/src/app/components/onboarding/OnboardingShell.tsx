import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";

import { springDefault } from "../../lib/motion-tokens";
const spring = springDefault;

interface OnboardingShellProps {
  /** Current step (0 = splash, 1–3 = steps) */
  step: number;
  /** Total steps (3) */
  totalSteps?: number;
  /** Whether to show progress bar */
  showProgress?: boolean;
  /** Whether to show skip button */
  showSkip?: boolean;
  children: React.ReactNode;
}

export function OnboardingShell({
  step,
  totalSteps = 3,
  showProgress = true,
  showSkip = true,
  children,
}: OnboardingShellProps) {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col bg-white"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* ── Minimal header ── */}
      <header className="border-b border-[#F5F5F7]">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-14">
            <Link to="/site">
              <span
                className="text-[18px] tracking-[-0.04em] text-[#1D1D1F]"
                style={{ fontWeight: 600 }}
              >
                ESSYN
              </span>
            </Link>
            {showSkip && (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-[13px] text-[#C7C7CC] hover:text-[#8E8E93] transition-colors"
                style={{ fontWeight: 400 }}
              >
                Pular configuração
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Progress bar ── */}
      {showProgress && step >= 1 && (
        <div className="max-w-[520px] mx-auto w-full px-6 pt-8">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="text-[11px] text-[#C7C7CC]"
              style={{ fontWeight: 500 }}
            >
              {step} de {totalSteps}
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full overflow-hidden bg-[#F2F2F7]"
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: "#1D1D1F" }}
                  initial={{ width: "0%" }}
                  animate={{ width: i < step ? "100%" : "0%" }}
                  transition={spring}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Content area ── */}
      <div className="flex-1 flex items-start justify-center px-6 pt-10 pb-20">
        <div className="w-full max-w-[480px]">{children}</div>
      </div>
    </div>
  );
}