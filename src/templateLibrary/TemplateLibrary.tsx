/**
 * Template Library Component
 * Main UI for browsing and managing HTML email templates from file system
 */

import React, { useEffect, useMemo, useState } from "react";

import {
  Plus as AddIcon,
  Ban as BlockIcon,
  X as ClearIcon,
  FolderOpen as FolderOpenIcon,
  RefreshCw as RefreshIcon,
  Search as SearchIcon,
  SearchX as SearchOffIcon,
  Settings as SettingsIcon,
} from "lucide-react";

import { EmailTemplate, TemplateCategory } from "../types/template";

import PreviewSettings, { loadPreviewConfig, PreviewConfig } from "./PreviewSettings";
import { listTemplates, syncAllTemplates, getTemplateContent } from "./templateApi";
import TemplateStorageModal from "./TemplateStorageModal";
import VirtualizedTemplateGrid from "./VirtualizedTemplateGrid";
import { getTemplateStorageLocations } from "./templateStorageConfig";
import { templateContentCache } from "./templateContentCache";
import { logger } from "../utils/logger";
import { preloadImages } from "../utils/imageUrlReplacer";

const CATEGORY_OPTIONS: Array<TemplateCategory | "All"> = [
  "All",
  "Newsletter",
  "Transactional",
  "Marketing",
  "Internal",
  "Other",
];

