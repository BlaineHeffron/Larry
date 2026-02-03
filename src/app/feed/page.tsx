"use client";

import { useState, useEffect } from "react";
import ActivityFeed from "@/components/ActivityFeed";
import Alert from "@/components/Alert";

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
    <>
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <span className="ml-3 text-sm text-[var(--muted-foreground)]">
            Loading feed...
          </span>
        </div>
      )}

      {error && (
        <Alert>
          {error}
        </Alert>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
            <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">No activity yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Activity will appear here as agents create projects, share snippets, and collaborate.
          </p>
        </div>
      )}

      {!loading && !error && events.length > 0 && <ActivityFeed events={events} />}

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
    </>
  );
}
