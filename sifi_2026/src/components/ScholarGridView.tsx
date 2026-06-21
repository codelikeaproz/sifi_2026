import { useEffect, useState } from "react";

import { ScholarGridCard } from "@/components/ScholarGridCard";
import { Button } from "@/components/ui/button";
import type { Review } from "@/components/ui/testimonial-slider-1";
import type { ScholarLayoutMode } from "@/components/ScholarLayoutToggle";
import { cn } from "@/lib/utils";

function pageSizeForMode(mode: ScholarLayoutMode): number {
  return mode === "grid-9" ? 9 : 6;
}

interface ScholarGridViewProps {
  reviews: Review[];
  layoutMode: ScholarLayoutMode;
  className?: string;
}

export function ScholarGridView({
  reviews,
  layoutMode,
  className,
}: ScholarGridViewProps) {
  const pageSize = pageSizeForMode(layoutMode);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [layoutMode, pageSize, reviews]);

  const visible = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  return (
    <section
      className={cn(
        "mx-auto max-w-6xl px-4 py-8 sm:px-6",
        className
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
          Scholars
        </h2>
        <span className="text-sm font-mono text-muted-foreground">
          {String(reviews.length).padStart(2, "0")} total
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {visible.map((review) => (
          <ScholarGridCard key={review.id} review={review} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((count) => count + pageSize)}
          >
            Load more
          </Button>
        </div>
      )}
    </section>
  );
}
