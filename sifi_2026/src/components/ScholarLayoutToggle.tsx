import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ScholarLayoutMode = "single" | "grid-6" | "grid-9";

const STORAGE_KEY = "sifi-scholar-layout";

const OPTIONS: { mode: ScholarLayoutMode; label: string; ariaLabel: string }[] = [
  { mode: "single", label: "1", ariaLabel: "1 scholar" },
  { mode: "grid-6", label: "6", ariaLabel: "6 scholars grid" },
  { mode: "grid-9", label: "9", ariaLabel: "9 scholars grid" },
];

export function readStoredLayout(): ScholarLayoutMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "single" || stored === "grid-6" || stored === "grid-9") {
      return stored;
    }
  } catch {
    // ignore storage errors
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches
  ) {
    return "grid-6";
  }
  return "single";
}

export function persistLayout(mode: ScholarLayoutMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore storage errors
  }
}

interface ScholarLayoutToggleProps {
  value: ScholarLayoutMode;
  onChange: (mode: ScholarLayoutMode) => void;
  className?: string;
}

export function ScholarLayoutToggle({
  value,
  onChange,
  className,
}: ScholarLayoutToggleProps) {
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label="Scholar layout"
    >
      {OPTIONS.map(({ mode, label, ariaLabel }) => (
        <Button
          key={mode}
          type="button"
          size="sm"
          variant={value === mode ? "default" : "ghost"}
          className={cn(
            "min-w-10 px-3",
            value === mode && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          aria-pressed={value === mode}
          aria-label={ariaLabel}
          onClick={() => onChange(mode)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
