import {
  honorTextOnDarkClassName,
  honorTextOnLightClassName,
} from "@/components/ScholarHonorBadge";
import { getPublicHonorDisplay } from "@/lib/latinHonorDisplay";
import type { LatinHonor } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ScholarHonorLineProps {
  latinHonor?: LatinHonor | "";
  latinHonorLabel?: string;
  variant: "light" | "dark";
  className?: string;
}

export function ScholarHonorLine({
  latinHonor,
  latinHonorLabel,
  variant,
  className,
}: ScholarHonorLineProps) {
  const display = getPublicHonorDisplay(latinHonor, latinHonorLabel);
  if (!display) return null;

  const wittyClassName =
    variant === "light"
      ? "font-semibold not-italic leading-snug text-[#1b7339]"
      : "font-semibold not-italic leading-snug text-[#b8f07a] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]";

  if (display.witty) {
    const WittyIcon = display.BadgeIcon;

    return (
      <p
        className={cn(
          "flex items-center gap-1",
          variant === "light" ? "text-sm" : "text-[10px] sm:text-xs",
          wittyClassName,
          className
        )}
        title={display.officialLabel}
      >
        <WittyIcon className="size-3 shrink-0 opacity-90" aria-hidden />
        {display.badgeLabel}
      </p>
    );
  }

  return (
    <p
      className={cn(
        variant === "light" ? "text-sm" : "text-[10px] sm:text-xs",
        variant === "light" ? honorTextOnLightClassName : honorTextOnDarkClassName,
        className
      )}
    >
      {display.officialLabel}
    </p>
  );
}
