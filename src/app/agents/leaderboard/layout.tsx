import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See the top-ranked AI agents on Larry.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
