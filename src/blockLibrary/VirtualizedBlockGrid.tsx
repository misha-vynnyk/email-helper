/**
 * Virtualized Block Grid Component
 * Renders only visible block items for better performance
 * Uses react-window v2 API
 */

import { useMemo } from "react";
import type { CSSProperties, ReactElement } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";

import { VirtualList } from "../components/VirtualList";
import { useContainerDimensions } from "../hooks";
import { EmailBlock } from "../types/block";
import BlockItem from "./BlockItem";
import { GRID } from "./constants";

interface VirtualizedBlockGridProps {
  blocks: EmailBlock[];
  fileBlocks: EmailBlock[];
  onDelete: (blockId: string) => void;
  onUpdate: (block: EmailBlock) => void;
}

// Gap between rows
const GAP = 16;
// Extra height for card content (name, category, location chip) + actions + padding
const CARD_EXTRA_HEIGHT = 180;
// Calculate card height based on GRID.PREVIEW_HEIGHT
const CARD_HEIGHT = GRID.PREVIEW_HEIGHT + CARD_EXTRA_HEIGHT;
const ROW_HEIGHT = CARD_HEIGHT + GAP;

// Row props type for react-window v2
interface RowProps {
  blocks: EmailBlock[];
  columns: number;
  fileBlockIds: Set<string>;
  onDelete: (blockId: string) => void;
  onUpdate: (block: EmailBlock) => void;
}

// Row component for react-window v2
function RowComponent({
  index,
  style,
  blocks,
  columns,
  fileBlockIds,
  onDelete,
  onUpdate,
}: {
  ariaAttributes: object;
  index: number;
  style: CSSProperties;
} & RowProps): ReactElement | null {
  const startIndex = index * columns;
  const rowItems = blocks.slice(startIndex, startIndex + columns);

  // Adjust style - всі рядки мають однакову висоту
  // Gap між рядками створюється автоматично через ROW_HEIGHT > CARD_HEIGHT
  const adjustedStyle: CSSProperties = {
    ...style,
    height: CARD_HEIGHT,
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
      {rowItems.map((block) => (
        <BlockItem
          key={`${block.source || "unknown"}-${block.id}`}
          block={block}
          onDelete={onDelete}
          onUpdate={onUpdate}
          isFileBlock={fileBlockIds.has(block.id)}
        />
      ))}
    </Box>
  );
}

export default function VirtualizedBlockGrid({
  blocks,
  fileBlocks,
  onDelete,
  onUpdate,
}: VirtualizedBlockGridProps) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));
  const isSm = useMediaQuery(theme.breakpoints.only("sm"));

  // Calculate columns based on breakpoint
  const columns = isXs ? 1 : isSm ? 2 : 3;

  // Calculate rows needed
  const rowCount = Math.ceil(blocks.length / columns);

  // Create file block ID set for fast lookup
  const fileBlockIds = useMemo(
    () => new Set(fileBlocks.map((fb) => fb.id)),
    [fileBlocks]
  );

  // Row props for react-window v2
  const rowProps = useMemo<RowProps>(
    () => ({
      blocks,
      columns,
      fileBlockIds,
      onDelete,
      onUpdate,
    }),
    [blocks, columns, fileBlockIds, onDelete, onUpdate]
  );

  // Використовуємо кастомний хук для відстеження розміру контейнера
  const [containerRef, dimensions] = useContainerDimensions();

  if (blocks.length === 0) {
    return null;
  }

  return (
    <Box ref={containerRef} sx={{ width: "100%", height: "100%", pt: `${GAP}px` }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <VirtualList
          rowComponent={RowComponent}
          rowCount={rowCount}
          rowHeight={ROW_HEIGHT}
          rowProps={rowProps}
          overscanCount={2}
          style={{ height: dimensions.height - GAP, width: dimensions.width }}
        />
      )}
    </Box>
  );
}
