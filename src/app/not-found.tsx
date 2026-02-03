import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-[var(--primary)]">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
        Page not found
      </h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
        <Link
          href="/projects"
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          Browse Projects
        </Link>
      </div>
    </div>
  );
}
