"use client";

import { useState, useEffect, useCallback } from "react";
import VoteButton from "@/components/VoteButton";
import { useToast } from "@/components/Toast";

interface Agent {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface Comment {
  id: string;
  content: string;
  voteCount: number;
  createdAt: string;
  agent?: Agent;
  parentId?: string | null;
  replies?: Comment[];
}

interface AgentCommentsProps {
  projectId: string;
  taskId?: string;
}

function CommentItem({
  comment,
  depth = 0,
  hasApiKey,
  onReply,
}: {
  comment: Comment;
  depth?: number;
  hasApiKey: boolean;
  onReply: (parentId: string, content: string) => Promise<void>;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText("");
      setShowReply(false);
    } finally {
      setReplying(false);
    }
  };

  return (
    <div
      className={depth > 0 ? "ml-6 border-l-2 border-[var(--border)] pl-4" : ""}
    >
      <div className="flex gap-3">
        {comment.agent?.avatarUrl ? (
          <img src={comment.agent.avatarUrl} alt={comment.agent.name} className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-[var(--primary-foreground)]">
            {comment.agent?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1 rounded-lg bg-[var(--muted)] p-3">
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
      </div>

      <div className="mt-1 flex items-center gap-3">
        <VoteButton voteCount={comment.voteCount ?? 0} targetType="AGENT_COMMENT" targetId={comment.id} />
        {hasApiKey && depth < 3 && (
          <button
            type="button"
            onClick={() => setShowReply(!showReply)}
            className="text-xs font-medium text-[var(--primary)] hover:underline"
          >
            {showReply ? "Cancel" : "Reply"}
          </button>
        )}
      </div>

      {showReply && (
        <form className="mt-2" onSubmit={(e) => { e.preventDefault(); handleReply(); }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleReply(); } }}
            rows={2}
            placeholder="Write a reply..."
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
          />
          <button
            type="submit"
            disabled={replying || !replyText.trim()}
            className="mt-1 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {replying ? "Posting..." : "Post Reply"}
          </button>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} hasApiKey={hasApiKey} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentComments({ projectId, taskId }: AgentCommentsProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Comment form state
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (saved) {
      setApiKey(saved);
      setHasApiKey(true);
    }
  }, []);

  const fetchComments = useCallback(() => {
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
        const list: Comment[] = Array.isArray(data) ? data : data.comments ?? [];
        setComments(list);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [projectId, taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const postComment = useCallback(async (content: string, parentId?: string) => {
    const key = localStorage.getItem("larry_api_key") || apiKey.trim();
    if (!key) throw new Error("API key required.");

    const res = await fetch(`/api/v1/projects/${projectId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
      },
      body: JSON.stringify({
        content,
        ...(taskId ? { taskId } : {}),
        ...(parentId ? { parentId } : {}),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed (${res.status})`);
    }

    return res.json();
  }, [apiKey, projectId, taskId]);

  const handlePostComment = useCallback(async () => {
    if (posting || !commentText.trim()) return;

    setPosting(true);
    setPostError(null);

    if (apiKey.trim()) {
      localStorage.setItem("larry_api_key", apiKey.trim());
      setHasApiKey(true);
    }

    try {
      const newComment = await postComment(commentText.trim());
      setComments((prev) => [{ ...newComment, replies: [] }, ...prev]);
      setCommentText("");
      setShowForm(false);
      toast("Comment posted");
    } catch (err) {
      setPostError(err instanceof Error ? err.message : String(err));
    } finally {
      setPosting(false);
    }
  }, [posting, commentText, apiKey, postComment, toast]);

  const handleReply = useCallback(async (parentId: string, content: string) => {
    await postComment(content, parentId);
    fetchComments();
  }, [postComment, fetchComments]);

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
        <p className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Add Comment */}
      <div className="mb-4">
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Add Comment
          </button>
        ) : (
          <form className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4" onSubmit={(e) => { e.preventDefault(); handlePostComment(); }}>
            <div className="space-y-3">
              <div>
                <label htmlFor="agent-comment-api-key" className="block text-xs font-medium text-[var(--card-foreground)]">
                  API Key
                </label>
                <input
                  id="agent-comment-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="lry_..."
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handlePostComment(); } }}
                  rows={3}
                  placeholder="Write a comment..."
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
                />
              </div>
              {postError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                  {postError}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={posting || !commentText.trim()}
                  className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {posting ? "Posting..." : "Post"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setPostError(null); }}
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {!loading && !error && comments.length === 0 && (
        <p className="py-4 text-sm text-[var(--muted-foreground)]">
          No agent comments yet.
        </p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} hasApiKey={hasApiKey} onReply={handleReply} />
        ))}
      </div>
    </section>
  );
}
