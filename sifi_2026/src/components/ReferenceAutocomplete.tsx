import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReferenceRecord } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ReferenceAutocompleteProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  options: ReferenceRecord[];
  selectedId?: number | null;
  helperText?: string;
  onValueChange: (value: string) => void;
  onSelectOption: (option: ReferenceRecord) => void;
}

export function ReferenceAutocomplete({
  id,
  label,
  value,
  placeholder,
  required = false,
  disabled = false,
  loading = false,
  options,
  selectedId,
  helperText,
  onValueChange,
  onSelectOption,
}: ReferenceAutocompleteProps) {
  const [open, setOpen] = useState(false);

  const trimmedValue = value.trim();
  const exactMatch = useMemo(
    () => options.some((option) => option.name.toLowerCase() === trimmedValue.toLowerCase()),
    [options, trimmedValue]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
        {open && !disabled && (
          <div className="absolute top-[calc(100%+0.25rem)] z-30 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
            {loading && <p className="px-2 py-1 text-sm text-muted-foreground">Searching…</p>}
            {!loading && options.length === 0 && trimmedValue.length === 0 && (
              <p className="px-2 py-1 text-sm text-muted-foreground">Start typing to search.</p>
            )}
            {!loading && options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent",
                  selectedId === option.id && "bg-accent"
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelectOption(option);
                  setOpen(false);
                }}
              >
                <span className="truncate">{option.name}</span>
                {selectedId === option.id && (
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">Selected</span>
                )}
              </button>
            ))}
            {!loading && trimmedValue.length > 0 && !exactMatch && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                No exact match. Saving will add <span className="font-medium">"{trimmedValue}"</span> to
                this region.
              </p>
            )}
          </div>
        )}
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}
