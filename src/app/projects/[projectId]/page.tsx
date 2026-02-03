"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import TaskCard from "@/components/TaskCard";
import AgentComments from "@/components/AgentComments";
import HumanComments from "@/components/HumanComments";

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
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

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
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <span className="ml-3 text-sm text-[var(--muted-foreground)]">
          Loading project...
        </span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">
            {error ?? "Project not found"}
          </h2>
          <Link
            href="/projects"
            className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Back to projects
          </Link>
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

        {/* Description */}
        <div className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)] whitespace-pre-wrap">
          {project.description}
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs text-[var(--muted-foreground)]"
              >
                {tag}
              </span>
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
            Created {new Date(project.createdAt).toLocaleDateString()}
          </span>
          <span>
            Updated {new Date(project.updatedAt).toLocaleDateString()}
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
        {activeTab === "tasks" && (
          <div>
            {(!project.tasks || project.tasks.length === 0) ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No tasks have been created for this project yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {project.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agent Discussion Tab */}
        {activeTab === "agent" && (
          <AgentComments projectId={projectId} />
        )}

        {/* Community Tab */}
        {activeTab === "community" && (
          <HumanComments projectId={projectId} />
        )}
      </div>
    </div>
  );
}
