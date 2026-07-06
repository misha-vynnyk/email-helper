/**
 * Virtualized Block Grid Component
 * Renders only visible block items for better performance
 * Uses react-window v2 API
 */

import type { CSSProperties, ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

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

// react-window v2 doesn't have access to MUI's theme/useMediaQuery anymore;
// replicate the same xs(<600px) / sm(600-900px) / md(>=900px) breakpoints
// via matchMedia so column counts stay identical to the previous MUI logic.
function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

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
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${GAP}px`,
  };

  return (
    <div style={adjustedStyle}>
      {rowItems.map((block) => (
        <BlockItem
          key={`${block.source || "unknown"}-${block.id}`}
          block={block}
          onDelete={onDelete}
          onUpdate={onUpdate}
          isFileBlock={fileBlockIds.has(block.id)}
        />
      ))}
    </div>
  );
}

export default function VirtualizedBlockGrid({
  blocks,
  fileBlocks,
  onDelete,
  onUpdate,
}: VirtualizedBlockGridProps) {
  const isXs = useMatchMedia("(max-width: 599.98px)");
  const isSm = useMatchMedia("(min-width: 600px) and (max-width: 899.98px)");

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
    <div
      ref={containerRef}
      className='w-full h-full'
      style={{ paddingTop: `${GAP}px` }}
    >
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
    </div>
  );
}
