/**
 * Add Block Modal Component
 * Modal for adding custom email blocks
 */

import { Loader2, Plus as AddIcon, X as CloseIcon } from "lucide-react";
import React, { useState } from "react";

import { Checkbox } from "../components/ui/checkbox";
import { Note } from "../components/ui/primitives";
import Modal from "../templateLibrary/components/Modal";
import { BlockCategory, EmailBlock } from "../types/block";
import { logger } from "../utils/logger";
import { blockFileApi } from "./blockFileApi";
import { addCustomBlock } from "./blockLoader";
import { getStorageLocations } from "./blockStorageConfig";
import { VALIDATION } from "./constants";

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

  const inputClass =
    "w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground outline-none transition-all";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidthClass='max-w-2xl'
      title='Add Custom Email Block'
      actionsRow={
        <>
          <button
            onClick={handleClose}
            disabled={loading}
            className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name || !html || keywords.length === 0 || loading}
            className='flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm disabled:opacity-50'
          >
            {loading ? <Loader2 size={16} className='animate-spin' /> : <AddIcon size={16} />}
            {loading ? "Creating..." : createAsFile ? "Create .ts File" : "Add to Storage"}
          </button>
        </>
      }
    >
      <div className='flex flex-col gap-5'>
        {error && (
          <Note tone='error'>{error}</Note>
        )}

        {/* Name */}
        <div>
          <label className='block text-sm font-extrabold text-foreground mb-1.5'>
            Block Name<span className='text-destructive'> *</span>
          </label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g., My Custom Header'
            className={inputClass}
          />
        </div>

        {/* Category */}
        <div>
          <label className='block text-sm font-extrabold text-foreground mb-1.5'>
            Category<span className='text-destructive'> *</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BlockCategory)}
            className={`${inputClass} appearance-none cursor-pointer`}
          >
            {CATEGORIES.map((cat) => (
              <option
                key={cat}
                value={cat}
              >
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Save as File Option */}
        <div className='bg-muted/40 p-4 rounded-xl border border-border/50'>
          <label className='flex items-start gap-2.5 cursor-pointer'>
            <Checkbox
              checked={createAsFile}
              onCheckedChange={(checked) => setCreateAsFile(checked === true)}
              className='mt-0.5'
            />
            <div>
              <p className='text-sm font-bold text-foreground'>Save as TypeScript file (.ts)</p>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {createAsFile
                  ? "✅ Will create file (recommended for version control)"
                  : "Will save to localStorage (temporary storage)"}
              </p>
            </div>
          </label>

          {/* Storage Location Selection (only if createAsFile is true) */}
          {createAsFile && (
            <>
              {storageLocations.length === 0 ? (
                <div className='mt-3'>
                  <Note tone='warning'>
                    No storage locations configured! Please add a location in Storage settings
                    before creating file blocks, or switch to localStorage.
                  </Note>
                </div>
              ) : (
                <div className='mt-3'>
                  <label className='block text-sm font-extrabold text-foreground mb-1.5'>
                    Save Location
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    {storageLocations.map((location) => (
                      <option
                        key={location.id}
                        value={location.id}
                      >
                        📁 {location.name}
                        {location.isDefault && " (Default)"} — {location.path}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Keywords */}
        <div>
          <label className='block text-sm font-extrabold text-foreground mb-1.5'>Keywords</label>
          <div className='flex gap-2'>
            <input
              type='text'
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={handleKeywordKeyPress}
              placeholder='Type and press Enter to add'
              className={inputClass}
            />
            <button
              onClick={handleAddKeyword}
              disabled={!keywordInput.trim()}
              className='shrink-0 px-3 rounded-xl border border-input text-foreground hover:bg-muted transition-colors disabled:opacity-50'
            >
              <AddIcon size={18} />
            </button>
          </div>
          <p className='text-xs text-muted-foreground mt-1.5'>
            Add keywords to make your block easier to find
          </p>
          {keywords.length > 0 && (
            <div className='flex flex-wrap gap-1.5 mt-2'>
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className='inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border/50'
                >
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className='p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors'
                  >
                    <CloseIcon size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* HTML Code */}
        <div>
          <label className='block text-sm font-extrabold text-foreground mb-1.5'>
            HTML Code<span className='text-destructive'> *</span>
          </label>
          <textarea
            rows={12}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder='Paste your email-safe HTML code here...'
            className={`${inputClass} font-mono resize-y`}
          />
          <p className='text-xs text-muted-foreground mt-1.5'>
            Use table-based layout with inline styles for best email compatibility
          </p>
        </div>
      </div>
    </Modal>
  );
}
