"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-red-500">500</h1>
      <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={reset}
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
        <a
          href="/"
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
