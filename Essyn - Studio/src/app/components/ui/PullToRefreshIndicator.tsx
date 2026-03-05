/**
 * PullToRefreshIndicator — Apple-style refresh spinner
 *
 * Shows a rotating indicator when user pulls down on mobile.
 * Zero transparency rule: compliant (uses CSS opacity only).
 */
import { RefreshCw } from "lucide-react";

interface Props {
  pullProgress: number;
  pullDistance: number;
  isRefreshing: boolean;
}

export function PullToRefreshIndicator({
  pullProgress,
  pullDistance,
  isRefreshing,
}: Props) {
  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center w-full overflow-hidden transition-[height] duration-200 ease-out"
      style={{ height: isRefreshing ? 48 : pullDistance > 0 ? Math.min(pullDistance, 64) : 0 }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F2F2F7]"
        style={{
          opacity: Math.max(pullProgress, isRefreshing ? 1 : 0),
          transform: `rotate(${isRefreshing ? 0 : pullProgress * 360}deg)`,
        }}
      >
        <RefreshCw
          className={`w-4 h-4 text-[#8E8E93] ${isRefreshing ? "animate-spin" : ""}`}
        />
      </div>
    </div>
  );
}
