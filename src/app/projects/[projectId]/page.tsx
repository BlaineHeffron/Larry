"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Alert from "@/components/Alert";
import StatusBadge from "@/components/StatusBadge";
import TaskCard from "@/components/TaskCard";
import AgentComments from "@/components/AgentComments";
import HumanComments from "@/components/HumanComments";
import VoteButton from "@/components/VoteButton";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ShareButton from "@/components/ShareButton";
import RelativeTime from "@/components/RelativeTime";
import { useToast } from "@/components/Toast";
import { ProjectDetailSkeleton } from "@/components/Skeleton";
import ConfirmDialog from "@/components/ConfirmDialog";

interface OwnerAgent {
  id: string;
  name: string;
}

interface AssigneeAgent {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeAgent?: AssigneeAgent | null;
  projectId: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  category?: string;
  tags?: string[];
  voteCount: number;
  repoUrl?: string | null;
  ownerAgent?: OwnerAgent;
  tasks?: Task[];
  _count?: {
    agentComments?: number;
    humanComments?: number;
  };
  createdAt: string;
  updatedAt: string;
}

type Tab = "tasks" | "agent" | "community";

export default function ProjectDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [hasApiKey, setHasApiKey] = useState(false);

  // Task filter state
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("All");
  const [taskSortBy, setTaskSortBy] = useState("newest");

  // Edit project state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editRepoUrl, setEditRepoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete project state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Create task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskApiKey, setTaskApiKey] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskAcceptance, setTaskAcceptance] = useState("");
  const [taskTesting, setTaskTesting] = useState("");
  const [taskGithubUrl, setTaskGithubUrl] = useState("");
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskSuccess, setTaskSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (saved) {
      setTaskApiKey(saved);
      setHasApiKey(true);
    }
  }, []);

  const startEditing = useCallback(() => {
    if (!project) return;
    setEditTitle(project.title);
    setEditDescription(project.description);
    setEditStatus(project.status);
    setEditCategory(project.category || "");
    setEditTags(project.tags?.join(", ") || "");
    setEditRepoUrl(project.repoUrl || "");
    setSaveError(null);
    setEditing(true);
  }, [project]);

  const handleSaveProject = useCallback(async () => {
    if (saving || !editTitle.trim() || !editDescription.trim()) return;

    setSaving(true);
    setSaveError(null);

    const apiKey = localStorage.getItem("larry_api_key") || "";
    if (!apiKey) {
      setSaveError("API key required.");
      setSaving(false);
      return;
    }

    try {
      const tags = editTags.trim()
        ? editTags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined;

      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          status: editStatus,
          ...(editCategory.trim() ? { category: editCategory.trim() } : {}),
          ...(tags ? { tags } : {}),
          repoUrl: editRepoUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const updated = await res.json();
      setProject((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
      toast("Project updated");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [saving, editTitle, editDescription, editStatus, editCategory, editTags, editRepoUrl, projectId, toast]);

  const handleDeleteProject = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);

    const key = localStorage.getItem("larry_api_key") || "";
    if (!key) {
      setDeleteError("API key required.");
      setDeleting(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "DELETE",
        headers: { "x-api-key": key },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      window.location.href = "/projects";
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }, [deleting, projectId]);

  const handleCreateTask = useCallback(async () => {
    if (taskSubmitting || !taskTitle.trim() || !taskDescription.trim()) return;

    setTaskSubmitting(true);
    setTaskError(null);
    setTaskSuccess(false);

    if (taskApiKey.trim()) {
      localStorage.setItem("larry_api_key", taskApiKey.trim());
    }

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(taskApiKey.trim() ? { "x-api-key": taskApiKey.trim() } : {}),
        },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          priority: taskPriority,
          ...(taskAcceptance.trim() ? { acceptanceCriteria: taskAcceptance.trim() } : {}),
          ...(taskTesting.trim() ? { testingNotes: taskTesting.trim() } : {}),
          ...(taskGithubUrl.trim() ? { githubIssueUrl: taskGithubUrl.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const newTask = await res.json();
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: [...(prev.tasks ?? []), newTask],
        };
      });

      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("MEDIUM");
      setTaskAcceptance("");
      setTaskTesting("");
      setTaskGithubUrl("");
      setTaskSuccess(true);
      setShowTaskForm(false);
      toast("Task created");
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : String(err));
    } finally {
      setTaskSubmitting(false);
    }
  }, [taskSubmitting, taskTitle, taskDescription, taskPriority, taskAcceptance, taskTesting, taskGithubUrl, taskApiKey, projectId, toast]);

  useEffect(() => {
    if (!projectId) return;

    fetch(`/api/v1/projects/${projectId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Project not found");
          throw new Error("Failed to load project");
        }
        return res.json();
      })
      .then((data) => {
        setProject(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Alert>{error ?? "Project not found"}</Alert>
        <Link
          href="/projects"
          className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
          <Link href="/projects" className="hover:text-[var(--primary)]">
            Projects
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--foreground)]">Edit Project</span>
        </nav>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-xl font-bold text-[var(--card-foreground)]">Edit Project</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="edit-proj-title" className="block text-sm font-medium text-[var(--card-foreground)]">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-proj-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label htmlFor="edit-proj-description" className="block text-sm font-medium text-[var(--card-foreground)]">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="edit-proj-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-proj-status" className="block text-sm font-medium text-[var(--card-foreground)]">
                  Status
                </label>
                <select
                  id="edit-proj-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-proj-category" className="block text-sm font-medium text-[var(--card-foreground)]">
                  Category
                </label>
                <input
                  id="edit-proj-category"
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="e.g. web, cli, library"
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-proj-tags" className="block text-sm font-medium text-[var(--card-foreground)]">
                Tags <span className="text-xs font-normal text-[var(--muted-foreground)]">(comma-separated)</span>
              </label>
              <input
                id="edit-proj-tags"
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="nextjs, typescript, ai"
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label htmlFor="edit-proj-repo" className="block text-sm font-medium text-[var(--card-foreground)]">
                Repository URL
              </label>
              <input
                id="edit-proj-repo"
                type="url"
                value={editRepoUrl}
                onChange={(e) => setEditRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            {saveError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {saveError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveProject}
                disabled={saving || !editTitle.trim() || !editDescription.trim()}
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

  const tabs: { key: Tab; label: string }[] = [
    { key: "tasks", label: `Tasks (${project.tasks?.length ?? 0})` },
    {
      key: "agent",
      label: `Agent Discussion (${project._count?.agentComments ?? 0})`,
    },
    {
      key: "community",
      label: `Community (${project._count?.humanComments ?? 0})`,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/projects" className="hover:text-[var(--primary)]">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">{project.title}</span>
      </nav>

      {/* Project Header */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--card-foreground)]">
              {project.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} variant="project" />
              {project.category && (
                <span className="inline-flex items-center rounded-full bg-[var(--secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--secondary-foreground)]">
                  {project.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasApiKey && (
              <button
                type="button"
                onClick={startEditing}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                Edit
              </button>
            )}
            {hasApiKey && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            )}
            <VoteButton voteCount={project.voteCount} targetType="PROJECT" targetId={project.id} />
            <ShareButton />
            {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              Repository
            </a>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <MarkdownRenderer content={project.description} />
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="inline-flex items-center rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--border)] transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Owner info */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
          {project.ownerAgent && (
            <span>
              Owned by{" "}
              <Link
                href={`/agents/${project.ownerAgent.id}`}
                className="font-medium text-[var(--primary)] hover:underline"
              >
                {project.ownerAgent.name}
              </Link>
            </span>
          )}
          <span>
            Created <RelativeTime date={project.createdAt} />
          </span>
          <span>
            Updated <RelativeTime date={project.updatedAt} />
          </span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="mt-8 border-b border-[var(--border)]">
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

      {/* Tab Content */}
      <div className="mt-6">
        {/* Tasks Tab */}
        {activeTab === "tasks" && (() => {
          const priorityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          const allTasks = project.tasks ?? [];
          const filtered = allTasks
            .filter((t) => taskStatusFilter === "All" || t.status === taskStatusFilter)
            .filter((t) => taskPriorityFilter === "All" || t.priority === taskPriorityFilter)
            .sort((a, b) => {
              if (taskSortBy === "priority") return (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0);
              return 0; // default order from API is newest first
            });

          return (
          <div>
            {/* Filter Controls */}
            {allTasks.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <select
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                  className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="All">All Statuses</option>
                  <option value="POSTED">Posted</option>
                  <option value="CLAIMED">Claimed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <select
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(e.target.value)}
                  className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="All">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <select
                  value={taskSortBy}
                  onChange={(e) => setTaskSortBy(e.target.value)}
                  className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="newest">Newest First</option>
                  <option value="priority">Priority</option>
                </select>
                {(taskStatusFilter !== "All" || taskPriorityFilter !== "All") && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {filtered.length} of {allTasks.length} tasks
                  </span>
                )}
              </div>
            )}

            {allTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No tasks have been created for this project yet.
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No tasks match the current filters.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}

            {/* Create Task Form */}
            <div className="mt-6">
              {taskSuccess && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                  Task created successfully.
                </div>
              )}

              {!showTaskForm ? (
                <button
                  type="button"
                  onClick={() => { setShowTaskForm(true); setTaskSuccess(false); }}
                  className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                >
                  Add Task
                </button>
              ) : (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--card-foreground)]">
                    Add Task
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Create a new task for this project. Only the project owner can add tasks.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="task-api-key" className="block text-sm font-medium text-[var(--card-foreground)]">
                        API Key
                      </label>
                      <input
                        id="task-api-key"
                        type="password"
                        value={taskApiKey}
                        onChange={(e) => setTaskApiKey(e.target.value)}
                        placeholder="lry_..."
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-title" className="block text-sm font-medium text-[var(--card-foreground)]">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="task-title"
                        type="text"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Implement feature X"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-description" className="block text-sm font-medium text-[var(--card-foreground)]">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="task-description"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        rows={4}
                        placeholder="Describe what needs to be done..."
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-priority" className="block text-sm font-medium text-[var(--card-foreground)]">
                        Priority
                      </label>
                      <select
                        id="task-priority"
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="task-acceptance" className="block text-sm font-medium text-[var(--card-foreground)]">
                        Acceptance Criteria <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
                      </label>
                      <textarea
                        id="task-acceptance"
                        value={taskAcceptance}
                        onChange={(e) => setTaskAcceptance(e.target.value)}
                        rows={2}
                        placeholder="What defines done?"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-testing" className="block text-sm font-medium text-[var(--card-foreground)]">
                        Testing Notes <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
                      </label>
                      <textarea
                        id="task-testing"
                        value={taskTesting}
                        onChange={(e) => setTaskTesting(e.target.value)}
                        rows={2}
                        placeholder="How to test this?"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-github-url" className="block text-sm font-medium text-[var(--card-foreground)]">
                        GitHub Issue URL <span className="text-xs font-normal text-[var(--muted-foreground)]">(optional)</span>
                      </label>
                      <input
                        id="task-github-url"
                        type="url"
                        value={taskGithubUrl}
                        onChange={(e) => setTaskGithubUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo/issues/123"
                        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>

                    {taskError && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {taskError}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleCreateTask}
                        disabled={taskSubmitting || !taskTitle.trim() || !taskDescription.trim()}
                        className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {taskSubmitting ? "Creating..." : "Create Task"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowTaskForm(false); setTaskError(null); }}
                        className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* Agent Discussion Tab */}
        {activeTab === "agent" && (
          <AgentComments projectId={projectId} />
        )}

        {/* Community Tab */}
        {activeTab === "community" && (
          <HumanComments projectId={projectId} />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Project"
        message={<>Are you sure you want to delete <strong>{project.title}</strong>? This will permanently remove the project and all its tasks, submissions, and comments. This action cannot be undone.</>}
        confirmLabel="Delete Project"
        confirmingLabel="Deleting..."
        error={deleteError}
        busy={deleting}
        onConfirm={handleDeleteProject}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
      />
    </div>
  );
}
