/**
 * Block Item Component
 * Displays a single block card with preview and actions
 */

import { Code as CodeIcon, Copy as CopyIcon, Eye, Folder as FolderIcon, Minus, Pencil as EditIcon, Plus as AddIcon, RotateCcw as RestartAltIcon, Trash2 as DeleteIcon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import Modal from "../templateLibrary/components/Modal";
import { EmailBlock } from "../types/block";
import { cn } from "../lib/utils";
import { logger } from "../utils/logger";
import { blockFileApi } from "./blockFileApi";
import { updateCustomBlock } from "./blockLoader";
import { getCategoryIcon } from "./categoryIcons";
import { GRID } from "./constants";
import { wrapInTemplate } from "./emailTemplate";
import ResizablePreview from "./ResizablePreview";
import ResponsiveToolbar from "./ResponsiveToolbar";

interface BlockItemProps {
  block: EmailBlock;
  onDelete?: (blockId: string) => void;
  onUpdate?: (updatedBlock: EmailBlock) => void;
  isFileBlock?: boolean; // NEW: Indicates if this is a file-based block
}

type LocationColor = "primary" | "secondary" | "warning" | "default";

const LOCATION_COLOR_CLASSES: Record<LocationColor, string> = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  secondary: "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-300",
  warning: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  default: "border-border bg-muted/40 text-muted-foreground",
};

