import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import type { ConverterMode } from "../hooks/useHtmlConverterLogic";
import type { HeadingTag } from "../markers";
import { buildMarkers } from "../markers";
import { getActiveHeading, insertTextAtCaret, toggleHeading, wrapSelectionWithMarkers } from "../utils/editorCommands";

const SELECTION_DEBOUNCE_MS = 120;
const GAP_PX = 8;

interface EditorSelectionToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  converterMode: ConverterMode;
  oneBrSymbol: string;
  enabled: boolean;
}

/**
 * Плаваючий тулбар маркерів над виділеним текстом редактора.
 * Ручне позиціонування (fixed div у порталі) замість Radix Popover — його
 * focus/dismiss-менеджмент скидає виділення в contenteditable.
 */
export function EditorSelectionToolbar({ editorRef, converterMode, oneBrSymbol, enabled }: EditorSelectionToolbarProps) {
  const { t } = useTranslation();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [activeHeading, setActiveHeading] = useState<HeadingTag | null>(null);

  const hide = useCallback(() => {
    setAnchorRect(null);
    setPosition(null);
  }, []);

  const syncFromSelection = useCallback(() => {
    const editorEl = editorRef.current;
    const sel = window.getSelection();
    if (!editorEl || !sel || sel.rangeCount === 0 || sel.isCollapsed || !sel.anchorNode || !sel.focusNode || !editorEl.contains(sel.anchorNode) || !editorEl.contains(sel.focusNode)) {
      hide();
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hide();
      return;
    }
    setActiveHeading(getActiveHeading(editorEl));
    setAnchorRect(rect);
  }, [editorRef, hide]);

  useEffect(() => {
    if (!enabled) {
      hide();
      return;
    }

    let timer: number | null = null;
    const scheduleSync = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(syncFromSelection, SELECTION_DEBOUNCE_MS);
    };
    const hideNow = (e: Event) => {
      // Скрол усередині самого тулбара не ховає його
      if (toolbarRef.current && e.target instanceof Node && toolbarRef.current.contains(e.target)) return;
      hide();
    };

    document.addEventListener("selectionchange", scheduleSync);
    window.addEventListener("scroll", hideNow, true);
    window.addEventListener("resize", hideNow);
    return () => {
      document.removeEventListener("selectionchange", scheduleSync);
      window.removeEventListener("scroll", hideNow, true);
      window.removeEventListener("resize", hideNow);
      if (timer) window.clearTimeout(timer);
    };
  }, [enabled, syncFromSelection, hide]);

  // Двофазне позиціонування: рендер невидимим → замір → фінальна позиція
  // (над виділенням, фліп донизу біля верху екрана, клемп по горизонталі).
  useLayoutEffect(() => {
    if (!anchorRect || !toolbarRef.current) return;
    const { offsetWidth, offsetHeight } = toolbarRef.current;
    let top = anchorRect.top - offsetHeight - GAP_PX;
    if (top < GAP_PX) top = anchorRect.bottom + GAP_PX;
    const left = Math.max(GAP_PX, Math.min(anchorRect.left + anchorRect.width / 2 - offsetWidth / 2, window.innerWidth - offsetWidth - GAP_PX));
    setPosition({ left, top });
  }, [anchorRect]);

  if (!enabled || !anchorRect) return null;

  const editorEl = editorRef.current;
  if (!editorEl) return null;

  const markers = buildMarkers(oneBrSymbol);
  const isAdvanced = converterMode === "advanced";
  // Виділення не повинно скидатись кліком по кнопці
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();

  const buttonBase = "px-2 py-1 rounded-md text-xs font-mono font-semibold transition-colors select-none disabled:opacity-40 disabled:cursor-not-allowed";
  const buttonIdle = "text-foreground hover:bg-muted";
  const buttonActive = "bg-primary text-primary-foreground";

  return createPortal(
    <div ref={toolbarRef} role='toolbar' aria-label={t("Marker toolbar", "Панель маркерів")} style={{ position: "fixed", left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? "visible" : "hidden" }} className='z-50 flex items-center gap-0.5 bg-card border border-border/50 rounded-xl shadow-soft p-1'>
      {markers.map((marker) => {
        if (marker.kind === "heading") {
          const active = activeHeading === marker.tag;
          return (
            <button key={marker.tag} onMouseDown={keepSelection} onClick={() => toggleHeading(editorEl, marker.tag)} title={t(marker.labelEn, marker.labelUk)} className={`${buttonBase} ${active ? buttonActive : buttonIdle}`}>
              {marker.tag.toUpperCase()}
            </button>
          );
        }
        if (marker.kind === "insert") {
          return (
            <button key='insert-br' onMouseDown={keepSelection} onClick={() => insertTextAtCaret(editorEl, marker.text)} title={t(marker.labelEn, marker.labelUk)} className={`${buttonBase} ${buttonIdle}`}>
              {marker.text}
            </button>
          );
        }
        // title не спрацьовує на disabled-кнопці в частині рушіїв — тримаємо його на span-обгортці
        return (
          <span key={marker.open} title={isAdvanced ? t("Not supported in advanced mode", "Не підтримується в advanced-режимі") : t(marker.labelEn, marker.labelUk)}>
            <button onMouseDown={keepSelection} onClick={() => wrapSelectionWithMarkers(editorEl, marker.open, marker.close)} disabled={isAdvanced} className={`${buttonBase} ${buttonIdle} text-muted-foreground`}>
              {marker.short}
            </button>
          </span>
        );
      })}
    </div>,
    document.body
  );
}
