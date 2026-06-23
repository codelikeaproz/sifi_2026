import { Medal } from "lucide-react";

import { cn } from "@/lib/utils";

export type HonorTier = "summa" | "magna" | "cum";

export function honorTierFromLabel(label?: string): HonorTier | null {
  if (!label) return null;
  const normalized = label.toLowerCase();
  if (normalized.includes("summa")) return "summa";
  if (normalized.includes("magna")) return "magna";
  if (normalized.includes("cum")) return "cum";
  return null;
}

export const HONOR_STYLES: Record<
  HonorTier,
  { icon: string; border: string; ring: string }
> = {
  summa: {
    icon: "text-[#d4af37]",
    border: "border-[#d4af37]/50",
    ring: "shadow-[0_0_12px_rgba(212,175,55,0.35)]",
  },
  magna: {
    icon: "text-[#e8d5a3]",
    border: "border-[#d4af37]/35",
    ring: "shadow-[0_0_8px_rgba(212,175,55,0.2)]",
  },
  cum: {
    icon: "text-[#8dc63f]",
    border: "border-[#15803d]/40",
    ring: "shadow-[0_0_8px_rgba(21,128,61,0.25)]",
  },
};

function honorShortLabel(tier: HonorTier): string {
  if (tier === "summa") return "Summa";
  if (tier === "magna") return "Magna";
  return "Cum Laude";
}

/** Latin honor line on white / light backgrounds (solo text column). */
export const honorTextOnLightClassName =
  "font-medium italic text-[#9a7b2e]";

/** Latin honor line on dark green card gradients. */
export const honorTextOnDarkClassName =
  "font-medium italic text-[#f0d78c] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]";

interface ScholarHonorBadgeProps {
  latinHonorLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ScholarHonorBadge({
  latinHonorLabel,
  size = "sm",
  className,
}: ScholarHonorBadgeProps) {
  const honorTier = honorTierFromLabel(latinHonorLabel);
  if (!honorTier || !latinHonorLabel) return null;

  return (
    <div
      className={cn(
        "absolute z-30 flex items-center gap-1 rounded-full border bg-black/35 backdrop-blur-md",
        HONOR_STYLES[honorTier].border,
        HONOR_STYLES[honorTier].ring,
        size === "sm" && "top-2 right-2 px-1.5 py-0.5 sm:top-3 sm:right-3 sm:px-2 sm:py-1",
        size === "md" && "top-3 right-3 px-2.5 py-1 sm:top-4 sm:right-4 sm:px-3 sm:py-1.5",
        className
      )}
      title={latinHonorLabel}
      aria-label={latinHonorLabel}
    >
      <Medal
        className={cn(
          "shrink-0",
          HONOR_STYLES[honorTier].icon,
          size === "sm" && "size-3 sm:size-3.5",
          size === "md" && "size-4 sm:size-5"
        )}
        aria-hidden
      />
      <span
        className={cn(
          "truncate font-medium text-white/95",
          size === "sm" && "max-w-16 text-[9px] sm:max-w-22 sm:text-[10px]",
          size === "md" && "max-w-24 text-[11px] sm:max-w-28 sm:text-xs"
        )}
      >
        {honorShortLabel(honorTier)}
      </span>
    </div>
  );
}
