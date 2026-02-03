function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--muted)] ${className ?? ""}`}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start justify-between gap-3">
        <Bone className="h-5 w-40" />
        <Bone className="h-6 w-12 rounded-full" />
      </div>
      <div className="mt-2 flex gap-2">
        <Bone className="h-5 w-20 rounded-full" />
        <Bone className="h-5 w-16 rounded-full" />
      </div>
      <Bone className="mt-3 h-4 w-full" />
      <Bone className="mt-1.5 h-4 w-3/4" />
      <div className="mt-3 flex gap-1.5">
        <Bone className="h-5 w-14 rounded-full" />
        <Bone className="h-5 w-12 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bone className="h-3 w-20" />
          <Bone className="h-3 w-16" />
        </div>
        <Bone className="h-3 w-20" />
      </div>
    </div>
  );
}

export function SnippetCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start justify-between gap-3">
        <Bone className="h-5 w-36" />
        <Bone className="h-6 w-12 rounded-full" />
      </div>
      <div className="mt-2">
        <Bone className="h-5 w-16 rounded-full" />
      </div>
      <Bone className="mt-2 h-4 w-full" />
      <Bone className="mt-3 h-24 w-full rounded-md" />
      <div className="mt-3 flex gap-1.5">
        <Bone className="h-5 w-14 rounded-full" />
        <Bone className="h-5 w-10 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bone className="h-3 w-20" />
          <Bone className="h-3 w-16" />
        </div>
        <Bone className="h-3 w-20" />
      </div>
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-3">
        <Bone className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Bone className="h-5 w-28" />
          <Bone className="mt-1 h-3 w-20" />
        </div>
      </div>
      <Bone className="mt-3 h-4 w-full" />
      <Bone className="mt-1 h-4 w-2/3" />
      <div className="mt-3 flex gap-1.5">
        <Bone className="h-5 w-16 rounded-full" />
        <Bone className="h-5 w-14 rounded-full" />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <Bone className="h-3 w-16" />
        <Bone className="h-3 w-16" />
        <Bone className="h-3 w-16" />
      </div>
      <Bone className="mt-3 h-3 w-24" />
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <Bone className="mt-0.5 h-8 w-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Bone className="h-4 w-56" />
        <Bone className="mt-1.5 h-3 w-20" />
      </div>
    </div>
  );
}

export function TaskDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2">
        <Bone className="h-4 w-16" />
        <Bone className="h-4 w-4" />
        <Bone className="h-4 w-24" />
        <Bone className="h-4 w-4" />
        <Bone className="h-4 w-32" />
      </div>
      {/* Header card */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <Bone className="h-7 w-72" />
        <div className="mt-3 flex gap-2">
          <Bone className="h-6 w-20 rounded-full" />
          <Bone className="h-6 w-16 rounded-full" />
        </div>
        <Bone className="mt-4 h-4 w-full" />
        <Bone className="mt-1.5 h-4 w-full" />
        <Bone className="mt-1.5 h-4 w-3/4" />
        <div className="mt-4 flex gap-3">
          <Bone className="h-3 w-28" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Bone className="h-5 w-48" />
          <Bone className="mt-1 h-3 w-28" />
          <Bone className="mt-2 h-4 w-full" />
          <Bone className="mt-1 h-4 w-3/4" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Bone className="h-5 w-16 rounded-full" />
          <Bone className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Bone className="h-3 w-24" />
        <Bone className="h-3 w-16" />
      </div>
    </div>
  );
}
