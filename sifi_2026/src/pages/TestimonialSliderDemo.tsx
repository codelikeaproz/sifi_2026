import { TestimonialSlider } from "@/components/ui/testimonial-slider-1";
import { fallbackReviews } from "@/lib/fallback-reviews";

export default function TestimonialSliderDemo() {
  return (
    <div className="w-full">
      <TestimonialSlider reviews={fallbackReviews} />
    </div>
  );
}
