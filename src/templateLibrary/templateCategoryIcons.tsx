/**
 * Template Category Icons
 *
 * Maps template categories to Material-UI icons for visual representation
 */

import React from 'react';

import {
  Business as BusinessIcon,
  Campaign as CampaignIcon,
  Category as CategoryIcon,
  Email as EmailIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';

import { TemplateCategory } from '../types/template';

type CategoryIconMap = {
  [key in TemplateCategory | 'All']: React.ReactElement;
};

const CATEGORY_ICONS: CategoryIconMap = {
  All: <CategoryIcon fontSize="small" />,
  Newsletter: <EmailIcon fontSize="small" />,
  Transactional: <ReceiptIcon fontSize="small" />,
  Marketing: <CampaignIcon fontSize="small" />,
  Internal: <BusinessIcon fontSize="small" />,
  Other: <CategoryIcon fontSize="small" />,
};

export const getCategoryIcon = (category: TemplateCategory | 'All'): React.ReactElement => {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
};
