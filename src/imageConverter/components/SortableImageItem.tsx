/**
 * Sortable wrapper for ImageGridItem with drag-and-drop
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Grid } from '@mui/material';

import { ImageFile } from '../types';

import ImageGridItem from './ImageGridItem';

interface SortableImageItemProps {
  file: ImageFile;
  index: number;
  onDownload: () => void;
  onRemove: () => void;
  onToggleSelection: () => void;
}

export default function SortableImageItem({
  file,
  index,
  onDownload,
  onRemove,
  onToggleSelection,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Grid
      item
      xs={6}
      sm={4}
      md={3}
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <ImageGridItem
        file={file}
        onDownload={onDownload}
        onRemove={onRemove}
        onToggleSelection={onToggleSelection}
        index={index}
        dragListeners={listeners}
      />
    </Grid>
  );
}
