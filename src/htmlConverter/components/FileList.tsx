import { useState } from "react";
import { Box, Stack, TextField, Typography, IconButton, Tooltip, Chip, useTheme, alpha, Paper, Collapse, Button, CircularProgress, Badge } from "@mui/material";
import { DragIndicator as DragIcon, AutoFixHigh as MagicIcon, Check as CheckIcon, ExpandMore as ExpandIcon, ExpandLess as CollapseIcon, TextFields as OcrIcon } from "@mui/icons-material";
import { borderRadius } from "../../theme/tokens";
import { normalizeCustomNameInput } from "../utils/imageAnalysis";

interface FileItem {
  id: string;
  name: string;
  path?: string;
}

interface AIResult {
  ocrText?: string;
  ocrTextRaw?: string;
  altSuggestions?: string[];
  nameSuggestions?: string[];
  ctaSuggestions?: string[];
  status?: "idle" | "running" | "done" | "error";
  error?: string;
}

interface FileListProps {
  files: FileItem[];
  customNames: Record<string, string>;
  setCustomNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  customAlts: Record<string, string[]>;
  setCustomAlts: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  draggedIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  aiById: Record<string, AIResult>;
  showOcrTextById: Record<string, boolean>;
  setShowOcrTextById: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onAnalyze: (file: FileItem, opts?: { force?: boolean }) => void;
}

// Helper: case-insensitive check if tag exists
const hasTagIgnoreCase = (tags: string[], tag: string): boolean => tags.some((t) => t.toLowerCase() === tag.toLowerCase());

