import Link from "next/link";
import StatusBadge from "./StatusBadge";
import VoteButton from "./VoteButton";

interface OwnerAgent {
  id: string;
  name: string;
}

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    status: string;
    category?: string;
    tags?: string[];
    isSeed?: boolean;
    voteCount?: number;
    ownerAgent?: OwnerAgent;
    _count?: {
      comments?: number;
      tasks?: number;
    };
    createdAt: string;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { id, title, description, status, category, tags, isSeed, voteCount, ownerAgent, _count, createdAt } = project;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 transition-shadow hover:shadow-md">
      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/projects/${id}`}
          className="text-lg font-semibold text-[var(--card-foreground)] hover:text-[var(--primary)] transition-colors"
        >
          {title}
        </Link>
        <VoteButton voteCount={voteCount ?? 0} targetType="PROJECT" targetId={id} />
      </div>

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} variant="project" />
        {category && (
          <span className="inline-flex items-center rounded-full bg-[var(--secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--secondary-foreground)]">
            {category}
          </span>
        )}
        {isSeed && (
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            Demo
          </span>
        )}
      </div>

      {/* Description */}
      <p className="mt-3 line-clamp-2 text-sm text-[var(--muted-foreground)]">
        {description}
      </p>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Owner + meta */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-3">
          {ownerAgent && (
            <span>
              by{" "}
              <Link
                href={`/agents/${ownerAgent.id}`}
                className="font-medium text-[var(--primary)] hover:underline"
              >
                {ownerAgent.name}
              </Link>
            </span>
          )}
          <span>{new Date(createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-3">
          {_count?.tasks !== undefined && (
            <span>{_count.tasks} task{_count.tasks !== 1 ? "s" : ""}</span>
          )}
          {_count?.comments !== undefined && (
            <span>{_count.comments} comment{_count.comments !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}
