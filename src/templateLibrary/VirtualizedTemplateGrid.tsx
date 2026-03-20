/**
 * Virtualized Template Grid Component
 * Renders only visible template items for better performance
 * Uses react-window v2 API
 */

import { useMemo } from "react";
import type { CSSProperties, ReactElement } from "react";

import { VirtualList } from "../components/VirtualList";
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

  const adjustedStyle: CSSProperties = {
    ...style,
    height: cardHeight,
    paddingLeft: 16,
    paddingRight: 16,
    boxSizing: "border-box" as const,
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${GAP}px`,
  };

  return (
    <div style={adjustedStyle}>
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
    </div>
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
  // Використовуємо кастомний хук для відстеження розміру контейнера
  const [containerRef, dimensions] = useContainerDimensions();

  // Calculate columns based conditionally on container width
  let columns = 1;
  if (dimensions.width >= 1024) {
    columns = 3; // lg and above
  } else if (dimensions.width >= 640) {
    columns = 2; // sm and md
  }

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

  if (templates.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full h-full" style={{ paddingTop: `${GAP}px` }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <VirtualList
          listKey={`${previewConfig.containerHeight}-${columns}`}
          rowComponent={RowComponent}
          rowCount={rowCount}
          rowHeight={rowHeight}
          rowProps={rowProps}
          overscanCount={2}
          style={{ height: dimensions.height - GAP, width: dimensions.width }}
        />
      )}
    </div>
  );
}
