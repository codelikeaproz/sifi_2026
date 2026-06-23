import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const SHIMMER_SWEEP_MS = 3000;
const SHIMMER_INTERVAL_MIN_MS = 8000;
const SHIMMER_INTERVAL_SPREAD_MS = 4000;
const INITIAL_DELAY_CARD_MS = 1500;
const INITIAL_DELAY_BRIGHT_MS = 800;

export type ScholarCardShimmerVariant = "card" | "hero" | "grid";

interface ScholarCardShimmerProps {
  enabled: boolean;
  variant?: ScholarCardShimmerVariant;
  staggerIndex?: number;
  className?: string;
}

function bandClassName(variant: ScholarCardShimmerVariant): string {
  if (variant === "grid") return "scholar-shimmer-grid-band";
  if (variant === "hero") return "scholar-shimmer-hero-band";
  return "scholar-shimmer-card-band";
}

function animationClassName(
  variant: ScholarCardShimmerVariant,
  active: boolean
): string | false {
  if (!active) return false;
  if (variant === "grid") return "animate-scholar-shimmer-grid";
  if (variant === "hero") return "animate-scholar-shimmer-hero";
  return "animate-scholar-shimmer";
}

export function ScholarCardShimmer({
  enabled,
  variant = "card",
  staggerIndex = 0,
  className,
}: ScholarCardShimmerProps) {
  const [active, setActive] = useState(false);
  const isBright = variant === "hero" || variant === "grid";
  const isSynced = variant === "grid";

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
        (isSynced ? 0 : staggerIndex * 1300);
      intervalTimer = window.setTimeout(() => {
        runSweep();
        scheduleNext();
      }, delay);
    };

    const initialDelay = window.setTimeout(
      () => {
        runSweep();
        scheduleNext();
      },
      (isBright ? INITIAL_DELAY_BRIGHT_MS : INITIAL_DELAY_CARD_MS) +
        (isSynced ? 0 : staggerIndex * 400)
    );

    return () => {
      window.clearTimeout(initialDelay);
      window.clearTimeout(sweepTimer);
      window.clearTimeout(intervalTimer);
    };
  }, [enabled, isBright, isSynced, staggerIndex]);

  if (!enabled) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 overflow-hidden",
        variant === "card" && "rounded-xl",
        className
      )}
      aria-hidden
    >
      <div
        className={cn(
          "absolute -inset-full opacity-0",
          bandClassName(variant),
          active && animationClassName(variant, active)
        )}
      />
    </div>
  );
}
