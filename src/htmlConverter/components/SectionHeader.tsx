import React from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { spacingMUI, opacity } from "../../theme/tokens";

export interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: spacingMUI.md, mb: spacingMUI.base }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: `${componentStyles.card.borderRadius}px`,
          bgcolor: alpha(theme.palette.primary.main, opacity.selected),
          color: "primary.main",
        }}>
        {icon}
      </Box>
      <Box>
        <Typography variant='subtitle2' fontWeight={600}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant='caption' color='text.secondary'>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
