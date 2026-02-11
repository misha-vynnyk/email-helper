import React from "react";
import { Paper, useTheme, alpha } from "@mui/material";
import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { spacingMUI } from "../../theme/tokens";

export interface StyledPaperProps {
  children: React.ReactNode;
  sx?: any;
}

export function StyledPaper({ children, sx = {} }: StyledPaperProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  return (
    <Paper
      elevation={0}
      sx={{
        p: spacingMUI.base,
        borderRadius: `${componentStyles.card.borderRadius}px`,
        backgroundColor: componentStyles.card.background || alpha(theme.palette.background.paper, 0.8),
        backdropFilter: componentStyles.card.backdropFilter,
        WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
        border: componentStyles.card.border,
        boxShadow: componentStyles.card.boxShadow,
        ...sx,
      }}>
      {children}
    </Paper>
  );
}
