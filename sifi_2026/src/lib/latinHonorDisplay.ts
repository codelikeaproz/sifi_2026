import { Crown, Glasses, Medal, Sparkles, type LucideIcon } from "lucide-react";

import type { LatinHonor } from "@/lib/api";

export type HonorTier = "summa" | "magna" | "cum";

function getHonorTierFromValue(
  latinHonor?: LatinHonor | ""
): HonorTier | null {
  switch (latinHonor) {
    case "summa_cum_laude":
      return "summa";
    case "magna_cum_laude":
    case "cumpyansa":
      return "magna";
    case "cum_laude":
    case "cumbati":
      return "cum";
    default:
      return null;
  }
}

/** @deprecated Prefer getHonorTierFromValue with latinHonor code. */
export function honorTierFromLabel(label?: string): HonorTier | null {
  if (!label) return null;
  const normalized = label.toLowerCase();
  if (normalized === "cumbati") return "cum";
  if (normalized === "cumpyansa") return "magna";
  if (normalized.includes("summa")) return "summa";
  if (normalized.includes("magna")) return "magna";
  if (normalized.includes("cum laude") || normalized === "cum laude") return "cum";
  return null;
}

function honorValueFromLabel(label?: string): LatinHonor | "" {
  if (!label) return "";
  const normalized = label.toLowerCase();
  if (normalized === "cumbati") return "cumbati";
  if (normalized === "cumpyansa") return "cumpyansa";
  if (normalized.includes("summa")) return "summa_cum_laude";
  if (normalized.includes("magna")) return "magna_cum_laude";
  if (normalized.includes("cum")) return "cum_laude";
  return "";
}

type WittyHonorConfig = {
  badgeLabel: string;
  BadgeIcon: LucideIcon;
};

const WITTY_HONOR: Partial<Record<LatinHonor, WittyHonorConfig>> = {
  cumbati: {
    badgeLabel: "CumBati",
    BadgeIcon: Sparkles,
  },
  cumpyansa: {
    badgeLabel: "Cumpyansa",
    BadgeIcon: Glasses,
  },
};

function officialBadgeLabel(latinHonor: LatinHonor): string {
  switch (latinHonor) {
    case "summa_cum_laude":
      return "Summa";
    case "magna_cum_laude":
      return "Magna";
    case "cum_laude":
      return "Cum Laude";
    default:
      return "";
  }
}

function officialBadgeIcon(latinHonor: LatinHonor): LucideIcon {
  if (latinHonor === "summa_cum_laude") return Crown;
  return Medal;
}

export type PublicHonorDisplay = {
  officialLabel: string;
  badgeLabel: string;
  BadgeIcon: LucideIcon;
  witty: boolean;
};

export function getPublicHonorDisplay(
  latinHonor?: LatinHonor | "",
  latinHonorLabel?: string
): PublicHonorDisplay | null {
  const honorValue =
    latinHonor || (latinHonorLabel ? honorValueFromLabel(latinHonorLabel) : "");
  if (!honorValue) return null;

  const officialLabel = latinHonorLabel || honorValue;
  const witty = WITTY_HONOR[honorValue];

  if (witty) {
    return {
      officialLabel,
      badgeLabel: witty.badgeLabel,
      BadgeIcon: witty.BadgeIcon,
      witty: true,
    };
  }

  return {
    officialLabel,
    badgeLabel: officialBadgeLabel(honorValue),
    BadgeIcon: officialBadgeIcon(honorValue),
    witty: false,
  };
}

export function getHonorTier(
  latinHonor?: LatinHonor | "",
  latinHonorLabel?: string
): HonorTier | null {
  const honorValue =
    latinHonor || (latinHonorLabel ? honorValueFromLabel(latinHonorLabel) : "");
  if (honorValue) return getHonorTierFromValue(honorValue);
  return honorTierFromLabel(latinHonorLabel);
}
