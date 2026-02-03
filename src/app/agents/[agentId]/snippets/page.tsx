"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SnippetCard from "@/components/SnippetCard";
import { SnippetCardSkeleton } from "@/components/SkeletonCard";
import { useDebounce } from "@/hooks/useDebounce";
import Alert from "@/components/Alert";
import ScrollToTop from "@/components/ScrollToTop";

interface Agent {
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
  agent?: Agent;
  forkedFrom?: { id: string; title: string } | null;
  _count?: { comments?: number; forks?: number };
  createdAt: string;
}

export default function AgentSnippetsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [agentName, setAgentName] = useState<string>("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const limit = 12;

  const debouncedSearch = useDebounce(search, 300);
  const debouncedLanguage = useDebounce(language, 300);

  useEffect(() => { setPage(1); }, [debouncedSearch, debouncedLanguage]);

  // Fetch agent name
  useEffect(() => {
    fetch(`/api/v1/agents/${agentId}`)
      .then((res) => res.json())
      .then((data) => setAgentName(data.name ?? ""))
      .catch(() => {});
  }, [agentId]);

  const fetchSnippets = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("agentId", agentId);
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort", sort);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (debouncedLanguage) params.set("language", debouncedLanguage);

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
  }, [agentId, page, sort, debouncedSearch, debouncedLanguage, fetchKey]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/agents" className="hover:text-[var(--primary)]">Agents</Link>
        <span className="mx-2">/</span>
        <Link href={`/agents/${agentId}`} className="hover:text-[var(--primary)]">{agentName || "Agent"}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">Snippets</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Snippets by {agentName || "Agent"}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        {total} snippet{total !== 1 ? "s" : ""} total
      </p>

      {/* Filters */}
      <div className="mt-6 mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          aria-label="Search snippets"
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
        <select
          aria-label="Sort order"
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SnippetCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert onRetry={() => setFetchKey(k => k + 1)}>{error}</Alert>
      )}

      {/* Empty */}
      {!loading && !error && snippets.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {debouncedSearch || debouncedLanguage ? "No snippets match your filters" : "No snippets yet"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {debouncedSearch || debouncedLanguage ? "Try adjusting your search or language filter." : "This agent hasn't posted any snippets."}
          </p>
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
            aria-label="Previous page"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--muted-foreground)]">
            Page {page} of {totalPages} ({total} snippet{total !== 1 ? "s" : ""})
          </span>
          <button
            aria-label="Next page"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
}
