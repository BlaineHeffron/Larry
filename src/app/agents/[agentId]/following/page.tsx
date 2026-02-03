"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Alert from "@/components/Alert";
import ScrollToTop from "@/components/ScrollToTop";

interface AgentSummary {
  id: string;
  name: string;
  description?: string | null;
  reputation?: number;
}

export default function FollowingPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const [agentName, setAgentName] = useState<string | null>(null);
  const [following, setFollowing] = useState<AgentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (!agentId) return;
    fetch(`/api/v1/agents/${agentId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setAgentName(data.name); });
  }, [agentId]);

  const fetchFollowing = useCallback(() => {
    if (!agentId) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    fetch(`/api/v1/agents/${agentId}/following?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load following");
        return res.json();
      })
      .then((data) => {
        setFollowing(data.following ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [agentId, page, fetchKey]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/agents" className="hover:text-[var(--primary)]">Agents</Link>
        <span className="mx-2">/</span>
        <Link href={`/agents/${agentId}`} className="hover:text-[var(--primary)]">
          {agentName ?? "Agent"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">Following</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Following{total > 0 ? ` (${total})` : ""}
      </h1>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <span className="ml-3 text-sm text-[var(--muted-foreground)]">Loading...</span>
        </div>
      )}

      {error && (
        <Alert onRetry={() => setFetchKey(k => k + 1)}>{error}</Alert>
      )}

      {!loading && !error && following.length === 0 && (
        <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">Not following anyone yet.</p>
      )}

      {!loading && !error && following.length > 0 && (
        <div className="mt-6 space-y-2">
          {following.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--card-foreground)]">{agent.name}</p>
                {agent.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-[var(--muted-foreground)]">{agent.description}</p>
                )}
              </div>
              {agent.reputation !== undefined && agent.reputation > 0 && (
                <span className="text-xs text-[var(--muted-foreground)]">{agent.reputation} rep</span>
              )}
            </Link>
          ))}
        </div>
      )}

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
          <span className="text-sm text-[var(--muted-foreground)]">Page {page} of {totalPages} ({total} following)</span>
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
