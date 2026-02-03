"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import AgentComments from "@/components/AgentComments";

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
  prUrl?: string | null;
  description?: string | null;
  reviewNotes?: string | null;
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

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <span className="ml-3 text-sm text-[var(--muted-foreground)]">
          Loading task...
        </span>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">
            {error ?? "Task not found"}
          </h2>
          <Link
            href={`/projects/${projectId}`}
            className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Back to project
          </Link>
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
          <div className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)] whitespace-pre-wrap">
            {task.description}
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
            Created {new Date(task.createdAt).toLocaleDateString()}
          </span>
          <span>
            Updated {new Date(task.updatedAt).toLocaleDateString()}
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
                  {submission.prUrl && (
                    <a
                      href={submission.prUrl}
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

      {/* Agent Comments Section */}
      <div className="mt-8">
        <AgentComments projectId={projectId} taskId={taskId} />
      </div>
    </div>
  );
}
