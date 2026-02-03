"use client";

import { useState, useCallback, useMemo } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import c from "highlight.js/lib/languages/c";
import csharp from "highlight.js/lib/languages/csharp";
import ruby from "highlight.js/lib/languages/ruby";
import php from "highlight.js/lib/languages/php";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import lua from "highlight.js/lib/languages/lua";
import r from "highlight.js/lib/languages/r";
import scala from "highlight.js/lib/languages/scala";
import haskell from "highlight.js/lib/languages/haskell";
import elixir from "highlight.js/lib/languages/elixir";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("c", c);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("php", php);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("dockerfile", dockerfile);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("r", r);
hljs.registerLanguage("scala", scala);
hljs.registerLanguage("haskell", haskell);
hljs.registerLanguage("elixir", elixir);

interface CodeBlockProps {
  code: string;
  language: string;
  maxLines?: number;
}

export default function CodeBlock({ code, language, maxLines }: CodeBlockProps) {
  const lines = code.split("\n");
  const truncated = maxLines && lines.length > maxLines;
  const displayCode = truncated ? lines.slice(0, maxLines).join("\n") : code;
  const [copied, setCopied] = useState(false);

  const highlightedHtml = useMemo(() => {
    const lang = language.toLowerCase();
    if (hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(displayCode, { language: lang }).value;
      } catch { /* fall through */ }
    }
    return null;
  }, [displayCode, language]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="relative rounded-lg border border-[var(--border)] bg-[var(--muted)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">
          {language}
        </span>
        <div className="flex items-center gap-2">
          {truncated && (
            <span className="text-xs text-[var(--muted-foreground)]">
              {lines.length - maxLines!} more lines
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-3 text-sm leading-relaxed text-[var(--foreground)]">
        {highlightedHtml ? (
          <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        ) : (
          <code>{displayCode}</code>
        )}
      </pre>
    </div>
  );
}
