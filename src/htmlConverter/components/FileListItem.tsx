/**
 * FileListItem — a single file row in the StorageUploadDialog.
 * Shows: drag handle, thumbnail, index, name input, ALT tags, and AI suggestions.
 *
 * This is a "dumb" presentational component — all state lives in the parent.
 */

import React from "react";
import { GripVertical, X, AlertTriangle } from "lucide-react";
import { normalizeCustomNameInput } from "../utils/imageAnalysis";
import type { ImageAiAnalysis } from "../utils/ocrUiTypes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileItem {
  id: string;
  name: string;
  path?: string;
  size?: number;
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
  /** File size threshold in KB to show a warning */
  warningFileSizeKB?: number;

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

export default function FileListItem({ file, index, uploading, draggedIndex, customName, customAltString, aiState, analysisEnabled, analysisLabel, editingTag, useAiBackend, warningFileSizeKB = 1024, onNameChange, onAltChange, onEditingTagChange, onAnalyze, onDragStart, onDragOver, onDragEnd, onRemove }: FileListItemProps) {
  const isDragged = draggedIndex === index;
  const altTags = getAltTags(customAltString);

  return (
    <div
      draggable={!uploading}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={`
        flex flex-col items-stretch gap-3 p-3 rounded-lg border transition-all duration-200
        ${isDragged ? "bg-primary/15 border-primary" : "bg-card border-border/50"}
        ${uploading ? "cursor-default" : "cursor-grab active:cursor-grabbing"}
        ${!uploading && !isDragged ? "hover:bg-primary/5 hover:border-primary/50" : ""}
      `}>
      {/* Top row: drag handle + thumbnail + index + name/alt inputs + remove button */}
      <div className='flex items-start gap-3'>
        <div className='flex items-center gap-3 pt-1 flex-1'>
          {/* Drag Handle */}
          <GripVertical className={`text-muted-foreground ${uploading ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`} size={20} />

          {/* Warning Icon if file is too large */}
          {warningFileSizeKB && file.size && file.size > warningFileSizeKB * 1024 && (
            <div title={`Увага: файл завеликий (${(file.size / 1024).toFixed(0)} KB). Рекомендовано до ${warningFileSizeKB} KB.`} className='flex text-warning cursor-help'>
              <AlertTriangle size={20} />
            </div>
          )}

          {/* Thumbnail */}
          {file.path && (
            <div title={file.name} className='w-12 h-12 rounded-md overflow-hidden shrink-0 border border-border/50 bg-background/50 cursor-pointer group relative'>
              <img src={file.path} alt={file.name} className='w-full h-full object-cover group-hover:opacity-50 transition-opacity' />
            </div>
          )}

          {/* Index Badge */}
          <span className='min-w-[36px] h-6 flex items-center justify-center font-bold text-[11px] rounded-full bg-primary/10 text-primary'>#{index + 1}</span>

          <div className='flex-1 flex flex-col gap-2'>
            {/* Name Input */}
            <div className='flex flex-col'>
              <input type='text' placeholder={file.name.replace(/\.[^/.]+$/, "")} value={customName} onChange={(e) => onNameChange(file.id, normalizeCustomNameInput(e.target.value))} disabled={uploading} className='w-full bg-background border border-border/50 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50' />
              <span className='font-mono text-[10px] text-muted-foreground mt-1'>{customName ? `${customName}.jpg` : file.name}</span>
            </div>

            {/* ALT Input with Tags */}
            <AltTagInput fileId={file.id} altTags={altTags} customAltString={customAltString} uploading={uploading} editingTag={editingTag} onAltChange={onAltChange} onEditingTagChange={onEditingTagChange} />
          </div>

          {/* Remove Button */}
          <div className='pt-0.5'>
            <button title='Remove file from upload list' onClick={onRemove} disabled={uploading} className='p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* AI suggestions section */}
      {analysisEnabled && <AiSuggestionsSection file={file} uploading={uploading} aiState={aiState} analysisLabel={analysisLabel} customAltString={customAltString} customName={customName} useAiBackend={useAiBackend} onAnalyze={onAnalyze} onAltChange={onAltChange} onNameChange={onNameChange} />}
    </div>
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
  return (
    <div>
      <span className='text-xs text-muted-foreground mb-1 block'>ALT text</span>
      <div className='min-h-[40px] border border-border/50 rounded-md p-1.5 flex flex-wrap gap-1.5 items-center bg-card/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'>
        {/* Existing tags as editable/removable chips */}
        {altTags.map((tag, idx) => {
          const isEditing = editingTag?.fileId === fileId && editingTag?.tagIdx === idx;

          if (isEditing) {
            return (
              <input
                key={`edit-${idx}`}
                type='text'
                defaultValue={tag}
                autoFocus
                onBlur={(e) => {
                  onAltChange(fileId, updateTag(customAltString, idx, e.target.value.trim()));
                  onEditingTagChange(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  else if (e.key === "Escape") onEditingTagChange(null);
                }}
                className='w-auto min-w-[60px] text-[13px] px-1.5 py-0.5 bg-background border border-border/50 rounded outline-none focus:border-primary'
              />
            );
          }

          return (
            <div key={`${tag}-${idx}`} onDoubleClick={() => onEditingTagChange({ fileId, tagIdx: idx })} className='group flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-foreground px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95'>
              <span>{tag}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAltChange(fileId, removeTag(customAltString, idx));
                }}
                className='text-muted-foreground hover:text-destructive p-0.5 rounded-full outline-none transition-all hover:scale-110 active:scale-95'>
                <X size={12} />
              </button>
            </div>
          );
        })}

        {/* Inline input for adding new tags */}
        <input
          type='text'
          placeholder={customAltString ? "Add more..." : "Type or click suggestions below..."}
          disabled={uploading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              e.preventDefault();
              const newTag = e.currentTarget.value.trim();
              onAltChange(fileId, addTag(customAltString, newTag));
              e.currentTarget.value = "";
            }
          }}
          className='flex-1 min-w-[120px] text-sm bg-transparent border-none outline-none disabled:opacity-50 placeholder:text-muted-foreground'
        />
      </div>
    </div>
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
  const forceLabel = useAiBackend ? "Force Analyze" : "Force OCR";
  const altTags = getAltTags(customAltString);

  return (
    <div className='pt-2 pl-0'>
      {/* Analyze button row */}
      <div className='flex flex-wrap items-center gap-2'>
        <button onClick={() => onAnalyze(file)} disabled={uploading || aiState?.status === "running"} className='px-3 py-1 text-xs font-medium border border-border/50 rounded hover:bg-muted transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed'>
          {aiState?.status === "running" ? "Analyzing…" : analysisLabel}
        </button>

        {aiState?.skippedReason === "lowTextLikelihood" && (
          <button onClick={() => onAnalyze(file, { force: true })} disabled={uploading || aiState?.status === "running"} className='px-3 py-1 text-xs font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed'>
            {forceLabel}
          </button>
        )}

        {typeof aiState?.textLikelihood === "number" && <span className='px-2 py-0.5 text-[10px] border border-border/50 rounded text-muted-foreground'>TL {Number(aiState?.textLikelihood).toFixed(3)}</span>}
        {aiState?.cacheHit && <span className='px-2 py-0.5 text-[10px] border border-border/50 rounded text-muted-foreground'>cache</span>}

        {aiState?.status === "error" && <span className='text-[10px] text-destructive'>{aiState?.error}</span>}
      </div>

      {/* Progress bar */}
      {aiState?.status === "running" && <div className='mt-2 h-1 w-full bg-muted rounded overflow-hidden'>{typeof aiState?.progress === "number" ? <div className='h-full bg-primary transition-all duration-300' style={{ width: `${Math.round(aiState.progress * 100)}%` }} /> : <div className='h-full bg-primary w-1/3 animate-progress' />}</div>}

      {/* Results: ALT, CTA, and Name suggestions */}
      {aiState?.status === "done" && (
        <div className='mt-2'>
          {aiState?.skippedReason === "lowTextLikelihood" && (
            <span className='block mb-2 text-xs text-muted-foreground'>
              Skipped (low text likelihood). Click <strong className='text-foreground'>{forceLabel}</strong> if this is a banner/button with text.
            </span>
          )}

          {/* ALT suggestions */}
          <SuggestionChipGroup label='ALT suggestions (click to add)' suggestions={aiState?.altSuggestions ?? []} selectedTags={altTags} color='primary' onToggle={(s) => onAltChange(file.id, toggleSuggestion(customAltString, s))} />

          {/* CTA suggestions */}
          <SuggestionChipGroup label='CTA text (click to add)' suggestions={aiState?.ctaSuggestions ?? []} selectedTags={altTags} color='secondary' variant='outlined' onToggle={(s) => onAltChange(file.id, toggleSuggestion(customAltString, s))} />

          {/* Filename suggestions */}
          {(aiState?.nameSuggestions?.length ?? 0) > 0 && (
            <div className='mt-3'>
              <span className='block mb-1.5 text-xs text-muted-foreground'>Filename suggestions</span>
              <div className='flex flex-wrap gap-1.5'>
                {aiState?.nameSuggestions?.map((s) => {
                  const normalized = normalizeCustomNameInput(s);
                  const isSelected = customName === normalized;
                  return (
                    <button key={s} onClick={() => onNameChange(file.id, normalized)} className={`px-2 py-1 text-xs rounded border transition-all hover:scale-105 active:scale-95 ${isSelected ? "border-success bg-success/15 text-foreground" : "border-border text-muted-foreground hover:bg-success/10 hover:text-foreground"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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
  if (suggestions.length === 0) return null;

  return (
    <div className='mt-2'>
      <span className='block mb-1.5 text-xs text-muted-foreground'>{label}</span>
      <div className='flex flex-wrap gap-1.5'>
        {suggestions.map((s) => {
          const isSelected = selectedTags.includes(s);

          let colorClasses = "";
          if (color === "primary") {
            colorClasses = isSelected ? "border-primary bg-primary/20 text-foreground" : "border-border text-foreground bg-card hover:bg-primary/10";
          } else {
            colorClasses = isSelected ? "border-secondary bg-secondary/20 text-foreground" : "border-border text-foreground hover:bg-secondary/15 " + (variant === "outlined" ? "bg-transparent" : "bg-card");
          }

          return (
            <button key={s} onClick={() => onToggle(s)} className={`px-2 py-1 text-xs rounded-full border transition-all hover:scale-105 active:scale-95 ${colorClasses}`}>
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}
