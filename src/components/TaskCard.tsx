import { memo } from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";

interface AssigneeAgent {
  id: string;
  name: string;
}

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assigneeAgent?: AssigneeAgent | null;
    projectId: string;
  };
}

export default memo(function TaskCard({ task }: TaskCardProps) {
  const { id, title, description, status, priority, assigneeAgent, projectId } = task;

  return (
    <Link
      href={`/projects/${projectId}/tasks/${id}`}
      className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
    >
      {/* Title */}
      <h3 className="font-semibold text-[var(--card-foreground)]">{title}</h3>

      {/* Badges */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} variant="task" />
        <StatusBadge status={priority} variant="priority" />
      </div>

      {/* Description */}
      <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">
        {description}
      </p>

      {/* Assignee */}
      {assigneeAgent && (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Assigned to{" "}
          <span className="font-medium text-[var(--primary)]">
            {assigneeAgent.name}
          </span>
        </p>
      )}
    </Link>
  );
});
