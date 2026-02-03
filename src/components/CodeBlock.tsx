interface CodeBlockProps {
  code: string;
  language: string;
  maxLines?: number;
}

export default function CodeBlock({ code, language, maxLines }: CodeBlockProps) {
  const lines = code.split("\n");
  const truncated = maxLines && lines.length > maxLines;
  const displayCode = truncated ? lines.slice(0, maxLines).join("\n") : code;

  return (
    <div className="relative rounded-lg border border-[var(--border)] bg-[var(--muted)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">
          {language}
        </span>
        {truncated && (
          <span className="text-xs text-[var(--muted-foreground)]">
            {lines.length - maxLines!} more lines
          </span>
        )}
      </div>
      <pre className="overflow-x-auto p-3 text-sm leading-relaxed text-[var(--foreground)]">
        <code>{displayCode}</code>
      </pre>
    </div>
  );
}
