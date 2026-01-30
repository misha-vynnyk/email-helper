/**
 * Virtualized Template Grid Component
 * Renders only visible template items for better performance
 * Uses react-window v2 API
 */

import React, { useMemo, CSSProperties, ReactElement } from "react";
import { List } from "react-window";
import { Box, useMediaQuery, useTheme } from "@mui/material";

import { useContainerDimensions } from "../hooks";
import { EmailTemplate } from "../types/template";
import { PreviewConfig } from "./PreviewSettings";
import TemplateItem from "./TemplateItem";

interface VirtualizedTemplateGridProps {
  templates: EmailTemplate[];
  previewConfig: PreviewConfig;
  openTemplateId: string | null;
  onDelete: (templateId: string) => void;
  onUpdate: (template: EmailTemplate) => void;
  onOpen: (templateId: string) => void;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next", savedScrollPos?: number) => void;
  savedScrollPosition: number;
}

// Gap between rows
const GAP = 16;
// Extra height for card content (name, tags, description) + actions + padding
const CARD_EXTRA_HEIGHT = 150;

// Row props type for react-window v2
interface RowProps {
  templates: EmailTemplate[];
  columns: number;
  previewConfig: PreviewConfig;
  openTemplateId: string | null;
  onDelete: (templateId: string) => void;
  onUpdate: (template: EmailTemplate) => void;
  onOpen: (templateId: string) => void;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next", savedScrollPos?: number) => void;
  savedScrollPosition: number;
}

// Row component for react-window v2
function RowComponent({
  index,
  style,
  templates,
  columns,
  previewConfig,
  openTemplateId,
  onDelete,
  onUpdate,
  onOpen,
  onClose,
  onNavigate,
  savedScrollPosition,
}: {
  ariaAttributes: object;
  index: number;
  style: CSSProperties;
} & RowProps): ReactElement | null {
  const startIndex = index * columns;
  const rowItems = templates.slice(startIndex, startIndex + columns);

  // Calculate card height based on preview config
  const cardHeight = previewConfig.containerHeight + CARD_EXTRA_HEIGHT;

  // Adjust style - всі рядки мають однакову висоту
  // Gap між рядками створюється автоматично через rowHeight > cardHeight
  const adjustedStyle: CSSProperties = {
    ...style,
    height: cardHeight,
    paddingLeft: 16,
    paddingRight: 16,
    boxSizing: "border-box" as const,
  };

  return (
    <Box
      style={adjustedStyle}
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${GAP}px`,
      }}
    >
      {rowItems.map((template, colIndex) => {
        const globalIndex = startIndex + colIndex;
        return (
          <TemplateItem
            key={template.id}
            template={template}
            previewConfig={previewConfig}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onLoadTemplate={() => {}}
            isOpen={openTemplateId === template.id}
            onOpen={() => onOpen(template.id)}
            onClose={onClose}
            allTemplates={templates}
            currentIndex={globalIndex}
            onNavigate={onNavigate}
            savedScrollPosition={savedScrollPosition}
          />
        );
      })}
    </Box>
  );
}

export default function VirtualizedTemplateGrid({
  templates,
  previewConfig,
  openTemplateId,
  onDelete,
  onUpdate,
  onOpen,
  onClose,
  onNavigate,
  savedScrollPosition,
}: VirtualizedTemplateGridProps) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));
  const isSm = useMediaQuery(theme.breakpoints.only("sm"));

  // Calculate columns based on breakpoint
  const columns = isXs ? 1 : isSm ? 2 : 3;

  // Calculate rows needed
  const rowCount = Math.ceil(templates.length / columns);

  // Calculate row height based on preview config
  const cardHeight = previewConfig.containerHeight + CARD_EXTRA_HEIGHT;
  const rowHeight = cardHeight + GAP;

  // Row props for react-window v2
  const rowProps = useMemo<RowProps>(
    () => ({
      templates,
      columns,
      previewConfig,
      openTemplateId,
      onDelete,
      onUpdate,
      onOpen,
      onClose,
      onNavigate,
      savedScrollPosition,
    }),
    [templates, columns, previewConfig, openTemplateId, onDelete, onUpdate, onOpen, onClose, onNavigate, savedScrollPosition]
  );

  // Використовуємо кастомний хук для відстеження розміру контейнера
  const [containerRef, dimensions] = useContainerDimensions();

  if (templates.length === 0) {
    return null;
  }

  return (
    <Box ref={containerRef} sx={{ width: "100%", height: "100%", pt: `${GAP}px` }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <List
          key={`${previewConfig.containerHeight}-${columns}`}
          rowComponent={RowComponent}
          rowCount={rowCount}
          rowHeight={rowHeight}
          rowProps={rowProps}
          overscanCount={2}
          style={{ height: dimensions.height - GAP, width: dimensions.width }}
        />
      )}
    </Box>
  );
}
