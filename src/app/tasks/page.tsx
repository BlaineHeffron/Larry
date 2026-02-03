"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { TaskCardSkeleton } from "@/components/SkeletonCard";
import RelativeTime from "@/components/RelativeTime";
import StatusBadge from "@/components/StatusBadge";
import Alert from "@/components/Alert";
import ScrollToTop from "@/components/ScrollToTop";

interface TaskProject {
  id: string;
  title: string;
}

interface TaskAgent {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: string;
  project?: TaskProject;
  assigneeAgent?: TaskAgent | null;
  _count?: { submissions?: number };
  createdAt: string;
}

const STATUS_OPTIONS = ["All", "POSTED", "CLAIMED", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "CANCELLED"];
const PRIORITY_OPTIONS = ["All", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest" },
  { value: "priority", label: "Priority" },
];

const LIMIT = 12;

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Tasks</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Browse tasks across all projects.</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <TasksPageInner />
    </Suspense>
  );
}

function TasksPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "All");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "All");
  const [searchFilter, setSearchFilter] = useState(searchParams.get("search") || "");
  const [sortFilter, setSortFilter] = useState(searchParams.get("sort") || "recent");

  const debouncedSearch = useDebounce(searchFilter, 300);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (priorityFilter !== "All") params.set("priority", priorityFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sortFilter !== "recent") params.set("sort", sortFilter);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/tasks", { scroll: false });
  }, [statusFilter, priorityFilter, debouncedSearch, sortFilter, page, router]);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    params.set("sort", sortFilter);
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (priorityFilter !== "All") params.set("priority", priorityFilter);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

    fetch(`/api/v1/tasks?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load tasks");
        return res.json();
      })
      .then((data) => {
        setTasks(data.tasks ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, statusFilter, priorityFilter, debouncedSearch, sortFilter, fetchKey]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const resetPage = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Tasks</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Browse tasks across all projects. Find work to claim or contribute to.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="task-status" className="text-xs font-medium text-[var(--muted-foreground)]">Status</label>
          <select id="task-status" value={statusFilter} onChange={(e) => resetPage(setStatusFilter, e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt === "All" ? "All Statuses" : opt.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="task-priority" className="text-xs font-medium text-[var(--muted-foreground)]">Priority</label>
          <select id="task-priority" value={priorityFilter} onChange={(e) => resetPage(setPriorityFilter, e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt === "All" ? "All Priorities" : opt}</option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="task-search" className="text-xs font-medium text-[var(--muted-foreground)]">Search</label>
          <input id="task-search" type="text" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Search tasks..." className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="task-sort" className="text-xs font-medium text-[var(--muted-foreground)]">Sort</label>
          <select id="task-sort" value={sortFilter} onChange={(e) => resetPage(setSortFilter, e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert className="mt-6" onRetry={() => setFetchKey(k => k + 1)}>{error}</Alert>
      )}

      {/* Empty */}
      {!loading && !error && tasks.length === 0 && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
            <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          {(statusFilter !== "All" || priorityFilter !== "All" || debouncedSearch) ? (
            <>
              <p className="text-sm font-medium text-[var(--foreground)]">No tasks match your filters</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Try broadening your search or clearing some filters.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-[var(--foreground)]">No tasks yet</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Tasks are created within projects. Browse projects to find or create tasks.</p>
              <Link href="/projects" className="mt-4 inline-block rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity">
                Browse Projects
              </Link>
            </>
          )}
        </div>
      )}

      {/* Task List */}
      {!loading && !error && tasks.length > 0 && (
        <div className="mt-6 space-y-3">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/projects/${task.projectId}/tasks/${task.id}`}
              className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[var(--card-foreground)]">{task.title}</h3>
                  {task.project && (
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      in <span className="font-medium text-[var(--primary)]">{task.project.title}</span>
                    </p>
                  )}
                  <p className="mt-1.5 line-clamp-2 text-sm text-[var(--muted-foreground)]">{task.description}</p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge status={task.priority} variant="priority" />
                  <StatusBadge status={task.status} variant="task" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                {task.assigneeAgent && (
                  <span>Assigned to <span className="font-medium">{task.assigneeAgent.name}</span></span>
                )}
                {task._count?.submissions !== undefined && task._count.submissions > 0 && (
                  <span>{task._count.submissions} submission{task._count.submissions !== 1 ? "s" : ""}</span>
                )}
                <RelativeTime date={task.createdAt} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--muted-foreground)]">
            Page {page} of {totalPages} ({total} task{total !== 1 ? "s" : ""})
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
}
