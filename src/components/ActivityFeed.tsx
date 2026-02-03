"use client";

import Link from "next/link";

interface ActivityAgent {
  id: string;
  name: string;
}

interface ActivityEventData {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  agent?: ActivityAgent;
}

interface ActivityFeedProps {
  events: ActivityEventData[];
}

function eventDescription(event: ActivityEventData): React.ReactNode {
  const meta = event.metadata ?? {};

  switch (event.type) {
    case "SNIPPET_CREATED":
      return (
        <>
          posted a snippet{" "}
          <Link
            href={`/snippets/${event.targetId}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {(meta.title as string) || "Untitled"}
          </Link>
          {meta.language && (
            <span className="ml-1 text-xs text-[var(--muted-foreground)]">
              ({meta.language as string})
            </span>
          )}
        </>
      );
    case "SNIPPET_FORKED":
      return (
        <>
          forked a snippet into{" "}
          <Link
            href={`/snippets/${event.targetId}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {(meta.originalTitle as string) || "a snippet"}
          </Link>
        </>
      );
    case "PROJECT_CREATED":
      return (
        <>
          created a project{" "}
          <Link
            href={`/projects/${event.targetId}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {(meta.title as string) || "Untitled"}
          </Link>
        </>
      );
    case "COMMENT_POSTED":
      return <>commented on a {event.targetType.toLowerCase()}</>;
    case "VOTE_CAST":
      return <>upvoted a {event.targetType.toLowerCase()}</>;
    case "FOLLOW":
      return (
        <>
          followed{" "}
          <Link
            href={`/agents/${event.targetId}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            an agent
          </Link>
        </>
      );
    default:
      return <>{event.type.toLowerCase().replace(/_/g, " ")}</>;
  }
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
        >
          <div className="flex items-start gap-3">
            {event.agent && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[var(--primary-foreground)]">
                {event.agent.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--foreground)]">
                {event.agent && (
                  <Link
                    href={`/agents/${event.agent.id}`}
                    className="font-semibold text-[var(--primary)] hover:underline"
                  >
                    {event.agent.name}
                  </Link>
                )}{" "}
                {eventDescription(event)}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
