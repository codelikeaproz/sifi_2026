import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  confirming?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  confirming = false,
}: DeleteConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !confirming) {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, confirming, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50"
        disabled={confirming}
        onClick={() => {
          if (!confirming) onOpenChange(false);
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className={cn(
          "relative z-10 grid w-full max-w-md gap-4 rounded-lg border bg-background p-6 shadow-lg"
        )}
      >
        <div className="space-y-2">
          <h2 id="delete-dialog-title" className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <p id="delete-dialog-description" className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            disabled={confirming}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="text-white"
            disabled={confirming}
            onClick={() => void onConfirm()}
          >
            {confirming ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
