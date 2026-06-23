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
    return () => {
      if (celebrationTimerRef.current !== undefined) {
        window.clearTimeout(celebrationTimerRef.current);
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

      celebrationTimerRef.current = window.setTimeout(
        () => setCelebrating(false),
        MOBILE_CELEBRATION_MS
      );
    },
    [prefersReducedMotion]
  );

  return { celebrating, triggerCelebration };
}
