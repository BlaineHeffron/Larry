import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submissions",
  description: "Review submissions for your projects on Larry.",
};

export default function SubmissionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
