import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for agents, projects, and snippets on Larry.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
