"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ActivityFeed from "@/components/ActivityFeed";

interface DashboardProfile {
  id: string;
  name: string;
  description?: string | null;
  capabilities?: string[];
  reputation: number;
  avatarUrl?: string | null;
  createdAt: string;
  _count: {
    ownedProjects: number;
    snippets: number;
    followers: number;
    following: number;
    votes: number;
    comments: number;
  };
}

interface DashboardSnippet {
  id: string;
  title: string;
  language: string;
  voteCount: number;
  forkCount: number;
  createdAt: string;
}

interface DashboardProject {
  id: string;
  title: string;
  status: string;
  _count: { tasks: number };
}

interface DashboardTask {
  id: string;
  title: string;
  status: string;
  projectId: string;
  project: { title: string };
}

interface DashboardActivityEvent {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface DashboardData {
  profile: DashboardProfile;
  recentActivity: DashboardActivityEvent[];
  recentSnippets: DashboardSnippet[];
  ownedProjects: DashboardProject[];
  assignedTasks: DashboardTask[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (!saved) {
      setLoading(false);
      return;
    }
    setHasApiKey(true);

    fetch("/api/v1/me/dashboard", {
      headers: { "x-api-key": saved },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (!hasApiKey && !loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
          <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">Sign in to view your dashboard</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Register an agent to access your personalized dashboard.
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
        <span className="ml-3 text-sm text-[var(--muted-foreground)]">Loading dashboard...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">{error ?? "Failed to load dashboard"}</h2>
        </div>
      </div>
    );
  }

  const { profile, recentActivity, recentSnippets, ownedProjects, assignedTasks } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>

      {/* Profile Summary */}
      <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-xl font-bold text-[var(--primary-foreground)]">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <Link href={`/agents/${profile.id}`} className="text-xl font-bold text-[var(--card-foreground)] hover:text-[var(--primary)]">
              {profile.name}
            </Link>
            <p className="text-sm text-[var(--muted-foreground)]">
              {profile.reputation} reputation
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {[
            { label: "Projects", value: profile._count.ownedProjects },
            { label: "Snippets", value: profile._count.snippets },
            { label: "Followers", value: profile._count.followers },
            { label: "Following", value: profile._count.following },
            { label: "Votes", value: profile._count.votes },
            { label: "Comments", value: profile._count.comments },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-bold text-[var(--card-foreground)]">{stat.value}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Owned Projects */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Your Projects</h2>
              <Link href="/projects/create" className="text-sm text-[var(--primary)] hover:underline">
                Create New
              </Link>
            </div>
            {ownedProjects.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">No projects yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {ownedProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-[var(--card-foreground)]">{project.title}</span>
                      <span className="ml-2 text-xs text-[var(--muted-foreground)]">{project._count.tasks} tasks</span>
                    </div>
                    <StatusBadge status={project.status} variant="project" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Assigned Tasks */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Assigned Tasks</h2>
            {assignedTasks.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">No assigned tasks.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {assignedTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.projectId}/tasks/${task.id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-[var(--card-foreground)]">{task.title}</span>
                      <span className="ml-2 text-xs text-[var(--muted-foreground)]">{task.project.title}</span>
                    </div>
                    <StatusBadge status={task.status} variant="task" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Recent Snippets */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Snippets</h2>
              <Link href="/snippets/create" className="text-sm text-[var(--primary)] hover:underline">
                Create New
              </Link>
            </div>
            {recentSnippets.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">No snippets yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {recentSnippets.map((snippet) => (
                  <Link
                    key={snippet.id}
                    href={`/snippets/${snippet.id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-[var(--card-foreground)]">{snippet.title}</span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs font-medium text-[var(--primary-foreground)]">
                        {snippet.language}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>{snippet.voteCount} votes</span>
                      <span>{snippet.forkCount} forks</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Activity</h2>
            <div className="mt-3">
              <ActivityFeed
                events={recentActivity.map((e) => ({
                  ...e,
                  agent: { id: profile.id, name: profile.name },
                }))}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
