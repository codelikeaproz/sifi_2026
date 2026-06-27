import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Search } from "lucide-react";

import { LazyMotion, domAnimation } from "@/lib/motion";
import { MobileCelebrationOverlay } from "@/components/MobileCelebrationOverlay";
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
import { useMobileCelebration } from "@/hooks/use-mobile-celebration";
import {
  getPublicScholarsPaginated,
  type PublicPageSize,
  type RegionFilterValue,
  type Scholar,
} from "@/lib/api";
import { fallbackReviews } from "@/lib/fallback-reviews";

function toSliderReview(s: Scholar): Review {
  return {
    id: s.id,
    name: s.fullName,
    fullName: s.fullName,
    affiliation: s.schoolName ?? s.school,
    schoolName: s.schoolName ?? s.school,
    degreeName: s.degreeName,
    yearGraduated: s.year_graduated,
    quote: s.message,
    message: s.message,
    latinHonor: s.latinHonor ?? s.latin_honor ?? "",
    latinHonorLabel: s.latinHonorLabel,
    imageSrc: s.imageSrc,
    thumbnailSrc: s.thumbnailSrc,
  };
}

function pageSizeForLayout(layoutMode: ScholarLayoutMode): PublicPageSize {
  if (layoutMode === "single") return 10;
  if (layoutMode === "grid-9") return 9;
  return 6;
}

type FetchState = {
  reviews: Review[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
};

const initialFetchState: FetchState = {
  reviews: [],
  totalCount: 0,
  page: 1,
  hasMore: false,
  loading: true,
  loadingMore: false,
  error: null,
};

type FetchAction =
  | { type: "FETCH_START"; silent?: boolean }
  | {
      type: "FETCH_SUCCESS";
      reviews: Review[];
      totalCount: number;
      hasMore: boolean;
      page: number;
      append: boolean;
    }
  | { type: "FETCH_ERROR"; message: string; useFallback?: boolean }
  | { type: "LOAD_MORE_START" }
  | { type: "LOAD_MORE_ERROR"; message: string }
  | { type: "LOAD_MORE_END" };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        loading: action.silent ? state.loading : true,
        error: null,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        reviews: action.append
          ? [...state.reviews, ...action.reviews]
          : action.reviews,
        totalCount: action.totalCount,
        hasMore: action.hasMore,
        page: action.page,
        loading: false,
        loadingMore: false,
        error: null,
      };
    case "FETCH_ERROR":
      if (action.useFallback) {
        return {
          ...state,
          reviews: fallbackReviews,
          totalCount: fallbackReviews.length,
          hasMore: false,
          page: 1,
          error: action.message,
          loading: false,
          loadingMore: false,
        };
      }
      return {
        ...state,
        reviews: [],
        totalCount: 0,
        hasMore: false,
        page: 1,
        error: action.message,
        loading: false,
        loadingMore: false,
      };
    case "LOAD_MORE_START":
      return { ...state, loadingMore: true };
    case "LOAD_MORE_ERROR":
      return { ...state, loadingMore: false, error: action.message };
    case "LOAD_MORE_END":
      return { ...state, loadingMore: false };
    default:
      return state;
  }
}

export default function HomePage() {
  const [fetchState, dispatchFetch] = useReducer(fetchReducer, initialFetchState);
  const [layoutMode, setLayoutMode] = useState<ScholarLayoutMode>(readStoredLayout);
  const [region, setRegion] = useState<RegionFilterValue>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { celebrating: gridCelebrating, triggerCelebration } = useMobileCelebration();
  const layoutOnlyRefetchRef = useRef(false);

  const { reviews, totalCount, page, hasMore, loading, loadingMore, error } =
    fetchState;
  const pageSize = pageSizeForLayout(layoutMode);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      const data = await getPublicScholarsPaginated({
        page: pageNum,
        pageSize,
        region,
        search: debouncedSearch,
      });
      dispatchFetch({
        type: "FETCH_SUCCESS",
        reviews: data.results.map(toSliderReview),
        totalCount: data.count,
        hasMore: data.next != null,
        page: pageNum,
        append,
      });
    },
    [pageSize, region, debouncedSearch]
  );

  useEffect(() => {
    let cancelled = false;
    const silentRefetch = layoutOnlyRefetchRef.current;
    layoutOnlyRefetchRef.current = false;

    dispatchFetch({ type: "FETCH_START", silent: silentRefetch });

    fetchPage(1, false).catch(() => {
      if (cancelled) return;
      dispatchFetch({
        type: "FETCH_ERROR",
        message: debouncedSearch
          ? "Search failed. Please try again."
          : "Could not reach the API. Showing sample scholars.",
        useFallback: !debouncedSearch,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPage, debouncedSearch]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    dispatchFetch({ type: "LOAD_MORE_START" });
    try {
      await fetchPage(page + 1, true);
    } catch {
      dispatchFetch({
        type: "LOAD_MORE_ERROR",
        message: "Failed to load more scholars.",
      });
    }
  }, [hasMore, loadingMore, page, fetchPage]);

  function handleLayoutChange(mode: ScholarLayoutMode) {
    if (mode !== layoutMode) {
      layoutOnlyRefetchRef.current = reviews.length > 0;
      if (mode === "grid-6" || mode === "grid-9") {
        triggerCelebration({ allowDesktop: true });
      }
    }
    setLayoutMode(mode);
    persistLayout(mode);
  }

  const showSlider = layoutMode === "single";
  const showGrid = layoutMode !== "single";
  const listKey = `${region}-${debouncedSearch}-${pageSize}`;

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex min-h-svh flex-col bg-background">
        <SiteHeader />

        <main className="relative flex-1">
          <MobileCelebrationOverlay
            active={gridCelebrating && showGrid}
            showOnDesktop
            className="fixed inset-0 z-60 rounded-none"
          />
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
    </LazyMotion>
  );
}
