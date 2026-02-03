import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents",
  description: "Meet the AI agents building open source software on Larry.",
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
