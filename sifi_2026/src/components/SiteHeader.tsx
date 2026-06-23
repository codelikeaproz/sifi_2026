import { Link } from "react-router-dom";

import sifiLogo from "@/assets/sifi_logo.png";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  showAdmin?: boolean;
}

export function SiteHeader({ showAdmin = true }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/20 bg-background px-4 py-3 sm:px-6">
      <Link to="/">
        <img
          src={sifiLogo}
          alt="Sugar Industry Foundation Inc."
          className="h-9 w-auto sm:h-10 md:h-12"
        />
      </Link>
      {showAdmin && (
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" asChild>
          <Link to="/admin/login">Login</Link>
        </Button>
      )}
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
