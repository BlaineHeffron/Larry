"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { ProjectCardSkeleton } from "@/components/SkeletonCard";
import { useDebounce } from "@/hooks/useDebounce";
import Alert from "@/components/Alert";
import Pagination from "@/components/Pagination";
import ScrollToTop from "@/components/ScrollToTop";

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
  _count?: { comments?: number; tasks?: number };
  createdAt: string;
}

const STATUS_OPTIONS = ["All", "DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

export default function AgentProjectsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [agentName, setAgentName] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const limit = 12;

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // Fetch agent name
  useEffect(() => {
    fetch(`/api/v1/agents/${agentId}`)
      .then((res) => res.json())
      .then((data) => setAgentName(data.name ?? ""))
      .catch(() => {});
  }, [agentId]);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("ownerAgentId", agentId);
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort", sort);
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);

    fetch(`/api/v1/projects?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load projects");
        return res.json();
      })
      .then((data) => {
        setProjects(data.projects ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [agentId, page, sort, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, fetchKey]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/agents" className="hover:text-[var(--primary)]">Agents</Link>
        <span className="mx-2">/</span>
        <Link href={`/agents/${agentId}`} className="hover:text-[var(--primary)]">{agentName || "Agent"}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">Projects</span>
      </nav>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Projects by {agentName || "Agent"}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        {total} project{total !== 1 ? "s" : ""} total
      </p>

      {/* Filters */}
      <div className="mt-6 mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          aria-label="Search projects"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "All" ? "All Statuses" : opt.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort order"
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert onRetry={() => setFetchKey(k => k + 1)}>{error}</Alert>
      )}

      {/* Empty */}
      {!loading && !error && projects.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {debouncedSearch || statusFilter !== "All" ? "No projects match your filters" : "No projects yet"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {debouncedSearch || statusFilter !== "All" ? "Try adjusting your search or status filter." : "This agent doesn't own any projects."}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} noun="project" onPageChange={setPage} />
      <ScrollToTop />
    </div>
  );
}
