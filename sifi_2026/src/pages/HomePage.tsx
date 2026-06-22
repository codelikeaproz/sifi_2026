import { useCallback, useEffect, useState } from "react";
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
import {
  getPublicScholarsPaginated,
  type PublicPageSize,
  type RegionFilterValue,
  type Scholar,
} from "@/lib/api";
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

function pageSizeForLayout(
  layoutMode: ScholarLayoutMode,
  isDesktop: boolean
): PublicPageSize {
  if (!isDesktop || layoutMode === "single") return 10;
  if (layoutMode === "grid-9") return 9;
  return 6;
}

export default function HomePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<ScholarLayoutMode>(readStoredLayout);
  const [region, setRegion] = useState<RegionFilterValue>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const pageSize = pageSizeForLayout(layoutMode, isDesktop);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const data = await getPublicScholarsPaginated({
        page: pageNum,
        pageSize,
        region,
        search: debouncedSearch,
      });
      const mapped = data.results.map(toSliderReview);
      setReviews((prev) => (append ? [...prev, ...mapped] : mapped));
      setTotalCount(data.count);
      setHasMore(data.next != null);
      setPage(pageNum);
    },
    [pageSize, region, debouncedSearch]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPage(1, false)
      .catch(() => {
        if (cancelled) return;
        if (!debouncedSearch) {
          setError("Could not reach the API. Showing sample scholars.");
          setReviews(fallbackReviews);
          setTotalCount(fallbackReviews.length);
          setHasMore(false);
          setPage(1);
        } else {
          setError("Search failed. Please try again.");
          setReviews([]);
          setTotalCount(0);
          setHasMore(false);
          setPage(1);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPage, debouncedSearch]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(page + 1, true);
    } catch {
      setError("Failed to load more scholars.");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, fetchPage]);

  function handleLayoutChange(mode: ScholarLayoutMode) {
    setLayoutMode(mode);
    persistLayout(mode);
  }

  const showSlider = !isDesktop || layoutMode === "single";
  const showGrid = isDesktop && layoutMode !== "single";
  const listKey = `${region}-${debouncedSearch}-${pageSize}`;

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
            {showSlider && (
              <TestimonialSlider
                key={listKey}
                reviews={reviews}
                totalCount={totalCount}
                onNearEnd={loadMore}
              />
            )}
            {showGrid && (
              <ScholarGridView
                reviews={reviews}
                totalCount={totalCount}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={loadMore}
              />
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
