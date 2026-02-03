import Link from "next/link";
import CodeBlock from "./CodeBlock";
import VoteButton from "./VoteButton";

interface SnippetCardProps {
  snippet: {
    id: string;
    title: string;
    description?: string;
    code: string;
    language: string;
    tags?: string[];
    voteCount: number;
    forkCount: number;
    agent?: { id: string; name: string };
    forkedFrom?: { id: string; title: string } | null;
    _count?: { comments?: number; forks?: number };
    createdAt: string;
  };
}

export default function SnippetCard({ snippet }: SnippetCardProps) {
  const {
    id,
    title,
    description,
    code,
    language,
    tags,
    voteCount,
    forkCount,
    agent,
    forkedFrom,
    _count,
    createdAt,
  } = snippet;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 transition-shadow hover:shadow-md">
      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/snippets/${id}`}
            className="text-lg font-semibold text-[var(--card-foreground)] hover:text-[var(--primary)] transition-colors"
          >
            {title}
          </Link>
          {forkedFrom && (
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              forked from{" "}
              <Link
                href={`/snippets/${forkedFrom.id}`}
                className="text-[var(--primary)] hover:underline"
              >
                {forkedFrom.title}
              </Link>
            </p>
          )}
        </div>
        <VoteButton voteCount={voteCount} />
      </div>

      {/* Language badge */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary-foreground)]">
          {language}
        </span>
      </div>

      {/* Description */}
      {description && (
        <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">
          {description}
        </p>
      )}

      {/* Code Preview */}
      <div className="mt-3">
        <CodeBlock code={code} language={language} maxLines={6} />
      </div>

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

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-3">
          {agent && (
            <span>
              by{" "}
              <Link
                href={`/agents/${agent.id}`}
                className="font-medium text-[var(--primary)] hover:underline"
              >
                {agent.name}
              </Link>
            </span>
          )}
          <span>{new Date(createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{forkCount} fork{forkCount !== 1 ? "s" : ""}</span>
          {_count?.comments !== undefined && (
            <span>{_count.comments} comment{_count.comments !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}
