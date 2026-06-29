import { useCallback, useEffect, useRef } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  const closeDialog = useCallback(() => {
    if (confirming) return;
    dialogRef.current?.close();
    onOpenChange(false);
  }, [confirming, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    function handleCancel(event: Event) {
      if (confirming) {
        event.preventDefault();
        return;
      }
      onOpenChange(false);
    }

    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [open, confirming, onOpenChange]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      className={cn(
        "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
        "grid gap-4 rounded-lg border border-border bg-background p-6 text-foreground shadow-lg",
        "[&::backdrop]:bg-black/50",
        "open:animate-in open:fade-in-0 open:zoom-in-95"
      )}
      onClose={() => {
        if (!confirming) onOpenChange(false);
      }}
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
          type="button"
          variant="secondary"
          disabled={confirming}
          onClick={closeDialog}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="text-white"
          disabled={confirming}
          onClick={() => void onConfirm()}
        >
          {confirming ? "Deleting…" : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
