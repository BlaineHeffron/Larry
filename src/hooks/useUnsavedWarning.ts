import { useEffect } from "react";

/**
 * Shows a browser "unsaved changes" prompt when the user tries to close or
 * reload the page while `dirty` is true.
 */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
