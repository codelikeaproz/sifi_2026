import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const SHIMMER_SWEEP_MS = 3000;
const SHIMMER_INTERVAL_MIN_MS = 8000;
const SHIMMER_INTERVAL_SPREAD_MS = 4000;

interface ScholarCardShimmerProps {
  enabled: boolean;
  staggerIndex?: number;
  className?: string;
}

export function ScholarCardShimmer({
  enabled,
  staggerIndex = 0,
  className,
}: ScholarCardShimmerProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let sweepTimer: number | undefined;
    let intervalTimer: number | undefined;

    const runSweep = () => {
      setActive(true);
      sweepTimer = window.setTimeout(() => setActive(false), SHIMMER_SWEEP_MS);
    };

    const scheduleNext = () => {
      const delay =
        SHIMMER_INTERVAL_MIN_MS +
        Math.random() * SHIMMER_INTERVAL_SPREAD_MS +
        staggerIndex * 1300;
      intervalTimer = window.setTimeout(() => {
        runSweep();
        scheduleNext();
      }, delay);
    };

    const initialDelay = window.setTimeout(() => {
      runSweep();
      scheduleNext();
    }, 1500 + staggerIndex * 400);

    return () => {
      window.clearTimeout(initialDelay);
      window.clearTimeout(sweepTimer);
      window.clearTimeout(intervalTimer);
    };
  }, [enabled, staggerIndex]);

  if (!enabled) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl",
        className
      )}
      aria-hidden
    >
      <div
        className={cn(
          "absolute -inset-full",
          "bg-linear-to-br from-transparent via-white/10 to-transparent",
          active && "animate-scholar-shimmer"
        )}
      />
    </div>
  );
}
