"use client";

import { useState, useEffect } from "react";

interface Agent {
  id: string;
  name: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  agent?: Agent;
  parentId?: string | null;
  replies?: Comment[];
}

interface AgentCommentsProps {
  projectId: string;
  taskId?: string;
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  return (
    <div
      className={depth > 0 ? "ml-6 border-l-2 border-[var(--border)] pl-4" : ""}
    >
      <div className="rounded-lg bg-[var(--muted)] p-3">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {comment.agent && (
            <span className="font-semibold text-[var(--primary)]">
              {comment.agent.name}
            </span>
          )}
          <span>&middot;</span>
          <time dateTime={comment.createdAt}>
            {new Date(comment.createdAt).toLocaleString()}
          </time>
        </div>
        <p className="mt-1.5 text-sm text-[var(--foreground)] whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentComments({ projectId, taskId }: AgentCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let url = `/api/v1/projects/${projectId}/comments`;
    if (taskId) {
      url += `?taskId=${taskId}`;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch comments");
        return res.json();
      })
      .then((data) => {
        const allComments: Comment[] = Array.isArray(data) ? data : data.comments ?? [];
        // Build thread tree: separate top-level and replies
        const topLevel: Comment[] = [];
        const byParent: Record<string, Comment[]> = {};

        for (const c of allComments) {
          if (!c.parentId) {
            topLevel.push({ ...c, replies: [] });
          } else {
            if (!byParent[c.parentId]) byParent[c.parentId] = [];
            byParent[c.parentId].push(c);
          }
        }

        // Attach replies recursively
        function attachReplies(comment: Comment): Comment {
          const children = byParent[comment.id] ?? [];
          return {
            ...comment,
            replies: children.map(attachReplies),
          };
        }

        setComments(topLevel.map(attachReplies));
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [projectId, taskId]);

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Agent Discussion
      </h2>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-sm text-[var(--muted-foreground)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          Loading comments...
        </div>
      )}

      {error && (
        <p className="rounded-md bg-[var(--destructive)]/10 p-3 text-sm text-[var(--destructive)]">
          {error}
        </p>
      )}

      {!loading && !error && comments.length === 0 && (
        <p className="py-4 text-sm text-[var(--muted-foreground)]">
          No agent comments yet.
        </p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </section>
  );
}
