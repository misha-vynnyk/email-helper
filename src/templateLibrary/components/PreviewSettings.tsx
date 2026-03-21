/**
 * Preview Settings Component
 * Allows users to configure preview dimensions and scale
 */

import { useState } from "react";
import Modal from "./Modal";
import { Plus as AddIcon, Settings as SettingsIcon, X as CloseIcon } from "lucide-react";

import { logger } from "../../utils/logger";
import { STORAGE_KEYS } from "../../utils/storageKeys";

export interface PreviewConfig {
  cardWidth: number;
  cardHeight: number;
  containerHeight: number;
  dialogMaxWidth: "xs" | "sm" | "md" | "lg" | "xl";
  saveScrollPosition: boolean;
  hiddenSections: string[];
}

const DEFAULT_CONFIG: PreviewConfig = {
  cardWidth: 600,
  cardHeight: 2000,
  containerHeight: 300,
  dialogMaxWidth: "lg",
  saveScrollPosition: true,
  hiddenSections: [],
};

export function loadPreviewConfig(): PreviewConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATE_PREVIEW_CONFIG);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    logger.error("PreviewSettings", "Failed to load preview config", error);
  }
  return DEFAULT_CONFIG;
}

export function savePreviewConfig(config: PreviewConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATE_PREVIEW_CONFIG, JSON.stringify(config));
  } catch (error) {
    logger.error("PreviewSettings", "Failed to save preview config", error);
  }
}

interface PreviewSettingsProps {
  config: PreviewConfig;
  onChange: (config: PreviewConfig) => void;
}

