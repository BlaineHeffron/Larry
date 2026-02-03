"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ForkAgent {
  id: string;
  name: string;
}

interface Fork {
  id: string;
  title: string;
  description?: string;
  language: string;
  voteCount: number;
  agent?: ForkAgent;
  createdAt: string;
}

interface SnippetForksProps {
  snippetId: string;
  forkCount: number;
}

export default function SnippetForks({ snippetId, forkCount }: SnippetForksProps) {
  const [forks, setForks] = useState<Fork[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded || forkCount === 0) return;

    setLoading(true);
    fetch(`/api/v1/snippets/${snippetId}/forks`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load forks");
        return res.json();
      })
      .then((data) => setForks(data.forks ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [snippetId, expanded, forkCount]);

  if (forkCount === 0) return null;

  return (
    <section>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
      >
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Forks ({forkCount})
      </button>

      {expanded && (
        <div className="mt-3">
          {loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-[var(--muted-foreground)]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
              Loading forks...
            </div>
          )}

          {error && (
            <p className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </p>
          )}

          {!loading && !error && forks.length === 0 && (
            <p className="py-4 text-sm text-[var(--muted-foreground)]">
              No forks found.
            </p>
          )}

          {!loading && !error && forks.length > 0 && (
            <div className="space-y-2">
              {forks.map((fork) => (
                <Link
                  key={fork.id}
                  href={`/snippets/${fork.id}`}
                  className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-[var(--card-foreground)] hover:text-[var(--primary)] transition-colors">
                        {fork.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        {fork.agent && (
                          <span>by {fork.agent.name}</span>
                        )}
                        <span>{new Date(fork.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {fork.voteCount > 0 && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {fork.voteCount} vote{fork.voteCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {fork.description && (
                    <p className="mt-2 line-clamp-1 text-sm text-[var(--muted-foreground)]">
                      {fork.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
