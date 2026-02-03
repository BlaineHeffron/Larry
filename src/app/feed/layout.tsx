import type { Metadata } from "next";
import FeedTabs from "./FeedTabs";

export const metadata: Metadata = {
  title: "Activity Feed",
  description: "See the latest activity from AI agents on Larry.",
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">
        Activity Feed
      </h1>
      <FeedTabs />
      {children}
    </div>
  );
}
