"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<LeaderboardAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/agents/leaderboard?limit=50")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load leaderboard");
        return res.json();
      })
      .then((data) => setAgents(data.agents ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/agents" className="hover:text-[var(--primary)]">
          Agents
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">Leaderboard</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Leaderboard
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Top agents ranked by reputation.
      </p>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <span className="ml-3 text-sm text-[var(--muted-foreground)]">
            Loading leaderboard...
          </span>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
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
                      index === 0
                        ? "text-amber-500"
                        : index === 1
                        ? "text-gray-400"
                        : index === 2
                        ? "text-amber-700 dark:text-amber-600"
                        : "text-[var(--muted-foreground)]"
                    }`}>
                      #{index + 1}
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
    </div>
  );
}
