/**
 * Block Item Component
 * Displays a single block card with preview and actions
 */

import React, { useEffect, useMemo, useState } from "react";

import {
  Add as AddIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  Remove as RemoveIcon,
  RestartAlt as RestartAltIcon,
  Visibility,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { EmailBlock } from "../types/block";

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

export default function BlockItem({
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
          color: "secondary" as const,
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
          const pathsToTrim = [
            "/Users/mykhailo.vynnyk/Documents/projects/email-helper/",
            "/Users/mykhailo.vynnyk/Documents/",
          ];

          for (const prefix of pathsToTrim) {
            if (prefix && dirPath.startsWith(prefix)) {
              displayPath = dirPath.substring(prefix.length);
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
            color: "primary" as const,
            tooltip: `Full path: ${dirPath}`,
          };
        }
        return {
          label: "data/blocks/files",
          color: "primary" as const,
          tooltip: "Data blocks - immediately visible",
        };
      }
      case "localStorage":
        return {
          label: "Browser Storage",
          color: "warning" as const,
          tooltip: "Stored in browser localStorage",
        };
      default:
        return { label: "Unknown", color: "default" as const, tooltip: "Unknown source location" };
    }
  };

  const locationInfo = getLocationInfo();
  const [copySuccess, setCopySuccess] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHtml, setEditedHtml] = useState(block.html);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Responsive viewport state
  const [viewportWidth, setViewportWidth] = useState<number | "responsive">("responsive");
  const [viewportOrientation, setViewportOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
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
      setCopySuccess(true);
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to copy block HTML:", error);
      setSnackbar({
        open: true,
        message: `Copy failed: ${error}. Check clipboard permissions.`,
        severity: "error",
      });
    }
  };

  const handleCloseCopySnackbar = () => {
    setCopySuccess(false);
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
          setSaveSuccess(true);
          setIsEditing(false);
          setCodeDialogOpen(false);
        }
      } else {
        // Update localStorage block
        const updatedBlock = updateCustomBlock(block.id, { html: editedHtml.trim() });

        if (updatedBlock && onUpdate) {
          onUpdate(updatedBlock);
          setSaveSuccess(true);
          setIsEditing(false);
          setCodeDialogOpen(false);
        } else {
          setSaveError("Failed to update block");
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to save block:", error);

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

      setSnackbar({
        open: true,
        message: `"${block.name}" deleted successfully`,
        severity: "success",
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to delete block:", error);

      setSnackbar({
        open: true,
        message: `Delete failed: ${error}`,
        severity: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 4,
          },
        }}
      >
        {/* Preview Area */}
        <Box
          sx={{
            position: "relative",
            height: GRID.PREVIEW_HEIGHT,
            backgroundColor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderBottom: "1px solid",
            borderColor: "divider",
            cursor: "pointer",
            "&:hover .quick-actions": { opacity: 1 },
          }}
          onClick={() => setPreviewDialogOpen(true)}
        >
          {block.preview ? (
            <img
              src={block.preview}
              alt={block.name}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "text.secondary",
                padding: 2,
              }}
              dangerouslySetInnerHTML={{ __html: wrappedPreviewHtml }}
            />
          )}

          {/* Quick Actions Overlay */}
          <Box
            className='quick-actions'
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              opacity: 0,
              transition: "opacity 0.2s ease",
              display: "flex",
              gap: 0.5,
              bgcolor: "rgba(0, 0, 0, 0.7)",
              borderRadius: 1,
              p: 0.5,
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              size='small'
              onClick={handleCopyCode}
              sx={{ color: "white" }}
              title='Quick copy'
            >
              <CopyIcon fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              onClick={() => setPreviewDialogOpen(true)}
              sx={{ color: "white" }}
              title='Full preview'
            >
              <Visibility fontSize='small' />
            </IconButton>
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1 }}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='start'
            mb={1}
          >
            <Typography
              variant='h6'
              component='h3'
              fontSize='1rem'
              fontWeight='bold'
            >
              {block.name}
            </Typography>
            {(block.isCustom || isFileBlock) && (
              <Chip
                label={isFileBlock ? "File" : "Custom"}
                size='small'
                color='primary'
                sx={{ ml: 1 }}
              />
            )}
          </Box>

          <Box
            display='flex'
            gap={0.5}
            mb={1}
            flexWrap='wrap'
          >
            <Chip
              icon={getCategoryIcon(block.category)}
              label={block.category}
              size='small'
            />
            <Tooltip
              title={locationInfo.tooltip}
              arrow
            >
              <Chip
                icon={<FolderIcon />}
                label={locationInfo.label}
                size='small'
                color={locationInfo.color}
                variant='outlined'
              />
            </Tooltip>
          </Box>

          <Typography
            variant='body2'
            color='text.secondary'
            fontSize='0.75rem'
          >
            {block.keywords.slice(0, GRID.MAX_KEYWORDS_DISPLAY).join(", ")}
            {block.keywords.length > GRID.MAX_KEYWORDS_DISPLAY && "..."}
          </Typography>
        </CardContent>

        <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
          <Box>
            <IconButton
              size='small'
              onClick={handleOpenCodeDialog}
              title='View code'
            >
              <CodeIcon fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              onClick={() => setPreviewDialogOpen(true)}
              title='Preview'
            >
              <Visibility fontSize='small' />
            </IconButton>
          </Box>
          <Box>
            <Button
              size='small'
              startIcon={<CopyIcon />}
              onClick={handleCopyCode}
            >
              Copy
            </Button>
            {onDelete && (
              <IconButton
                size='small'
                onClick={handleDeleteClick}
                color='error'
                title='Delete'
                disabled={deleteLoading}
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            )}
          </Box>
        </CardActions>
      </Card>

      {/* Code Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={() => setCodeDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
          >
            <span>HTML Code - {block.name}</span>
            {(block.isCustom || isFileBlock) && !isEditing && (
              <Button
                size='small'
                startIcon={<EditIcon />}
                onClick={handleStartEditing}
                variant='outlined'
              >
                Edit
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert
              severity='error'
              sx={{ mb: 2 }}
              onClose={() => setSaveError(null)}
            >
              {saveError}
            </Alert>
          )}
          <TextField
            multiline
            fullWidth
            rows={15}
            value={isEditing ? editedHtml : block.html}
            onChange={isEditing ? (e) => setEditedHtml(e.target.value) : undefined}
            InputProps={{
              readOnly: !isEditing,
              style: { fontFamily: "monospace", fontSize: "0.875rem" },
            }}
            placeholder={isEditing ? "Enter your email-safe HTML code here..." : undefined}
          />
        </DialogContent>
        <DialogActions>
          {isEditing ? (
            <>
              <Button onClick={handleCancelEditing}>Cancel</Button>
              <Button
                onClick={handleSaveChanges}
                variant='contained'
                disabled={!editedHtml.trim()}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCopyCode}
                startIcon={<CopyIcon />}
              >
                Copy to Clipboard
              </Button>
              <Button onClick={() => setCodeDialogOpen(false)}>Close</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setZoom(1); // Reset zoom on close
        }}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>
          <Box
            display='flex'
            flexDirection='column'
            gap={2}
          >
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
            >
              <Typography variant='h6'>{block.name} - Preview</Typography>
              <ButtonGroup
                size='small'
                variant='outlined'
              >
                <Tooltip title='Zoom out (-)'>
                  <span>
                    <Button
                      onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
                      disabled={zoom <= 0.25}
                    >
                      <RemoveIcon fontSize='small' />
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title='Reset zoom (R)'>
                  <span>
                    <Button
                      onClick={() => setZoom(1)}
                      disabled={zoom === 1}
                    >
                      <RestartAltIcon fontSize='small' />
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  disabled
                  sx={{ minWidth: 70 }}
                >
                  {Math.round(zoom * 100)}%
                </Button>
                <Tooltip title='Zoom in (+)'>
                  <span>
                    <Button
                      onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                      disabled={zoom >= 3}
                    >
                      <AddIcon fontSize='small' />
                    </Button>
                  </span>
                </Tooltip>
              </ButtonGroup>
            </Box>

            {/* Responsive Toolbar */}
            <ResponsiveToolbar
              width={viewportWidth}
              onWidthChange={setViewportWidth}
              orientation={viewportOrientation}
              onOrientationChange={setViewportOrientation}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              overflow: "auto",
              maxHeight: "70vh",
              p: 2,
              bgcolor: "#f5f5f5",
            }}
          >
            <ResizablePreview
              width={viewportWidth}
              onWidthChange={setViewportWidth}
              zoom={zoom}
            >
              <Box
                sx={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  transition: "transform 0.3s ease",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  backgroundColor: "#fff",
                  minHeight: 200,
                  p: 2,
                  boxShadow: 2,
                }}
                dangerouslySetInnerHTML={{ __html: wrappedPreviewHtml }}
              />
            </ResizablePreview>
          </Box>
        </DialogContent>
        <DialogActions>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mr: "auto" }}
          >
            💡 Tip: Use <strong>+/-</strong> keys, <strong>R</strong> to reset, or{" "}
            <strong>Ctrl+Scroll</strong> to zoom
          </Typography>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Delete Block?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{block.name}"</strong>?
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mt: 1 }}
          >
            {isFileBlock
              ? "This will permanently delete the .ts file from your project."
              : "This action cannot be undone."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color='error'
            variant='contained'
            disabled={deleteLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={handleCloseCopySnackbar}
      >
        <Alert
          onClose={handleCloseCopySnackbar}
          severity='success'
          sx={{ width: "100%" }}
        >
          Code copied to clipboard!
        </Alert>
      </Snackbar>

      {/* Save Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
      >
        <Alert
          onClose={() => setSaveSuccess(false)}
          severity='success'
          sx={{ width: "100%" }}
        >
          Block updated successfully!
        </Alert>
      </Snackbar>

      {/* Universal Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
