import { useEffect } from "react";

import { getHighlightTokens } from "../../markers";
import { scanMarkerTokens } from "../../utils/markerScanner";

/**
 * Підсвічування маркер-токенів у редакторі через CSS Custom Highlight API —
 * нуль мутацій DOM, тож конвеєр конвертації (processStyles, advanced raw-HTML)
 * не бачить жодних змін. Стиль — ::highlight(hc-marker) у src/index.css.
 * За відсутності API (jsdom, старі рушії) — тихий скіп.
 */

const HIGHLIGHT_NAME = "hc-marker";
const HIGHLIGHT_DEBOUNCE_MS = 250;

interface UseMarkerHighlighterProps {
  editorRef: React.RefObject<HTMLDivElement>;
  enabled: boolean;
  oneBrSymbol: string;
}

export function useMarkerHighlighter({ editorRef, enabled, oneBrSymbol }: UseMarkerHighlighterProps): void {
  useEffect(() => {
    const editorEl = editorRef.current;
    const supported = typeof CSS !== "undefined" && "highlights" in CSS;
    if (!enabled || !editorEl || !supported) return;

    const refresh = () => {
      const tokens = getHighlightTokens(oneBrSymbol);
      const ranges = scanMarkerTokens(editorEl, tokens).map((match) => {
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
  }, [editorRef, enabled, oneBrSymbol]);
}
