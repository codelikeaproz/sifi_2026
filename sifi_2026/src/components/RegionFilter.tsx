import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Region, RegionFilterValue } from "@/lib/api";
import { REGION_OPTIONS } from "@/lib/api";

interface RegionFilterProps {
  value: RegionFilterValue;
  onChange: (value: RegionFilterValue) => void;
  lockedRegion?: Region;
  className?: string;
}

export function RegionFilter({
  value,
  onChange,
  lockedRegion,
  className,
}: RegionFilterProps) {
  const options: { value: RegionFilterValue; label: string }[] = lockedRegion
    ? [{ value: lockedRegion, label: REGION_OPTIONS.find((o) => o.value === lockedRegion)?.label ?? lockedRegion }]
    : [{ value: "all", label: "All" }, ...REGION_OPTIONS];

  return (
    <div
      className={cn("flex flex-wrap gap-1.5", className)}
      role="group"
      aria-label="Filter by region"
    >
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          size="sm"
          variant={value === opt.value ? "default" : "outline"}
          className="rounded-full px-3"
          disabled={Boolean(lockedRegion)}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
