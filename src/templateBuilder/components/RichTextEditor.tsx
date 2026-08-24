import { useEffect, useRef } from "react";

import { sanitizeRichText } from "../render/sanitizeRichText";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const buttonClass =
  "px-2 py-1 rounded-md text-xs font-semibold border border-border/60 bg-muted/40 text-foreground hover:bg-muted transition-colors select-none";

/**
 * Мінімальний rich-text редактор (contentEditable + Bold/Link/Color через execCommand),
 * не EditorSelectionToolbar з htmlConverter — той пише власний marker-синтаксис для formatter.ts,
 * тут потрібен прямий інлайн-HTML (b/font/span/a), який рендериться буквально в email-розмітку.
 */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  // Set right before we call onChange ourselves — the resulting `value` prop update is just an
  // echo of our own edit (DOMPurify's re-serialization can differ trivially from the live DOM,
  // e.g. quote/entity normalization, even with no real change), so the next effect run must skip
  // re-assigning innerHTML or the caret snaps to the start on every keystroke.
  const suppressNextSyncRef = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;
    if (suppressNextSyncRef.current) {
      suppressNextSyncRef.current = false;
      return;
    }
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    suppressNextSyncRef.current = true;
    onChange(sanitizeRichText(editorRef.current.innerHTML));
  };

  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  const applyBold = () => {
    editorRef.current?.focus();
    document.execCommand("bold");
    emitChange();
  };

  const applyLink = () => {
    const url = window.prompt("URL", "https://");
    if (!url) return;
    editorRef.current?.focus();
    document.execCommand("createLink", false, url);
    emitChange();
  };

  const applyColor = (color: string) => {
    editorRef.current?.focus();
    document.execCommand("foreColor", false, color);
    emitChange();
  };

  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-1'>
        <button type='button' onMouseDown={keepFocus} onClick={applyBold} className={buttonClass}>
          B
        </button>
        <button type='button' onMouseDown={keepFocus} onClick={applyLink} className={buttonClass}>
          Link
        </button>
        <input
          type='color'
          onMouseDown={keepFocus}
          onChange={(e) => applyColor(e.target.value)}
          className='h-6 w-8 rounded border border-border/60 bg-transparent p-0'
          title='Text color'
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={emitChange}
        onBlur={emitChange}
        className='min-h-16 rounded-md border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary'
      />
    </div>
  );
}
