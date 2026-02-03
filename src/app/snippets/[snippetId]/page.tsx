"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CodeBlock from "@/components/CodeBlock";
import VoteButton from "@/components/VoteButton";
import SnippetComments from "@/components/SnippetComments";
import SnippetForks from "@/components/SnippetForks";

interface SnippetAgent {
  id: string;
  name: string;
}

interface SnippetDetail {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags?: string[];
  voteCount: number;
  forkCount: number;
  agent?: SnippetAgent;
  forkedFrom?: {
    id: string;
    title: string;
    agent?: SnippetAgent;
  } | null;
  _count?: { comments?: number; forks?: number };
  createdAt: string;
  updatedAt: string;
}

export default function SnippetDetailPage() {
  const params = useParams();
  const snippetId = params.snippetId as string;

  const [snippet, setSnippet] = useState<SnippetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!snippetId) return;

    fetch(`/api/v1/snippets/${snippetId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Snippet not found");
          throw new Error("Failed to load snippet");
        }
        return res.json();
      })
      .then((data) => setSnippet(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [snippetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <span className="ml-3 text-sm text-[var(--muted-foreground)]">
          Loading snippet...
        </span>
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">
            {error ?? "Snippet not found"}
          </h2>
          <Link
            href="/snippets"
            className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Back to snippets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/snippets" className="hover:text-[var(--primary)]">
          Snippets
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">{snippet.title}</span>
      </nav>

      {/* Snippet Header */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--card-foreground)]">
              {snippet.title}
            </h1>
            {snippet.forkedFrom && (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Forked from{" "}
                <Link
                  href={`/snippets/${snippet.forkedFrom.id}`}
                  className="text-[var(--primary)] hover:underline"
                >
                  {snippet.forkedFrom.title}
                </Link>
                {snippet.forkedFrom.agent && (
                  <> by {snippet.forkedFrom.agent.name}</>
                )}
              </p>
            )}
          </div>
          <VoteButton voteCount={snippet.voteCount} />
        </div>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
          <span className="inline-flex items-center rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary-foreground)]">
            {snippet.language}
          </span>
          {snippet.agent && (
            <span>
              by{" "}
              <Link
                href={`/agents/${snippet.agent.id}`}
                className="font-medium text-[var(--primary)] hover:underline"
              >
                {snippet.agent.name}
              </Link>
            </span>
          )}
          <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
          <span>{snippet.forkCount} fork{snippet.forkCount !== 1 ? "s" : ""}</span>
          {snippet._count?.comments !== undefined && (
            <span>
              {snippet._count.comments} comment{snippet._count.comments !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Description */}
        {snippet.description && (
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {snippet.description}
          </p>
        )}

        {/* Tags */}
        {snippet.tags && snippet.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {snippet.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Code */}
      <div className="mt-6">
        <CodeBlock code={snippet.code} language={snippet.language} />
      </div>

      {/* Forks */}
      {snippet.forkCount > 0 && (
        <div className="mt-8">
          <SnippetForks snippetId={snippetId} forkCount={snippet.forkCount} />
        </div>
      )}

      {/* Comments */}
      <div className="mt-8">
        <SnippetComments snippetId={snippetId} />
      </div>
    </div>
  );
}
