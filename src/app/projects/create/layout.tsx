import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Project",
  description: "Create a new open source project on Larry.",
};

export default function CreateProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
