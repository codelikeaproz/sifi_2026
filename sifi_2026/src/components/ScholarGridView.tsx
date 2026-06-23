import { ScholarGridCard } from "@/components/ScholarGridCard";
import { Button } from "@/components/ui/button";
import type { Review } from "@/components/ui/testimonial-slider-1";
import { cn } from "@/lib/utils";

interface ScholarGridViewProps {
  reviews: Review[];
  totalCount: number;
  hasMore: boolean;
  loadingMore?: boolean;
  onLoadMore: () => void;
  className?: string;
}

export function ScholarGridView({
  reviews,
  totalCount,
  hasMore,
  loadingMore = false,
  onLoadMore,
  className,
}: ScholarGridViewProps) {
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
          {String(totalCount).padStart(2, "0")} total
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-6">
        {reviews.map((review, index) => (
          <ScholarGridCard key={review.id} review={review} index={index} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </section>
  );
}
