import type { ReactElement } from "react";

import { Card, type CardProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { useThemeMode } from "./ThemeContext";
import { getComponentStyles } from "./componentStyles";

export type StyledCardProps = CardProps & {
  /**
   * If the current ThemeStyle doesn't provide its own card background,
   * we fallback to `alpha(theme.palette.background.paper, backgroundAlpha)`.
   */
  backgroundAlpha?: number;
  /**
   * Apply ThemeStyle hover transform/shadow, if provided.
   */
  enableHover?: boolean;
};

export function StyledCard({
  backgroundAlpha = 0.8,
  enableHover = false,
  sx,
  ...props
}: StyledCardProps): ReactElement {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  return (
    <Card
      {...props}
      raised={false}
      sx={{
        borderRadius: `${componentStyles.card.borderRadius}px`,
        background:
          componentStyles.card.background || alpha(theme.palette.background.paper, backgroundAlpha),
        backdropFilter: componentStyles.card.backdropFilter,
        WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
        border: componentStyles.card.border,
        boxShadow: componentStyles.card.boxShadow,
        transition:
          enableHover && componentStyles.card.hover
            ? theme.transitions.create(["transform", "box-shadow", "border"], {
                duration: theme.transitions.duration.short,
              })
            : undefined,
        ...(enableHover && componentStyles.card.hover
          ? {
              "&:hover": {
                transform: componentStyles.card.hover.transform,
                boxShadow: componentStyles.card.hover.boxShadow,
                border: componentStyles.card.hover.border || componentStyles.card.border,
              },
            }
          : {}),
        ...sx,
      }}
    />
  );
}

