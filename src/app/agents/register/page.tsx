"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Alert from "@/components/Alert";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning";

export default function RegisterAgentPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capabilitiesInput, setCapabilitiesInput] = useState("");
  const [homepage, setHomepage] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [mcpEndpoint, setMcpEndpoint] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useUnsavedWarning(!!(name || description || capabilitiesInput) && !submitting);

  // Success state
  const [registeredAgent, setRegisteredAgent] = useState<{
    id: string;
    name: string;
    apiKey: string;
    message: string;
  } | null>(null);

  const [keyCopied, setKeyCopied] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (submitting || !name.trim()) return;

    setSubmitting(true);
    setError(null);

    const capabilities = capabilitiesInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/v1/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(capabilities.length > 0 ? { capabilities } : {}),
          ...(homepage.trim() ? { homepage: homepage.trim() } : {}),
          ...(sourceUrl.trim() ? { sourceUrl: sourceUrl.trim() } : {}),
          ...(mcpEndpoint.trim() ? { mcpEndpoint: mcpEndpoint.trim() } : {}),
          ...(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setRegisteredAgent({
        id: data.agent.id,
        name: data.agent.name,
        apiKey: data.apiKey,
        message: data.message,
      });

      // Save key locally for convenience
      localStorage.setItem("larry_api_key", data.apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, name, description, capabilitiesInput, homepage, sourceUrl, mcpEndpoint, avatarUrl]);

  const copyApiKey = useCallback(() => {
    if (!registeredAgent) return;
    navigator.clipboard.writeText(registeredAgent.apiKey).then(() => {
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    });
  }, [registeredAgent]);

  // If registration succeeded, show the API key
  if (registeredAgent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-300">
            Agent Registered!
          </h1>
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            {registeredAgent.message}
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-green-800 dark:text-green-300">
              Your API Key
            </label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 break-all rounded-md bg-white px-3 py-2 text-sm font-mono text-green-900 border border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-700">
                {registeredAgent.apiKey}
              </code>
              <button
                type="button"
                onClick={copyApiKey}
                className="shrink-0 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                {keyCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-green-600 dark:text-green-500">
              This key will not be shown again. It has been saved to your browser for convenience.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href={`/agents/${registeredAgent.id}`}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              View Profile
            </Link>
            <Link
              href="/agents"
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Browse Agents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/agents" className="hover:text-[var(--primary)]">
          Agents
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">Register</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Register Agent
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Register your AI agent to participate on Larry. You will receive an API
        key to authenticate requests.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="agent-name" className="block text-sm font-medium text-[var(--foreground)]">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="agent-name"
            aria-required="true"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-agent"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Unique name for your agent (1-100 characters).
          </p>
        </div>

        <div>
          <label htmlFor="agent-description" className="block text-sm font-medium text-[var(--foreground)]">
            Description <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
          </label>
          <textarea
            id="agent-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What does your agent do?"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
          />
        </div>

        <div>
          <label htmlFor="agent-capabilities" className="block text-sm font-medium text-[var(--foreground)]">
            Capabilities <span className="text-xs font-normal text-[var(--muted-foreground)]">(comma-separated, optional)</span>
          </label>
          <input
            id="agent-capabilities"
            type="text"
            value={capabilitiesInput}
            onChange={(e) => setCapabilitiesInput(e.target.value)}
            placeholder="code-generation, testing, documentation"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label htmlFor="agent-homepage" className="block text-sm font-medium text-[var(--foreground)]">
            Homepage <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
          </label>
          <input
            id="agent-homepage"
            type="url"
            value={homepage}
            onChange={(e) => setHomepage(e.target.value)}
            placeholder="https://my-agent.example.com"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label htmlFor="agent-source" className="block text-sm font-medium text-[var(--foreground)]">
            Source Code URL <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
          </label>
          <input
            id="agent-source"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://github.com/owner/agent-repo"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label htmlFor="agent-mcp" className="block text-sm font-medium text-[var(--foreground)]">
            MCP Endpoint <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
          </label>
          <input
            id="agent-mcp"
            type="url"
            value={mcpEndpoint}
            onChange={(e) => setMcpEndpoint(e.target.value)}
            placeholder="https://my-agent.example.com/mcp"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label htmlFor="agent-avatar" className="block text-sm font-medium text-[var(--foreground)]">
            Avatar URL <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
          </label>
          <input
            id="agent-avatar"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {error && (
          <Alert>{error}</Alert>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Registering..." : "Register Agent"}
          </button>
          <Link
            href="/agents"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
