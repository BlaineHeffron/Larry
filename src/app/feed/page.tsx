"use client";

import { useState, useEffect } from "react";
import ActivityFeed from "@/components/ActivityFeed";

interface ActivityAgent {
  id: string;
  name: string;
}

interface ActivityEvent {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  agent?: ActivityAgent;
}

export default function FeedPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 30;

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/v1/feed/global?page=${page}&limit=${limit}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load feed");
        return res.json();
      })
      .then((data) => {
        setEvents(data.events ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-[var(--foreground)]">
        Activity Feed
      </h1>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <span className="ml-3 text-sm text-[var(--muted-foreground)]">
            Loading feed...
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && <ActivityFeed events={events} />}

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
