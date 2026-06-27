import {
  GraduationCap,
  Heart,
  Handshake,
  Sprout,
  ExternalLink,
} from "lucide-react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { SIFI_OFFICIAL_URL, SIFI_YEARBOOK_TAGLINE } from "@/lib/sifi";

const PILLARS = [
  {
    icon: GraduationCap,
    title: "Education",
    description:
      "Scholarships, educational assistance, and technical-vocational training.",
  },
  {
    icon: Heart,
    title: "Health",
    description: "Medical missions, health insurance assistance, and wellness.",
  },
  {
    icon: Sprout,
    title: "Livelihood",
    description: "Skills development, enterprise programs, and cooperatives.",
  },
  {
    icon: Handshake,
    title: "Advocacy",
    description: "Child welfare, family wellness, and community development.",
  },
] as const;

export default function AboutSifiPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <header className="border-b border-primary/10 pb-10">
            <p className="text-sm font-medium tracking-wide text-primary">
              {SIFI_YEARBOOK_TAGLINE}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              About SIFI
            </h1>
            <p className="mt-4 text-muted-foreground italic">
              Empowering communities through education, health, livelihood, and
              advocacy.
            </p>
          </header>

          <section className="py-10" aria-labelledby="who-we-are-heading">
            <h2
              id="who-we-are-heading"
              className="text-sm font-semibold tracking-wide text-primary uppercase"
            >
              Who We Are
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              The Sugar Industry Foundation, Inc. (SIFI) is a non-profit
              organization dedicated to improving the lives of sugar workers,
              their families, and communities through sustainable development
              programs. Guided by its vision of building stable and self-reliant
              sugar-producing communities, SIFI focuses on education, health,
              livelihood, and advocacy initiatives that empower individuals and
              create lasting opportunities.
            </p>
          </section>

          <section
            className="grid gap-8 border-y border-primary/10 py-10 sm:grid-cols-2"
            aria-labelledby="vision-mission-heading"
          >
            <h2 id="vision-mission-heading" className="sr-only">
              Vision and Mission
            </h2>
            <div>
              <h3 className="text-sm font-semibold text-primary">Vision</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Stable and self-reliant sugar producing and milling communities.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">Mission</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A professionally run, apolitical, progressive social development
                foundation capable of initiating, developing, promoting, and
                supporting programs for sugar workers, their families, and their
                communities.
              </p>
            </div>
          </section>

          <section className="py-10" aria-labelledby="pillars-heading">
            <h2
              id="pillars-heading"
              className="text-sm font-semibold tracking-wide text-primary uppercase"
            >
              Four Pillars
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2">
              {PILLARS.map((pillar) => (
                <li key={pillar.title} className="flex gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <pillar.icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-medium text-foreground">{pillar.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {pillar.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="pt-2">
            <Button variant="outline" asChild>
              <a
                href={SIFI_OFFICIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Official SIFI Website
                <ExternalLink className="ml-2 size-3.5" aria-hidden />
                <span className="sr-only">(opens in new tab)</span>
              </a>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
