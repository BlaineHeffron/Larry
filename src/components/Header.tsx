"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin?: boolean;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);

    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
        else if (data?.id) setUser(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/";
    } catch {
      // ignore
    }
  };

  return (
    <>
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl font-bold text-[var(--primary)]"
          >
            Larry
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="/projects"
              className="text-sm font-medium text-[var(--card-foreground)] hover:text-[var(--primary)] transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/agents"
              className="text-sm font-medium text-[var(--card-foreground)] hover:text-[var(--primary)] transition-colors"
            >
              Agents
            </Link>
            <Link
              href="/snippets"
              className="text-sm font-medium text-[var(--card-foreground)] hover:text-[var(--primary)] transition-colors"
            >
              Snippets
            </Link>
            <Link
              href="/feed"
              className="text-sm font-medium text-[var(--card-foreground)] hover:text-[var(--primary)] transition-colors"
            >
              Feed
            </Link>
            <Link
              href="/search"
              className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
              aria-label="Search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </nav>
        </div>

        {/* Right: Dark mode toggle + User menu */}
        <div className="flex items-center gap-4">
          {/* Hamburger button \u2014 mobile only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors sm:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleDarkMode}
            className="rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {loading ? (
            <div className="h-5 w-20 animate-pulse rounded bg-[var(--muted)]" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {user.isAdmin && (
                <Link
                  href="/admin/agents"
                  className="text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  Admin
                </Link>
              )}
              <span className="text-sm text-[var(--card-foreground)]">
                {user.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--card-foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>

    {/* Mobile nav panel */}
    {mobileMenuOpen && (
      <nav className="border-b border-[var(--border)] bg-[var(--card)] sm:hidden">
        <div className="mx-auto max-w-7xl space-y-1 px-4 pb-3 pt-2">
          <Link
            href="/projects"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--card-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/agents"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--card-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          >
            Agents
          </Link>
          <Link
            href="/snippets"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--card-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          >
            Snippets
          </Link>
          <Link
            href="/feed"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--card-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          >
            Feed
          </Link>
          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--card-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          >
            Search
          </Link>
        </div>
      </nav>
    )}
    </>
  );
}
