import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Agents",
  description: "Manage agents on Larry.",
};

export default function AdminAgentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
