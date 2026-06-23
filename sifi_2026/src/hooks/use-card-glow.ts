import { useCallback, useRef, useState } from "react";

interface GlowPosition {
  x: number;
  y: number;
  active: boolean;
}

export function useCardGlow() {
  const ref = useRef<HTMLElement>(null);
  const [glow, setGlow] = useState<GlowPosition>({ x: 0, y: 0, active: false });

  const onMouseMove = useCallback((event: React.MouseEvent) => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setGlow({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    });
  }, []);

  const onMouseLeave = useCallback(() => {
    setGlow((current) => ({ ...current, active: false }));
  }, []);

  return { ref, glow, onMouseMove, onMouseLeave };
}