export default function PreviewSettings({ config, onChange }: PreviewSettingsProps) {
  const [open, setOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<PreviewConfig>(config);
  const [newSectionName, setNewSectionName] = useState("");

  const [containerHeightStr, setContainerHeightStr] = useState<string>(
    String(config.containerHeight)
  );
  const [cardWidthStr, setCardWidthStr] = useState<string>(String(config.cardWidth));
  const [cardHeightStr, setCardHeightStr] = useState<string>(String(config.cardHeight));

  const handleOpen = () => {
    setTempConfig(config);
    setContainerHeightStr(String(config.containerHeight));
    setCardWidthStr(String(config.cardWidth));
    setCardHeightStr(String(config.cardHeight));
    setNewSectionName("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    const validatedConfig: PreviewConfig = {
      ...tempConfig,
      containerHeight: tempConfig.containerHeight > 0 ? tempConfig.containerHeight : 300,
      cardWidth: tempConfig.cardWidth > 0 ? tempConfig.cardWidth : 600,
      cardHeight: tempConfig.cardHeight > 0 ? tempConfig.cardHeight : 2000,
    };
    onChange(validatedConfig);
    savePreviewConfig(validatedConfig);
    setOpen(false);
  };

  const handleReset = () => {
    setTempConfig(DEFAULT_CONFIG);
    setContainerHeightStr(String(DEFAULT_CONFIG.containerHeight));
    setCardWidthStr(String(DEFAULT_CONFIG.cardWidth));
    setCardHeightStr(String(DEFAULT_CONFIG.cardHeight));
  };

  const autoScale = tempConfig.containerHeight / tempConfig.cardHeight;
  const calculatedCardSize = {
    width: Math.round(tempConfig.cardWidth * autoScale),
    height: tempConfig.containerHeight,
  };

  return (
    <>
      <button
        title="Preview Settings"
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 border-input bg-background hover:bg-muted text-foreground rounded-xl transition-all active:scale-95"
      >
        <SettingsIcon size={16} strokeWidth={2.5} />
        <span className="hidden sm:inline">Dimensions</span>
      </button>

      <Modal
        open={open}
        onClose={handleClose}
        title="Preview Settings"
        maxWidthClass="max-w-sm"
        actionsRow={
          <div className="flex items-center justify-between w-full">
            <button onClick={handleReset} className="px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-all">
              Reset to Defaults
            </button>
            <div className="flex gap-2">
              <button onClick={handleClose} className="px-4 py-2 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={handleSave} className="px-5 py-2 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm">
                Save
              </button>
            </div>
          </div>
        }
      >
        {/* Preview Container Height */}
        <div className="mb-6">
          <label className="block text-sm font-extrabold text-foreground mb-1">Preview Card Height (px)</label>
          <p className="text-xs text-muted-foreground mb-2">Height of preview cards - templates will auto-scale to fit this height</p>
          <input
            type="number"
            value={containerHeightStr}
            onChange={(e) => {
              const value = e.target.value;
              setContainerHeightStr(value);
              if (value !== "" && value !== "-") {
                const numValue = parseInt(value, 10);
                if (!isNaN(numValue)) setTempConfig({ ...tempConfig, containerHeight: numValue });
              }
            }}
            onBlur={(e) => {
              const numValue = parseInt(e.target.value, 10);
              if (isNaN(numValue) || numValue <= 0) {
                setContainerHeightStr("300");
                setTempConfig({ ...tempConfig, containerHeight: 300 });
              } else {
                setContainerHeightStr(String(numValue));
                setTempConfig({ ...tempConfig, containerHeight: numValue });
              }
            }}
            step={50}
            className="w-full px-4 py-2 text-sm rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none"
          />
        </div>

        {/* Template Dimensions */}
        <div className="mb-6">
          <label className="block text-sm font-extrabold text-foreground mb-1">Template Dimensions</label>
          <p className="text-xs text-muted-foreground mb-2">Expected template size (typical emails: 600×2000px)</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Width (px)</label>
              <input
                type="number"
                value={cardWidthStr}
                onChange={(e) => {
                  const value = e.target.value;
                  setCardWidthStr(value);
                  if (value !== "" && value !== "-") {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue)) setTempConfig({ ...tempConfig, cardWidth: numValue });
                  }
                }}
                onBlur={(e) => {
                  const numValue = parseInt(e.target.value, 10);
                  if (isNaN(numValue) || numValue <= 0) {
                    setCardWidthStr("600");
                    setTempConfig({ ...tempConfig, cardWidth: 600 });
                  } else {
                    setCardWidthStr(String(numValue));
                    setTempConfig({ ...tempConfig, cardWidth: numValue });
                  }
                }}
                step={50}
                className="w-full px-4 py-2 text-sm rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Height (px)</label>
              <input
                type="number"
                value={cardHeightStr}
                onChange={(e) => {
                  const value = e.target.value;
                  setCardHeightStr(value);
                  if (value !== "" && value !== "-") {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue)) setTempConfig({ ...tempConfig, cardHeight: numValue });
                  }
                }}
                onBlur={(e) => {
                  const numValue = parseInt(e.target.value, 10);
                  if (isNaN(numValue) || numValue <= 0) {
                    setCardHeightStr("2000");
                    setTempConfig({ ...tempConfig, cardHeight: 2000 });
                  } else {
                    setCardHeightStr(String(numValue));
                    setTempConfig({ ...tempConfig, cardHeight: numValue });
                  }
                }}
                step={50}
                className="w-full px-4 py-2 text-sm rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Calculated Result */}
        <div className="p-4 bg-muted/30 rounded-xl mb-6 border border-border/50">
          <p className="text-xs text-muted-foreground font-semibold mb-1">Result Card Preview Size:</p>
          <p className="text-sm font-bold text-foreground">
            {calculatedCardSize.width}px × {calculatedCardSize.height}px
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ({tempConfig.cardWidth}px × {tempConfig.cardHeight}px scaled to {(autoScale * 100).toFixed(1)}%)
          </p>
          <p className="text-xs text-[#10b981] font-bold mt-2">
            ✓ Full template visible! Auto-scaled from {tempConfig.cardHeight}px to {tempConfig.containerHeight}px
          </p>
        </div>

        {/* Scroll Position */}
        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="mt-0.5">
              <input
                type="checkbox"
                checked={tempConfig.saveScrollPosition}
                onChange={(e) => setTempConfig({ ...tempConfig, saveScrollPosition: e.target.checked })}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary/20 bg-background cursor-pointer"
              />
            </div>
            <div>
              <span className="block text-sm font-extrabold text-foreground">Save scroll position</span>
              <span className="block text-xs text-muted-foreground mt-0.5">When enabled, your scroll position in the preview will be preserved when switching between templates</span>
            </div>
          </label>
        </div>

        {/* Hidden Sections */}
        <div>
          <label className="block text-sm font-extrabold text-foreground mb-1">Hidden Sections (Preview Only)</label>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Sections marked with comment markers will be hidden in preview only. Code remains unchanged.<br/>
            Enter only: <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono border border-border/50">SectionName</code>
          </p>

          {tempConfig.hiddenSections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tempConfig.hiddenSections.map((section, index) => (
                <span key={index} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-border/60 bg-muted/40 text-foreground">
                  {section}
                  <button onClick={() => {
                    const newSections = tempConfig.hiddenSections.filter((_, i) => i !== index);
                    setTempConfig({ ...tempConfig, hiddenSections: newSections });
                  }} className="hover:text-destructive rounded-full p-0.5 transition-colors">
                    <CloseIcon size={12} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Promo-content"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSectionName.trim()) {
                  e.preventDefault();
                  const trimmed = newSectionName.trim();
                  if (!tempConfig.hiddenSections.includes(trimmed)) {
                    setTempConfig({ ...tempConfig, hiddenSections: [...tempConfig.hiddenSections, trimmed] });
                    setNewSectionName("");
                  }
                }
              }}
              className="flex-1 px-3 py-2 text-sm rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none"
            />
            <button
              onClick={() => {
                const trimmed = newSectionName.trim();
                if (trimmed && !tempConfig.hiddenSections.includes(trimmed)) {
                  setTempConfig({ ...tempConfig, hiddenSections: [...tempConfig.hiddenSections, trimmed] });
                  setNewSectionName("");
                }
              }}
              disabled={!newSectionName.trim()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold border-2 border-input bg-background hover:bg-muted text-foreground rounded-xl transition-all disabled:opacity-50"
            >
              <AddIcon size={16} strokeWidth={3} /> Add
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
