"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert prose-headings:text-[var(--card-foreground)] prose-p:text-[var(--muted-foreground)] prose-a:text-[var(--primary)] prose-strong:text-[var(--card-foreground)] prose-code:text-[var(--card-foreground)] prose-code:bg-[var(--muted)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[var(--muted)] prose-pre:text-[var(--foreground)] prose-li:text-[var(--muted-foreground)] prose-blockquote:border-[var(--border)] prose-blockquote:text-[var(--muted-foreground)] prose-hr:border-[var(--border)] prose-th:text-[var(--card-foreground)] prose-td:text-[var(--muted-foreground)] ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
