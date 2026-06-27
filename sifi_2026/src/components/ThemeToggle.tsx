import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  onPrimary = false,
}: {
  className?: string;
  onPrimary?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const isDark = theme === "dark" || (theme === "system" && systemDark);

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        onPrimary
          ? "border-primary-foreground/30 bg-primary-foreground/15 focus-visible:ring-primary-foreground focus-visible:ring-offset-primary"
          : "border-border bg-muted/80 focus-visible:ring-ring focus-visible:ring-offset-background",
        className
      )}
    >
      <Sun
        className={cn(
          "pointer-events-none absolute left-2 size-3.5",
          onPrimary ? "text-amber-200/80" : "text-amber-500/70"
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          "pointer-events-none absolute right-2 size-3.5",
          onPrimary ? "text-primary-foreground/60" : "text-muted-foreground/70"
        )}
        aria-hidden
      />
      <span
        className={cn(
          "relative z-10 flex size-7 items-center justify-center rounded-full shadow-sm",
          onPrimary ? "bg-primary-foreground" : "bg-background",
          isDark ? "translate-x-7" : "translate-x-0",
          !prefersReducedMotion && "transition-transform duration-200 ease-out"
        )}
      >
        {isDark ? (
          <Moon
            className={cn("size-4", onPrimary ? "text-primary" : "text-foreground")}
            aria-hidden
          />
        ) : (
          <Sun
            className={cn("size-4", onPrimary ? "text-primary" : "text-amber-500")}
            aria-hidden
          />
        )}
      </span>
    </button>
  );
}
