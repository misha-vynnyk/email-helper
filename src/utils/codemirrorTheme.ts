import { drawSelection } from "@codemirror/view";
import { EditorView } from "@codemirror/view";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { ThemeMode, ThemeStyle } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";

/**
 * Creates a custom CodeMirror theme based on MUI theme and component styles
 */
export function createCodeMirrorTheme(theme: Theme, mode: ThemeMode, style: ThemeStyle) {
  const componentStyles = getComponentStyles(mode, style);
  const isDark = mode === "dark";

  const selectionColor = alpha(theme.palette.primary.main, 0.25);

  return [
    drawSelection(),
    EditorView.theme(
    {
      "&": {
        backgroundColor: componentStyles.card.background || theme.palette.background.paper,
        color: theme.palette.text.primary,
        fontSize: "14px",
      },
      "&.cm-focused": {
        outline: "none",
      },
      ".cm-scroller": {
        fontFamily: "monospace",
        backgroundColor: componentStyles.card.background || theme.palette.background.paper,
      },
      ".cm-content": {
        color: theme.palette.text.primary,
        backgroundColor: "transparent",
        caretColor: theme.palette.text.primary,
        padding: "12px 16px",
      },
      ".cm-gutters": {
        backgroundColor: theme.palette.background.default,
        borderRight: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.secondary,
      },
      ".cm-lineNumbers": {
        color: theme.palette.text.secondary,
        minWidth: "3ch",
      },
      ".cm-lineNumbers .cm-gutterElement": {
        color: theme.palette.text.secondary,
        padding: "0 8px 0 16px",
      },
      ".cm-gutterElement": {
        color: theme.palette.text.secondary,
      },
      ".cm-lineNumber": {
        color: theme.palette.text.secondary,
      },
      ".cm-activeLineGutter": {
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
        color: theme.palette.primary.main,
        fontWeight: 600,
      },
      ".cm-activeLine": {
        backgroundColor: alpha(theme.palette.primary.main, 0.06),
      },
      // Selection highlighting - виправлені селектори
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
        backgroundColor: alpha(theme.palette.primary.main, 0.15),
        borderRadius: "2px",
      },
      ".cm-cursor": {
        borderLeftColor: theme.palette.text.primary,
        borderLeftWidth: "2px",
      },
      ".cm-dropCursor": {
        borderLeftColor: theme.palette.primary.main,
        borderLeftWidth: "2px",
      },
      ".cm-panels": {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      },
      ".cm-panels.cm-panels-top": {
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
      ".cm-panels.cm-panels-bottom": {
        borderTop: `1px solid ${theme.palette.divider}`,
      },
      ".cm-searchMatch": {
        backgroundColor: alpha(theme.palette.warning.main, 0.3),
        borderRadius: "2px",
        padding: "0 2px",
      },
      ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: alpha(theme.palette.warning.main, 0.5),
      },
      ".cm-foldPlaceholder": {
        backgroundColor: "transparent",
        border: "none",
        color: theme.palette.text.secondary,
      },
      ".cm-tooltip": {
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "8px",
        boxShadow: theme.shadows[4],
      },
      ".cm-tooltip-autocomplete": {
        "& > ul > li[aria-selected]": {
          backgroundColor: alpha(theme.palette.primary.main, 0.12),
          color: theme.palette.text.primary,
        },
      },
    },
    { dark: isDark }
    ),
  ];
}