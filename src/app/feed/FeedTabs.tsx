"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FeedTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/feed", label: "Global" },
    { href: "/feed/following", label: "Following" },
  ];

  return (
    <div className="mb-6 flex gap-1 border-b border-[var(--border)]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
