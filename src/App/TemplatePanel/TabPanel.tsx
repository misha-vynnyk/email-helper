/**
 * Tab Panel Component
 * Wrapper for lazy-mounted tab content with proper visibility handling
 */

import React from "react";
import { Box } from "@mui/material";

interface TabPanelProps {
  children: React.ReactNode;
  value: string;
  selectedValue: string;
  mounted: boolean;
}

export default function TabPanel({ children, value, selectedValue, mounted }: TabPanelProps) {
  const isActive = selectedValue === value;

  if (!mounted) {
    return null;
  }

  return (
    <Box
      role="tabpanel"
      hidden={!isActive}
      aria-hidden={!isActive}
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        visibility: isActive ? "visible" : "hidden",
        pointerEvents: isActive ? "auto" : "none",
        // content-visibility: auto дозволяє браузеру пропускати рендер прихованого контенту
        contentVisibility: isActive ? "visible" : "auto",
      }}
    >
      {children}
    </Box>
  );
}
