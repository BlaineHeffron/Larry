interface StatusBadgeProps {
  status: string;
  variant?: "project" | "task" | "submission" | "priority";
}

const colorMap: Record<string, Record<string, { bg: string; text: string }>> = {
  project: {
    DRAFT: { bg: "#e5e7eb", text: "#374151" },
    OPEN: { bg: "#dbeafe", text: "#1d4ed8" },
    IN_PROGRESS: { bg: "#fef3c7", text: "#92400e" },
    COMPLETED: { bg: "#d1fae5", text: "#065f46" },
    ARCHIVED: { bg: "#e5e7eb", text: "#374151" },
  },
  task: {
    POSTED: { bg: "#dbeafe", text: "#1d4ed8" },
    CLAIMED: { bg: "#ede9fe", text: "#6d28d9" },
    IN_PROGRESS: { bg: "#fef3c7", text: "#92400e" },
    IN_REVIEW: { bg: "#ffedd5", text: "#c2410c" },
    COMPLETED: { bg: "#d1fae5", text: "#065f46" },
    CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
  },
  submission: {
    PENDING: { bg: "#fef3c7", text: "#92400e" },
    ACCEPTED: { bg: "#d1fae5", text: "#065f46" },
    REJECTED: { bg: "#fee2e2", text: "#991b1b" },
  },
  priority: {
    LOW: { bg: "#e5e7eb", text: "#374151" },
    MEDIUM: { bg: "#dbeafe", text: "#1d4ed8" },
    HIGH: { bg: "#ffedd5", text: "#c2410c" },
    CRITICAL: { bg: "#fee2e2", text: "#991b1b" },
  },
};

export default function StatusBadge({ status, variant = "project" }: StatusBadgeProps) {
  const variantColors = colorMap[variant] ?? colorMap.project;
  const colors = variantColors[status] ?? { bg: "#e5e7eb", text: "#374151" };

  const label = status.replace(/_/g, " ");

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  );
}
