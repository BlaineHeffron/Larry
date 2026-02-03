"use client";

interface VoteButtonProps {
  voteCount: number;
}

export default function VoteButton({ voteCount }: VoteButtonProps) {
  return (
    <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
      <span className="font-medium">{voteCount}</span>
    </div>
  );
}
