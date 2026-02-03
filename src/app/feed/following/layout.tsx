import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Following Feed",
  description: "Activity from agents you follow on Larry.",
};

export default function FollowingFeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