export function FileList({ files, customNames, setCustomNames, customAlts, setCustomAlts, draggedIndex, onDragStart, onDragOver, onDragEnd, aiById, showOcrTextById, setShowOcrTextById, onAnalyze }: FileListProps) {
  const theme = useTheme();

  // State for editing tags inline
  const [editingTag, setEditingTag] = useState<{ fileId: string; index: number; value: string } | null>(null);
  // State for AI panel expansion per file
  const [expandedAiPanels, setExpandedAiPanels] = useState<Record<string, boolean>>({});
  // State for new tag input per file
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});

  const toggleAiPanel = (fileId: string) => {
    setExpandedAiPanels((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const addTag = (fileId: string, tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const existing = customAlts[fileId] || [];
    // Case-insensitive duplicate check
    if (!hasTagIgnoreCase(existing, trimmed)) {
      setCustomAlts((prev) => ({ ...prev, [fileId]: [...existing, trimmed] }));
    }
    setNewTagInputs((prev) => ({ ...prev, [fileId]: "" }));
  };

  const removeTag = (fileId: string, tagToRemove: string) => {
    const existing = customAlts[fileId] || [];
    // Case-insensitive removal
    setCustomAlts((prev) => ({
      ...prev,
      [fileId]: existing.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()),
    }));
  };

  const updateTag = (fileId: string, index: number, newValue: string) => {
    const existing = [...(customAlts[fileId] || [])];
    const trimmed = newValue.trim();
    if (trimmed) {
      existing[index] = trimmed;
      setCustomAlts((prev) => ({ ...prev, [fileId]: existing }));
    }
  };

  return (
    <Stack spacing={1.5}>
      {files.map((file, index) => {
        const aiResult = aiById[file.id];
        const isAnalyzing = aiResult?.status === "running";
        const hasAiResults = aiResult && aiResult.status === "done";
        const altTags = customAlts[file.id] || [];
        const isExpanded = expandedAiPanels[file.id] ?? hasAiResults;

        return (
          <Paper
            key={file.id}
            elevation={draggedIndex === index ? 6 : 1}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            sx={{
              overflow: "hidden",
              borderRadius: `${borderRadius.lg}px`,
              border: `1px solid ${draggedIndex === index ? theme.palette.primary.main : "transparent"}`,
              backgroundColor: theme.palette.background.paper,
              opacity: draggedIndex === index ? 0.85 : 1,
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: theme.shadows[4],
                "& .file-index": { backgroundColor: theme.palette.primary.main, color: "#fff" },
              },
            }}>
            {/* Main Content Row */}
            <Stack direction='row' spacing={0}>
              {/* Left: Drag Handle + Index */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  pt: 2,
                  px: 1,
                  cursor: "grab",
                  backgroundColor: alpha(theme.palette.divider, 0.3),
                  "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                }}>
                <DragIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                <Typography
                  className='file-index'
                  variant='caption'
                  sx={{
                    mt: 1,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: theme.palette.grey[200],
                    color: theme.palette.text.secondary,
                    transition: "all 0.2s",
                  }}>
                  {index + 1}
                </Typography>
              </Box>

              {/* Center: Thumbnail */}
              {file.path && (
                <Box sx={{ p: 1.5, position: "relative" }}>
                  <Box
                    component='img'
                    src={file.path}
                    alt={file.name}
                    sx={{
                      width: 72,
                      height: 72,
                      objectFit: "contain",
                      borderRadius: `${borderRadius.md}px`,
                      backgroundColor: alpha(theme.palette.text.primary, 0.03),
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  {/* Analyze overlay button */}
                  {(!aiResult || aiResult.status === "idle") && (
                    <Tooltip title='Analyze with AI'>
                      <IconButton
                        size='small'
                        onClick={() => onAnalyze(file)}
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          backgroundColor: alpha(theme.palette.primary.main, 0.9),
                          color: "#fff",
                          width: 28,
                          height: 28,
                          "&:hover": { backgroundColor: theme.palette.primary.dark },
                        }}>
                        <MagicIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {isAnalyzing && (
                    <Box sx={{ position: "absolute", bottom: 8, right: 8 }}>
                      <CircularProgress size={20} />
                    </Box>
                  )}
                </Box>
              )}

              {/* Right: Inputs */}
              <Box sx={{ flex: 1, p: 1.5, minWidth: 0 }}>
                <Stack spacing={1.5}>
                  {/* Filename Input */}
                  <TextField
                    fullWidth
                    size='small'
                    label='Filename'
                    placeholder={file.name}
                    value={customNames[file.id] || ""}
                    onChange={(e) => {
                      const val = normalizeCustomNameInput(e.target.value);
                      setCustomNames((prev) => ({ ...prev, [file.id]: val }));
                    }}
                    helperText={customNames[file.id] ? `→ ${customNames[file.id]}` : file.name}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: `${borderRadius.md}px` } }}
                  />

                  {/* ALT Text Section */}
                  <Box>
                    {/* Current Tags */}
                    {altTags.length > 0 && (
                      <Stack direction='row' flexWrap='wrap' gap={0.5} mb={1}>
                        {altTags.map((tag, tagIndex) => {
                          const isEditing = editingTag?.fileId === file.id && editingTag.index === tagIndex;
                          if (isEditing) {
                            return (
                              <TextField
                                key={tagIndex}
                                size='small'
                                autoFocus
                                value={editingTag.value}
                                onChange={(e) => setEditingTag((prev) => (prev ? { ...prev, value: e.target.value } : null))}
                                onBlur={() => {
                                  updateTag(file.id, tagIndex, editingTag.value);
                                  setEditingTag(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateTag(file.id, tagIndex, editingTag.value);
                                    setEditingTag(null);
                                  } else if (e.key === "Escape") {
                                    setEditingTag(null);
                                  }
                                }}
                                sx={{
                                  width: Math.max(60, editingTag.value.length * 8 + 20),
                                  "& .MuiInputBase-root": { height: 24, fontSize: 12 },
                                }}
                                variant='outlined'
                              />
                            );
                          }
                          return (
                            <Chip
                              key={tagIndex}
                              label={tag}
                              size='small'
                              onDelete={() => removeTag(file.id, tag)}
                              onDoubleClick={() => setEditingTag({ fileId: file.id, index: tagIndex, value: tag })}
                              sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                "& .MuiChip-label": { cursor: "text" },
                              }}
                            />
                          );
                        })}
                      </Stack>
                    )}

                    {/* New Tag Input */}
                    <TextField
                      fullWidth
                      size='small'
                      label='ALT text'
                      placeholder={altTags.length ? "Add another..." : "Type and press Enter..."}
                      value={newTagInputs[file.id] || ""}
                      onChange={(e) => setNewTagInputs((prev) => ({ ...prev, [file.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(file.id, newTagInputs[file.id] || "");
                        }
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: `${borderRadius.md}px` } }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>

            {/* AI Panel (Collapsible) */}
            {hasAiResults && (
              <>
                <Box
                  onClick={() => toggleAiPanel(file.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 0.75,
                    cursor: "pointer",
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderTop: `1px solid ${theme.palette.divider}`,
                    "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                  }}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <MagicIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                    <Typography variant='caption' fontWeight={600} color='primary'>
                      AI Suggestions
                    </Typography>
                    {(aiResult?.altSuggestions?.length || 0) + (aiResult?.nameSuggestions?.length || 0) > 0 && <Badge badgeContent={(aiResult?.altSuggestions?.length || 0) + (aiResult?.nameSuggestions?.length || 0)} color='primary' sx={{ ml: 1 }} />}
                  </Stack>
                  {isExpanded ? <CollapseIcon fontSize='small' /> : <ExpandIcon fontSize='small' />}
                </Box>

                <Collapse in={isExpanded}>
                  <Box sx={{ p: 2, pt: 1.5, backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                    {/* Quick Actions */}
                    <Stack direction='row' spacing={1} mb={1.5}>
                      {(aiResult?.altSuggestions?.length ?? 0) > 0 && (
                        <Button
                          size='small'
                          variant='outlined'
                          startIcon={<CheckIcon />}
                          onClick={() => {
                            const best = aiResult?.altSuggestions?.[0];
                            if (best) addTag(file.id, best);
                          }}>
                          Use Best ALT
                        </Button>
                      )}
                      {(aiResult?.nameSuggestions?.length ?? 0) > 0 && (
                        <Button
                          size='small'
                          variant='outlined'
                          startIcon={<CheckIcon />}
                          onClick={() => {
                            const best = aiResult?.nameSuggestions?.[0];
                            if (best) setCustomNames((prev) => ({ ...prev, [file.id]: normalizeCustomNameInput(best) }));
                          }}>
                          Use Best Name
                        </Button>
                      )}
                      {aiResult?.ocrText && (
                        <Button size='small' variant='text' startIcon={<OcrIcon />} onClick={() => setShowOcrTextById((p) => ({ ...p, [file.id]: !p[file.id] }))}>
                          {showOcrTextById[file.id] ? "Hide" : "Show"} OCR
                        </Button>
                      )}
                      <IconButton size='small' onClick={() => onAnalyze(file, { force: true })} sx={{ ml: "auto !important" }}>
                        <Tooltip title='Re-analyze'>
                          <MagicIcon fontSize='small' />
                        </Tooltip>
                      </IconButton>
                    </Stack>

                    {/* OCR Text */}
                    {showOcrTextById[file.id] && aiResult?.ocrText && <TextField fullWidth multiline size='small' minRows={2} maxRows={4} value={aiResult.ocrText} InputProps={{ readOnly: true }} sx={{ mb: 1.5, bgcolor: theme.palette.background.paper }} />}

                    {/* Suggestions */}
                    <Stack spacing={1}>
                      {(aiResult?.altSuggestions?.length ?? 0) > 0 && (
                        <Box>
                          <Typography variant='caption' color='text.secondary' mb={0.5} display='block'>
                            ALT suggestions
                          </Typography>
                          <Stack direction='row' flexWrap='wrap' gap={0.5}>
                            {aiResult?.altSuggestions?.map((s) => {
                              const isUsed = hasTagIgnoreCase(altTags, s);
                              return <Chip key={s} label={s} size='small' color={isUsed ? "primary" : "default"} variant={isUsed ? "filled" : "outlined"} onClick={() => (isUsed ? removeTag(file.id, s) : addTag(file.id, s))} icon={isUsed ? <CheckIcon fontSize='small' /> : undefined} />;
                            })}
                          </Stack>
                        </Box>
                      )}
                      {(aiResult?.ctaSuggestions?.length ?? 0) > 0 && (
                        <Box>
                          <Typography variant='caption' color='text.secondary' mb={0.5} display='block'>
                            CTA suggestions
                          </Typography>
                          <Stack direction='row' flexWrap='wrap' gap={0.5}>
                            {aiResult?.ctaSuggestions?.map((s) => {
                              const isUsed = hasTagIgnoreCase(altTags, s);
                              return <Chip key={s} label={s} size='small' color={isUsed ? "secondary" : "default"} variant={isUsed ? "filled" : "outlined"} onClick={() => (isUsed ? removeTag(file.id, s) : addTag(file.id, s))} icon={isUsed ? <CheckIcon fontSize='small' /> : undefined} />;
                            })}
                          </Stack>
                        </Box>
                      )}
                      {(aiResult?.nameSuggestions?.length ?? 0) > 0 && (
                        <Box>
                          <Typography variant='caption' color='text.secondary' mb={0.5} display='block'>
                            Filename suggestions
                          </Typography>
                          <Stack direction='row' flexWrap='wrap' gap={0.5}>
                            {aiResult?.nameSuggestions?.map((s) => {
                              const norm = normalizeCustomNameInput(s);
                              const isUsed = customNames[file.id] === norm;
                              return <Chip key={s} label={s} size='small' color={isUsed ? "success" : "default"} variant={isUsed ? "filled" : "outlined"} onClick={() => setCustomNames((prev) => ({ ...prev, [file.id]: norm }))} icon={isUsed ? <CheckIcon fontSize='small' /> : undefined} />;
                            })}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Collapse>
              </>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
}
