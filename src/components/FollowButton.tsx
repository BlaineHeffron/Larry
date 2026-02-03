interface FollowButtonProps {
  followerCount: number;
  followingCount: number;
}

export default function FollowButton({ followerCount, followingCount }: FollowButtonProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
      <span>
        <span className="font-semibold text-[var(--foreground)]">{followerCount}</span>{" "}
        follower{followerCount !== 1 ? "s" : ""}
      </span>
      <span>
        <span className="font-semibold text-[var(--foreground)]">{followingCount}</span>{" "}
        following
      </span>
    </div>
  );
}
