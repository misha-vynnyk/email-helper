/**
 * FileListItem — a single file row in the StorageUploadDialog.
 * Shows: drag handle, thumbnail, index, name input, ALT tags, and AI suggestions.
 *
 * This is a "dumb" presentational component — all state lives in the parent.
 */

import React from "react";
import { Box, Button, Chip, LinearProgress, Stack, TextField, Typography, useTheme, alpha, Tooltip, IconButton } from "@mui/material";
import { DragIndicator as DragIcon, Close as CloseIcon } from "@mui/icons-material";

import { spacingMUI, borderRadius } from "../../theme/tokens";
import { normalizeCustomNameInput } from "../utils/imageAnalysis";
import type { ImageAiAnalysis } from "../utils/ocrUiTypes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileItem {
  id: string;
  name: string;
  path?: string;
}

export interface FileListItemProps {
  /** The file to render */
  file: FileItem;
  /** Position in the list (0-based) */
  index: number;
  /** Is the parent currently uploading? */
  uploading: boolean;
  /** Index of the file being dragged (null if none) */
  draggedIndex: number | null;
  /** Custom file name entered by user */
  customName: string;
  /** Pipe-separated ALT text string (e.g. "Banner | Sale -50%") */
  customAltString: string;
  /** AI analysis state for this file (or undefined if not analyzed) */
  aiState?: ImageAiAnalysis;
  /** Whether AI analysis is enabled */
  analysisEnabled: boolean;
  /** Label for the analyze button (e.g. "Analyze (OCR)") */
  analysisLabel: string;
  /** Which tag is being edited right now (if any) */
  editingTag: { fileId: string; tagIdx: number } | null;
  /** Whether the AI backend is used (for text labels) */
  useAiBackend?: boolean;

