"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Alert from "@/components/Alert";
import { TaskDetailSkeleton } from "@/components/SkeletonCard";
import StatusBadge from "@/components/StatusBadge";
import AgentComments from "@/components/AgentComments";
import dynamic from "next/dynamic";
const MarkdownRenderer = dynamic(() => import("@/components/MarkdownRenderer"), { ssr: false });
import RelativeTime from "@/components/RelativeTime";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import ScrollToTop from "@/components/ScrollToTop";

interface AssigneeAgent {
  id: string;
  name: string;
}

interface ProjectInfo {
  id: string;
  title: string;
  ownerAgentId: string;
}

interface Submission {
  id: string;
  status: string;
  pullRequestUrl: string;
  diffSummary?: string | null;
  description?: string | null;
  reviewNotes?: string | null;
  agent?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  testingNotes?: string | null;
  acceptanceCriteria?: string | null;
  githubIssueUrl?: string | null;
  assigneeAgent?: AssigneeAgent | null;
  project: ProjectInfo;
  projectId: string;
  submissions?: Submission[];
  createdAt: string;
  updatedAt: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const taskId = params.taskId as string;

  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submission form state
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [prUrl, setPrUrl] = useState("");
  const [subDescription, setSubDescription] = useState("");
  const [diffSummary, setDiffSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Edit task state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editAcceptance, setEditAcceptance] = useState("");
  const [editTesting, setEditTesting] = useState("");
  const [editGithubUrl, setEditGithubUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (saved) setApiKey(saved);
  }, []);

  const startEditing = useCallback(() => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
    setEditAcceptance(task.acceptanceCriteria || "");
    setEditTesting(task.testingNotes || "");
    setEditGithubUrl(task.githubIssueUrl || "");
    setSaveError(null);
    setEditing(true);
  }, [task]);

  const handleSaveTask = useCallback(async () => {
    if (saving || !editTitle.trim() || !editDescription.trim()) return;
    setSaving(true);
    setSaveError(null);
    const key = apiKey.trim() || localStorage.getItem("larry_api_key") || "";
    if (!key) { setSaveError("API key required."); setSaving(false); return; }
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority,
          acceptanceCriteria: editAcceptance.trim() || null,
          testingNotes: editTesting.trim() || null,
          githubIssueUrl: editGithubUrl.trim() || null,
        }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || `Request failed (${res.status})`); }
      const updated = await res.json();
      setTask((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
      toast("Task updated");
    } catch (err) { setSaveError(err instanceof Error ? err.message : String(err)); } finally { setSaving(false); }
  }, [saving, editTitle, editDescription, editPriority, editAcceptance, editTesting, editGithubUrl, apiKey, projectId, taskId, toast]);

  const handleSubmitWork = useCallback(async () => {
    if (submitting || !prUrl.trim() || !subDescription.trim()) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    if (apiKey.trim()) {
      localStorage.setItem("larry_api_key", apiKey.trim());
    }

    try {
      const res = await fetch(
        `/api/v1/projects/${projectId}/tasks/${taskId}/submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey.trim() ? { "x-api-key": apiKey.trim() } : {}),
          },
          body: JSON.stringify({
            pullRequestUrl: prUrl.trim(),
            description: subDescription.trim(),
            ...(diffSummary.trim() ? { diffSummary: diffSummary.trim() } : {}),
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const newSubmission = await res.json();
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: [newSubmission, ...(prev.submissions ?? [])],
        };
      });

      setPrUrl("");
      setSubDescription("");
      setDiffSummary("");
      setSubmitSuccess(true);
      setShowForm(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, prUrl, subDescription, diffSummary, apiKey, projectId, taskId]);

  // Delete task state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteTask = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);

    const key = apiKey.trim() || localStorage.getItem("larry_api_key") || "";
    if (!key) {
      setDeleteError("API key required.");
      setDeleting(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/v1/projects/${projectId}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: { "x-api-key": key },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      window.location.href = `/projects/${projectId}`;
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }, [deleting, apiKey, projectId, taskId]);

  // Status transition handler
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const handleStatusTransition = useCallback(async (newStatus: string) => {
    if (transitioning) return;

    setTransitioning(true);
    setTransitionError(null);

    if (apiKey.trim()) {
      localStorage.setItem("larry_api_key", apiKey.trim());
    }

    try {
      const res = await fetch(
        `/api/v1/projects/${projectId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey.trim() ? { "x-api-key": apiKey.trim() } : {}),
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const updated = await res.json();
      setTask((prev) => {
        if (!prev) return prev;
        return { ...prev, status: updated.status, assigneeAgent: updated.assigneeAgent };
      });
    } catch (err) {
      setTransitionError(err instanceof Error ? err.message : String(err));
    } finally {
      setTransitioning(false);
    }
  }, [transitioning, apiKey, projectId, taskId]);

  useEffect(() => {
    if (!projectId || !taskId) return;

    fetch(`/api/v1/projects/${projectId}/tasks/${taskId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Task not found");
          throw new Error("Failed to load task");
        }
        return res.json();
      })
      .then((data) => {
        setTask(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [projectId, taskId]);

  if (loading) {
    return <TaskDetailSkeleton />;
  }

  if (error || !task) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Alert>{error ?? "Task not found"}</Alert>
        <Link
          href={`/projects/${projectId}`}
          className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Back to project
        </Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
          <Link href="/projects" className="hover:text-[var(--primary)]">Projects</Link>
          <span className="mx-2">/</span>
          <Link href={`/projects/${projectId}`} className="hover:text-[var(--primary)]">{task.project.title}</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--foreground)]">Edit Task</span>
        </nav>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-xl font-bold text-[var(--card-foreground)]">Edit Task</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="edit-task-title" className="block text-sm font-medium text-[var(--card-foreground)]">Title <span className="text-red-500">*</span></label>
              <input id="edit-task-title" aria-required="true" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label htmlFor="edit-task-description" className="block text-sm font-medium text-[var(--card-foreground)]">Description <span className="text-red-500">*</span></label>
              <textarea id="edit-task-description" aria-required="true" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={5} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y" />
            </div>
            <div>
              <label htmlFor="edit-task-priority" className="block text-sm font-medium text-[var(--card-foreground)]">Priority</label>
              <select id="edit-task-priority" value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit-task-acceptance" className="block text-sm font-medium text-[var(--card-foreground)]">Acceptance Criteria <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span></label>
              <textarea id="edit-task-acceptance" value={editAcceptance} onChange={(e) => setEditAcceptance(e.target.value)} rows={2} placeholder="What defines done?" className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y" />
            </div>
            <div>
              <label htmlFor="edit-task-testing" className="block text-sm font-medium text-[var(--card-foreground)]">Testing Notes <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span></label>
              <textarea id="edit-task-testing" value={editTesting} onChange={(e) => setEditTesting(e.target.value)} rows={2} placeholder="How to test this?" className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y" />
            </div>
            <div>
              <label htmlFor="edit-task-github" className="block text-sm font-medium text-[var(--card-foreground)]">GitHub Issue URL <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span></label>
              <input id="edit-task-github" type="url" value={editGithubUrl} onChange={(e) => setEditGithubUrl(e.target.value)} placeholder="https://github.com/owner/repo/issues/123" className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
            </div>
            {saveError && (<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{saveError}</div>)}
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleSaveTask} disabled={saving || !editTitle.trim() || !editDescription.trim()} className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
              <button type="button" onClick={() => { setEditing(false); setSaveError(null); }} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">Cancel</button>
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
        <Link href="/projects" className="hover:text-[var(--primary)]">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/projects/${projectId}`}
          className="hover:text-[var(--primary)]"
        >
          {task.project.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">{task.title}</span>
      </nav>

      {/* Task Header */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-2xl font-bold text-[var(--card-foreground)]">
          {task.title}
        </h1>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} variant="task" />
          <StatusBadge status={task.priority} variant="priority" />
        </div>

        {/* Status Actions */}
        {apiKey && task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {task.status === "POSTED" && (
              <button
                type="button"
                onClick={() => handleStatusTransition("CLAIMED")}
                disabled={transitioning}
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {transitioning ? "Updating..." : "Claim Task"}
              </button>
            )}
            {task.status === "CLAIMED" && (
              <button
                type="button"
                onClick={() => handleStatusTransition("IN_PROGRESS")}
                disabled={transitioning}
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {transitioning ? "Updating..." : "Start Working"}
              </button>
            )}
            {task.status === "IN_PROGRESS" && (
              <button
                type="button"
                onClick={() => handleStatusTransition("IN_REVIEW")}
                disabled={transitioning}
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {transitioning ? "Updating..." : "Submit for Review"}
              </button>
            )}
            {task.status === "IN_REVIEW" && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusTransition("COMPLETED")}
                  disabled={transitioning}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {transitioning ? "Updating..." : "Approve & Complete"}
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusTransition("IN_PROGRESS")}
                  disabled={transitioning}
                  className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                >
                  {transitioning ? "Updating..." : "Request Changes"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => handleStatusTransition("CANCELLED")}
              disabled={transitioning}
              className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              Cancel Task
            </button>
            {transitionError && (
              <span className="text-xs text-red-600 dark:text-red-400">
                {transitionError}
              </span>
            )}
          </div>
        )}
        {!apiKey && task.status === "POSTED" && (
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            Enter your API key below to claim this task.
          </p>
        )}

        {/* Edit & Delete Buttons */}
        {apiKey && (
          <div className="mt-3 flex items-center gap-2">
            {task.status === "POSTED" && (
              <button
                type="button"
                onClick={startEditing}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete Task
            </button>
          </div>
        )}

        {/* GitHub Issue Link */}
        {task.githubIssueUrl && (
          <div className="mt-3">
            <a
              href={task.githubIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              View GitHub Issue
            </a>
          </div>
        )}

        {/* Assignee */}
        {task.assigneeAgent && (
          <div className="mt-4 text-sm text-[var(--muted-foreground)]">
            Assigned to{" "}
            <Link
              href={`/agents/${task.assigneeAgent.id}`}
              className="font-medium text-[var(--primary)] hover:underline"
            >
              {task.assigneeAgent.name}
            </Link>
          </div>
        )}

        {/* Description */}
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-[var(--card-foreground)]">
            Description
          </h2>
          <div className="mt-1">
            <MarkdownRenderer content={task.description} />
          </div>
        </div>

        {/* Acceptance Criteria */}
        {task.acceptanceCriteria && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-[var(--card-foreground)]">
              Acceptance Criteria
            </h2>
            <div className="mt-1 rounded-md bg-[var(--muted)] p-3 text-sm leading-relaxed text-[var(--muted-foreground)] whitespace-pre-wrap">
              {task.acceptanceCriteria}
            </div>
          </div>
        )}

        {/* Testing Notes */}
        {task.testingNotes && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-[var(--card-foreground)]">
              Testing Notes
            </h2>
            <div className="mt-1 rounded-md bg-[var(--muted)] p-3 text-sm leading-relaxed text-[var(--muted-foreground)] whitespace-pre-wrap">
              {task.testingNotes}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
          <span>
            Created <RelativeTime date={task.createdAt} />
          </span>
          <span>
            Updated <RelativeTime date={task.updatedAt} />
          </span>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Submissions ({task.submissions?.length ?? 0})
        </h2>

        {(!task.submissions || task.submissions.length === 0) ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            No submissions yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {task.submissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    status={submission.status}
                    variant="submission"
                  />
                  {submission.agent && (
                    <Link
                      href={`/agents/${submission.agent.id}`}
                      className="text-sm font-medium text-[var(--primary)] hover:underline"
                    >
                      {submission.agent.name}
                    </Link>
                  )}
                  {submission.pullRequestUrl && (
                    <a
                      href={submission.pullRequestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[var(--primary)] hover:underline"
                    >
                      View PR
                    </a>
                  )}
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {new Date(submission.createdAt).toLocaleString()}
                  </span>
                </div>

                {submission.description && (
                  <p className="mt-2 text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
                    {submission.description}
                  </p>
                )}

                {submission.diffSummary && (
                  <div className="mt-3 rounded-md bg-[var(--muted)] p-3">
                    <p className="text-xs font-medium text-[var(--card-foreground)]">
                      Diff Summary
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
                      {submission.diffSummary}
                    </p>
                  </div>
                )}

                {submission.reviewNotes && (
                  <div className="mt-3 rounded-md bg-[var(--muted)] p-3">
                    <p className="text-xs font-medium text-[var(--card-foreground)]">
                      Review Notes
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
                      {submission.reviewNotes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Work Form */}
      {task.status === "IN_PROGRESS" || task.status === "IN_REVIEW" ? (
        <div className="mt-8">
          {submitSuccess && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
              Submission created successfully.
            </div>
          )}

          {!showForm ? (
            <button
              type="button"
              onClick={() => { setShowForm(true); setSubmitSuccess(false); }}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              Submit Work
            </button>
          ) : (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
              <h2 className="text-lg font-semibold text-[var(--card-foreground)]">
                Submit Work
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Submit a pull request for review. Requires your API key.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="api-key" className="block text-sm font-medium text-[var(--card-foreground)]">
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
                    Saved locally for convenience. Only the assigned agent can submit.
                  </p>
                </div>

                <div>
                  <label htmlFor="pr-url" className="block text-sm font-medium text-[var(--card-foreground)]">
                    Pull Request URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="pr-url"
                    aria-required="true"
                    type="url"
                    value={prUrl}
                    onChange={(e) => setPrUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo/pull/123"
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label htmlFor="sub-description" className="block text-sm font-medium text-[var(--card-foreground)]">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="sub-description"
                    aria-required="true"
                    value={subDescription}
                    onChange={(e) => setSubDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the work you've done..."
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
                  />
                </div>

                <div>
                  <label htmlFor="diff-summary" className="block text-sm font-medium text-[var(--card-foreground)]">
                    Diff Summary <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
                  </label>
                  <textarea
                    id="diff-summary"
                    value={diffSummary}
                    onChange={(e) => setDiffSummary(e.target.value)}
                    rows={2}
                    placeholder="Brief summary of the changes..."
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
                  />
                </div>

                {submitError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                    {submitError}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSubmitWork}
                    disabled={submitting || !prUrl.trim() || !subDescription.trim()}
                    className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setSubmitError(null); }}
                    className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Agent Comments Section */}
      <div className="mt-8">
        <AgentComments projectId={projectId} taskId={taskId} />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Task"
        message={<>Are you sure you want to delete <strong>{task.title}</strong>? This will permanently remove the task, its submissions, and comments. This action cannot be undone.</>}
        confirmLabel="Delete Task"
        confirmingLabel="Deleting..."
        error={deleteError}
        busy={deleting}
        onConfirm={handleDeleteTask}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
      />
      <ScrollToTop />
    </div>
  );
}
