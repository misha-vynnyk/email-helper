/**
 * Add Block Modal Component
 * Modal for adding custom email blocks
 */

import React, { useState } from "react";

import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import { BlockCategory, EmailBlock } from "../types/block";

import { blockFileApi } from "./blockFileApi";
import { addCustomBlock } from "./blockLoader";
import { getStorageLocations } from "./blockStorageConfig";
import { VALIDATION } from "./constants";
import { logger } from "../utils/logger";

interface AddBlockModalProps {
  open: boolean;
  onClose: () => void;
  onBlockAdded: (block: EmailBlock) => void;
}

const CATEGORIES: BlockCategory[] = [
  "Structure",
  "Content",
  "Buttons",
  "Footer",
  "Headers",
  "Social",
  "Custom",
];

export default function AddBlockModal({ open, onClose, onBlockAdded }: AddBlockModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BlockCategory>("Custom");
  const [html, setHtml] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [createAsFile, setCreateAsFile] = useState(true);
  const storageLocations = getStorageLocations(false); // Only visible locations
  const defaultLocation = storageLocations.find((loc) => loc.isDefault) || storageLocations[0];
  const [selectedLocationId, setSelectedLocationId] = useState<string>(defaultLocation?.id || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setName("");
    setCategory("Custom");
    setHtml("");
    setKeywordInput("");
    setKeywords([]);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError("Block name is required");
      return;
    }

    if (name.length > VALIDATION.MAX_BLOCK_NAME_LENGTH) {
      setError(`Block name is too long (max ${VALIDATION.MAX_BLOCK_NAME_LENGTH} characters)`);
      return;
    }

    if (!html.trim()) {
      setError("HTML code is required");
      return;
    }

    if (html.length > VALIDATION.MAX_HTML_LENGTH) {
      setError(
        `HTML code is too long (max ${VALIDATION.MAX_HTML_LENGTH.toLocaleString()} characters)`
      );
      return;
    }

    if (keywords.length < VALIDATION.MIN_KEYWORDS_REQUIRED) {
      setError(`At least ${VALIDATION.MIN_KEYWORDS_REQUIRED} keyword is required`);
      return;
    }

    if (keywords.length > VALIDATION.MAX_KEYWORDS) {
      setError(`Too many keywords (max ${VALIDATION.MAX_KEYWORDS})`);
      return;
    }

    if (keywords.some((k) => k.length > VALIDATION.MAX_KEYWORD_LENGTH)) {
      setError(`Keywords are too long (max ${VALIDATION.MAX_KEYWORD_LENGTH} characters each)`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (createAsFile) {
        // Check if storage locations are configured
        if (storageLocations.length === 0) {
          setError("No storage locations configured. Please add a location in Storage settings.");
          return;
        }

        // Create .ts file via API
        const blockId = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        // Get selected location
        const selectedLocation = storageLocations.find((loc) => loc.id === selectedLocationId);
        if (!selectedLocation) {
          setError("Selected storage location not found");
          return;
        }

        const fileBlock = await blockFileApi.createBlock({
          id: blockId,
          name: name.trim(),
          category,
          keywords,
          html: html.trim(),
          preview: "",
          targetPath: selectedLocation.path,
        });

        // Convert to EmailBlock format for callback
        const newBlock: EmailBlock = {
          id: fileBlock.id,
          name: fileBlock.name,
          category: fileBlock.category as BlockCategory,
          keywords: fileBlock.keywords,
          html: fileBlock.html,
          preview: fileBlock.preview,
          createdAt: fileBlock.createdAt || Date.now(),
          isCustom: true,
        };

        onBlockAdded(newBlock);
      } else {
        // Create in localStorage
        const newBlock = addCustomBlock({
          name: name.trim(),
          category,
          keywords,
          html: html.trim(),
          preview: "",
        });

        onBlockAdded(newBlock);
      }

      handleReset();
      onClose();
    } catch (err) {
      logger.error("AddBlockModal", "Failed to add block", err);
      const message = err instanceof Error ? err.message : "Failed to add block. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
    >
      <DialogTitle>Add Custom Email Block</DialogTitle>
      <DialogContent>
        {error && (
          <Alert
            severity='error'
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Box
          display='flex'
          flexDirection='column'
          gap={2}
          mt={1}
        >
          {/* Name */}
          <TextField
            label='Block Name'
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g., My Custom Header'
          />

          {/* Category */}
          <FormControl
            fullWidth
            required
          >
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label='Category'
              onChange={(e) => setCategory(e.target.value as BlockCategory)}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem
                  key={cat}
                  value={cat}
                >
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Save as File Option */}
          <Box sx={{ bgcolor: "action.hover", p: 2, borderRadius: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={createAsFile}
                  onChange={(e) => setCreateAsFile(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography
                    variant='body2'
                    fontWeight='bold'
                  >
                    Save as TypeScript file (.ts)
                  </Typography>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                  >
                    {createAsFile
                      ? "✅ Will create file (recommended for version control)"
                      : "Will save to localStorage (temporary storage)"}
                  </Typography>
                </Box>
              }
            />

            {/* Storage Location Selection (only if createAsFile is true) */}
            {createAsFile && (
              <>
                {storageLocations.length === 0 ? (
                  <Alert
                    severity='warning'
                    sx={{ mt: 2 }}
                  >
                    ⚠️ No storage locations configured! Please add a location in Storage settings
                    before creating file blocks, or switch to localStorage.
                  </Alert>
                ) : (
                  <FormControl
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    <InputLabel>Save Location</InputLabel>
                    <Select
                      value={selectedLocationId}
                      label='Save Location'
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                    >
                      {storageLocations.map((location) => (
                        <MenuItem
                          key={location.id}
                          value={location.id}
                        >
                          <Box>
                            <Typography variant='body2'>
                              📁 {location.name}
                              {location.isDefault && " (Default)"}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {location.path}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}
          </Box>

          {/* Keywords */}
          <Box>
            <TextField
              label='Keywords'
              fullWidth
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={handleKeywordKeyPress}
              placeholder='Type and press Enter to add'
              helperText='Add keywords to make your block easier to find'
              InputProps={{
                endAdornment: (
                  <IconButton
                    size='small'
                    onClick={handleAddKeyword}
                    disabled={!keywordInput.trim()}
                  >
                    <AddIcon />
                  </IconButton>
                ),
              }}
            />
            {keywords.length > 0 && (
              <Box
                display='flex'
                flexWrap='wrap'
                gap={1}
                mt={1}
              >
                {keywords.map((keyword) => (
                  <Chip
                    key={keyword}
                    label={keyword}
                    size='small'
                    onDelete={() => handleRemoveKeyword(keyword)}
                    deleteIcon={<CloseIcon />}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* HTML Code */}
          <TextField
            label='HTML Code'
            fullWidth
            required
            multiline
            rows={12}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder='Paste your email-safe HTML code here...'
            InputProps={{
              style: { fontFamily: "monospace", fontSize: "0.875rem" },
            }}
            helperText='Use table-based layout with inline styles for best email compatibility'
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={!name || !html || keywords.length === 0 || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          {loading ? "Creating..." : createAsFile ? "Create .ts File" : "Add to Storage"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
