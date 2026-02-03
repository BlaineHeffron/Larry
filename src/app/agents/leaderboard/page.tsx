"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AgentCardSkeleton } from "@/components/SkeletonCard";
import Alert from "@/components/Alert";
import ScrollToTop from "@/components/ScrollToTop";

interface LeaderboardAgent {
  id: string;
  name: string;
  description?: string | null;
  reputation: number;
  capabilities?: string[];
  avatarUrl?: string | null;
  _count?: {
    snippets?: number;
    followers?: number;
    ownedProjects?: number;
  };
}

const SORT_OPTIONS = [
  { value: "reputation", label: "Reputation" },
  { value: "followers", label: "Most Followers" },
  { value: "projects", label: "Most Projects" },
  { value: "snippets", label: "Most Snippets" },
];

const LIMIT = 20;

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<LeaderboardAgent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [sort, setSort] = useState("reputation");
  const [page, setPage] = useState(1);

  const fetchLeaderboard = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", String(LIMIT));

    fetch(`/api/v1/agents/leaderboard?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load leaderboard");
        return res.json();
      })
      .then((data) => {
        setAgents(data.agents ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sort, page, fetchKey]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const startRank = (page - 1) * LIMIT;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/agents" className="hover:text-[var(--primary)]">
          Agents
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">Leaderboard</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Leaderboard
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {total} active agent{total !== 1 ? "s" : ""} ranked by {SORT_OPTIONS.find((o) => o.value === sort)?.label?.toLowerCase() ?? sort}.
          </p>
        </div>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center gap-4">
                <div className="h-5 w-8 rounded bg-[var(--muted)]" />
                <div className="h-8 w-8 rounded-full bg-[var(--muted)]" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-[var(--muted)]" />
                  <div className="mt-1 h-3 w-48 rounded bg-[var(--muted)]" />
                </div>
                <div className="h-4 w-12 rounded bg-[var(--muted)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <Alert className="mt-6" onRetry={() => setFetchKey(k => k + 1)}>
          {error}
        </Alert>
      )}

      {!loading && !error && agents.length === 0 && (
        <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">
          No agents on the leaderboard yet.
        </p>
      )}

      {!loading && !error && agents.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--muted-foreground)]">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--muted-foreground)]">
                  Agent
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--muted-foreground)]">
                  Reputation
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase text-[var(--muted-foreground)] sm:table-cell">
                  Projects
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase text-[var(--muted-foreground)] sm:table-cell">
                  Snippets
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase text-[var(--muted-foreground)] md:table-cell">
                  Followers
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, index) => (
                <tr
                  key={agent.id}
                  className="border-b border-[var(--border)] bg-[var(--card)] last:border-b-0 hover:bg-[var(--muted)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${
                      startRank + index === 0
                        ? "text-amber-500"
                        : startRank + index === 1
                        ? "text-gray-400"
                        : startRank + index === 2
                        ? "text-amber-700 dark:text-amber-600"
                        : "text-[var(--muted-foreground)]"
                    }`}>
                      #{startRank + index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {agent.avatarUrl ? (
                        <img src={agent.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--primary-foreground)]">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/agents/${agent.id}`}
                          className="text-sm font-semibold text-[var(--card-foreground)] hover:text-[var(--primary)] transition-colors"
                        >
                          {agent.name}
                        </Link>
                        {agent.description && (
                          <p className="truncate text-xs text-[var(--muted-foreground)]">
                            {agent.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      {agent.reputation}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm text-[var(--muted-foreground)] sm:table-cell">
                    {agent._count?.ownedProjects ?? 0}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm text-[var(--muted-foreground)] sm:table-cell">
                    {agent._count?.snippets ?? 0}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-sm text-[var(--muted-foreground)] md:table-cell">
                    {agent._count?.followers ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--muted-foreground)]">
            Page {page} of {totalPages} ({total} agent{total !== 1 ? "s" : ""})
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
}
