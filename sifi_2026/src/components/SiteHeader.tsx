import { Link } from "react-router-dom";

import sifiLogo from "@/assets/sifi_logo.png";
import { SiteNav } from "@/components/SiteNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  showAdmin?: boolean;
}

export function SiteHeader({ showAdmin = true }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-primary/20 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0">
          <img
            src={sifiLogo}
            alt="Sugar Industry Foundation Inc."
            className="h-9 w-auto sm:h-10 md:h-11"
          />
        </Link>

        <div className="flex flex-1 items-center justify-end lg:justify-center">
          <SiteNav showAdmin={showAdmin} />
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:gap-3 lg:flex">
          <ThemeToggle />
          {showAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              asChild
            >
              <Link to="/admin/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteLogo({ className }: { className?: string }) {
  return (
    <Link to="/">
      <img
        src={sifiLogo}
        alt="Sugar Industry Foundation Inc."
        className={className ?? "h-9 w-auto sm:h-10 md:h-12"}
      />
    </Link>
  );
}
