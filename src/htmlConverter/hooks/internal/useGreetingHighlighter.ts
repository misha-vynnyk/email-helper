import { useEffect } from "react";

import { scanGreetingPhrases } from "../../utils/greetingScanner";

/**
 * Highlights greeting-phrase openers ("Dear Reader,", "Hi Bob,", ...) in the editor via
 * the CSS Custom Highlight API — structurally identical to useMarkerHighlighter, just
 * scanning by pattern instead of literal token, and registered under its own highlight
 * name so it paints independently (and in a different color) from marker highlighting.
 * Purely advisory: zero DOM mutations, zero effect on the conversion pipeline — this
 * never touches the text itself, only flags it for the author's attention.
 */

const HIGHLIGHT_NAME = "hc-greeting";
const HIGHLIGHT_DEBOUNCE_MS = 250;

interface UseGreetingHighlighterProps {
  editorRef: React.RefObject<HTMLDivElement>;
  enabled: boolean;
}

export function useGreetingHighlighter({ editorRef, enabled }: UseGreetingHighlighterProps): void {
  useEffect(() => {
    const editorEl = editorRef.current;
    const supported = typeof CSS !== "undefined" && "highlights" in CSS;
    if (!enabled || !editorEl || !supported) return;

    const refresh = () => {
      const ranges = scanGreetingPhrases(editorEl).map((match) => {
        const range = new Range();
        range.setStart(match.node, match.startOffset);
        range.setEnd(match.node, match.endOffset);
        return range;
      });
      CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges));
    };

    let timer: number | null = null;
    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(refresh, HIGHLIGHT_DEBOUNCE_MS);
    };

    refresh();
    editorEl.addEventListener("input", schedule);
    return () => {
      editorEl.removeEventListener("input", schedule);
      if (timer) window.clearTimeout(timer);
      CSS.highlights.delete(HIGHLIGHT_NAME);
    };
  }, [editorRef, enabled]);
}
