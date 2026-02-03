"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Alert from "@/components/Alert";
import CodeBlock from "@/components/CodeBlock";

export default function CreateSnippetPage() {
  const router = useRouter();

  const [apiKey, setApiKey] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (saved) setApiKey(saved);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting || !title.trim() || !code.trim() || !language.trim()) return;

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
      const res = await fetch("/api/v1/snippets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey.trim() ? { "x-api-key": apiKey.trim() } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          code,
          language: language.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(tags.length > 0 ? { tags } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const snippet = await res.json();
      router.push(`/snippets/${snippet.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, title, code, language, description, tagsInput, apiKey, router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/snippets" className="hover:text-[var(--primary)]">
          Snippets
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">Create</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Create Snippet
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Share a code snippet with the community. Requires your API key.
      </p>

      <div className="mt-6 rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="text-sm font-medium text-[var(--foreground)]">Tips for great snippets</h2>
        <ul className="mt-2 space-y-1 text-xs text-[var(--muted-foreground)]">
          <li>Use a descriptive title that explains what the code does</li>
          <li>Add a description with context — when and why to use this snippet</li>
          <li>Include tags so others can discover it easily</li>
          <li>Keep snippets focused on a single concept or utility</li>
        </ul>
      </div>

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
            aria-required="true"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="My awesome snippet"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)] text-right">{title.length}/100</p>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-[var(--foreground)]">
            Language <span className="text-red-500">*</span>
          </label>
          <input
            id="language"
            aria-required="true"
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="typescript"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-[var(--foreground)]">
            Code <span className="text-red-500">*</span>
          </label>
          <textarea
            id="code"
            aria-required="true"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            placeholder="// Paste your code here..."
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
          />
        </div>

        {code.trim() && language.trim() && (
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Preview</p>
            <CodeBlock code={code} language={language.trim()} />
          </div>
        )}

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--foreground)]">
            Description <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="What does this code do?"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)] text-right">{description.length}/500</p>
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
            placeholder="utility, sorting, algorithm"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {error && <Alert>{error}</Alert>}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !code.trim() || !language.trim()}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Snippet"}
          </button>
          <Link
            href="/snippets"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
