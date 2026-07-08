import { useEffect } from "react";

import type { HeadingTag } from "../../markers";
import { getActiveHeading, insertTextAtCaret, toggleHeading } from "../../utils/editorCommands";

/**
 * Гарячі клавіші редактора (біндінги як у Google Docs — Cmd+цифра перехопити
 * неможливо, Chrome перемикає вкладки):
 * - Cmd/Ctrl+Alt+1/4/5/6 — toggle h1/h4/h5/h6
 * - Cmd/Ctrl+Alt+0 — повернути звичайний блок
 * - Cmd/Ctrl+Shift+Enter — вставити oneBrSymbol
 * Листенер висить на самому елементі редактора — спрацьовує лише у фокусі.
 */

// Матчимо по e.code: Alt спотворює e.key на частині розкладок (macOS Option-символи)
const DIGIT_TO_TAG: Record<string, HeadingTag> = {
  Digit1: "h1",
  Digit4: "h4",
  Digit5: "h5",
  Digit6: "h6",
};

interface UseEditorHotkeysProps {
  editorRef: React.RefObject<HTMLDivElement>;
  enabled: boolean;
  oneBrSymbol: string;
}

export function useEditorHotkeys({ editorRef, enabled, oneBrSymbol }: UseEditorHotkeysProps): void {
  useEffect(() => {
    const editorEl = editorRef.current;
    if (!enabled || !editorEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;

      if (e.altKey && !e.shiftKey) {
        if (e.code === "Digit0") {
          e.preventDefault();
          e.stopPropagation();
          const active = getActiveHeading(editorEl);
          if (active) toggleHeading(editorEl, active);
          return;
        }
        const tag = DIGIT_TO_TAG[e.code];
        if (!tag) return;
        e.preventDefault();
        e.stopPropagation();
        toggleHeading(editorEl, tag);
        return;
      }

      if (e.shiftKey && !e.altKey && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        insertTextAtCaret(editorEl, oneBrSymbol);
      }
    };

    editorEl.addEventListener("keydown", handleKeyDown);
    return () => editorEl.removeEventListener("keydown", handleKeyDown);
  }, [editorRef, enabled, oneBrSymbol]);
}
