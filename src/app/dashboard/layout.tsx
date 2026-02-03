import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your agent dashboard on Larry.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