type SortOption = "name-asc" | "name-desc" | "date-newest" | "date-oldest" | "category";

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "All">("All");
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [excludedFolders, setExcludedFolders] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("date-newest");
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<PreviewConfig>(loadPreviewConfig());
  const [openTemplateId, setOpenTemplateId] = useState<string | null>(null);
  const savedScrollPositionRef = React.useRef<number>(0);
  const loadingRef = React.useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled || loadingRef.current) return;
      loadingRef.current = true;
      try {
        await loadTemplates();
        if (!cancelled) {
          await syncTemplates();
        }
      } finally {
        loadingRef.current = false;
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTemplates();
      if (Array.isArray(data)) {
        const locations = getTemplateStorageLocations(false);

        if (locations.length === 0) {
          setTemplates(data);
        } else {
          const allowedPaths = new Set(locations.map((loc) => loc.path));
          const filteredTemplates = data.filter((template) => {
            if (!template.filePath) return false;
            return Array.from(allowedPaths).some((path) => template.filePath.startsWith(path));
          });
          setTemplates(filteredTemplates);
        }

        const templatesWithPreview = data.filter((t) => t.preview);
        if (templatesWithPreview.length > 0) {
          preloadImages(templatesWithPreview.map((t) => t.preview!).join(' ')).catch((error) => {
            logger.warn("TemplateLibrary", "Failed to preload template preview images", error);
          });
        }
      } else {
        logger.error("TemplateLibrary", "API returned non-array data", data);
        setTemplates([]);
        setError("Invalid data format from server");
      }
    } catch (err) {
      const isConnectionError = err instanceof Error && (
        err.message.includes("Failed to fetch") ||
        err.message.includes("connection") ||
        err.message.includes("Server connection failed")
      );

      if (isConnectionError) {
        logger.warn("TemplateLibrary", "Server unavailable - templates cannot be loaded");
      } else {
        logger.error("TemplateLibrary", "Failed to load templates", err);
      }

      setTemplates([]);
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const syncTemplates = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setError(null);

    try {
      const locations = getTemplateStorageLocations(false);

      if (locations.length === 0) {
        setError("No storage locations configured. Please add directories in Storage settings.");
        setSyncing(false);
        return;
      }

      let totalFound = 0;
      const errors: string[] = [];

      for (const location of locations) {
        try {
          const result = await syncAllTemplates({
            recursive: true,
            category: "Other",
            paths: [location.path], 
          });

          totalFound += result.templatesFound;
        } catch (err) {
          const errorMsg = `Failed to sync ${location.name}: ${err instanceof Error ? err.message : "Unknown error"}`;
          const isConnectionError = err instanceof Error && (
            err.message.includes("Failed to fetch") ||
            err.message.includes("connection") ||
            err.message.includes("Server connection failed")
          );

          if (isConnectionError) {
            logger.warn("TemplateLibrary", `Server unavailable - sync failed for ${location.name}`);
          } else {
            logger.error("TemplateLibrary", errorMsg, err);
          }

          errors.push(errorMsg);
        }
      }

      if (errors.length > 0) {
        setError(`Sync completed with errors:\n${errors.join("\n")}`);
      } else {
        setSyncMessage(`✅ Sync completed: ${totalFound} templates found`);
        setTimeout(() => setSyncMessage(null), 5000);
      }

      await loadTemplates();
    } catch (err) {
      const isConnectionError = err instanceof Error && (
        err.message.includes("Failed to fetch") ||
        err.message.includes("connection") ||
        err.message.includes("Server connection failed")
      );

      if (isConnectionError) {
        logger.warn("TemplateLibrary", "Server unavailable - sync failed");
      } else {
        logger.error("TemplateLibrary", "Failed to sync templates", err);
      }

      setError(err instanceof Error ? err.message : "Failed to sync templates");
    } finally {
      setSyncing(false);
    }
  };

  const handleTemplateDeleted = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const handleTemplateUpdated = (updated: EmailTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleOpenTemplate = (templateId: string) => {
    setOpenTemplateId(templateId);
  };

  const handleCloseTemplate = () => {
    setOpenTemplateId(null);
  };

  const handleNavigateTemplate = (direction: "prev" | "next", savedScrollPos?: number) => {
    if (!openTemplateId || filteredTemplates.length === 0) return;

    if (previewConfig.saveScrollPosition && savedScrollPos !== undefined) {
      savedScrollPositionRef.current = savedScrollPos;
    } else {
      savedScrollPositionRef.current = 0;
    }

    const currentIndex = filteredTemplates.findIndex((t) => t.id === openTemplateId);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredTemplates.length - 1;
    } else {
      newIndex = currentIndex < filteredTemplates.length - 1 ? currentIndex + 1 : 0;
    }

    const newTemplate = filteredTemplates[newIndex];

    const preloadIds = [
      filteredTemplates[newIndex - 1]?.id,
      filteredTemplates[newIndex + 1]?.id,
      filteredTemplates[newIndex - 2]?.id,
      filteredTemplates[newIndex + 2]?.id,
    ].filter(Boolean) as string[];

    if (preloadIds.length > 0) {
      templateContentCache.preload(preloadIds, getTemplateContent);
    }

    setOpenTemplateId(newTemplate.id);
  };

  const rootFolders = useMemo(() => {
    const folders = new Set<string>();
    (Array.isArray(templates) ? templates : []).forEach((template) => {
      if (template.folderPath) {
        const rootFolder = template.folderPath.split(" / ")[0];
        if (rootFolder) {
          folders.add(rootFolder);
        }
      }
    });
    return Array.from(folders).sort();
  }, [templates]);

  const folderStats = useMemo(() => {
    const stats: Record<string, number> = {};
    (Array.isArray(templates) ? templates : []).forEach((template) => {
      if (template.folderPath) {
        const rootFolder = template.folderPath.split(" / ")[0];
        if (rootFolder) {
          stats[rootFolder] = (stats[rootFolder] || 0) + 1;
        }
      }
    });
    return stats;
  }, [templates]);

  const filteredTemplates = React.useMemo(() => {
    const filtered = (Array.isArray(templates) ? templates : []).filter((template) => {
      if (selectedCategory !== "All" && template.category !== selectedCategory) {
        return false;
      }

      const rootFolder = template.folderPath?.split(" / ")[0];

      if (rootFolder && excludedFolders.has(rootFolder)) {
        return false;
      }

      if (selectedFolders.size > 0) {
        if (!rootFolder || !selectedFolders.has(rootFolder)) {
          return false;
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.name.toLowerCase().includes(query) ||
          template.category.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          template.description?.toLowerCase().includes(query) ||
          template.filePath.toLowerCase().includes(query) ||
          template.folderPath?.toLowerCase().includes(query)
        );
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        case "name-desc":
          return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
        case "date-newest":
          return (b.lastModified || 0) - (a.lastModified || 0);
        case "date-oldest":
          return (a.lastModified || 0) - (b.lastModified || 0);
        case "category": {
          const categoryCompare = a.category.localeCompare(b.category);
          if (categoryCompare !== 0) return categoryCompare;
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [templates, selectedCategory, selectedFolders, excludedFolders, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background text-foreground">
        {/* Header skeleton */}
        <div className="p-4 md:p-8 border-b border-border/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-8 w-64 bg-muted animate-pulse rounded-lg mb-3"></div>
              <div className="h-5 w-40 bg-muted animate-pulse rounded-lg"></div>
            </div>
            <div className="h-10 w-48 bg-muted animate-pulse rounded-xl"></div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="h-10 w-full md:w-2/3 bg-muted animate-pulse rounded-xl"></div>
            <div className="h-10 w-full md:w-1/3 bg-muted animate-pulse rounded-xl"></div>
          </div>
        </div>

        {/* Templates skeleton */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-[2rem] border border-border/50 overflow-hidden shadow-sm h-[320px] flex flex-col">
                <div className="h-[150px] bg-muted animate-pulse border-b border-border/50"></div>
                <div className="p-5 flex-grow">
                  <div className="h-6 w-3/4 bg-muted animate-pulse rounded mb-4"></div>
                  <div className="h-5 w-1/3 bg-muted animate-pulse rounded mb-5"></div>
                  <div className="h-4 w-full bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-4 w-5/6 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-sans w-full transition-colors duration-300">
      {/* Header */}
      <div className="p-4 md:p-8 border-b border-border/50">
        {/* Title and Stats */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <span className="text-2xl">📚</span> HTML Template Library
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-1.5 flex flex-wrap gap-x-2">
              <span>{filteredTemplates.length} {filteredTemplates.length === 1 ? "template" : "templates"}</span>
              {searchQuery && <span className="bg-muted px-1.5 rounded text-foreground">matching "{searchQuery}"</span>}
              {selectedFolders.size > 0 && <span>in {selectedFolders.size} folder{selectedFolders.size > 1 ? "s" : ""}</span>}
              {excludedFolders.size > 0 && <span className="text-destructive">({excludedFolders.size} hidden)</span>}
              {selectedCategory !== "All" && <span className="flex items-center gap-1 before:content-['•'] before:mr-1">{selectedCategory}</span>}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <PreviewSettings config={previewConfig} onChange={setPreviewConfig} />
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  await loadTemplates();
                  setError(null);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to reload templates");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || syncing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 border-input bg-background hover:bg-muted text-foreground rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshIcon size={16} strokeWidth={2.5} className={loading || syncing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={syncTemplates}
              disabled={syncing || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:hover:translate-y-0 disabled:shadow-none disabled:opacity-50"
            >
              <AddIcon size={16} strokeWidth={3} />
              <span>{syncing ? "Syncing..." : "Sync New"}</span>
            </button>
            <button
              onClick={() => setStorageModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 border-input bg-background hover:bg-muted text-foreground rounded-xl transition-all active:scale-95"
            >
              <SettingsIcon size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Storage</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Search templates by name, category, tags, folder, or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="md:col-span-3 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full pl-4 pr-10 py-2.5 text-sm font-bold rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="date-newest">📅 Newest File First</option>
              <option value="date-oldest">📅 Oldest File First</option>
              <option value="name-asc">🔤 Name (A-Z)</option>
              <option value="name-desc">🔤 Name (Z-A)</option>
              <option value="category">📂 Category</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          
          <div className="md:col-span-4 relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | "All")}
              className="w-full pl-4 pr-10 py-2.5 text-sm font-bold rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none appearance-none cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "Select Category (All)" : cat}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* Quick Folder Filter Chips */}
        {rootFolders.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedFolders(new Set());
                setExcludedFolders(new Set());
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${
                selectedFolders.size === 0 && excludedFolders.size === 0
                  ? "bg-primary border-primary text-primary-foreground shadow-sm"
                  : "bg-background border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <FolderOpenIcon size={14} strokeWidth={2.5} />
              All
            </button>
            
            {rootFolders.map((folder) => {
              const isIncluded = selectedFolders.has(folder);
              const isExcluded = excludedFolders.has(folder);

              return (
                <div key={folder} className="flex items-center relative group">
                  <button
                    onClick={() => {
                      if (isExcluded) return;
                      setSelectedFolders((prev) => {
                        const next = new Set(prev);
                        if (next.has(folder)) next.delete(folder);
                        else next.add(folder);
                        return next;
                      });
                    }}
                    className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-l-full text-xs font-bold transition-all border-y-2 border-l-2 ${
                      isIncluded
                        ? "bg-primary border-primary text-primary-foreground shadow-sm"
                        : isExcluded
                        ? "bg-destructive/10 border-destructive/20 text-destructive/50 opacity-50 cursor-not-allowed"
                        : "bg-background border-input text-foreground hover:border-primary/50 hover:text-primary border-r-0"
                    }`}
                  >
                    <span>{folder}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] bg-black/10`}>{folderStats[folder] || 0}</span>
                    {isIncluded && (
                      <div onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFolders((prev) => {
                          const next = new Set(prev);
                          next.delete(folder);
                          return next;
                        });
                      }} className="p-0.5 hover:bg-black/20 rounded-full ml-0.5">
                        <ClearIcon size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isExcluded) {
                        setExcludedFolders((prev) => {
                          const next = new Set(prev);
                          next.delete(folder);
                          return next;
                        });
                      } else {
                        setExcludedFolders((prev) => new Set(prev).add(folder));
                        setSelectedFolders((prev) => {
                          const next = new Set(prev);
                          next.delete(folder);
                          return next;
                        });
                      }
                    }}
                    className={`flex items-center justify-center p-1.5 rounded-r-full transition-all border-y-2 border-r-2 border-l border-l-border/30 ${
                      isIncluded ? "bg-primary border-primary text-primary-foreground hover:brightness-90" : 
                      isExcluded ? "bg-destructive text-destructive-foreground border-destructive opacity-80 hover:opacity-100" : 
                      "bg-background border-input text-muted-foreground hover:border-destructive hover:text-destructive"
                    }`}
                    title={isExcluded ? "Show folder" : "Hide folder"}
                  >
                    <BlockIcon size={14} strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Storage Configuration Notice */}
        {getTemplateStorageLocations(false).length === 0 && (
          <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning-foreground flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-medium">
                <strong className="font-extrabold mr-1">No storage locations configured.</strong> 
                Add template directories in Storage settings to enable template synchronization.
              </p>
            </div>
            <button onClick={() => setStorageModalOpen(true)} className="px-4 py-2 text-sm font-bold bg-warning text-warning-foreground hover:brightness-110 rounded-lg transition-all shadow-sm">
              Configure
            </button>
          </div>
        )}
      </div>

      {/* Error & Sync States */}
      {error && (
        <div className="mx-4 md:mx-8 mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex justify-between items-start">
          <p className="text-sm font-bold whitespace-pre-wrap">{error}</p>
          <button onClick={() => setError(null)} className="p-1 hover:bg-destructive/20 rounded-lg transition-colors"><ClearIcon size={16}/></button>
        </div>
      )}
      {syncMessage && (
        <div className="mx-4 md:mx-8 mt-4 p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] flex justify-between items-start">
          <p className="text-sm font-bold">{syncMessage}</p>
          <button onClick={() => setSyncMessage(null)} className="p-1 hover:bg-[#10b981]/20 rounded-lg transition-colors"><ClearIcon size={16}/></button>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        data-app-scroll="true" 
        className={`flex-1 flex flex-col ${filteredTemplates.length === 0 ? 'overflow-auto p-4 md:p-8' : 'overflow-hidden'}`}
      >
        {filteredTemplates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6 text-muted-foreground/50">
              {searchQuery || selectedCategory !== "All" || selectedFolders.size > 0 || excludedFolders.size > 0 ? (
                <SearchOffIcon size={48} strokeWidth={1.5} />
              ) : (
                <FolderOpenIcon size={48} strokeWidth={1.5} />
              )}
            </div>
            
            <h3 className="text-xl font-extrabold text-foreground mb-3">
              {searchQuery || selectedCategory !== "All" || selectedFolders.size > 0 || excludedFolders.size > 0
                ? "No templates found"
                : "Your template library is empty"}
            </h3>
            
            <p className="text-sm text-muted-foreground max-w-md mb-8 font-medium">
              {searchQuery || selectedCategory !== "All" || selectedFolders.size > 0 || excludedFolders.size > 0
                ? "Try different keywords or clear filters to see more templates."
                : "Start building your email collection by adding HTML templates from your file system. Place your templates in ~/Templates for quick access."}
            </p>

            {searchQuery || selectedCategory !== "All" || selectedFolders.size > 0 || excludedFolders.size > 0 ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedFolders(new Set());
                  setExcludedFolders(new Set());
                }}
                className="px-6 py-2.5 text-sm font-bold border-2 border-input bg-background hover:bg-muted text-foreground rounded-xl transition-all shadow-sm active:scale-95"
              >
                Clear Filters
              </button>
            ) : (
              <div className="flex gap-4 flex-wrap justify-center">
                <button
                  onClick={() => setStorageModalOpen(true)}
                  className="px-6 py-2.5 flex items-center gap-2 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <SettingsIcon size={16} /> Configure Storage
                </button>
                <button
                  onClick={syncTemplates}
                  disabled={syncing}
                  className="px-6 py-2.5 flex items-center gap-2 text-sm font-bold border-2 border-input bg-background hover:bg-muted text-foreground rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <RefreshIcon size={16} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing..." : "Sync Templates"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 w-full min-h-0 relative">
            <VirtualizedTemplateGrid
              templates={filteredTemplates}
              previewConfig={previewConfig}
              openTemplateId={openTemplateId}
              onDelete={handleTemplateDeleted}
              onUpdate={handleTemplateUpdated}
              onOpen={handleOpenTemplate}
              onClose={handleCloseTemplate}
              onNavigate={handleNavigateTemplate}
              savedScrollPosition={savedScrollPositionRef.current}
            />
          </div>
        )}
      </div>

      <TemplateStorageModal
        open={storageModalOpen}
        onClose={() => setStorageModalOpen(false)}
        onSave={() => loadTemplates()}
      />
    </div>
  );
}
