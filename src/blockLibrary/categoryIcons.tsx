/**
 * Category Icons Mapping
 * Visual icons for each block category
 */

import { ArrowDownToLine, FileText, LayoutGrid, MousePointerClick, PanelTop, Share2, Star } from "lucide-react";
import React from "react";

export const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  Structure: <LayoutGrid size={14} />,
  Layout: <LayoutGrid size={14} />,
  Content: <FileText size={14} />,
  Buttons: <MousePointerClick size={14} />,
  Footer: <ArrowDownToLine size={14} />,
  Footers: <ArrowDownToLine size={14} />,
  Headers: <PanelTop size={14} />,
  Social: <Share2 size={14} />,
  Custom: <Star size={14} />,
};

/**
 * Get icon for a given category
 */
export const getCategoryIcon = (category: string): React.ReactElement | undefined => {
  return CATEGORY_ICONS[category];
};
