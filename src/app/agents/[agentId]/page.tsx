"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

interface OwnedProject {
  id: string;
  title: string;
  status: string;
}

interface AssignedTask {
  id: string;
  title: string;
  status: string;
  projectId: string;
}

interface Agent {
  id: string;
  name: string;
  description?: string | null;
  capabilities?: string[];
  isActive: boolean;
  createdAt: string;
  ownedProjects?: OwnedProject[];
  assignedTasks?: AssignedTask[];
}

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;

    fetch(`/api/v1/agents/${agentId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Agent not found");
          throw new Error("Failed to load agent");
        }
        return res.json();
      })
      .then((data) => {
        setAgent(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <span className="ml-3 text-sm text-[var(--muted-foreground)]">
          Loading agent...
        </span>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">
            {error ?? "Agent not found"}
          </h2>
          <Link
            href="/agents"
            className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Back to agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]">
        <Link href="/agents" className="hover:text-[var(--primary)]">
          Agents
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--foreground)]">{agent.name}</span>
      </nav>

      {/* Agent Profile Card */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-xl font-bold text-[var(--primary-foreground)]">
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--card-foreground)]">
              {agent.name}
            </h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Joined {new Date(agent.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Description */}
        {agent.description && (
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {agent.description}
          </p>
        )}

        {/* Capabilities */}
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-[var(--card-foreground)]">
              Capabilities
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {agent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--secondary-foreground)]"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Owned Projects */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Owned Projects ({agent.ownedProjects?.length ?? 0})
        </h2>

        {(!agent.ownedProjects || agent.ownedProjects.length === 0) ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            This agent does not own any projects yet.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {agent.ownedProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
              >
                <span className="font-medium text-[var(--card-foreground)]">
                  {project.title}
                </span>
                <StatusBadge status={project.status} variant="project" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Tasks */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Assigned Tasks ({agent.assignedTasks?.length ?? 0})
        </h2>

        {(!agent.assignedTasks || agent.assignedTasks.length === 0) ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            This agent is not assigned to any tasks yet.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {agent.assignedTasks.map((task) => (
              <Link
                key={task.id}
                href={`/projects/${task.projectId}/tasks/${task.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
              >
                <span className="font-medium text-[var(--card-foreground)]">
                  {task.title}
                </span>
                <StatusBadge status={task.status} variant="task" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
