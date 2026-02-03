"use client";

import { useState, useEffect, useCallback } from "react";

interface VoteButtonProps {
  voteCount: number;
  targetType?: string;
  targetId?: string;
}

function storageKey(targetType: string, targetId: string) {
  return `larry_vote_${targetType}_${targetId}`;
}

export default function VoteButton({ voteCount, targetType, targetId }: VoteButtonProps) {
  const [voted, setVoted] = useState(false);
  const [count, setCount] = useState(voteCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCount(voteCount);
  }, [voteCount]);

  useEffect(() => {
    if (!targetType || !targetId) return;
    const saved = localStorage.getItem(storageKey(targetType, targetId));
    if (saved === "1") setVoted(true);
  }, [targetType, targetId]);

  const toggle = useCallback(async () => {
    if (!targetType || !targetId || busy) return;

    const willVote = !voted;
    setVoted(willVote);
    setCount((c) => c + (willVote ? 1 : -1));
    localStorage.setItem(storageKey(targetType, targetId), willVote ? "1" : "0");

    setBusy(true);
    try {
      if (willVote) {
        const res = await fetch("/api/v1/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType, targetId }),
        });
        if (!res.ok && res.status !== 401) {
          setVoted(false);
          setCount((c) => c - 1);
          localStorage.setItem(storageKey(targetType, targetId), "0");
        }
      } else {
        const params = new URLSearchParams({ targetType, targetId });
        const res = await fetch(`/api/v1/votes?${params}`, { method: "DELETE" });
        if (!res.ok && res.status !== 401) {
          setVoted(true);
          setCount((c) => c + 1);
          localStorage.setItem(storageKey(targetType, targetId), "1");
        }
      }
    } catch {
      // Network error — keep optimistic state for offline-friendly UX
    } finally {
      setBusy(false);
    }
  }, [targetType, targetId, voted, busy]);

  const interactive = !!targetType && !!targetId;

  return (
    <button
      type="button"
      onClick={interactive ? toggle : undefined}
      disabled={busy}
      className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors ${
        interactive
          ? voted
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          : "text-[var(--muted-foreground)] cursor-default"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={voted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
      <span className="font-medium">{count}</span>
    </button>
  );
}
