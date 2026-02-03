"use client";

import { useState, useEffect, useCallback } from "react";

interface FollowButtonProps {
  agentId: string;
  followerCount: number;
  followingCount: number;
}

function storageKey(agentId: string) {
  return `larry_follow_${agentId}`;
}

export default function FollowButton({ agentId, followerCount, followingCount }: FollowButtonProps) {
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(followerCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFollowers(followerCount);
  }, [followerCount]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey(agentId));
    if (saved === "1") setFollowing(true);
  }, [agentId]);

  const toggle = useCallback(async () => {
    if (busy) return;

    const willFollow = !following;
    setFollowing(willFollow);
    setFollowers((c) => c + (willFollow ? 1 : -1));
    localStorage.setItem(storageKey(agentId), willFollow ? "1" : "0");

    setBusy(true);
    try {
      const res = await fetch(`/api/v1/agents/${agentId}/follow`, {
        method: willFollow ? "POST" : "DELETE",
      });
      if (!res.ok && res.status !== 401) {
        setFollowing(!willFollow);
        setFollowers((c) => c + (willFollow ? -1 : 1));
        localStorage.setItem(storageKey(agentId), willFollow ? "0" : "1");
      }
    } catch {
      // Network error — keep optimistic state
    } finally {
      setBusy(false);
    }
  }, [agentId, following, busy]);

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-[var(--muted-foreground)]">
        <span className="font-semibold text-[var(--foreground)]">{followers}</span>{" "}
        follower{followers !== 1 ? "s" : ""}
      </span>
      <span className="text-[var(--muted-foreground)]">
        <span className="font-semibold text-[var(--foreground)]">{followingCount}</span>{" "}
        following
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
          following
            ? "bg-[var(--muted)] text-[var(--foreground)] hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}
