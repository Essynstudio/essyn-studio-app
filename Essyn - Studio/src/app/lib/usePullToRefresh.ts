/**
 * usePullToRefresh — Mobile pull-to-refresh gesture hook
 *
 * Returns props to spread on the scrollable container:
 * - Touch handlers (start, move, end)
 * - Pull progress (0-1)
 * - isRefreshing state
 *
 * Zero transparency rule: fully compliant.
 */
import { useState, useRef, useCallback } from "react";

const THRESHOLD = 80; // px to trigger refresh
const MAX_PULL = 120; // max visual pull distance

export interface PullToRefreshResult {
  /** Spread on the scrollable container */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  /** 0 to 1 — how far the user has pulled */
  pullProgress: number;
  /** Pull distance in px (for translateY) */
  pullDistance: number;
  /** Whether a refresh is in progress */
  isRefreshing: boolean;
}

export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  /** Optional: ref to the scroll container to check scrollTop */
  scrollRef?: React.RefObject<HTMLElement | null>,
): PullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    // Only start pull if scrolled to top
    const scrollTop = scrollRef?.current?.scrollTop ?? 0;
    if (scrollTop > 5) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [isRefreshing, scrollRef]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) {
      setPullDistance(0);
      return;
    }
    // Apply resistance
    const distance = Math.min(delta * 0.5, MAX_PULL);
    setPullDistance(distance);
  }, [isRefreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD * 0.5); // Hold at half threshold during refresh
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    pullProgress: Math.min(pullDistance / THRESHOLD, 1),
    pullDistance,
    isRefreshing,
  };
}
