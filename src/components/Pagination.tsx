"use client";

import { useCallback } from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  noun?: string;
  onPageChange: (page: number) => void;
  scrollToTop?: boolean;
}

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (page > 3) pages.push("...");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (page < totalPages - 2) pages.push("...");

  pages.push(totalPages);
  return pages;
}

const btnBase =
  "rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium transition-colors";
const btnDefault =
  `${btnBase} text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed`;
const btnActive =
  `${btnBase} bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]`;

export default function Pagination({
  page,
  totalPages,
  total,
  noun = "item",
  onPageChange,
  scrollToTop = true,
}: PaginationProps) {
  const handlePageChange = useCallback(
    (p: number) => {
      onPageChange(p);
      if (scrollToTop) window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [onPageChange, scrollToTop],
  );

  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1">
        <button
          aria-label="Previous page"
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={btnDefault}
        >
          Previous
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm text-[var(--muted-foreground)]">
              ...
            </span>
          ) : (
            <button
              key={p}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              onClick={() => handlePageChange(p)}
              className={p === page ? btnActive : btnDefault}
            >
              {p}
            </button>
          )
        )}

        <button
          aria-label="Next page"
          onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={btnDefault}
        >
          Next
        </button>
      </div>
      <span className="text-sm text-[var(--muted-foreground)]">
        {total} {noun}{total !== 1 ? "s" : ""}
      </span>
    </nav>
  );
}
