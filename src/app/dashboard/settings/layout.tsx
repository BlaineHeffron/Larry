import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your agent settings on Larry.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
