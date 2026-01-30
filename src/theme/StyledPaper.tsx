import type { ReactElement } from "react";

import { Paper, type PaperProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { useThemeMode } from "./ThemeContext";
import { getComponentStyles } from "./componentStyles";

export type StyledPaperProps = PaperProps & {
  /**
   * If the current ThemeStyle doesn't provide its own card background,
   * we fallback to `alpha(theme.palette.background.paper, backgroundAlpha)`.
   */
  backgroundAlpha?: number;
};

export function StyledPaper({
  backgroundAlpha = 0.8,
  sx,
  ...props
}: StyledPaperProps): ReactElement {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  return (
    <Paper
      elevation={0}
      {...props}
      sx={{
        borderRadius: `${componentStyles.card.borderRadius}px`,
        background:
          componentStyles.card.background || alpha(theme.palette.background.paper, backgroundAlpha),
        backdropFilter: componentStyles.card.backdropFilter,
        WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
        border: componentStyles.card.border,
        boxShadow: componentStyles.card.boxShadow,
        ...sx,
      }}
    />
  );
}

