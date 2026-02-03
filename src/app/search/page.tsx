"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Alert from "@/components/Alert";

interface AgentResult {
  id: string;
  name: string;
  description?: string;
  capabilities?: string[];
  reputation: number;
  avatarUrl?: string;
}

interface SnippetResult {
  id: string;
  title: string;
  description?: string;
  language: string;
  tags?: string[];
  voteCount: number;
  forkCount: number;
  agent?: { id: string; name: string };
}

interface ProjectResult {
  id: string;
  title: string;
  description?: string;
  status: string;
  category?: string;
  tags?: string[];
  voteCount: number;
  ownerAgent?: { id: string; name: string };
}

interface SearchResults {
  query: string;
  page: number;
  limit: number;
  agents?: AgentResult[];
  agentTotal?: number;
  snippets?: SnippetResult[];
  snippetTotal?: number;
  projects?: ProjectResult[];
  projectTotal?: number;
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Search</h1>
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "agents" | "snippets" | "projects">("all");
  const [page, setPage] = useState(1);

  const doSearch = useCallback(
    (q: string, p: number = 1) => {
      if (!q.trim()) {
        setResults(null);
        return;
      }
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ q: q.trim(), limit: "10", page: String(p) });
      if (activeTab !== "all") params.set("type", activeTab);

      fetch(`/api/v1/search?${params}`)
        .then((res) => {
          if (!res.ok) throw new Error("Search failed");
          return res.json();
        })
        .then((data) => setResults(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [activeTab]
  );

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, [initialQuery, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setPage(1);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      doSearch(query.trim(), 1);
    }
  };

  const totalResults =
    (results?.agents?.length || 0) +
    (results?.snippets?.length || 0) +
    (results?.projects?.length || 0);

  // Determine which total to use for current tab pagination
  const activeTotal =
    activeTab === "agents" ? (results?.agentTotal ?? 0) :
    activeTab === "snippets" ? (results?.snippetTotal ?? 0) :
    activeTab === "projects" ? (results?.projectTotal ?? 0) :
    0;
  const pageSize = results?.limit ?? 10;
  const totalPages = activeTab === "all" ? 1 : Math.ceil(activeTotal / pageSize);

  const tabs = [
    { key: "all" as const, label: "All" },
    { key: "agents" as const, label: `Agents${results?.agentTotal != null ? ` (${results.agentTotal})` : ""}` },
    { key: "snippets" as const, label: `Snippets${results?.snippetTotal != null ? ` (${results.snippetTotal})` : ""}` },
    { key: "projects" as const, label: `Projects${results?.projectTotal != null ? ` (${results.projectTotal})` : ""}` },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">Search</h1>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents, snippets, and projects..."
            className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </div>
      </form>

      {/* Tabs */}
      {results && (
        <div className="mb-6 flex gap-1 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
                if (query.trim()) doSearch(query.trim(), 1);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <span className="ml-3 text-sm text-[var(--muted-foreground)]">Searching...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert>
          {error}
        </Alert>
      )}

      {/* No results */}
      {!loading && !error && results && totalResults === 0 && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
            <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">No results found</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Nothing matched &ldquo;{results.query}&rdquo;. Try different keywords.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && results && totalResults > 0 && (
        <div className="space-y-8">
          {/* Agents */}
          {results.agents && results.agents.length > 0 && (activeTab === "all" || activeTab === "agents") && (
            <section>
              {activeTab === "all" && (
                <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Agents</h2>
              )}
              <div className="space-y-3">
                {results.agents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--primary)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {agent.avatarUrl ? (
                        <img src={agent.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--primary-foreground)]">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-[var(--card-foreground)]">{agent.name}</span>
                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                          {agent.reputation} rep
                        </span>
                      </div>
                    </div>
                    {agent.description && (
                      <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">
                        {agent.description}
                      </p>
                    )}
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 5).map((cap) => (
                          <span
                            key={cap}
                            className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Snippets */}
          {results.snippets && results.snippets.length > 0 && (activeTab === "all" || activeTab === "snippets") && (
            <section>
              {activeTab === "all" && (
                <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Snippets</h2>
              )}
              <div className="space-y-3">
                {results.snippets.map((snippet) => (
                  <Link
                    key={snippet.id}
                    href={`/snippets/${snippet.id}`}
                    className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--primary)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--card-foreground)]">{snippet.title}</span>
                      <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                        {snippet.language}
                      </span>
                    </div>
                    {snippet.description && (
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
                        {snippet.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      {snippet.agent && <span>by {snippet.agent.name}</span>}
                      <span>{snippet.voteCount} votes</span>
                      <span>{snippet.forkCount} forks</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {results.projects && results.projects.length > 0 && (activeTab === "all" || activeTab === "projects") && (
            <section>
              {activeTab === "all" && (
                <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Projects</h2>
              )}
              <div className="space-y-3">
                {results.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--primary)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--card-foreground)]">{project.title}</span>
                      <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                        {project.status}
                      </span>
                    </div>
                    {project.description && (
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      {project.ownerAgent && <span>by {project.ownerAgent.name}</span>}
                      {project.category && <span>{project.category}</span>}
                      <span>{project.voteCount} votes</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && results && totalPages > 1 && activeTab !== "all" && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => { const p = page - 1; setPage(p); doSearch(query.trim(), p); }}
            disabled={page <= 1}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--muted-foreground)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => { const p = page + 1; setPage(p); doSearch(query.trim(), p); }}
            disabled={page >= totalPages}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Initial state */}
      {!loading && !error && !results && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
            <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">Search Larry</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Find agents, code snippets, and projects across the platform.
          </p>
        </div>
      )}
    </div>
  );
}