  // --- Callbacks ---
  onNameChange: (fileId: string, value: string) => void;
  onAltChange: (fileId: string, newAltString: string) => void;
  onEditingTagChange: (tag: { fileId: string; tagIdx: number } | null) => void;
  onAnalyze: (file: FileItem, opts?: { force?: boolean }) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onRemove: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse pipe-separated ALT string into array of tags */
function getAltTags(altString: string): string[] {
  return (altString || "").split(" | ").filter(Boolean);
}

/** Update a single tag at index, or remove it if newValue is empty */
function updateTag(altString: string, idx: number, newValue: string): string {
  const tags = getAltTags(altString);
  if (newValue) {
    tags[idx] = newValue;
  } else {
    tags.splice(idx, 1);
  }
  return tags.join(" | ");
}

/** Remove a tag at index */
function removeTag(altString: string, idx: number): string {
  const tags = getAltTags(altString);
  tags.splice(idx, 1);
  return tags.join(" | ");
}

/** Toggle a suggestion: add if not present, remove if present */
function toggleSuggestion(altString: string, suggestion: string): string {
  const tags = getAltTags(altString);
  if (tags.includes(suggestion)) {
    return tags.filter((t) => t !== suggestion).join(" | ");
  }
  return [...tags, suggestion].join(" | ");
}

/** Add a new tag if not already present */
function addTag(altString: string, newTag: string): string {
  const tags = getAltTags(altString);
  if (tags.includes(newTag)) return altString;
  return [...tags, newTag].join(" | ");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FileListItem({ file, index, uploading, draggedIndex, customName, customAltString, aiState, analysisEnabled, analysisLabel, editingTag, useAiBackend, onNameChange, onAltChange, onEditingTagChange, onAnalyze, onDragStart, onDragOver, onDragEnd, onRemove }: FileListItemProps) {
  const theme = useTheme();
  const isDragged = draggedIndex === index;
  const altTags = getAltTags(customAltString);

  return (
    <Box
      draggable={!uploading}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: spacingMUI.sm,
        p: spacingMUI.sm,
        borderRadius: `${borderRadius.sm}px`,
        backgroundColor: isDragged ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.background.paper, 0.5),
        border: `1px solid ${isDragged ? theme.palette.primary.main : theme.palette.divider}`,
        cursor: uploading ? "default" : "grab",
        transition: "all 0.2s ease",
        "&:active": { cursor: uploading ? "default" : "grabbing" },
        "&:hover": uploading
          ? {}
          : {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              borderColor: theme.palette.primary.light,
            },
      }}>
      {/* Top row: drag handle + thumbnail + index + name/alt inputs + remove button */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: spacingMUI.sm }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: spacingMUI.sm, pt: 1 }}>
          {/* Drag Handle */}
          <DragIcon
            sx={{
              color: theme.palette.text.disabled,
              cursor: uploading ? "default" : "grab",
              "&:active": { cursor: uploading ? "default" : "grabbing" },
            }}
          />

          {/* Thumbnail */}
          {file.path && (
            <Tooltip
              title={
                <Box sx={{ p: 0.5 }}>
                  <img
                    src={file.path}
                    alt={file.name}
                    style={{
                      maxWidth: 350,
                      maxHeight: 350,
                      display: "block",
                      objectFit: "contain",
                      borderRadius: 4,
                    }}
                  />
                </Box>
              }
              placement='left'
              enterDelay={800}
              enterNextDelay={800}
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: "background.paper",
                    boxShadow: theme.shadows[6],
                    border: `1px solid ${theme.palette.divider}`,
                    p: 0,
                    maxWidth: "none",
                  },
                },
                arrow: {
                  sx: {
                    color: "background.paper",
                    "&::before": {
                      border: `1px solid ${theme.palette.divider}`,
                    },
                  },
                },
              }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: `${borderRadius.sm}px`,
                  overflow: "hidden",
                  flexShrink: 0,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  cursor: "zoom-in",
                }}>
                <img src={file.path} alt={file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>
            </Tooltip>
          )}

          {/* Index Chip */}
          <Chip
            label={`#${index + 1}`}
            size='small'
            sx={{
              minWidth: 36,
              fontWeight: 700,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}
          />

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: spacingMUI.xs }}>
            {/* Name Input */}
            <TextField
              size='small'
              fullWidth
              placeholder={file.name.replace(/\.[^/.]+$/, "")}
              value={customName}
              onChange={(e) => onNameChange(file.id, normalizeCustomNameInput(e.target.value))}
              disabled={uploading}
              helperText={customName ? `${customName}.jpg` : file.name}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${borderRadius.sm}px`,
                  "&.Mui-focused": { backgroundColor: "transparent" },
                },
                "& .MuiFormHelperText-root": {
                  fontFamily: "monospace",
                  fontSize: "0.7rem",
                },
              }}
            />

            {/* ALT Input with Tags */}
            <AltTagInput fileId={file.id} altTags={altTags} customAltString={customAltString} uploading={uploading} editingTag={editingTag} onAltChange={onAltChange} onEditingTagChange={onEditingTagChange} />
          </Box>

          {/* Remove Button */}
          <Box sx={{ pt: 0.5 }}>
            <Tooltip title='Remove file from upload list' arrow>
              <IconButton
                size='small'
                onClick={onRemove}
                disabled={uploading}
                sx={{
                  color: theme.palette.text.secondary,
                  "&:hover": { color: theme.palette.error.main, backgroundColor: alpha(theme.palette.error.main, 0.1) },
                }}>
                <CloseIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* AI suggestions section */}
      {analysisEnabled && <AiSuggestionsSection file={file} uploading={uploading} aiState={aiState} analysisLabel={analysisLabel} customAltString={customAltString} customName={customName} useAiBackend={useAiBackend} onAnalyze={onAnalyze} onAltChange={onAltChange} onNameChange={onNameChange} />}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// ALT Tag Input — the box with chips + inline text input
// ---------------------------------------------------------------------------

interface AltTagInputProps {
  fileId: string;
  altTags: string[];
  customAltString: string;
  uploading: boolean;
  editingTag: { fileId: string; tagIdx: number } | null;
  onAltChange: (fileId: string, newAltString: string) => void;
  onEditingTagChange: (tag: { fileId: string; tagIdx: number } | null) => void;
}

function AltTagInput({ fileId, altTags, customAltString, uploading, editingTag, onAltChange, onEditingTagChange }: AltTagInputProps) {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: "block" }}>
        ALT text
      </Typography>
      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${borderRadius.sm}px`,
          p: spacingMUI.xs,
          minHeight: 40,
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          alignItems: "center",
          backgroundColor: alpha(theme.palette.background.paper, 0.5),
          "&:focus-within": { borderColor: theme.palette.primary.main },
        }}>
        {/* Existing tags as editable/removable chips */}
        {altTags.map((tag, idx) => {
          const isEditing = editingTag?.fileId === fileId && editingTag?.tagIdx === idx;

          if (isEditing) {
            return (
              <TextField
                key={`edit-${idx}`}
                size='small'
                variant='standard'
                defaultValue={tag}
                autoFocus
                onBlur={(e) => {
                  onAltChange(fileId, updateTag(customAltString, idx, e.target.value.trim()));
                  onEditingTagChange(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  else if (e.key === "Escape") onEditingTagChange(null);
                }}
                sx={{
                  width: "auto",
                  minWidth: 60,
                  "& .MuiInputBase-input": { fontSize: "0.8125rem", padding: "2px 4px" },
                }}
                InputProps={{ disableUnderline: true }}
              />
            );
          }

          return (
            <Chip
              key={`${tag}-${idx}`}
              size='small'
              label={tag}
              onDoubleClick={() => onEditingTagChange({ fileId, tagIdx: idx })}
              onDelete={() => onAltChange(fileId, removeTag(customAltString, idx))}
              sx={{
                cursor: "pointer",
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                "& .MuiChip-deleteIcon": {
                  color: theme.palette.text.secondary,
                  "&:hover": { color: theme.palette.error.main },
                },
                "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
              }}
            />
          );
        })}

        {/* Inline input for adding new tags */}
        <TextField
          size='small'
          variant='standard'
          placeholder={customAltString ? "Add more..." : "Type or click suggestions below..."}
          disabled={uploading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
              e.preventDefault();
              const newTag = (e.target as HTMLInputElement).value.trim();
              onAltChange(fileId, addTag(customAltString, newTag));
              (e.target as HTMLInputElement).value = "";
            }
          }}
          sx={{
            flex: 1,
            minWidth: 120,
            "& .MuiInput-underline:before": { borderBottom: "none" },
            "& .MuiInput-underline:after": { borderBottom: "none" },
            "& .MuiInput-underline:hover:before": { borderBottom: "none" },
          }}
          InputProps={{ disableUnderline: true, sx: { fontSize: "0.875rem" } }}
        />
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// AI Suggestions Section — analyze button + results chips
// ---------------------------------------------------------------------------

