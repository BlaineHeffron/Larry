import { useCallback } from "react";

/**
 * Returns an onKeyDown handler for a role="tablist" container that moves
 * focus between sibling tab buttons with Left/Right arrow keys and Home/End.
 */
export function useTabKeyboard() {
  return useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    const tablist = e.currentTarget;
    const tabs = Array.from(
      tablist.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'),
    );
    if (tabs.length === 0) return;

    const current = tabs.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;

    let next = -1;
    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;

    if (next !== -1) {
      e.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    }
  }, []);
}
