/**
 * Category Icons Mapping
 * Visual icons for each block category
 */

import React from "react";

import {
  Article as ArticleIcon,
  GridOn as GridOnIcon,
  Share as ShareIcon,
  SmartButton as SmartButtonIcon,
  Star as StarIcon,
  VerticalAlignBottom as VerticalAlignBottomIcon,
  ViewAgenda as ViewAgendaIcon,
} from "@mui/icons-material";

export const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  Structure: <GridOnIcon fontSize='small' />,
  Layout: <GridOnIcon fontSize='small' />,
  Content: <ArticleIcon fontSize='small' />,
  Buttons: <SmartButtonIcon fontSize='small' />,
  Footer: <VerticalAlignBottomIcon fontSize='small' />,
  Footers: <VerticalAlignBottomIcon fontSize='small' />,
  Headers: <ViewAgendaIcon fontSize='small' />,
  Social: <ShareIcon fontSize='small' />,
  Custom: <StarIcon fontSize='small' />,
};

/**
 * Get icon for a given category
 */
export const getCategoryIcon = (category: string): React.ReactElement | undefined => {
  return CATEGORY_ICONS[category];
};
