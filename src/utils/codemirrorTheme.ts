import { drawSelection, EditorView } from "@codemirror/view";

/**
 * Creates a custom CodeMirror theme driven by the app's Tailwind CSS variables,
 * so it automatically tracks light/dark mode via `[data-theme]` on <html>.
 */
export function createCodeMirrorTheme(isDark: boolean) {
  const selectionColor = "hsl(var(--primary) / 0.25)";

  return [
    drawSelection(),
    EditorView.theme(
      {
        "&": {
          backgroundColor: "hsl(var(--card))",
          color: "hsl(var(--foreground))",
          fontSize: "14px",
        },
        "&.cm-focused": {
          outline: "none",
        },
        ".cm-scroller": {
          fontFamily: "monospace",
          backgroundColor: "hsl(var(--card))",
        },
        ".cm-content": {
          color: "hsl(var(--foreground))",
          backgroundColor: "transparent",
          caretColor: "hsl(var(--foreground))",
          padding: "12px 16px",
        },
        ".cm-gutters": {
          backgroundColor: "hsl(var(--background))",
          borderRight: "1px solid hsl(var(--border))",
          color: "hsl(var(--muted-foreground))",
        },
        ".cm-lineNumbers": {
          color: "hsl(var(--muted-foreground))",
          minWidth: "3ch",
        },
        ".cm-lineNumbers .cm-gutterElement": {
          color: "hsl(var(--muted-foreground))",
          padding: "0 8px 0 16px",
        },
        ".cm-gutterElement": {
          color: "hsl(var(--muted-foreground))",
        },
        ".cm-lineNumber": {
          color: "hsl(var(--muted-foreground))",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "hsl(var(--primary) / 0.12)",
          color: "hsl(var(--primary))",
          fontWeight: 600,
        },
        ".cm-activeLine": {
          backgroundColor: "hsl(var(--primary) / 0.06)",
        },
        // Selection highlighting
        "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
          backgroundColor: `${selectionColor} !important`,
        },
        ".cm-selectionLayer .cm-selectionBackground": {
          backgroundColor: `${selectionColor} !important`,
        },
        ".cm-selectionBackground": {
          backgroundColor: `${selectionColor} !important`,
        },
        ".cm-content ::selection": {
          backgroundColor: `${selectionColor} !important`,
        },
        ".cm-selectionMatch": {
          backgroundColor: "hsl(var(--primary) / 0.15)",
          borderRadius: "2px",
        },
        ".cm-cursor": {
          borderLeftColor: "hsl(var(--foreground))",
          borderLeftWidth: "2px",
        },
        ".cm-dropCursor": {
          borderLeftColor: "hsl(var(--primary))",
          borderLeftWidth: "2px",
        },
        ".cm-panels": {
          backgroundColor: "hsl(var(--card))",
          color: "hsl(var(--foreground))",
        },
        ".cm-panels.cm-panels-top": {
          borderBottom: "1px solid hsl(var(--border))",
        },
        ".cm-panels.cm-panels-bottom": {
          borderTop: "1px solid hsl(var(--border))",
        },
        ".cm-searchMatch": {
          backgroundColor: "hsl(var(--warning) / 0.3)",
          borderRadius: "2px",
          padding: "0 2px",
        },
        ".cm-searchMatch.cm-searchMatch-selected": {
          backgroundColor: "hsl(var(--warning) / 0.5)",
        },
        ".cm-foldPlaceholder": {
          backgroundColor: "transparent",
          border: "none",
          color: "hsl(var(--muted-foreground))",
        },
        ".cm-tooltip": {
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
        },
        ".cm-tooltip-autocomplete": {
          "& > ul > li[aria-selected]": {
            backgroundColor: "hsl(var(--primary) / 0.12)",
            color: "hsl(var(--foreground))",
          },
        },
      },
      { dark: isDark }
    ),
  ];
}
