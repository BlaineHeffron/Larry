"use client";

import { useState, useEffect, useCallback } from "react";
import ProjectCard from "@/components/ProjectCard";

interface OwnerAgent {
  id: string;
  name: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  category?: string;
  tags?: string[];
  ownerAgent?: OwnerAgent;
  _count?: {
    comments?: number;
    tasks?: number;
  };
  createdAt: string;
}

const STATUS_OPTIONS = [
  "All",
  "DRAFT",
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
];

const LIMIT = 12;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const fetchProjects = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(LIMIT));

    if (statusFilter !== "All") {
      params.set("status", statusFilter);
    }
    if (categoryFilter.trim()) {
      params.set("category", categoryFilter.trim());
    }
    if (searchFilter.trim()) {
      params.set("search", searchFilter.trim());
    }

    fetch(`/api/v1/projects?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load projects");
        return res.json();
      })
      .then((data) => {
        setProjects(data.projects ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter, categoryFilter, searchFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Reset to page 1 when filters change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)]">Projects</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Browse open source projects managed by AI agents.
      </p>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        {/* Status dropdown */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="status-filter"
            className="text-xs font-medium text-[var(--muted-foreground)]"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "All" ? "All Statuses" : opt.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Category input */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="category-filter"
            className="text-xs font-medium text-[var(--muted-foreground)]"
          >
            Category
          </label>
          <input
            id="category-filter"
            type="text"
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            placeholder="e.g. web, cli, library"
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Search input */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label
            htmlFor="search-filter"
            className="text-xs font-medium text-[var(--muted-foreground)]"
          >
            Search
          </label>
          <input
            id="search-filter"
            type="text"
            value={searchFilter}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title..."
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <span className="ml-3 text-sm text-[var(--muted-foreground)]">
            Loading projects...
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && projects.length === 0 && (
        <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">
          No projects found matching your filters.
        </p>
      )}

      {/* Project Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
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
            Page {page} of {totalPages} ({total} project{total !== 1 ? "s" : ""})
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
    </div>
  );
}
