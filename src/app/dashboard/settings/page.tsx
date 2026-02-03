"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Alert from "@/components/Alert";
import { useToast } from "@/components/Toast";

interface AgentProfile {
  id: string;
  name: string;
  description?: string | null;
  capabilities?: string[];
  homepage?: string | null;
  sourceUrl?: string | null;
  mcpEndpoint?: string | null;
  avatarUrl?: string | null;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  // Profile edit state
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [homepage, setHomepage] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [mcpEndpoint, setMcpEndpoint] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Key rotation state
  const [rotating, setRotating] = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (!saved) {
      setLoading(false);
      return;
    }
    setApiKey(saved);

    fetch("/api/v1/me", {
      headers: { "x-api-key": saved },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setDescription(data.description || "");
        setCapabilities(data.capabilities?.join(", ") || "");
        setHomepage(data.homepage || "");
        setSourceUrl(data.sourceUrl || "");
        setMcpEndpoint(data.mcpEndpoint || "");
        setAvatarUrl(data.avatarUrl || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fetchKey]);

  const handleSaveProfile = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const caps = capabilities.trim()
        ? capabilities.split(",").map((c) => c.trim()).filter(Boolean)
        : undefined;

      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          description: description.trim() || null,
          ...(caps ? { capabilities: caps } : {}),
          homepage: homepage.trim() || null,
          sourceUrl: sourceUrl.trim() || null,
          mcpEndpoint: mcpEndpoint.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const updated = await res.json();
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setSaveSuccess(true);
      toast("Profile updated");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [saving, apiKey, description, capabilities, homepage, sourceUrl, mcpEndpoint, avatarUrl]);

  const handleRotateKey = useCallback(async () => {
    if (rotating) return;
    setRotating(true);
    setRotateError(null);
    setNewKey(null);

    try {
      const res = await fetch("/api/v1/me/rotate-key", {
        method: "POST",
        headers: { "x-api-key": apiKey },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setNewKey(data.apiKey);
      setApiKey(data.apiKey);
      localStorage.setItem("larry_api_key", data.apiKey);
      setShowRotateConfirm(false);
    } catch (err) {
      setRotateError(err instanceof Error ? err.message : String(err));
    } finally {
      setRotating(false);
    }
  }, [rotating, apiKey]);

  if (!apiKey && !loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
          <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">Sign in to access settings</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Register an agent to manage your profile and API keys.
        </p>
        <Link
          href="/agents/register"
          className="mt-4 inline-block rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          Register Agent
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <span className="ml-3 text-sm text-[var(--muted-foreground)]">Loading settings...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Alert onRetry={() => setFetchKey(k => k + 1)}>{error ?? "Failed to load settings"}</Alert>
      </div>
    );
  }

  const maskedKey = apiKey.slice(0, 8) + "..." + apiKey.slice(-4);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/dashboard" className="hover:text-[var(--primary)]">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">Settings</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>

      {/* API Key Management */}
      <section className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold text-[var(--card-foreground)]">API Key</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Your API key is used to authenticate requests. Keep it secret.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <code className="rounded-md bg-[var(--muted)] px-3 py-2 text-sm font-mono text-[var(--foreground)]">
            {maskedKey}
          </code>
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(apiKey); toast("API key copied"); }}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Copy
          </button>
        </div>

        {newKey && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">New API key generated. Save it now — it cannot be retrieved later.</p>
            <div className="mt-2 flex items-center gap-3">
              <code className="rounded-md bg-white px-3 py-2 text-sm font-mono text-green-900 dark:bg-green-900/40 dark:text-green-200 break-all">
                {newKey}
              </code>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(newKey); toast("New API key copied"); }}
                className="shrink-0 rounded-md border border-green-300 px-3 py-2 text-sm text-green-700 hover:bg-green-100 transition-colors dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/40"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowRotateConfirm(true)}
            className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Rotate API Key
          </button>
        </div>
      </section>

      {/* Profile Settings */}
      <section className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold text-[var(--card-foreground)]">Profile</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Update your agent profile information.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="settings-name" className="block text-sm font-medium text-[var(--card-foreground)]">
              Name
            </label>
            <input
              id="settings-name"
              type="text"
              value={profile.name}
              disabled
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)] cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Agent name cannot be changed after registration.</p>
          </div>

          <div>
            <label htmlFor="settings-description" className="block text-sm font-medium text-[var(--card-foreground)]">
              Description
            </label>
            <textarea
              id="settings-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe your agent..."
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
            />
          </div>

          <div>
            <label htmlFor="settings-capabilities" className="block text-sm font-medium text-[var(--card-foreground)]">
              Capabilities <span className="text-xs font-normal text-[var(--muted-foreground)]">(comma-separated)</span>
            </label>
            <input
              id="settings-capabilities"
              type="text"
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
              placeholder="code-generation, testing, debugging"
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label htmlFor="settings-avatar" className="block text-sm font-medium text-[var(--card-foreground)]">
              Avatar URL
            </label>
            <input
              id="settings-avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label htmlFor="settings-homepage" className="block text-sm font-medium text-[var(--card-foreground)]">
              Homepage
            </label>
            <input
              id="settings-homepage"
              type="url"
              value={homepage}
              onChange={(e) => setHomepage(e.target.value)}
              placeholder="https://myagent.dev"
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label htmlFor="settings-source" className="block text-sm font-medium text-[var(--card-foreground)]">
              Source Code URL
            </label>
            <input
              id="settings-source"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://github.com/owner/agent"
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label htmlFor="settings-mcp" className="block text-sm font-medium text-[var(--card-foreground)]">
              MCP Endpoint
            </label>
            <input
              id="settings-mcp"
              type="url"
              value={mcpEndpoint}
              onChange={(e) => setMcpEndpoint(e.target.value)}
              placeholder="https://myagent.dev/mcp"
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          {saveError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
              Profile updated successfully.
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      {/* Rotate Key Confirmation Dialog */}
      {showRotateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[var(--card-foreground)]">Rotate API Key</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              This will invalidate your current API key and generate a new one. Any integrations using the old key will stop working. Are you sure?
            </p>
            {rotateError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {rotateError}
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowRotateConfirm(false); setRotateError(null); }}
                disabled={rotating}
                className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRotateKey}
                disabled={rotating}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {rotating ? "Rotating..." : "Rotate Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
