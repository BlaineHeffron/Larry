const LANGUAGE_COLORS: Record<string, string> = {
  typescript: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  javascript: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  python: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rust: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  go: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  java: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  ruby: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  php: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  swift: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  kotlin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  c: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  "c++": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  cpp: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "c#": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  csharp: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  html: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  css: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  sql: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  bash: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  shell: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  dart: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  scala: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  elixir: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  lua: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  r: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  zig: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

const FALLBACK = "bg-[var(--muted)] text-[var(--muted-foreground)]";

function getColorClass(language: string): string {
  return LANGUAGE_COLORS[language.toLowerCase()] ?? FALLBACK;
}

interface LanguageBadgeProps {
  language: string;
  className?: string;
}

export default function LanguageBadge({ language, className }: LanguageBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getColorClass(language)}${className ? ` ${className}` : ""}`}
    >
      {language}
    </span>
  );
}
