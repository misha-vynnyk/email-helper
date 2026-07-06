/**
 * Tab Panel Component
 * Wrapper for lazy-mounted tab content with proper visibility handling
 */

import React from "react";

import { cn } from "../../lib/utils";

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
    <div
      role='tabpanel'
      hidden={!isActive}
      aria-hidden={!isActive}
      className='absolute inset-0'
      style={{
        visibility: isActive ? "visible" : "hidden",
        pointerEvents: isActive ? "auto" : "none",
        // content-visibility: auto дозволяє браузеру пропускати рендер прихованого контенту
        contentVisibility: isActive ? "visible" : "auto",
      }}>
      <div
        data-app-scroll='true'
        className={cn("h-full w-full overflow-auto transition-opacity duration-200", isActive ? "opacity-100" : "opacity-0")}>
        {children}
      </div>
    </div>
  );
}