function BlockItem({
  block,
  onDelete,
  onUpdate,
  isFileBlock = false,
}: BlockItemProps) {
  // ✅ useMemo: Wrap HTML only when block.html changes
  const wrappedPreviewHtml = useMemo(() => wrapInTemplate(block.html), [block.html]);

  // Get location label and color
  const getLocationInfo = () => {
    switch (block.source) {
      case "src":
        return {
          label: "src/blocks",
          color: "secondary" as LocationColor,
          tooltip: block.filePath || "Source code blocks - requires rebuild",
        };
      case "data": {
        // Extract directory from full path if available
        if (block.filePath) {
          // Get the directory path without the filename
          const dirPath = block.filePath.substring(0, block.filePath.lastIndexOf("/"));

          // Try to make path relative to common locations
          let displayPath = dirPath;

          // Remove common prefixes for cleaner display
          // Try to extract meaningful path segments instead of hardcoded paths
          const commonPrefixes = ["server/data/blocks/", "data/blocks/", "blocks/"];
          for (const prefix of commonPrefixes) {
            const prefixIndex = dirPath.indexOf(prefix);
            if (prefixIndex !== -1) {
              displayPath = dirPath.substring(prefixIndex);
              break;
            }
          }

          // If path is still very long, show last 3 segments
          const segments = displayPath.split("/");
          if (segments.length > 3) {
            displayPath = ".../" + segments.slice(-3).join("/");
          }

          return {
            label: displayPath,
            color: "primary" as LocationColor,
            tooltip: `Full path: ${dirPath}`,
          };
        }
        return {
          label: "data/blocks/files",
          color: "primary" as LocationColor,
          tooltip: "Data blocks - immediately visible",
        };
      }
      case "localStorage":
        return {
          label: "Browser Storage",
          color: "warning" as LocationColor,
          tooltip: "Stored in browser localStorage",
        };
      default:
        return { label: "Unknown", color: "default" as LocationColor, tooltip: "Unknown source location" };
    }
  };

  const locationInfo = getLocationInfo();
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHtml, setEditedHtml] = useState(block.html);

  // Responsive viewport state
  const [viewportWidth, setViewportWidth] = useState<number | "responsive">("responsive");
  const [viewportOrientation, setViewportOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    if (!previewDialogOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom in with +/= key
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => Math.min(3, z + 0.1));
      }
      // Zoom out with - key
      else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoom((z) => Math.max(0.25, z - 0.1));
      }
      // Reset zoom with R or 0 key
      else if (e.key === "r" || e.key === "R" || e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Zoom with Ctrl/Cmd + mouse wheel
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          // Scroll up = zoom in
          setZoom((z) => Math.min(3, z + 0.1));
        } else {
          // Scroll down = zoom out
          setZoom((z) => Math.max(0.25, z - 0.1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [previewDialogOpen]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(block.html);
      toast.success("Code copied to clipboard!");
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      logger.error("BlockItem", "Failed to copy block HTML", err);
      toast.error(`Copy failed: ${error}. Check clipboard permissions.`);
    }
  };

  const handleOpenCodeDialog = () => {
    setEditedHtml(block.html);
    setIsEditing(false);
    setCodeDialogOpen(true);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setEditedHtml(block.html);
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!editedHtml.trim()) {
      setSaveError("HTML code cannot be empty");
      return;
    }

    try {
      if (isFileBlock) {
        // Update file via API
        const updatedFileBlock = await blockFileApi.updateBlock(block.id, {
          html: editedHtml.trim(),
        });

        if (updatedFileBlock && onUpdate) {
          const updatedBlock: EmailBlock = {
            ...block,
            html: updatedFileBlock.html,
          };
          onUpdate(updatedBlock);
          toast.success("Block updated successfully!");
          setIsEditing(false);
          setCodeDialogOpen(false);
        }
      } else {
        // Update localStorage block
        const updatedBlock = updateCustomBlock(block.id, { html: editedHtml.trim() });

        if (updatedBlock && onUpdate) {
          onUpdate(updatedBlock);
          toast.success("Block updated successfully!");
          setIsEditing(false);
          setCodeDialogOpen(false);
        } else {
          setSaveError("Failed to update block");
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      logger.error("BlockItem", "Failed to save block", err);

      if (error.includes("network") || error.includes("fetch")) {
        setSaveError("Network error. Check your connection.");
      } else if (isFileBlock) {
        setSaveError(`File update failed: ${error}`);
      } else {
        setSaveError(`Save failed: ${error}`);
      }
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteDialogOpen(false);

      // Just call parent's onDelete handler
      // Parent (BlockLibrary) handles the actual API call and state updates
      onDelete(block.id);

      toast.success(`"${block.name}" deleted successfully`);
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      logger.error("BlockItem", "Failed to delete block", err);

      toast.error(`Delete failed: ${error}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className='h-full flex flex-col bg-card rounded-2xl border border-border/50 shadow-soft hover:shadow-lg hover:border-border transition-all duration-300 group overflow-hidden'>
        {/* Preview Area */}
        <div
          className='relative flex items-center justify-center overflow-hidden border-b border-border/50 cursor-pointer bg-muted/30'
          style={{ height: GRID.PREVIEW_HEIGHT }}
          onClick={() => setPreviewDialogOpen(true)}
        >
          {block.preview ? (
            <img
              src={block.preview}
              alt={block.name}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <div
              className='w-full h-full flex items-center justify-center text-xs text-muted-foreground p-4'
              dangerouslySetInnerHTML={{ __html: wrappedPreviewHtml }}
            />
          )}

          {/* Quick Actions Overlay */}
          <div
            className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 bg-black/70 rounded-lg p-1 backdrop-blur-sm'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCopyCode}
              className='p-1.5 text-white hover:bg-white/20 rounded-md transition-colors'
              title='Quick copy'
            >
              <CopyIcon size={14} />
            </button>
            <button
              onClick={() => setPreviewDialogOpen(true)}
              className='p-1.5 text-white hover:bg-white/20 rounded-md transition-colors'
              title='Full preview'
            >
              <Eye size={14} />
            </button>
          </div>
        </div>

        <div className='flex-grow p-4'>
          <div className='flex justify-between items-start mb-2 gap-2'>
            <h3 className='text-base font-bold text-foreground leading-tight'>{block.name}</h3>
            {(block.isCustom || isFileBlock) && (
              <span className='shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary'>
                {isFileBlock ? "File" : "Custom"}
              </span>
            )}
          </div>

          <div className='flex flex-wrap items-center gap-1.5 mb-2'>
            <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground border border-border/50'>
              {getCategoryIcon(block.category)}
              {block.category}
            </span>
            <span
              title={locationInfo.tooltip}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                LOCATION_COLOR_CLASSES[locationInfo.color]
              )}
            >
              <FolderIcon size={12} />
              {locationInfo.label}
            </span>
          </div>

          <p className='text-xs text-muted-foreground'>
            {block.keywords.slice(0, GRID.MAX_KEYWORDS_DISPLAY).join(", ")}
            {block.keywords.length > GRID.MAX_KEYWORDS_DISPLAY && "..."}
          </p>
        </div>

        <div className='flex items-center justify-between px-4 pb-4'>
          <div className='flex items-center gap-1'>
            <button
              onClick={handleOpenCodeDialog}
              title='View code'
              className='p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors'
            >
              <CodeIcon size={16} />
            </button>
            <button
              onClick={() => setPreviewDialogOpen(true)}
              title='Preview'
              className='p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors'
            >
              <Eye size={16} />
            </button>
          </div>
          <div className='flex items-center gap-1'>
            <button
              onClick={handleCopyCode}
              className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors'
            >
              <CopyIcon size={14} /> Copy
            </button>
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                disabled={deleteLoading}
                title='Delete'
                className='p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50'
              >
                <DeleteIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Code Dialog */}
      <Modal
        open={codeDialogOpen}
        onClose={() => setCodeDialogOpen(false)}
        maxWidthClass='max-w-2xl'
        title={`HTML Code - ${block.name}`}
        headerExtra={
          (block.isCustom || isFileBlock) && !isEditing ? (
            <button
              onClick={handleStartEditing}
              className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-muted transition-colors'
            >
              <EditIcon size={14} /> Edit
            </button>
          ) : undefined
        }
        actionsRow={
          isEditing ? (
            <>
              <button
                onClick={handleCancelEditing}
                className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={!editedHtml.trim()}
                className='px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm disabled:opacity-50'
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCopyCode}
                className='px-5 py-2.5 flex items-center gap-2 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'
              >
                <CopyIcon size={16} /> Copy to Clipboard
              </button>
              <button
                onClick={() => setCodeDialogOpen(false)}
                className='px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm'
              >
                Close
              </button>
            </>
          )
        }
      >
        {saveError && (
          <div className='mb-4 rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-200 px-3.5 py-2.5 text-xs leading-relaxed'>
            {saveError}
          </div>
        )}
        <textarea
          rows={15}
          readOnly={!isEditing}
          value={isEditing ? editedHtml : block.html}
          onChange={isEditing ? (e) => setEditedHtml(e.target.value) : undefined}
          placeholder={isEditing ? "Enter your email-safe HTML code here..." : undefined}
          className={cn(
            "w-full font-mono text-sm rounded-xl border border-input p-3 text-foreground outline-none resize-y",
            isEditing
              ? "bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              : "bg-muted/30 cursor-default"
          )}
        />
      </Modal>

      {/* Preview Dialog */}
      <Modal
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setZoom(1); // Reset zoom on close
        }}
        maxWidthClass='max-w-5xl'
        title={`${block.name} - Preview`}
        actionsRow={
          <div className='flex items-center justify-between w-full gap-3'>
            <p className='text-xs text-muted-foreground'>
              💡 Tip: Use <strong className='text-foreground'>+/-</strong> keys,{" "}
              <strong className='text-foreground'>R</strong> to reset, or{" "}
              <strong className='text-foreground'>Ctrl+Scroll</strong> to zoom
            </p>
            <button
              onClick={() => setPreviewDialogOpen(false)}
              className='px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm shrink-0'
            >
              Close
            </button>
          </div>
        }
      >
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between flex-wrap gap-3'>
            <div className='flex items-center rounded-lg border border-border overflow-hidden'>
              <button
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
                disabled={zoom <= 0.25}
                title='Zoom out (-)'
                className='p-2 text-foreground hover:bg-muted transition-colors disabled:opacity-40'
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => setZoom(1)}
                disabled={zoom === 1}
                title='Reset zoom (R)'
                className='p-2 text-foreground hover:bg-muted transition-colors disabled:opacity-40 border-x border-border'
              >
                <RestartAltIcon size={14} />
              </button>
              <span className='px-3 text-xs font-semibold min-w-[56px] text-center'>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                disabled={zoom >= 3}
                title='Zoom in (+)'
                className='p-2 text-foreground hover:bg-muted transition-colors disabled:opacity-40 border-l border-border'
              >
                <AddIcon size={14} />
              </button>
            </div>

            {/* Responsive Toolbar */}
            <ResponsiveToolbar
              width={viewportWidth}
              onWidthChange={setViewportWidth}
              orientation={viewportOrientation}
              onOrientationChange={setViewportOrientation}
            />
          </div>

          <div
            className='overflow-auto rounded-xl p-4'
            style={{ maxHeight: "70vh", backgroundColor: "#f5f5f5" }}
          >
            <ResizablePreview
              width={viewportWidth}
              onWidthChange={setViewportWidth}
              zoom={zoom}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  transition: "transform 0.3s ease",
                  backgroundColor: "#fff",
                  minHeight: 200,
                }}
                className='border border-border rounded-lg p-4 shadow-md'
                dangerouslySetInnerHTML={{ __html: wrappedPreviewHtml }}
              />
            </ResizablePreview>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidthClass='max-w-xs'
        title='Delete Block?'
        actionsRow={
          <>
            <button
              onClick={() => setDeleteDialogOpen(false)}
              className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className='px-5 py-2.5 text-sm font-bold bg-destructive hover:brightness-110 text-destructive-foreground rounded-xl transition-all shadow-sm disabled:opacity-50'
            >
              Delete
            </button>
          </>
        }
      >
        <p className='text-foreground'>
          Are you sure you want to delete <strong>&quot;{block.name}&quot;</strong>?
        </p>
        <p className='text-sm text-muted-foreground mt-1'>
          {isFileBlock
            ? "This will permanently delete the .ts file from your project."
            : "This action cannot be undone."}
        </p>
      </Modal>
    </>
  );
}

// Мемоізуємо компонент для запобігання зайвих ре-рендерів
export default React.memo(BlockItem, (prevProps, nextProps) => {
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.name === nextProps.block.name &&
    prevProps.block.html === nextProps.block.html &&
    prevProps.isFileBlock === nextProps.isFileBlock
  );
});
