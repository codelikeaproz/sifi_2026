import { useState } from "react";
import { m } from "@/lib/motion";

import { ScholarHonorBadge } from "@/components/ScholarHonorBadge";
import { ScholarHonorLine } from "@/components/ScholarHonorLine";
import { getHonorTier } from "@/lib/latinHonorDisplay";
import type { Review } from "@/components/ui/testimonial-slider-1";
import { useCardGlow } from "@/hooks/use-card-glow";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface ScholarGridCardProps {
  review: Review;
  index?: number;
  className?: string;
}

export function ScholarGridCard({
  review,
  index = 0,
  className,
}: ScholarGridCardProps) {
  const name = review.fullName ?? review.name;
  const school = review.schoolName ?? review.affiliation;
  const message = review.message ?? review.quote;
  const honorTier = getHonorTier(review.latinHonor, review.latinHonorLabel);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const { ref, glow, onMouseMove, onMouseLeave } = useCardGlow();
  const [expanded, setExpanded] = useState(false);

  const motionEnabled = !prefersReducedMotion;
  const isActive = canHover ? glow.active : expanded;

  function handleCardClick() {
    if (canHover) return;
    setExpanded((current) => !current);
  }

  return (
    <m.div
      className={cn("group relative", className)}
      initial={motionEnabled ? { opacity: 0, y: 24 } : false}
      whileInView={motionEnabled ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay: motionEnabled ? index * 0.06 : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={
        motionEnabled && canHover
          ? {
              y: -6,
              scale: 1.03,
              transition: { type: "spring", stiffness: 260, damping: 22 },
            }
          : undefined
      }
      whileTap={
        motionEnabled && !canHover
          ? { scale: 1.01, transition: { duration: 0.15 } }
          : undefined
      }
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-2 rounded-2xl bg-[#15803d]/0 blur-2xl transition-opacity duration-500",
          "opacity-0",
          canHover && "group-hover:opacity-100",
          isActive && "opacity-40"
        )}
        aria-hidden
      />

      <article
        ref={ref}
        onMouseMove={motionEnabled && canHover ? onMouseMove : undefined}
        onMouseLeave={motionEnabled && canHover ? onMouseLeave : undefined}
        onClick={!canHover ? handleCardClick : undefined}
        onKeyDown={
          canHover
            ? undefined
            : (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setExpanded((current) => !current);
              }
        }
        {...(!canHover
          ? {
              tabIndex: 0,
              role: "button" as const,
              "aria-expanded": expanded,
            }
          : {})}
        className={cn(
          "relative aspect-3/4 overflow-hidden rounded-xl",
          "border border-white/20 bg-card shadow-md",
          "transition-shadow duration-300",
          canHover &&
            "hover:shadow-[0_20px_40px_-12px_rgba(21,128,61,0.35)]",
          !canHover && expanded && "shadow-[0_16px_32px_-10px_rgba(21,128,61,0.3)]",
          !motionEnabled && "hover:shadow-lg",
          !canHover && "cursor-pointer select-none"
        )}
        aria-label={canHover ? name : `${name}. Tap for details.`}
      >
        {motionEnabled && canHover && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-20 rounded-xl opacity-0 transition-opacity duration-300",
              glow.active ? "opacity-100" : "group-hover:opacity-100"
            )}
            style={{
              background: glow.active
                ? `radial-gradient(520px circle at ${glow.x}px ${glow.y}px, rgba(21,128,61,0.18), rgba(212,175,55,0.06) 35%, transparent 55%)`
                : undefined,
            }}
            aria-hidden
          />
        )}

        {motionEnabled && !canHover && expanded && (
          <div
            className="pointer-events-none absolute inset-0 z-20 rounded-xl opacity-100 transition-opacity duration-300"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, rgba(21,128,61,0.2), rgba(212,175,55,0.05) 45%, transparent 70%)",
            }}
            aria-hidden
          />
        )}

        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-20 rounded-xl ring-1 ring-inset ring-white/10 transition-all duration-300",
            canHover && "group-hover:ring-[#15803d]/45",
            !canHover && expanded && "ring-[#15803d]/50",
            honorTier === "summa" && canHover && "group-hover:ring-[#d4af37]/30",
            honorTier === "summa" && !canHover && expanded && "ring-[#d4af37]/35"
          )}
          aria-hidden
        />

        <img
          src={review.imageSrc}
          alt={name}
          className={cn(
            "relative z-0 h-full w-full object-cover transition-transform duration-500 ease-out",
            canHover && motionEnabled && "group-hover:scale-[1.02]",
            !canHover && expanded && motionEnabled && "scale-[1.02]"
          )}
          loading="lazy"
        />

        <ScholarHonorBadge
          latinHonor={review.latinHonor}
          latinHonorLabel={review.latinHonorLabel}
        />

        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-20 px-3 pb-3 pt-12 text-white sm:px-4 sm:pb-4 sm:pt-16",
            "bg-linear-to-t from-primary/95 via-primary/70 to-transparent",
            "transition-all duration-300",
            canHover && "group-hover:from-primary group-hover:via-primary/95 group-hover:pt-24",
            !canHover && expanded && "from-primary via-primary/95 pt-20 sm:pt-24"
          )}
        >
          <div
            className={cn(
              "transition-opacity duration-300",
              canHover && "group-hover:opacity-0",
              !canHover && expanded && "opacity-0"
            )}
          >
            {school && (
              <p className="text-[10px] font-medium leading-snug opacity-90 line-clamp-2 sm:text-xs">
                {school}
              </p>
            )}
            <p className="mt-0.5 text-xs font-semibold leading-snug sm:mt-1 sm:text-sm">
              {name}
            </p>
          </div>

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 px-3 pb-3 opacity-0 transition-opacity duration-300 sm:px-4 sm:pb-4",
              canHover && "group-hover:opacity-100",
              !canHover && expanded && "opacity-100"
            )}
          >
            {school && (
              <p className="text-[10px] font-medium leading-snug opacity-90 line-clamp-2 sm:text-xs">
                {school}
              </p>
            )}
            <p className="mt-0.5 text-xs font-semibold leading-snug sm:mt-1 sm:text-sm">
              {name}
            </p>
            {review.degreeName && (
              <p className="mt-1.5 text-[10px] leading-snug opacity-90 line-clamp-2 sm:mt-2 sm:text-xs">
                {review.degreeName}
              </p>
            )}
            {review.yearGraduated && (
              <p className="mt-1 text-[10px] leading-snug opacity-90 sm:text-xs">
                Class of {review.yearGraduated}
              </p>
            )}
            {review.latinHonorLabel && (
              <ScholarHonorLine
                latinHonor={review.latinHonor}
                latinHonorLabel={review.latinHonorLabel}
                variant="dark"
                className="mt-1"
              />
            )}
            {message && (
              <blockquote className="mt-2 text-[10px] leading-relaxed opacity-95 line-clamp-3 sm:mt-3 sm:text-xs sm:line-clamp-4">
                &ldquo;{message}&rdquo;
              </blockquote>
            )}
          </div>
        </div>
      </article>
    </m.div>
  );
}
