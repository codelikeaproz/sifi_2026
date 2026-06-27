import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SIFI_OFFICIAL_URL } from "@/lib/sifi";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-primary/10 bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          This website is an independent graduation memory project created by a
          SIFI Scholar to celebrate the achievements and preserve the memories of
          the SIFI Scholars Class of 2026. It is not the official website of the
          Sugar Industry Foundation, Inc.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a
            href={SIFI_OFFICIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit the Official SIFI Website
            <ExternalLink className="ml-2 size-3.5" aria-hidden />
            <span className="sr-only">(opens in new tab)</span>
          </a>
        </Button>
        <p className="text-xs tracking-wide text-muted-foreground/80">
          Developed by © Sifi Scholar 2026 Ralph C. Jumao-as
        </p>
      </div>
    </footer>
  );
}