interface AiSuggestionsSectionProps {
  file: FileItem;
  uploading: boolean;
  aiState?: ImageAiAnalysis;
  analysisLabel: string;
  customAltString: string;
  customName: string;
  useAiBackend?: boolean;
  onAnalyze: (file: FileItem, opts?: { force?: boolean }) => void;
  onAltChange: (fileId: string, newAltString: string) => void;
  onNameChange: (fileId: string, value: string) => void;
}

function AiSuggestionsSection({ file, uploading, aiState, analysisLabel, customAltString, customName, useAiBackend, onAnalyze, onAltChange, onNameChange }: AiSuggestionsSectionProps) {
  const theme = useTheme();
  const forceLabel = useAiBackend ? "Force Analyze" : "Force OCR";
  const altTags = getAltTags(customAltString);

  return (
    <Box sx={{ pl: 0, pt: spacingMUI.xs }}>
      {/* Analyze button row */}
      <Stack direction='row' spacing={spacingMUI.xs} alignItems='center' flexWrap='wrap'>
        <Button size='small' variant='outlined' onClick={() => onAnalyze(file)} disabled={uploading || aiState?.status === "running"} sx={{ textTransform: "none" }}>
          {aiState?.status === "running" ? "Analyzing…" : analysisLabel}
        </Button>

        {aiState?.skippedReason === "lowTextLikelihood" && (
          <Button size='small' variant='text' onClick={() => onAnalyze(file, { force: true })} disabled={uploading || aiState?.status === "running"} sx={{ textTransform: "none" }}>
            {forceLabel}
          </Button>
        )}

        {typeof aiState?.textLikelihood === "number" && <Chip size='small' variant='outlined' label={`TL ${Number(aiState?.textLikelihood).toFixed(3)}`} />}
        {aiState?.cacheHit && <Chip size='small' variant='outlined' label='cache' />}

        {aiState?.status === "error" && (
          <Typography variant='caption' color='error'>
            {aiState?.error}
          </Typography>
        )}
      </Stack>

      {/* Progress bar */}
      {aiState?.status === "running" && (
        <Box sx={{ mt: spacingMUI.xs }}>
          <LinearProgress variant={typeof aiState?.progress === "number" ? "determinate" : "indeterminate"} value={Math.round((aiState?.progress ?? 0) * 100)} />
        </Box>
      )}

      {/* Results: ALT, CTA, and Name suggestions */}
      {aiState?.status === "done" && (
        <Box sx={{ mt: spacingMUI.xs }}>
          {aiState?.skippedReason === "lowTextLikelihood" && (
            <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>
              Skipped (low text likelihood). Click <b>{forceLabel}</b> if this is a banner/button with text.
            </Typography>
          )}

          {/* ALT suggestions */}
          <SuggestionChipGroup label='ALT suggestions (click to add)' suggestions={aiState?.altSuggestions ?? []} selectedTags={altTags} color='primary' onToggle={(s) => onAltChange(file.id, toggleSuggestion(customAltString, s))} />

          {/* CTA suggestions */}
          <SuggestionChipGroup label='CTA text (click to add)' suggestions={aiState?.ctaSuggestions ?? []} selectedTags={altTags} color='secondary' variant='outlined' onToggle={(s) => onAltChange(file.id, toggleSuggestion(customAltString, s))} />

          {/* Filename suggestions */}
          {(aiState?.nameSuggestions?.length ?? 0) > 0 && (
            <Box sx={{ mt: spacingMUI.sm }}>
              <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.75 }}>
                Filename suggestions
              </Typography>
              <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ gap: 0.75 }}>
                {aiState?.nameSuggestions?.map((s) => {
                  const normalized = normalizeCustomNameInput(s);
                  const isSelected = customName === normalized;
                  return (
                    <Chip
                      key={s}
                      size='small'
                      variant='outlined'
                      label={s}
                      onClick={() => onNameChange(file.id, normalized)}
                      sx={{
                        cursor: "pointer",
                        borderColor: isSelected ? theme.palette.success.main : theme.palette.divider,
                        backgroundColor: isSelected ? alpha(theme.palette.success.main, 0.15) : "transparent",
                        "&:hover": { backgroundColor: alpha(theme.palette.success.main, 0.1) },
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// SuggestionChipGroup — reusable row of clickable suggestion chips
// ---------------------------------------------------------------------------

interface SuggestionChipGroupProps {
  label: string;
  suggestions: string[];
  selectedTags: string[];
  color: "primary" | "secondary";
  variant?: "filled" | "outlined";
  onToggle: (suggestion: string) => void;
}

function SuggestionChipGroup({ label, suggestions, selectedTags, color, variant, onToggle }: SuggestionChipGroupProps) {
  const theme = useTheme();

  if (suggestions.length === 0) return null;

  const paletteColor = theme.palette[color].main;

  return (
    <Box sx={{ mt: spacingMUI.sm }}>
      <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.75 }}>
        {label}
      </Typography>
      <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ gap: 0.75 }}>
        {suggestions.map((s) => {
          const isSelected = selectedTags.includes(s);
          return (
            <Chip
              key={s}
              size='small'
              variant={variant}
              label={s}
              onClick={() => onToggle(s)}
              sx={{
                cursor: "pointer",
                borderColor: isSelected ? paletteColor : theme.palette.divider,
                backgroundColor: isSelected ? alpha(paletteColor, variant === "outlined" ? 0.15 : 0.2) : variant === "outlined" ? "transparent" : alpha(theme.palette.background.paper, 0.8),
                border: variant === "outlined" ? undefined : isSelected ? `1px solid ${paletteColor}` : `1px solid ${theme.palette.divider}`,
                "&:hover": { backgroundColor: alpha(paletteColor, variant === "outlined" ? 0.1 : 0.15) },
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
