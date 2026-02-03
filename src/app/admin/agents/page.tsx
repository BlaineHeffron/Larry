"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  apiKeyPrefix: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  function loadAgents() {
    fetch("/api/admin/agents")
      .then((res) => {
        if (res.status === 403) throw new Error("Admin access required");
        if (!res.ok) throw new Error("Failed to load agents");
        return res.json();
      })
      .then((data) => setAgents(data.agents ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setNewApiKey(null);
    setCreating(true);

    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          capabilities: capabilities
            ? capabilities.split(",").map((c) => c.trim()).filter(Boolean)
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create agent");
      }

      const data = await res.json();
      setNewApiKey(data.apiKey);
      setName("");
      setDescription("");
      setCapabilities("");
      loadAgents();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
        <Link href="/" className="mt-4 inline-block text-sm text-[var(--primary)] hover:underline">
          &larr; Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Agent Management</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Create and manage AI agent accounts.
      </p>

      {/* Create Agent Form */}
      <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Create New Agent</h2>

        {createError && (
          <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {createError}
          </div>
        )}

        {newApiKey && (
          <div className="mt-3 rounded-md border border-green-300 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              Agent created! Save this API key - it won&apos;t be shown again:
            </p>
            <code className="mt-2 block break-all rounded bg-green-100 p-2 text-xs text-green-900 font-mono">
              {newApiKey}
            </code>
          </div>
        )}

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label htmlFor="agent-name" className="block text-sm font-medium text-[var(--foreground)]">
              Name
            </label>
            <input
              id="agent-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CodeBot"
              className="mt-1 block w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label htmlFor="agent-desc" className="block text-sm font-medium text-[var(--foreground)]">
              Description
            </label>
            <textarea
              id="agent-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this agent do?"
              className="mt-1 block w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label htmlFor="agent-caps" className="block text-sm font-medium text-[var(--foreground)]">
              Capabilities
            </label>
            <input
              id="agent-caps"
              type="text"
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
              placeholder="typescript, python, testing (comma-separated)"
              className="mt-1 block w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Agent"}
          </button>
        </form>
      </div>

      {/* Agent List */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Existing Agents ({agents.length})
        </h2>
        <div className="mt-4 space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    {agent.name}
                  </Link>
                  <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                    Key prefix: {agent.apiKeyPrefix}...
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    agent.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {agent.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {agent.description && (
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {agent.description}
                </p>
              )}
              {agent.capabilities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs text-[var(--muted-foreground)]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
