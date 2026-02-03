import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Browse available tasks across all projects",
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
