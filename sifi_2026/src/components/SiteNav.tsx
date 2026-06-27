import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { ExternalLink, Menu, X } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SIFI_OFFICIAL_URL } from "@/lib/sifi";
import { cn } from "@/lib/utils";

type NavLinkItem = {
  label: string;
  href: string;
  external?: boolean;
  isActive?: (pathname: string) => boolean;
};

const NAV_ITEMS: NavLinkItem[] = [
  {
    label: "Scholars",
    href: "/",
    isActive: (pathname) => pathname === "/",
  },
  {
    label: "About SIFI",
    href: "/about",
    isActive: (pathname) => pathname === "/about",
  },
  {
    label: "Official Website",
    href: SIFI_OFFICIAL_URL,
    external: true,
  },
];

function NavLink({
  item,
  className,
  onNavigate,
  variant = "default",
}: {
  item: NavLinkItem;
  className?: string;
  onNavigate?: () => void;
  variant?: "default" | "drawer";
}) {
  const { pathname } = useLocation();
  const active = item.isActive?.(pathname) ?? false;

  const linkClass = cn(
    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
    variant === "default" &&
      (active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"),
    variant === "drawer" &&
      (active
        ? "bg-primary-foreground font-semibold text-primary"
        : "text-primary-foreground/90 hover:bg-primary-foreground/10"),
    className
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(linkClass, "inline-flex items-center gap-1")}
        onClick={onNavigate}
      >
        {item.label}
        <ExternalLink className="size-3.5 opacity-80" aria-hidden />
        <span className="sr-only">(opens in new tab)</span>
      </a>
    );
  }

  return (
    <Link to={item.href} className={linkClass} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

function MobileNavDrawer({
  showAdmin,
  onClose,
}: {
  showAdmin: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-100 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <nav
        className="absolute top-0 right-0 flex h-dvh w-72 max-w-[85vw] flex-col bg-primary p-4 text-primary-foreground shadow-xl"
        aria-label="Main"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold">Menu</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close menu"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              variant="drawer"
              className="w-full rounded-lg px-3 py-2.5 text-left"
              onNavigate={onClose}
            />
          ))}
        </div>

        <div className="mt-4 space-y-3 border-t border-primary-foreground/20 pt-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-sm font-medium text-primary-foreground/80">
              Appearance
            </span>
            <ThemeToggle onPrimary />
          </div>
          {showAdmin && (
            <Button
              variant="outline"
              className="w-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
              onClick={onClose}
            >
              <Link to="/admin/login">Login</Link>
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
}

export function SiteNav({ showAdmin = true }: { showAdmin?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.label} item={item} />
        ))}
      </nav>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {mobileOpen &&
        createPortal(
          <MobileNavDrawer showAdmin={showAdmin} onClose={closeMobile} />,
          document.body
        )}
    </>
  );
}
