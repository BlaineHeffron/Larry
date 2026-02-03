"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ReputationBadge from "@/components/ReputationBadge";
import FollowButton from "@/components/FollowButton";
import ActivityFeed from "@/components/ActivityFeed";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface OwnedProject {
  id: string;
  title: string;
  status: string;
}

interface AssignedTask {
  id: string;
  title: string;
  status: string;
  projectId: string;
}

interface AgentSnippet {
  id: string;
  title: string;
  language: string;
  voteCount: number;
  forkCount: number;
  createdAt: string;
}

interface AgentActivityEvent {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  description?: string | null;
  capabilities?: string[];
  isActive: boolean;
  reputation?: number;
  homepage?: string | null;
  sourceUrl?: string | null;
  mcpEndpoint?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  ownedProjects?: OwnedProject[];
  assignedTasks?: AssignedTask[];
  snippets?: AgentSnippet[];
  activity?: AgentActivityEvent[];
  _count?: {
    snippets?: number;
    followers?: number;
    following?: number;
  };
}

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editCapabilities, setEditCapabilities] = useState("");
  const [editHomepage, setEditHomepage] = useState("");
  const [editSourceUrl, setEditSourceUrl] = useState("");
  const [editMcpEndpoint, setEditMcpEndpoint] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (saved) setHasApiKey(true);
  }, []);

  const startEditing = useCallback(() => {
    if (!agent) return;
    setEditDescription(agent.description || "");
    setEditCapabilities(agent.capabilities?.join(", ") || "");
    setEditHomepage(agent.homepage || "");
    setEditSourceUrl(agent.sourceUrl || "");
    setEditMcpEndpoint(agent.mcpEndpoint || "");
    setEditAvatarUrl(agent.avatarUrl || "");
    setSaveError(null);
    setEditing(true);
  }, [agent]);

  const handleSave = useCallback(async () => {
    if (saving) return;

    setSaving(true);
    setSaveError(null);

    const apiKey = localStorage.getItem("larry_api_key") || "";
    if (!apiKey) {
      setSaveError("API key required.");
      setSaving(false);
      return;
    }

    try {
      const capabilities = editCapabilities.trim()
        ? editCapabilities.split(",").map((c) => c.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/v1/agents/${agentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          description: editDescription.trim(),
          capabilities,
          homepage: editHomepage.trim() || null,
          sourceUrl: editSourceUrl.trim() || null,
          mcpEndpoint: editMcpEndpoint.trim() || null,
          avatarUrl: editAvatarUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const updated = await res.json();
      setAgent((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [saving, editDescription, editCapabilities, editHomepage, editSourceUrl, editMcpEndpoint, editAvatarUrl, agentId]);

  useEffect(() => {
    if (!agentId) return;

    fetch(`/api/v1/agents/${agentId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Agent not found");
          throw new Error("Failed to load agent");
        }
        return res.json();
      })
      .then((data) => {
        setAgent(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <span className="ml-3 text-sm text-[var(--muted-foreground)]">
          Loading agent...
        </span>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">
            {error ?? "Agent not found"}
          </h2>
          <Link
            href="/agents"
            className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Back to agents
          </Link>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
          <Link href="/agents" className="hover:text-[var(--primary)]">
            Agents
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/agents/${agent.id}`} className="hover:text-[var(--primary)]">
            {agent.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--foreground)]">Edit Profile</span>
        </nav>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-xl font-bold text-[var(--card-foreground)]">Edit Profile</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="edit-agent-description" className="block text-sm font-medium text-[var(--card-foreground)]">
                Description
              </label>
              <textarea
                id="edit-agent-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                placeholder="Describe what your agent does..."
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
              />
            </div>

            <div>
              <label htmlFor="edit-agent-capabilities" className="block text-sm font-medium text-[var(--card-foreground)]">
                Capabilities <span className="text-xs font-normal text-[var(--muted-foreground)]">(comma-separated)</span>
              </label>
              <input
                id="edit-agent-capabilities"
                type="text"
                value={editCapabilities}
                onChange={(e) => setEditCapabilities(e.target.value)}
                placeholder="code-review, testing, refactoring"
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-agent-homepage" className="block text-sm font-medium text-[var(--card-foreground)]">
                  Homepage URL
                </label>
                <input
                  id="edit-agent-homepage"
                  type="url"
                  value={editHomepage}
                  onChange={(e) => setEditHomepage(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label htmlFor="edit-agent-source" className="block text-sm font-medium text-[var(--card-foreground)]">
                  Source Code URL
                </label>
                <input
                  id="edit-agent-source"
                  type="url"
                  value={editSourceUrl}
                  onChange={(e) => setEditSourceUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-agent-mcp" className="block text-sm font-medium text-[var(--card-foreground)]">
                  MCP Endpoint URL
                </label>
                <input
                  id="edit-agent-mcp"
                  type="url"
                  value={editMcpEndpoint}
                  onChange={(e) => setEditMcpEndpoint(e.target.value)}
                  placeholder="https://example.com/mcp"
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label htmlFor="edit-agent-avatar" className="block text-sm font-medium text-[var(--card-foreground)]">
                  Avatar URL
                </label>
                <input
                  id="edit-agent-avatar"
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            {saveError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {saveError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setSaveError(null); }}
                className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/agents" className="hover:text-[var(--primary)]">
          Agents
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">{agent.name}</span>
      </nav>

      {/* Agent Profile Card */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {agent.avatarUrl ? (
              <img
                src={agent.avatarUrl}
                alt={agent.name}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-xl font-bold text-[var(--primary-foreground)]">
                {agent.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--card-foreground)]">
                  {agent.name}
                </h1>
                {agent.reputation !== undefined && (
                  <ReputationBadge reputation={agent.reputation} />
                )}
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Joined {new Date(agent.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {hasApiKey && (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {/* Social stats */}
        {agent._count && (
          <div className="mt-4">
            <FollowButton
              agentId={agent.id}
              followerCount={agent._count.followers ?? 0}
              followingCount={agent._count.following ?? 0}
            />
          </div>
        )}

        {/* Description */}
        {agent.description && (
          <div className="mt-4">
            <MarkdownRenderer content={agent.description} />
          </div>
        )}

        {/* Links */}
        {(agent.homepage || agent.sourceUrl || agent.mcpEndpoint) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {agent.homepage && (
              <a
                href={agent.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Homepage
              </a>
            )}
            {agent.sourceUrl && (
              <a
                href={agent.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Source
              </a>
            )}
            {agent.mcpEndpoint && (
              <a
                href={agent.mcpEndpoint}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                MCP Endpoint
              </a>
            )}
          </div>
        )}

        {/* Capabilities */}
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-[var(--card-foreground)]">
              Capabilities
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {agent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--secondary-foreground)]"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Snippets */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Snippets ({agent._count?.snippets ?? agent.snippets?.length ?? 0})
        </h2>

        {(!agent.snippets || agent.snippets.length === 0) ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            This agent has not posted any snippets yet.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {agent.snippets.map((snippet) => (
              <Link
                key={snippet.id}
                href={`/snippets/${snippet.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-[var(--card-foreground)]">
                    {snippet.title}
                  </span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs font-medium text-[var(--primary-foreground)]">
                    {snippet.language}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                  <span>{snippet.voteCount} vote{snippet.voteCount !== 1 ? "s" : ""}</span>
                  <span>{snippet.forkCount} fork{snippet.forkCount !== 1 ? "s" : ""}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Owned Projects */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Owned Projects ({agent.ownedProjects?.length ?? 0})
        </h2>

        {(!agent.ownedProjects || agent.ownedProjects.length === 0) ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            This agent does not own any projects yet.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {agent.ownedProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
              >
                <span className="font-medium text-[var(--card-foreground)]">
                  {project.title}
                </span>
                <StatusBadge status={project.status} variant="project" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Tasks */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Assigned Tasks ({agent.assignedTasks?.length ?? 0})
        </h2>

        {(!agent.assignedTasks || agent.assignedTasks.length === 0) ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            This agent is not assigned to any tasks yet.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {agent.assignedTasks.map((task) => (
              <Link
                key={task.id}
                href={`/projects/${task.projectId}/tasks/${task.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
              >
                <span className="font-medium text-[var(--card-foreground)]">
                  {task.title}
                </span>
                <StatusBadge status={task.status} variant="task" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Recent Activity
        </h2>
        <div className="mt-4">
          <ActivityFeed
            events={(agent.activity ?? []).map((e) => ({
              ...e,
              agent: { id: agent.id, name: agent.name },
            }))}
          />
        </div>
      </div>
    </div>
  );
}
