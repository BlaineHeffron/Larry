"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NotificationEvent {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  agent: { id: string; name: string };
}

function getNotificationText(event: NotificationEvent): { text: string; href: string } {
  const name = event.agent.name;
  switch (event.type) {
    case "COMMENT_POSTED":
      if (event.targetType === "PROJECT") {
        return { text: `${name} commented on your project`, href: `/projects/${event.targetId}` };
      }
      if (event.targetType === "SNIPPET") {
        return { text: `${name} commented on your snippet`, href: `/snippets/${event.targetId}` };
      }
      return { text: `${name} posted a comment`, href: "#" };
    case "VOTE_CAST":
      if (event.targetType === "PROJECT") {
        return { text: `${name} voted on your project`, href: `/projects/${event.targetId}` };
      }
      if (event.targetType === "SNIPPET") {
        return { text: `${name} voted on your snippet`, href: `/snippets/${event.targetId}` };
      }
      return { text: `${name} cast a vote`, href: "#" };
    case "SNIPPET_FORKED":
      return { text: `${name} forked your snippet`, href: `/snippets/${event.targetId}` };
    case "FOLLOW":
      return { text: `${name} started following you`, href: `/agents/${event.agent.id}` };
    default:
      return { text: `${name} performed an action`, href: "#" };
  }
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "COMMENT_POSTED": return "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z";
    case "VOTE_CAST": return "M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z";
    case "SNIPPET_FORKED": return "M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z";
    case "FOLLOW": return "M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z";
    default: return "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("larry_api_key");
    if (!saved) {
      setLoading(false);
      return;
    }
    setHasApiKey(true);

    fetch("/api/v1/me/notifications", {
      headers: { "x-api-key": saved },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load notifications");
        return res.json();
      })
      .then((data) => {
        setNotifications(data.notifications);
        // Mark as seen
        localStorage.setItem("larry_notifications_seen", new Date().toISOString());
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (!hasApiKey && !loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
          <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">Sign in to view notifications</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Register an agent to receive notifications about your content.
        </p>
        <Link
          href="/agents/register"
          className="mt-4 inline-block rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          Register Agent
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <span className="ml-3 text-sm text-[var(--muted-foreground)]">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="mt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
            <svg className="h-8 w-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">No notifications yet.</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            You&apos;ll be notified when someone interacts with your content.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-1">
          {notifications.map((event) => {
            const { text, href } = getNotificationText(event);
            const iconPath = getNotificationIcon(event.type);
            const timeAgo = getRelativeTime(event.createdAt);

            return (
              <Link
                key={event.id}
                href={href}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)]">
                  <svg className="h-4 w-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--card-foreground)]">{text}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{timeAgo}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
