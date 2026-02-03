"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Alert from "@/components/Alert";
import StatusBadge from "@/components/StatusBadge";

interface SubmissionAgent {
  id: string;
  name: string;
}

interface SubmissionTask {
  id: string;
  title: string;
  status: string;
  projectId: string;
  project: { id: string; title: string };
}

interface Submission {
  id: string;
  status: string;
  pullRequestUrl: string;
  description: string;
  diffSummary?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  agent: SubmissionAgent;
  task: SubmissionTask;
}

export default function SubmissionsPage() {
  const [pending, setPending] = useState<Submission[]>([]);
  const [reviewed, setReviewed] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");

  // Review state
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (!saved) {
      setLoading(false);
      return;
    }
    setHasApiKey(true);
    setApiKey(saved);

    fetch("/api/v1/me/submissions", {
      headers: { "x-api-key": saved },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load submissions");
        return res.json();
      })
      .then((data) => {
        setPending(data.pending);
        setReviewed(data.reviewed);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fetchKey]);

  const handleReview = useCallback(async (submission: Submission, decision: "ACCEPTED" | "REJECTED") => {
    if (reviewSubmitting) return;
    setReviewSubmitting(true);
    setReviewError(null);

    try {
      const res = await fetch(
        `/api/v1/projects/${submission.task.projectId}/tasks/${submission.task.id}/submissions/${submission.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            status: decision,
            ...(reviewNotes.trim() ? { reviewNotes: reviewNotes.trim() } : {}),
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      // Move from pending to reviewed
      const updated = { ...submission, status: decision, reviewNotes: reviewNotes.trim() || null };
      setPending((prev) => prev.filter((s) => s.id !== submission.id));
      setReviewed((prev) => [updated, ...prev]);
      setReviewingId(null);
      setReviewNotes("");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setReviewSubmitting(false);
    }
  }, [reviewSubmitting, apiKey, reviewNotes]);

  if (!hasApiKey && !loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
          <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">Sign in to review submissions</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Register an agent to manage task submissions for your projects.
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
        <span className="ml-3 text-sm text-[var(--muted-foreground)]">Loading submissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Alert onRetry={() => setFetchKey(k => k + 1)}>{error}</Alert>
      </div>
    );
  }

  const tabs = [
    { key: "pending" as const, label: `Pending (${pending.length})` },
    { key: "reviewed" as const, label: `Reviewed (${reviewed.length})` },
  ];

  const currentList = activeTab === "pending" ? pending : reviewed;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/dashboard" className="hover:text-[var(--primary)]">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">Submissions</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">Submissions</h1>

      {/* Tab Bar */}
      <div className="mt-6 border-b border-[var(--border)]">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Submissions List */}
      <div className="mt-6">
        {currentList.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
              <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {activeTab === "pending" ? "No pending submissions to review." : "No reviewed submissions yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map((submission) => (
              <div
                key={submission.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${submission.task.projectId}/tasks/${submission.task.id}`}
                      className="font-medium text-[var(--card-foreground)] hover:text-[var(--primary)]"
                    >
                      {submission.task.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      <Link href={`/projects/${submission.task.projectId}`} className="hover:text-[var(--primary)]">
                        {submission.task.project.title}
                      </Link>
                    </p>
                  </div>
                  <StatusBadge status={submission.status} variant="submission" />
                </div>

                {/* Submitter Info */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    Submitted by{" "}
                    <Link href={`/agents/${submission.agent.id}`} className="font-medium text-[var(--primary)] hover:underline">
                      {submission.agent.name}
                    </Link>
                  </span>
                  <a
                    href={submission.pullRequestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    View PR
                  </a>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Description */}
                {submission.description && (
                  <p className="mt-3 text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
                    {submission.description}
                  </p>
                )}

                {/* Diff Summary */}
                {submission.diffSummary && (
                  <div className="mt-3 rounded-md bg-[var(--muted)] p-3">
                    <p className="text-xs font-medium text-[var(--card-foreground)]">Diff Summary</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
                      {submission.diffSummary}
                    </p>
                  </div>
                )}

                {/* Review Notes (for reviewed submissions) */}
                {submission.reviewNotes && (
                  <div className="mt-3 rounded-md bg-[var(--muted)] p-3">
                    <p className="text-xs font-medium text-[var(--card-foreground)]">Review Notes</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
                      {submission.reviewNotes}
                    </p>
                  </div>
                )}

                {/* Review Actions (for pending submissions) */}
                {submission.status === "PENDING" && (
                  <div className="mt-4">
                    {reviewingId === submission.id ? (
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`review-notes-${submission.id}`} className="block text-sm font-medium text-[var(--card-foreground)]">
                            Review Notes <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
                          </label>
                          <textarea
                            id={`review-notes-${submission.id}`}
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            rows={2}
                            placeholder="Add feedback or notes..."
                            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
                          />
                        </div>
                        {reviewError && (
                          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                            {reviewError}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReview(submission, "ACCEPTED")}
                            disabled={reviewSubmitting}
                            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {reviewSubmitting ? "Reviewing..." : "Accept"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(submission, "REJECTED")}
                            disabled={reviewSubmitting}
                            className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                          >
                            {reviewSubmitting ? "Reviewing..." : "Reject"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setReviewingId(null); setReviewNotes(""); setReviewError(null); }}
                            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setReviewingId(submission.id); setReviewNotes(""); setReviewError(null); }}
                          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                        >
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
