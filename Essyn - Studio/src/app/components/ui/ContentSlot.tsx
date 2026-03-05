import { motion, AnimatePresence } from "motion/react";
import { useRef, useCallback, type ReactNode } from "react";
import { useLocation } from "react-router";
import { useIsMobile } from "./use-mobile";
import { usePullToRefresh } from "../../lib/usePullToRefresh";
import { PullToRefreshIndicator } from "./PullToRefreshIndicator";
import { useDk } from "../../lib/useDarkColors";
import { toast } from "sonner";

export interface ContentSlotProps {
  /** Page content */
  children: ReactNode;
  /** Padding — default 24px (16px on mobile) */
  padding?: number;
  /** Background color — default #F5F5F7 */
  bg?: string;
}

/**
 * ContentSlot — Container central do AppShell
 *
 * Auto Layout:
 * - flex: 1 (preenche o espaço disponível)
 * - overflow-y: auto (scroll vertical quando necessário)
 * - padding: 24px desktop / 16px mobile (configurável)
 * - direção: vertical (flex-col)
 * - gap: 16px entre seções
 *
 * Mobile pull-to-refresh: built-in on mobile devices.
 */
export function ContentSlot({
  children,
  padding,
  bg = "#F5F5F7",
}: ContentSlotProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const effectivePadding = padding ?? (isMobile ? 16 : 24);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isDark } = useDk();
  const effectiveBg = isDark ? "#0A0A0A" : bg;

  const handleRefresh = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Dados atualizados");
  }, []);

  const { handlers, pullProgress, pullDistance, isRefreshing } =
    usePullToRefresh(handleRefresh, scrollRef);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto min-w-0 min-h-0 relative"
      style={{ backgroundColor: effectiveBg }}
      {...(isMobile ? handlers : {})}
    >
      {isMobile && (
        <PullToRefreshIndicator
          pullProgress={pullProgress}
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex flex-col gap-4 min-h-full"
          style={{ padding: effectivePadding }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}