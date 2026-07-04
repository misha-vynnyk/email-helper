/**
 * Template Category Icons
 *
 * Maps template categories to lucide-react icons for visual representation
 */

import { Briefcase as BusinessIcon, FolderTree as CategoryIcon, Mail as EmailIcon, Megaphone as CampaignIcon, Receipt as ReceiptIcon } from "lucide-react";
import React from "react";

import { TemplateCategory } from "../../types/template";

type CategoryIconMap = {
  [key in TemplateCategory | "All"]: React.ReactElement;
};

const CATEGORY_ICONS: CategoryIconMap = {
  All: <CategoryIcon size={16} />,
  Newsletter: <EmailIcon size={16} />,
  Transactional: <ReceiptIcon size={16} />,
  Marketing: <CampaignIcon size={16} />,
  Internal: <BusinessIcon size={16} />,
  Other: <CategoryIcon size={16} />,
};

export const getCategoryIcon = (category: TemplateCategory | "All"): React.ReactElement => {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
};
