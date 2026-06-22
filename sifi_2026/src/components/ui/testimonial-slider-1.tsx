import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileCelebrationOverlay } from "@/components/MobileCelebrationOverlay";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  fireMobileScholarConfetti,
  isMobileViewport,
  MOBILE_CELEBRATION_MS,
} from "@/lib/mobile-confetti";

export type Review = {
  id: string | number;
  name: string;
  affiliation: string;
  quote: string;
  imageSrc: string;
  thumbnailSrc: string;
  schoolName?: string;
  latinHonorLabel?: string;
  degreeName?: string;
  fullName?: string;
  message?: string;
};

interface TestimonialSliderProps {
  reviews: Review[];
  totalCount?: number;
  onNearEnd?: () => void;
  className?: string;
}

const THUMBNAIL_COUNT = 5;

export const TestimonialSlider = ({
  reviews,
  totalCount: totalCountProp,
  onNearEnd,
  className,
}: TestimonialSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [celebrating, setCelebrating] = useState(false);
  const celebrationTimerRef = useRef<number | undefined>(undefined);
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current !== undefined) {
        window.clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  const totalCount = totalCountProp ?? reviews.length;

  useEffect(() => {
    const index = Math.min(currentIndex, Math.max(0, reviews.length - 1));
    if (
      onNearEnd &&
      reviews.length > 0 &&
      reviews.length < totalCount &&
      index + THUMBNAIL_COUNT >= reviews.length
    ) {
      onNearEnd();
    }
  }, [currentIndex, reviews.length, totalCount, onNearEnd]);

  if (reviews.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        No scholars yet.
      </div>
    );
  }

  const index = Math.min(currentIndex, reviews.length - 1);
  const activeReview = reviews[index];
  const mobileTilt = isMobile && !prefersReducedMotion;

  function triggerMobileCelebration() {
    if (!isMobileViewport()) return;
    fireMobileScholarConfetti();
    setCelebrating(true);
    if (celebrationTimerRef.current !== undefined) {
      window.clearTimeout(celebrationTimerRef.current);
    }
    celebrationTimerRef.current = window.setTimeout(
      () => setCelebrating(false),
      MOBILE_CELEBRATION_MS
    );
  }

  const handleNext = () => {
    setDirection("right");
    triggerMobileCelebration();
    setCurrentIndex((prev) => {
      if (prev + 1 < reviews.length) return prev + 1;
      if (reviews.length < totalCount) {
        onNearEnd?.();
        return prev;
      }
      return (prev + 1) % totalCount;
    });
  };

  const handlePrev = () => {
    setDirection("left");
    const bound = reviews.length >= totalCount ? totalCount : reviews.length;
    setCurrentIndex((prev) => (prev - 1 + bound) % bound);
  };

  const handleThumbnailClick = (targetIndex: number) => {
    if (targetIndex === index) return;
    setDirection(targetIndex > index ? "right" : "left");
    triggerMobileCelebration();
    setCurrentIndex(targetIndex);
  };

  const thumbnailReviews = reviews.slice(
    index + 1,
    index + 1 + THUMBNAIL_COUNT
  );

  const imageVariants = {
    enter: (dir: "left" | "right") => ({
      y: dir === "right" ? "100%" : "-100%",
      opacity: 0,
      ...(mobileTilt && dir === "right" ? { rotate: -3 } : {}),
    }),
    center: { y: 0, opacity: 1, rotate: 0 },
    exit: (dir: "left" | "right") => ({
      y: dir === "right" ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  const textVariants = {
    enter: (dir: "left" | "right") => ({
      x: dir === "right" ? 50 : -50,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: "left" | "right") => ({
      x: dir === "right" ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <div
      className={cn(
        "relative w-full min-h-[650px] md:min-h-[600px] overflow-hidden bg-background text-foreground p-8 md:p-12",
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
        <div className="md:col-span-3 flex flex-col justify-between order-2 md:order-1">
          <div className="flex flex-row md:flex-col justify-between md:justify-start space-x-4 md:space-x-0 md:space-y-4">
            <span className="text-sm text-muted-foreground font-mono">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(totalCount).padStart(2, "0")}
            </span>
            <h2 className="text-sm font-medium tracking-widest uppercase [writing-mode:vertical-rl] md:rotate-180 hidden md:block">
              Scholars
            </h2>
          </div>

          {thumbnailReviews.length > 0 && (
            <div className="mt-8 flex flex-nowrap gap-2 overflow-x-auto pb-1 md:mt-0 md:max-w-full">
              {thumbnailReviews.map((review, i) => {
                const originalIndex = index + 1 + i;
                return (
                  <button
                    key={review.id}
                    onClick={() => handleThumbnailClick(originalIndex)}
                    className="shrink-0 overflow-hidden rounded-md w-14 h-[4.5rem] sm:w-16 sm:h-20 md:w-20 md:h-24 opacity-70 hover:opacity-100 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                    aria-label={`View scholar ${review.name}`}
                  >
                    <img
                      src={review.thumbnailSrc}
                      alt={review.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="md:col-span-4 relative h-80 min-h-[400px] md:min-h-[500px] md:bg-muted/30 md:rounded-lg order-1 md:order-2">
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={index}
              src={activeReview.imageSrc}
              alt={activeReview.name}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 w-full h-full object-cover md:object-contain md:object-center rounded-lg"
            />
          </AnimatePresence>
          <MobileCelebrationOverlay active={celebrating && isMobile} />
        </div>

        <div className="md:col-span-5 flex flex-col justify-between md:pl-8 order-3 md:order-3">
          <div className="relative overflow-hidden pt-4 md:pt-24 min-h-[200px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={index}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                {activeReview.schoolName && (
                  <p className="text-sm font-medium text-muted-foreground">
                    {activeReview.schoolName}
                  </p>
                )}
                {activeReview.degreeName && (
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {activeReview.degreeName}
                  </p>
                )}
                <h3 className="text-xl font-semibold mt-1">
                  {activeReview.fullName ?? activeReview.name}
                </h3>
                {activeReview.latinHonorLabel && (
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {activeReview.latinHonorLabel}
                  </p>
                )}
                <blockquote className="mt-6 text-2xl md:text-3xl font-medium leading-snug">
                  &ldquo;{activeReview.message ?? activeReview.quote}&rdquo;
                </blockquote>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-2 mt-8 md:mt-0">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-12 h-12 border-muted-foreground/50"
              onClick={handlePrev}
              aria-label="Previous scholar"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="rounded-full w-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleNext}
              aria-label="Next scholar"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
