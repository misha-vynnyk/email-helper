/**
 * Template Library Component
 * Main UI for browsing and managing HTML email templates from file system
 */

import React, { useEffect, useMemo, useState } from "react";

import {
  Add as AddIcon,
  Block as BlockIcon,
  Clear as ClearIcon,
  FolderOpen as FolderOpenIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  SearchOff as SearchOffIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { EmailTemplate, TemplateCategory } from "../types/template";

import PreviewSettings, { loadPreviewConfig, PreviewConfig } from "./PreviewSettings";
import { listTemplates, syncAllTemplates, getTemplateContent } from "./templateApi";
import { getCategoryIcon } from "./templateCategoryIcons";
import TemplateItem from "./TemplateItem";
import TemplateStorageModal from "./TemplateStorageModal";
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
        // First load existing templates
        await loadTemplates();

        // Then sync to find new files
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
      // Ensure data is always an array
      if (Array.isArray(data)) {
        // Filter templates based on storage locations
        const locations = getTemplateStorageLocations(false); // Exclude hidden

        if (locations.length === 0) {
          // No storage locations configured - show all templates
          setTemplates(data);
        } else {
          // Filter templates by configured storage paths
          const allowedPaths = new Set(locations.map((loc) => loc.path));
          const filteredTemplates = data.filter((template) => {
            if (!template.filePath) return false;
            // Check if template's file path starts with any allowed path
            return Array.from(allowedPaths).some((path) => template.filePath.startsWith(path));
          });
          setTemplates(filteredTemplates);
        }

        // Preload зображень з preview шаблонів (якщо вони є) в кеш (в фоні)
        const templatesWithPreview = data.filter((t) => t.preview);
        if (templatesWithPreview.length > 0) {
          preloadImages(templatesWithPreview.map((t) => t.preview!).join(' ')).catch((error) => {
            // Ігноруємо помилки preloading - це не критично
            logger.warn("TemplateLibrary", "Failed to preload template preview images", error);
          });
        }
      } else {
        logger.error("TemplateLibrary", "API returned non-array data", data);
        setTemplates([]);
        setError("Invalid data format from server");
      }
    } catch (err) {
      logger.error("TemplateLibrary", "Failed to load templates", err);
      setTemplates([]); // Ensure templates is always an array
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
      // Get configured storage locations
      const locations = getTemplateStorageLocations(false); // Exclude hidden

      if (locations.length === 0) {
        setError("No storage locations configured. Please add directories in Storage settings.");
        setSyncing(false);
        return;
      }

      // Sync each configured location
      let totalFound = 0;
      const errors: string[] = [];

      for (const location of locations) {
        try {
          const result = await syncAllTemplates({
            recursive: true,
            category: "Other",
            paths: [location.path], // Sync specific path
          });

          totalFound += result.templatesFound;
        } catch (err) {
          const errorMsg = `Failed to sync ${location.name}: ${err instanceof Error ? err.message : "Unknown error"}`;
          logger.error("TemplateLibrary", errorMsg, err);
          errors.push(errorMsg);
        }
      }

      if (errors.length > 0) {
        setError(`Sync completed with errors:\n${errors.join("\n")}`);
      } else {
        setSyncMessage(`✅ Sync completed: ${totalFound} templates found`);
      }

      // Reload templates after sync
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync templates");
    } finally {
      setSyncing(false);
    }
  };

  // const handleTemplateAdded = (template: EmailTemplate | EmailTemplate[]) => {
  //   if (Array.isArray(template)) {
  //     // Folder import
  //     setTemplates((prev) => [...prev, ...template]);
  //   } else {
  //     // Single template
  //     setTemplates((prev) => [...prev, template]);
  //   }
  // };

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

    // Save scroll position if provided and enabled
    if (previewConfig.saveScrollPosition && savedScrollPos !== undefined) {
      savedScrollPositionRef.current = savedScrollPos;
    } else {
      // Reset scroll position if disabled
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

    // Preload next templates in background for faster navigation
    const preloadIds = [
      filteredTemplates[newIndex - 1]?.id,
      filteredTemplates[newIndex + 1]?.id,
      filteredTemplates[newIndex - 2]?.id,
      filteredTemplates[newIndex + 2]?.id,
    ].filter(Boolean) as string[];

    if (preloadIds.length > 0) {
      // Preload in background - don't wait
      templateContentCache.preload(preloadIds, getTemplateContent);
    }

    setOpenTemplateId(newTemplate.id);
  };

  // Extract unique root folders from templates (memoized)
  const rootFolders = useMemo(() => {
    const folders = new Set<string>();
    (Array.isArray(templates) ? templates : []).forEach((template) => {
      if (template.folderPath) {
        // Extract first-level folder (e.g., "Finance" from "Finance / DailyMarketClue.com")
        const rootFolder = template.folderPath.split(" / ")[0];
        if (rootFolder) {
          folders.add(rootFolder);
        }
      }
    });
    return Array.from(folders).sort();
  }, [templates]);

  // Folder statistics (memoized)
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

  // Filter and sort templates - ensure templates is always an array
  const filteredTemplates = React.useMemo(() => {
    // Filter
    const filtered = (Array.isArray(templates) ? templates : []).filter((template) => {
      // Category filter
      if (selectedCategory !== "All" && template.category !== selectedCategory) {
        return false;
      }

      // Folder filter (root level)
      const rootFolder = template.folderPath?.split(" / ")[0];

      // Exclude folders that are in excludedFolders set
      if (rootFolder && excludedFolders.has(rootFolder)) {
        return false;
      }

      // If specific folders are selected, show only those folders
      if (selectedFolders.size > 0) {
        if (!rootFolder || !selectedFolders.has(rootFolder)) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.name.toLowerCase().includes(query) ||
          template.category.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          template.description?.toLowerCase().includes(query) ||
          template.filePath.toLowerCase().includes(query) ||
          template.folderPath?.toLowerCase().includes(query) // Search in folder structure
        );
      }

      return true;
    });

    // Sort
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

  // Skeleton Loading State
  if (loading) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header skeleton */}
        <Box
          p={2}
          borderBottom='1px solid'
          borderColor='divider'
        >
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            mb={2}
          >
            <Box>
              <Skeleton
                variant='text'
                width={250}
                height={32}
              />
              <Skeleton
                variant='text'
                width={150}
                height={20}
              />
            </Box>
            <Skeleton
              variant='rectangular'
              width={180}
              height={36}
              sx={{ borderRadius: 1 }}
            />
          </Box>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={8}
            >
              <Skeleton
                variant='rectangular'
                height={40}
                sx={{ borderRadius: 1 }}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={4}
            >
              <Skeleton
                variant='rectangular'
                height={40}
                sx={{ borderRadius: 1 }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Templates skeleton */}
        <Box
          data-app-scroll="true"
          flex={1}
          overflow='auto'
          p={2}
        >
          <Grid
            container
            spacing={2}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={i}
              >
                <Card>
                  <Skeleton
                    variant='rectangular'
                    height={180}
                  />
                  <CardContent>
                    <Skeleton
                      variant='text'
                      width='70%'
                      height={24}
                    />
                    <Skeleton
                      variant='text'
                      width='40%'
                      height={20}
                      sx={{ mt: 1 }}
                    />
                    <Skeleton
                      variant='text'
                      width='85%'
                      height={20}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        p={2}
        borderBottom='1px solid'
        borderColor='divider'
      >
        {/* Title and Stats */}
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Box>
            <Typography
              variant='h6'
              component='h2'
            >
              HTML Template Library
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
            >
              {filteredTemplates.length} {filteredTemplates.length === 1 ? "template" : "templates"}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedFolders.size > 0 &&
                ` in ${selectedFolders.size} folder${selectedFolders.size > 1 ? "s" : ""}`}
              {excludedFolders.size > 0 && ` (${excludedFolders.size} hidden)`}
              {selectedCategory !== "All" && ` • ${selectedCategory}`}
            </Typography>
          </Box>
          <Box
            display='flex'
            gap={1}
            alignItems='center'
          >
            <PreviewSettings
              config={previewConfig}
              onChange={setPreviewConfig}
            />
            <Button
              variant='outlined'
              startIcon={<RefreshIcon />}
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
              size='small'
            >
              Refresh
            </Button>
            <Button
              variant='outlined'
              startIcon={<AddIcon />}
              onClick={syncTemplates}
              disabled={syncing || loading}
              size='small'
            >
              {syncing ? "Syncing..." : "Sync New"}
            </Button>
            <Button
              variant='outlined'
              startIcon={<SettingsIcon />}
              onClick={() => setStorageModalOpen(true)}
              size='small'
            >
              Storage
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
            md={5}
          >
            <TextField
              fullWidth
              size='small'
              placeholder='Search templates by name, category, tags, folder, or path...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Grid>
          <Grid
            item
            xs={12}
            md={2}
          >
            <TextField
              fullWidth
              size='small'
              select
              label='Sort By'
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <MenuItem value='date-newest'>📅 Newest File First</MenuItem>
              <MenuItem value='date-oldest'>📅 Oldest File First</MenuItem>
              <MenuItem value='name-asc'>🔤 Name (A-Z)</MenuItem>
              <MenuItem value='name-desc'>🔤 Name (Z-A)</MenuItem>
              <MenuItem value='category'>📂 Category</MenuItem>
            </TextField>
          </Grid>
          <Grid
            item
            xs={12}
            md={4.5}
          >
            <TextField
              fullWidth
              size='small'
              select
              label='Category'
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | "All")}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <MenuItem
                  key={cat}
                  value={cat}
                >
                  <Box
                    display='flex'
                    alignItems='center'
                    gap={1}
                  >
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* Quick Folder Filter Chips */}
        {rootFolders.length > 0 && (
          <Box
            mt={2}
            display='flex'
            gap={1}
            flexWrap='wrap'
            alignItems='center'
          >
            <Chip
              label='All'
              variant={
                selectedFolders.size === 0 && excludedFolders.size === 0 ? "filled" : "outlined"
              }
              color={
                selectedFolders.size === 0 && excludedFolders.size === 0 ? "primary" : "default"
              }
              onClick={() => {
                setSelectedFolders(new Set());
                setExcludedFolders(new Set());
              }}
              icon={<FolderOpenIcon />}
              size='small'
            />
            {rootFolders.map((folder) => {
              const isIncluded = selectedFolders.has(folder);
              const isExcluded = excludedFolders.has(folder);

              return (
                <Box
                  key={folder}
                  display='flex'
                  gap={0.5}
                  alignItems='center'
                >
                  <Chip
                    label={`${folder} (${folderStats[folder] || 0})`}
                    variant={isIncluded ? "filled" : "outlined"}
                    color={isIncluded ? "primary" : isExcluded ? "error" : "default"}
                    onClick={() => {
                      if (isExcluded) {
                        // Can't select excluded folder - need to unexclude first
                        return;
                      }
                      // Toggle inclusion
                      setSelectedFolders((prev) => {
                        const next = new Set(prev);
                        if (next.has(folder)) {
                          next.delete(folder);
                        } else {
                          next.add(folder);
                        }
                        return next;
                      });
                    }}
                    onDelete={
                      isIncluded
                        ? () => {
                            setSelectedFolders((prev) => {
                              const next = new Set(prev);
                              next.delete(folder);
                              return next;
                            });
                          }
                        : undefined
                    }
                    deleteIcon={<ClearIcon />}
                    size='small'
                    sx={{
                      opacity: isExcluded ? 0.5 : 1,
                      cursor: isExcluded ? "not-allowed" : "pointer",
                    }}
                  />
                  <Tooltip title={isExcluded ? "Show folder" : "Hide folder"}>
                    <IconButton
                      size='small'
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isExcluded) {
                          // Unhide
                          setExcludedFolders((prev) => {
                            const next = new Set(prev);
                            next.delete(folder);
                            return next;
                          });
                        } else {
                          // Hide
                          setExcludedFolders((prev) => new Set(prev).add(folder));
                          setSelectedFolders((prev) => {
                            const next = new Set(prev);
                            next.delete(folder);
                            return next;
                          });
                        }
                      }}
                      color={isExcluded ? "error" : "default"}
                      sx={{
                        minWidth: 32,
                        height: 32,
                      }}
                    >
                      <BlockIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Storage Configuration Notice */}
        {getTemplateStorageLocations(false).length === 0 && (
          <Alert
            severity='warning'
            sx={{ mt: 2 }}
            action={
              <Button
                color='inherit'
                size='small'
                onClick={() => setStorageModalOpen(true)}
              >
                Configure
              </Button>
            }
          >
            <Typography variant='body2'>
              <strong>⚠️ No storage locations configured.</strong> Add template directories in
              Storage settings to enable template synchronization.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Error State */}
      {error && (
        <Box p={2}>
          <Alert
            severity='error'
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Sync Message */}
      {syncMessage && (
        <Box p={2}>
          <Alert
            severity='success'
            onClose={() => setSyncMessage(null)}
          >
            {syncMessage}
          </Alert>
        </Box>
      )}

      {/* Content Area */}
      <Box
        data-app-scroll="true"
        flex={1}
        overflow='auto'
        p={2}
      >
        {filteredTemplates.length === 0 ? (
          /* Empty State */
          <Box
            textAlign='center'
            py={8}
            px={3}
            sx={{
              minHeight: "400px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              mb={3}
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                bgcolor: "action.hover",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {searchQuery ||
              selectedCategory !== "All" ||
              selectedFolders.size > 0 ||
              excludedFolders.size > 0 ? (
                <SearchOffIcon sx={{ fontSize: 60, color: "text.disabled" }} />
              ) : (
                <FolderOpenIcon sx={{ fontSize: 60, color: "text.disabled" }} />
              )}
            </Box>

            <Typography
              variant='h5'
              gutterBottom
              fontWeight={600}
            >
              {searchQuery ||
              selectedCategory !== "All" ||
              selectedFolders.size > 0 ||
              excludedFolders.size > 0
                ? "No templates found"
                : "Your template library is empty"}
            </Typography>

            <Typography
              variant='body2'
              color='text.secondary'
              mb={3}
              maxWidth={500}
            >
              {searchQuery ||
              selectedCategory !== "All" ||
              selectedFolders.size > 0 ||
              excludedFolders.size > 0
                ? "Try different keywords or clear filters to see more templates."
                : "Start building your email collection by adding HTML templates from your file system. Place your templates in ~/Templates for quick access."}
            </Typography>

            {searchQuery ||
            selectedCategory !== "All" ||
            selectedFolders.size > 0 ||
            excludedFolders.size > 0 ? (
              <Button
                variant='outlined'
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedFolders(new Set());
                  setExcludedFolders(new Set());
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Box
                display='flex'
                gap={2}
              >
                <Button
                  variant='contained'
                  startIcon={<SettingsIcon />}
                  onClick={() => setStorageModalOpen(true)}
                  size='large'
                >
                  Configure Storage
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<RefreshIcon />}
                  onClick={syncTemplates}
                  size='large'
                  disabled={syncing}
                >
                  {syncing ? "Syncing..." : "Sync Templates"}
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          /* Templates Grid */
          <Grid
            container
            spacing={2}
          >
            {filteredTemplates.map((template, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={template.id}
              >
                <TemplateItem
                  template={template}
                  previewConfig={previewConfig}
                  onDelete={handleTemplateDeleted}
                  onUpdate={handleTemplateUpdated}
                  onLoadTemplate={(html, tmpl) => {
                    // TODO: Integrate with editor
                  }}
                  isOpen={openTemplateId === template.id}
                  onOpen={() => handleOpenTemplate(template.id)}
                  onClose={handleCloseTemplate}
                  allTemplates={filteredTemplates}
                  currentIndex={index}
                  onNavigate={handleNavigateTemplate}
                  savedScrollPosition={savedScrollPositionRef.current}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Template Storage Modal */}
      <TemplateStorageModal
        open={storageModalOpen}
        onClose={() => setStorageModalOpen(false)}
        onSave={() => {
          // Reload templates after storage config changes
          loadTemplates();
        }}
      />
    </Box>
  );
}
