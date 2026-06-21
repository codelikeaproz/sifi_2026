import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { ScholarGridView } from "@/components/ScholarGridView";
import {
  persistLayout,
  readStoredLayout,
  ScholarLayoutToggle,
  type ScholarLayoutMode,
} from "@/components/ScholarLayoutToggle";
import { RegionFilter } from "@/components/RegionFilter";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { TestimonialSlider, type Review } from "@/components/ui/testimonial-slider-1";
import { useDebounce } from "@/hooks/use-debounce";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getScholars, type RegionFilterValue, type Scholar } from "@/lib/api";
import { fallbackReviews } from "@/pages/TestimonialSliderDemo";

function toSliderReview(s: Scholar): Review {
  return {
    id: s.id,
    name: s.fullName,
    fullName: s.fullName,
    affiliation: s.schoolName ?? s.school,
    schoolName: s.schoolName ?? s.school,
    degreeName: s.degreeName,
    quote: s.message,
    message: s.message,
    latinHonorLabel: s.latinHonorLabel,
    imageSrc: s.imageSrc,
    thumbnailSrc: s.thumbnailSrc,
  };
}

export default function HomePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<ScholarLayoutMode>(readStoredLayout);
  const [region, setRegion] = useState<RegionFilterValue>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getScholars({ region, search: debouncedSearch })
      .then((data) => {
        if (cancelled) return;
        setReviews(data.map(toSliderReview));
      })
      .catch(() => {
        if (cancelled) return;
        if (!debouncedSearch) {
          setError("Could not reach the API. Showing sample scholars.");
          setReviews(fallbackReviews);
        } else {
          setError("Search failed. Please try again.");
          setReviews([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [region, debouncedSearch]);

  function handleLayoutChange(mode: ScholarLayoutMode) {
    setLayoutMode(mode);
    persistLayout(mode);
  }

  const showSlider = !isDesktop || layoutMode === "single";
  const showGrid = isDesktop && layoutMode !== "single";

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl space-y-3 px-4 pt-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <RegionFilter value={region} onChange={setRegion} />
            <ScholarLayoutToggle value={layoutMode} onChange={handleLayoutChange} />
          </div>

          <div className="relative w-full sm:max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, school, degree…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {error && (
          <p className="px-4 py-2 text-sm text-muted-foreground sm:px-6">{error}</p>
        )}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
            Loading scholars…
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
            {debouncedSearch
              ? "No scholars match your search."
              : "No scholars in this region yet."}
          </div>
        ) : (
          <>
            {showSlider && <TestimonialSlider reviews={reviews} />}
            {showGrid && (
              <ScholarGridView reviews={reviews} layoutMode={layoutMode} />
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
