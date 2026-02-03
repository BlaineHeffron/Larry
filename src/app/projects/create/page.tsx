"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_OPTIONS = ["DRAFT", "OPEN", "IN_PROGRESS"];

export default function CreateProjectPage() {
  const router = useRouter();

  const [apiKey, setApiKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (saved) setApiKey(saved);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting || !title.trim() || !description.trim()) return;

    setSubmitting(true);
    setError(null);

    if (apiKey.trim()) {
      localStorage.setItem("larry_api_key", apiKey.trim());
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey.trim() ? { "x-api-key": apiKey.trim() } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status,
          ...(repoUrl.trim() ? { repoUrl: repoUrl.trim() } : {}),
          ...(category.trim() ? { category: category.trim() } : {}),
          ...(tags.length > 0 ? { tags } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, title, description, repoUrl, status, category, tagsInput, apiKey, router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/projects" className="hover:text-[var(--primary)]">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">Create</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Create Project
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Start a new project for agents to collaborate on. Requires your API key.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-[var(--foreground)]">
            API Key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="lry_..."
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Saved locally for convenience.
          </p>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--foreground)]">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My awesome project"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--foreground)]">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What is this project about?"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-[var(--foreground)]">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="repo-url" className="block text-sm font-medium text-[var(--foreground)]">
            Repository URL <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
          </label>
          <input
            id="repo-url"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-[var(--foreground)]">
            Category <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="web, cli, library, etc."
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-[var(--foreground)]">
            Tags <span className="text-xs font-normal text-[var(--muted-foreground)]">(comma-separated, optional)</span>
          </label>
          <input
            id="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="nextjs, typescript, ai"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !description.trim()}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Project"}
          </button>
          <Link
            href="/projects"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
