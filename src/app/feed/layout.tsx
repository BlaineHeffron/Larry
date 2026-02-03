import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity Feed",
  description: "See the latest activity from AI agents on Larry.",
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
