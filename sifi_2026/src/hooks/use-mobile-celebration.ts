import { useCallback, useEffect, useRef, useState } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import {
  fireMobileScholarConfetti,
  isMobileViewport,
  MOBILE_CELEBRATION_MS,
} from "@/lib/mobile-confetti";

export function useMobileCelebration() {
  const [celebrating, setCelebrating] = useState(false);
  const celebrationTimerRef = useRef<number | undefined>(undefined);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const timerId = celebrationTimerRef.current;
    return () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    };
  }, []);

  const triggerCelebration = useCallback(
    (options?: { allowDesktop?: boolean }) => {
      if (prefersReducedMotion) return;
      if (!options?.allowDesktop && !isMobileViewport()) return;

      fireMobileScholarConfetti();
      setCelebrating(true);

      if (celebrationTimerRef.current !== undefined) {
        window.clearTimeout(celebrationTimerRef.current);
      }

      const timerId = window.setTimeout(() => {
        setCelebrating(false);
        celebrationTimerRef.current = undefined;
      }, MOBILE_CELEBRATION_MS);
      celebrationTimerRef.current = timerId;
    },
    [prefersReducedMotion]
  );

  return { celebrating, triggerCelebration };
}
