import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu, Users, GraduationCap, BookOpen, ExternalLink, BarChart3 } from "lucide-react";

import sifiLogo from "@/assets/sifi_logo.png";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
}

type NavItem = {
  label: string;
  to?: string;
  icon: ReactNode;
  onClick?: () => void;
  external?: boolean;
};

function SidebarContent({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-3 px-3 py-2" onClick={onNavigate}>
        <img
          src={sifiLogo}
          alt="Sugar Industry Foundation Inc."
          className="h-10 w-auto"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary">SIFI Admin</p>
          <p className="truncate text-xs text-muted-foreground">Scholar management</p>
        </div>
      </Link>

      <nav className="mt-6 flex-1 space-y-1">
        {items.map((item) => {
          const isActive = item.to ? pathname === item.to || pathname.startsWith(`${item.to}/`) : false;
          const content = (
            <>
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {item.external && <ExternalLink className="ml-auto size-3.5 opacity-70" />}
            </>
          );

          if (item.to) {
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick?.();
                onNavigate?.();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {content}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminShell({
  title,
  description,
  actions,
  contentClassName,
  children,
}: AdminShellProps) {
  const { canManageUsers, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const items = useMemo<NavItem[]>(
    () => [
      {
        label: "Scholars",
        to: "/admin/scholars",
        icon: <GraduationCap className="size-4" />,
      },
      {
        label: "Schools & Degrees",
        to: "/admin/reference-data",
        icon: <BookOpen className="size-4" />,
      },
      {
        label: "Analytics",
        to: "/admin/analytics",
        icon: <BarChart3 className="size-4" />,
      },
      ...(canManageUsers
        ? [
            {
              label: "Users",
              to: "/admin/users",
              icon: <Users className="size-4" />,
            } satisfies NavItem,
          ]
        : []),
      {
        label: "View site",
        to: "/",
        icon: <ExternalLink className="size-4" />,
        external: true,
      },
      {
        label: "Log out",
        onClick: logout,
        icon: <LogOut className="size-4" />,
      },
    ],
    [canManageUsers, logout]
  );

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="hidden w-72 shrink-0 border-r bg-card/60 px-4 py-4 md:block">
        <SidebarContent items={items} pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85vw] border-r bg-background p-4 shadow-xl">
            <SidebarContent
              items={items}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="rounded-md border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img
                src={sifiLogo}
                alt="Sugar Industry Foundation Inc."
                className="h-9 w-auto"
              />
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6">
          {(title || description || actions) && (
            <div
              className={cn(
                "mx-auto mb-6 flex w-full max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between",
                contentClassName
              )}
            >
              <div>
                {title && <h1 className="text-2xl font-semibold text-primary">{title}</h1>}
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              <div className="flex items-center gap-3 self-start md:self-auto">
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>
                {actions}
              </div>
            </div>
          )}
          <div className={cn("mx-auto w-full max-w-6xl", contentClassName)}>
            {children}
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
