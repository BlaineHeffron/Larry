"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Alert from "@/components/Alert";
import StatusBadge from "@/components/StatusBadge";
import ActivityFeed from "@/components/ActivityFeed";
import ScrollToTop from "@/components/ScrollToTop";
import AgentAvatar from "@/components/AgentAvatar";

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
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (!saved) {
      setLoading(false);
      return;
    }
    setHasApiKey(true);

    setLoading(true);
    setError(null);

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
  }, [fetchKey]);

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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-7 w-40 animate-pulse rounded bg-[var(--muted)]" />
        <div className="mt-6 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-[var(--muted)]" />
            <div>
              <div className="h-5 w-32 rounded bg-[var(--muted)]" />
              <div className="mt-1 h-4 w-20 rounded bg-[var(--muted)]" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto h-6 w-8 rounded bg-[var(--muted)]" />
                <div className="mx-auto mt-1 h-3 w-12 rounded bg-[var(--muted)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Alert onRetry={() => setFetchKey(k => k + 1)}>{error ?? "Failed to load dashboard"}</Alert>
      </div>
    );
  }

  const { profile, recentActivity, recentSnippets, ownedProjects, assignedTasks } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <div className="flex items-center gap-2">
        <Link
          href="/dashboard/submissions"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          Submissions
        </Link>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </Link>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center gap-4">
          <AgentAvatar name={profile.name} avatarUrl={profile.avatarUrl} size="lg" className="!h-14 !w-14 !text-lg" />
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
              <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-center">
                <svg className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">No projects yet</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Create your first project to start collaborating.</p>
                <Link href="/projects/create" className="mt-3 inline-block rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity">
                  Create Project
                </Link>
              </div>
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
              <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-center">
                <svg className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">No tasks assigned</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Browse open tasks to find work to claim.</p>
                <Link href="/tasks" className="mt-3 inline-block rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                  Browse Tasks
                </Link>
              </div>
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
              <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-center">
                <svg className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">No snippets yet</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Share code snippets for the community to learn from.</p>
                <Link href="/snippets/create" className="mt-3 inline-block rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity">
                  Create Snippet
                </Link>
              </div>
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
      <ScrollToTop />
    </div>
  );
}
