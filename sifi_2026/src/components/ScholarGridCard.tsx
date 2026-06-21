import type { Review } from "@/components/ui/testimonial-slider-1";
import { cn } from "@/lib/utils";

interface ScholarGridCardProps {
  review: Review;
  className?: string;
}

export function ScholarGridCard({ review, className }: ScholarGridCardProps) {
  const name = review.fullName ?? review.name;
  const school = review.schoolName ?? review.affiliation;
  const message = review.message ?? review.quote;

  return (
    <article
      className={cn(
        "group relative aspect-[3/4] overflow-hidden rounded-lg",
        className
      )}
      aria-label={name}
    >
      <img
        src={review.imageSrc}
        alt={name}
        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:-rotate-2 group-hover:scale-[1.02]"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/95 via-primary/70 to-transparent px-4 pb-4 pt-16 text-primary-foreground transition-all duration-300 group-hover:from-primary group-hover:via-primary/95 group-hover:pt-24">
        <div className="transition-opacity duration-300 group-hover:opacity-0">
          {school && (
            <p className="text-xs font-medium leading-snug opacity-90 line-clamp-2">
              {school}
            </p>
          )}
          <p className="mt-1 text-sm font-semibold leading-snug">{name}</p>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {school && (
            <p className="text-xs font-medium leading-snug opacity-90 line-clamp-2">
              {school}
            </p>
          )}
          <p className="mt-1 text-sm font-semibold leading-snug">{name}</p>
          {review.degreeName && (
            <p className="mt-2 text-xs leading-snug opacity-90 line-clamp-2">
              {review.degreeName}
            </p>
          )}
          {review.latinHonorLabel && (
            <p className="mt-1 text-xs font-medium italic opacity-90">
              {review.latinHonorLabel}
            </p>
          )}
          {message && (
            <blockquote className="mt-3 text-xs leading-relaxed opacity-95 line-clamp-4">
              &ldquo;{message}&rdquo;
            </blockquote>
          )}
        </div>
      </div>
    </article>
  );
}
