import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
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
        "relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border border-border bg-muted/80 p-1",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <Sun
        className="pointer-events-none absolute left-2 size-3.5 text-amber-500/70"
        aria-hidden
      />
      <Moon
        className="pointer-events-none absolute right-2 size-3.5 text-muted-foreground/70"
        aria-hidden
      />
      <span
        className={cn(
          "relative z-10 flex size-7 items-center justify-center rounded-full bg-background shadow-sm",
          isDark ? "translate-x-7" : "translate-x-0",
          !prefersReducedMotion && "transition-transform duration-200 ease-out"
        )}
      >
        {isDark ? (
          <Moon className="size-4 text-foreground" aria-hidden />
        ) : (
          <Sun className="size-4 text-amber-500" aria-hidden />
        )}
      </span>
    </button>
  );
}
