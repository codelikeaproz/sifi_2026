import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, PartyPopper, Sparkles, type LucideIcon } from "lucide-react";

import {
  CELEBRATION_FALL_DURATION_S,
  CELEBRATION_PHRASE_MS,
} from "@/lib/mobile-confetti";
import { cn } from "@/lib/utils";

export const CELEBRATION_PHRASES: { icon: LucideIcon; text: string }[] = [
  { icon: PartyPopper, text: "Congrats!" },
  { icon: GraduationCap, text: "SIFI Scholars" },
  { icon: Sparkles, text: "SIFI Graduates" },
];

type FallingPhrase = {
  id: number;
  text: string;
  icon: LucideIcon;
  left: number;
  rotate: number;
  delay: number;
};

function createFallingPhrases(): FallingPhrase[] {
  return CELEBRATION_PHRASES.map((phrase, index) => ({
    id: index,
    text: phrase.text,
    icon: phrase.icon,
    left: 15 + Math.random() * 70,
    rotate: -8 + Math.random() * 16,
    delay: index * CELEBRATION_PHRASE_MS,
  }));
}

interface MobileCelebrationOverlayProps {
  active: boolean;
  className?: string;
}

export function MobileCelebrationOverlay({
  active,
  className,
}: MobileCelebrationOverlayProps) {
  const [fallingPhrases, setFallingPhrases] = useState<FallingPhrase[]>([]);

  useEffect(() => {
    if (!active) {
      setFallingPhrases([]);
      return;
    }
    setFallingPhrases(createFallingPhrases());
  }, [active]);

  if (!active || fallingPhrases.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 overflow-hidden rounded-lg pointer-events-none md:hidden",
        className
      )}
      aria-live="polite"
      aria-hidden="true"
    >
      {fallingPhrases.map(({ id, text, icon: Icon, left, rotate, delay }) => (
        <motion.div
          key={id}
          className="absolute top-0 flex -translate-x-1/2 items-center gap-1.5 text-base font-semibold text-[#FFD700] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          style={{ left: `${left}%` }}
          initial={{ y: "-15%", opacity: 0, rotate }}
          animate={{
            y: "95%",
            opacity: [0, 1, 1, 0.7, 0],
            rotate: rotate + 4,
          }}
          transition={{
            duration: CELEBRATION_FALL_DURATION_S,
            delay: delay / 1000,
            ease: "linear",
          }}
        >
          <Icon className="size-4 shrink-0" strokeWidth={2.25} />
          <span>{text}</span>
        </motion.div>
      ))}
    </div>
  );
}
