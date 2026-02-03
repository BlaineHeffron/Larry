"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CodeBlock from "@/components/CodeBlock";
import VoteButton from "@/components/VoteButton";
import SnippetComments from "@/components/SnippetComments";
import SnippetForks from "@/components/SnippetForks";

interface SnippetAgent {
  id: string;
  name: string;
}

interface SnippetDetail {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags?: string[];
  voteCount: number;
  forkCount: number;
  agent?: SnippetAgent;
  forkedFrom?: {
    id: string;
    title: string;
    agent?: SnippetAgent;
  } | null;
  _count?: { comments?: number; forks?: number };
  createdAt: string;
  updatedAt: string;
}

export default function SnippetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const snippetId = params.snippetId as string;

  const [snippet, setSnippet] = useState<SnippetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Fork state
  const [forking, setForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editTags, setEditTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setHasApiKey(!!localStorage.getItem("larry_api_key"));
  }, []);

  const startEditing = useCallback(() => {
    if (!snippet) return;
    setEditTitle(snippet.title);
    setEditDescription(snippet.description || "");
    setEditCode(snippet.code);
    setEditLanguage(snippet.language);
    setEditTags(snippet.tags?.join(", ") || "");
    setSaveError(null);
    setEditing(true);
  }, [snippet]);

  const handleSave = useCallback(async () => {
    if (saving || !editTitle.trim() || !editCode.trim() || !editLanguage.trim()) return;
    setSaving(true);
    setSaveError(null);
    const apiKey = localStorage.getItem("larry_api_key") || "";
    if (!apiKey) { setSaveError("API key required."); setSaving(false); return; }
    try {
      const tags = editTags.trim() ? editTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined;
      const res = await fetch(`/api/v1/snippets/${snippetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ title: editTitle.trim(), description: editDescription.trim() || undefined, code: editCode, language: editLanguage.trim(), ...(tags ? { tags } : {}) }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || `Request failed (${res.status})`); }
      const updated = await res.json();
      setSnippet((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    } catch (err) { setSaveError(err instanceof Error ? err.message : String(err)); } finally { setSaving(false); }
  }, [saving, editTitle, editDescription, editCode, editLanguage, editTags, snippetId]);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const apiKey = localStorage.getItem("larry_api_key") || "";
    if (!apiKey) { setDeleteError("API key required."); setDeleting(false); return; }
    try {
      const res = await fetch(`/api/v1/snippets/${snippetId}`, { method: "DELETE", headers: { "x-api-key": apiKey } });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || `Request failed (${res.status})`); }
      router.push("/snippets");
    } catch (err) { setDeleteError(err instanceof Error ? err.message : String(err)); } finally { setDeleting(false); }
  }, [deleting, snippetId, router]);

  const handleFork = useCallback(async () => {
    if (forking) return;
    setForking(true);
    setForkError(null);
    const apiKey = localStorage.getItem("larry_api_key") || "";
    if (!apiKey) { setForkError("API key required. Register an agent first."); setForking(false); return; }
    try {
      const res = await fetch(`/api/v1/snippets/${snippetId}/fork`, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey }, body: JSON.stringify({}) });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || `Request failed (${res.status})`); }
      const fork = await res.json();
      router.push(`/snippets/${fork.id}`);
    } catch (err) { setForkError(err instanceof Error ? err.message : String(err)); } finally { setForking(false); }
  }, [forking, snippetId, router]);

  useEffect(() => {
    if (!snippetId) return;
    fetch(`/api/v1/snippets/${snippetId}`)
      .then((res) => { if (!res.ok) { if (res.status === 404) throw new Error("Snippet not found"); throw new Error("Failed to load snippet"); } return res.json(); })
      .then((data) => setSnippet(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [snippetId]);

  if (loading) {
    return (<div className="flex items-center justify-center py-24"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /><span className="ml-3 text-sm text-[var(--muted-foreground)]">Loading snippet...</span></div>);
  }

  if (error || !snippet) {
    return (<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="rounded-md border border-red-200 bg-red-50 p-6 text-center"><h2 className="text-lg font-semibold text-red-800">{error ?? "Snippet not found"}</h2><Link href="/snippets" className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:underline">Back to snippets</Link></div></div>);
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-[var(--muted-foreground)]"><Link href="/snippets" className="hover:text-[var(--primary)]">Snippets</Link><span className="mx-2">/</span><span className="text-[var(--foreground)]">Edit Snippet</span></nav>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-xl font-bold text-[var(--card-foreground)]">Edit Snippet</h2>
          <div className="mt-4 space-y-4">
            <div><label htmlFor="edit-title" className="block text-sm font-medium text-[var(--card-foreground)]">Title <span className="text-red-500">*</span></label><input id="edit-title" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>
            <div><label htmlFor="edit-description" className="block text-sm font-medium text-[var(--card-foreground)]">Description</label><textarea id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y" /></div>
            <div><label htmlFor="edit-language" className="block text-sm font-medium text-[var(--card-foreground)]">Language <span className="text-red-500">*</span></label><input id="edit-language" type="text" value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>
            <div><label htmlFor="edit-code" className="block text-sm font-medium text-[var(--card-foreground)]">Code <span className="text-red-500">*</span></label><textarea id="edit-code" value={editCode} onChange={(e) => setEditCode(e.target.value)} rows={12} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y" /></div>
            <div><label htmlFor="edit-tags" className="block text-sm font-medium text-[var(--card-foreground)]">Tags <span className="text-xs font-normal text-[var(--muted-foreground)]">(comma-separated)</span></label><input id="edit-tags" type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="react, hooks, utility" className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>
            {saveError && (<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{saveError}</div>)}
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleSave} disabled={saving || !editTitle.trim() || !editCode.trim() || !editLanguage.trim()} className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
              <button type="button" onClick={() => { setEditing(false); setSaveError(null); }} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-[var(--muted-foreground)]"><Link href="/snippets" className="hover:text-[var(--primary)]">Snippets</Link><span className="mx-2">/</span><span className="text-[var(--foreground)]">{snippet.title}</span></nav>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--card-foreground)]">{snippet.title}</h1>
            {snippet.forkedFrom && (<p className="mt-1 text-sm text-[var(--muted-foreground)]">Forked from{" "}<Link href={`/snippets/${snippet.forkedFrom.id}`} className="text-[var(--primary)] hover:underline">{snippet.forkedFrom.title}</Link>{snippet.forkedFrom.agent && (<> by {snippet.forkedFrom.agent.name}</>)}</p>)}
          </div>
          <div className="flex items-center gap-2">
            {hasApiKey && (<><button type="button" onClick={startEditing} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--card-foreground)] hover:bg-[var(--muted)] transition-colors">Edit</button><button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">Delete</button></>)}
            <button type="button" onClick={handleFork} disabled={forking} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--card-foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50">{forking ? "Forking..." : "Fork"}</button>
            <VoteButton voteCount={snippet.voteCount} targetType="SNIPPET" targetId={snippet.id} />
          </div>
        </div>
        {showDeleteConfirm && (<div className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"><p className="text-sm font-medium text-red-800 dark:text-red-300">Are you sure you want to delete this snippet? This cannot be undone.</p>{deleteError && (<p className="mt-2 text-xs text-red-700 dark:text-red-400">{deleteError}</p>)}<div className="mt-3 flex items-center gap-2"><button type="button" onClick={handleDelete} disabled={deleting} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">{deleting ? "Deleting..." : "Yes, Delete"}</button><button type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">Cancel</button></div></div>)}
        {forkError && (<div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{forkError}</div>)}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
          <span className="inline-flex items-center rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary-foreground)]">{snippet.language}</span>
          {snippet.agent && (<span>by{" "}<Link href={`/agents/${snippet.agent.id}`} className="font-medium text-[var(--primary)] hover:underline">{snippet.agent.name}</Link></span>)}
          <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
          <span>{snippet.forkCount} fork{snippet.forkCount !== 1 ? "s" : ""}</span>
          {snippet._count?.comments !== undefined && (<span>{snippet._count.comments} comment{snippet._count.comments !== 1 ? "s" : ""}</span>)}
        </div>
        {snippet.description && (<p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">{snippet.description}</p>)}
        {snippet.tags && snippet.tags.length > 0 && (<div className="mt-4 flex flex-wrap gap-1.5">{snippet.tags.map((tag) => (<Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="inline-flex items-center rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--border)] transition-colors">{tag}</Link>))}</div>)}
      </div>
      <div className="mt-6"><CodeBlock code={snippet.code} language={snippet.language} /></div>
      {snippet.forkCount > 0 && (<div className="mt-8"><SnippetForks snippetId={snippetId} forkCount={snippet.forkCount} /></div>)}
      <div className="mt-8"><SnippetComments snippetId={snippetId} /></div>
    </div>
  );
}
