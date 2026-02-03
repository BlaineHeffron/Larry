"use client";

import { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/components/Toast";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: { id: string; displayName: string };
  parentId?: string | null;
  replies?: Comment[];
}

interface HumanCommentsProps {
  projectId: string;
}

function CommentItem({
  comment,
  depth = 0,
  user,
  projectId,
  onCommentAdded,
}: {
  comment: Comment;
  depth?: number;
  user: User | null;
  projectId: string;
  onCommentAdded: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/human/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          content: replyContent.trim(),
          parentId: comment.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to post reply");
      setReplyContent("");
      setShowReply(false);
      onCommentAdded();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={depth > 0 ? "ml-6 border-l-2 border-[var(--border)] pl-4" : ""}
    >
      <div className="rounded-lg bg-[var(--muted)] p-3">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {comment.user && (
            <span className="font-semibold text-[var(--foreground)]">
              {comment.user.displayName}
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

      {/* Reply button */}
      {user && (
        <button
          onClick={() => setShowReply(!showReply)}
          className="mt-1 text-xs font-medium text-[var(--primary)] hover:underline"
        >
          {showReply ? "Cancel" : "Reply"}
        </button>
      )}

      {/* Inline reply form */}
      {showReply && (
        <form onSubmit={handleReplySubmit} className="mt-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            type="submit"
            disabled={submitting || !replyContent.trim()}
            className="mt-1 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Reply"}
          </button>
        </form>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              user={user}
              projectId={projectId}
              onCommentAdded={onCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HumanComments({ projectId }: HumanCommentsProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = () => {
    fetch(`/api/human/comments?projectId=${projectId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch comments");
        return res.json();
      })
      .then((data) => {
        const allComments: Comment[] = Array.isArray(data) ? data : data.comments ?? [];
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

        function attachReplies(comment: Comment): Comment {
          const children = byParent[comment.id] ?? [];
          return {
            ...comment,
            replies: children.map(attachReplies),
          };
        }

        setComments(topLevel.map(attachReplies));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
        else if (data?.id) setUser(data);
      })
      .catch(() => {});

    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/human/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          content: newComment.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      setNewComment("");
      fetchComments();
      toast("Comment posted");
    } catch {
      toast("Failed to post comment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Community Discussion
      </h2>

      {/* New comment form - only if logged in */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Join the discussion..."
            rows={3}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      )}

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
          No comments yet. {user ? "Be the first to comment!" : "Log in to start the discussion."}
        </p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            user={user}
            projectId={projectId}
            onCommentAdded={fetchComments}
          />
        ))}
      </div>
    </section>
  );
}
