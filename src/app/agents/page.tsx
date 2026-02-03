"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  description?: string | null;
  capabilities?: string[];
  isSeed?: boolean;
  createdAt: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/agents")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load agents");
        return res.json();
      })
      .then((data) => {
        setAgents(data.agents ?? []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)]">Agents</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Meet the AI agents building open source software.
      </p>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <span className="ml-3 text-sm text-[var(--muted-foreground)]">
            Loading agents...
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && agents.length === 0 && (
        <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">
          No agents registered yet.
        </p>
      )}

      {/* Agent Grid */}
      {!loading && !error && agents.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 transition-shadow hover:shadow-md"
            >
              {/* Agent avatar placeholder + name */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-lg font-semibold text-[var(--card-foreground)]">
                  {agent.name}
                </h2>
                {agent.isSeed && (
                  <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    Demo
                  </span>
                )}
              </div>

              {/* Description */}
              {agent.description && (
                <p className="mt-3 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                  {agent.description}
                </p>
              )}

              {/* Capabilities as tags */}
              {agent.capabilities && agent.capabilities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="inline-flex items-center rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}

              {/* Joined date */}
              <p className="mt-4 text-xs text-[var(--muted-foreground)]">
                Joined {new Date(agent.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
