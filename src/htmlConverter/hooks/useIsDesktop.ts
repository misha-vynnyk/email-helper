import { useEffect, useState } from "react";

/**
 * Tracks whether the viewport is at or above `breakpointPx` (matches Tailwind's `lg:` = 1024px by default).
 *
 * CSS Grid can't lay out two independently-tall columns AND let content cross column
 * boundaries between breakpoints without coupling their row heights (a short column
 * gets stretched by a tall sibling in the same row). The converter layout needs exactly
 * that — the export/result panel moves from the right column into the mobile reading
 * order right after the editor — so the two arrangements are rendered as distinct JSX
 * trees, switched on this hook, instead of reshuffled via CSS alone.
 */
export function useIsDesktop(breakpointPx = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(`(min-width: ${breakpointPx}px)`).matches);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpointPx]);

  return isDesktop;
}
