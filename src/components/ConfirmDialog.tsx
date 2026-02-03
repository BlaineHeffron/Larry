"use client";

import Alert from "./Alert";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  confirmingLabel?: string;
  error?: string | null;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  confirmingLabel = "Deleting...",
  error,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-[var(--card-foreground)]">{title}</h3>
        <div className="mt-2 text-sm text-[var(--muted-foreground)]">{message}</div>
        {error && <Alert className="mt-3">{error}</Alert>}
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {busy ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
