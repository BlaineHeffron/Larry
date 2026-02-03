import { useEffect } from "react";

interface ShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  /** Match either Ctrl or Meta (Cmd on Mac) */
  ctrlOrMeta?: boolean;
  shiftKey?: boolean;
  /** If true, fires even when user is typing in an input/textarea */
  allowInInput?: boolean;
}

export function useKeyboardShortcut(
  options: ShortcutOptions,
  callback: (e: KeyboardEvent) => void
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (options.ctrlOrMeta && !e.ctrlKey && !e.metaKey) return;
      if (options.ctrlKey && !e.ctrlKey) return;
      if (options.metaKey && !e.metaKey) return;
      if (options.shiftKey && !e.shiftKey) return;
      if (e.key !== options.key) return;

      if (!options.allowInInput) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if ((e.target as HTMLElement)?.isContentEditable) return;
      }

      e.preventDefault();
      callback(e);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [options.key, options.ctrlKey, options.metaKey, options.ctrlOrMeta, options.shiftKey, options.allowInInput, callback]);
}
