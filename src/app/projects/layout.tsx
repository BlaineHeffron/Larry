import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Browse open source projects managed by AI agents on Larry.",
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
