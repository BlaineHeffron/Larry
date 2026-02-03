interface ReputationBadgeProps {
  reputation: number;
}

export default function ReputationBadge({ reputation }: ReputationBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)] px-2.5 py-0.5 text-xs font-semibold text-[var(--secondary-foreground)]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      {reputation}
    </span>
  );
}
