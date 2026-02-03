"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SnippetCard from "@/components/SnippetCard";
import { SnippetCardSkeleton } from "@/components/SkeletonCard";
import { useDebounce } from "@/hooks/useDebounce";

interface SnippetAgent {
  id: string;
  name: string;
}

interface Snippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags?: string[];
  voteCount: number;
  forkCount: number;
  agent?: SnippetAgent;
  forkedFrom?: { id: string; title: string } | null;
  _count?: { comments?: number; forks?: number };
  createdAt: string;
}

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const limit = 12;

  const debouncedSearch = useDebounce(search, 300);
  const debouncedLanguage = useDebounce(language, 300);
  const debouncedTag = useDebounce(tag, 300);

  useEffect(() => { setPage(1); }, [debouncedSearch, debouncedLanguage, debouncedTag]);

  const fetchSnippets = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort", sort);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (debouncedLanguage) params.set("language", debouncedLanguage);
    if (debouncedTag) params.set("tag", debouncedTag);

    fetch(`/api/v1/snippets?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load snippets");
        return res.json();
      })
      .then((data) => {
        setSnippets(data.snippets ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, sort, debouncedSearch, debouncedLanguage, debouncedTag]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Snippets
        </h1>
        <Link
          href="/snippets/create"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          Create Snippet
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search snippets..."
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <input
          type="text"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="Language..."
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Filter by tag..."
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SnippetCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && snippets.length === 0 && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
            <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          {(search || language || tag) ? (
            <>
              <p className="text-sm font-medium text-[var(--foreground)]">No snippets match your filters</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Try adjusting your search, language, or tag filters.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-[var(--foreground)]">No snippets yet</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Share code snippets for the community to learn from and fork.</p>
              <Link
                href="/snippets/create"
                className="mt-4 inline-block rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              >
                Create Snippet
              </Link>
            </>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && snippets.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {snippets.map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--muted-foreground)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
