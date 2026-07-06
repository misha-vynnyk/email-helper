/**
 * Block Library Component
 * Main component for browsing and managing email blocks
 */

import { Plus as AddIcon, RefreshCw as RefreshIcon, Search as SearchIcon, SearchX as SearchOffOutlined, Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Note } from "../components/ui/primitives";
import { useDebounce } from "../hooks/useDebounce";
import { EmailBlock } from "../types/block";
import { preloadBlocksImages } from "../utils/blockImagePreloader";
import { logger } from "../utils/logger";
import AddBlockModal from "./AddBlockModal";
import { blockFileApi } from "./blockFileApi";
import {
  getCategories,
  loadCustomBlocks,
  loadPredefinedBlocks,
  removeCustomBlock,
  saveCustomBlocks,
  searchBlocks,
} from "./blockLoader";
import { getStorageLocations } from "./blockStorageConfig";
import BlockStorageModal from "./BlockStorageModal";
import { GRID, TIMEOUTS } from "./constants";
import { formatErrorMessage } from "./errorHandling";
import VirtualizedBlockGrid from "./VirtualizedBlockGrid";

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer";

export default function BlockLibrary() {
  const [predefinedBlocks, setPredefinedBlocks] = useState<EmailBlock[]>([]);
  const [fileBlocks, setFileBlocks] = useState<EmailBlock[]>([]);
  const [customBlocks, setCustomBlocks] = useState<EmailBlock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blockSource, setBlockSource] = useState<"all" | "src" | "data" | "localStorage">("all"); // NEW: Block source filter
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false); // Prevent race conditions
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [storageModalOpen, setStorageModalOpen] = useState(false);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, TIMEOUTS.DEBOUNCE_SEARCH);

  // Helper function to determine block source based on file path
  const getBlockSource = (filePath: string): "src" | "data" => {
    if (filePath.includes("/src/blocks")) {
      return "src";
    }
    return "data"; // Default to data for all other paths
  };

  // Helper function to load file blocks
  const loadFileBlocks = useCallback(async (): Promise<EmailBlock[]> => {
    try {
      const fileBlockData = await blockFileApi.listBlocks();
      return fileBlockData
        .filter((fb) => fb.filePath) // Filter out blocks without filePath
        .map((fb) => ({
          id: fb.id,
          name: fb.name,
          category: fb.category as EmailBlock["category"],
          keywords: fb.keywords,
          html: fb.html,
          preview: fb.preview,
          createdAt: fb.createdAt || Date.now(),
          isCustom: true,
          source: getBlockSource(fb.filePath!), // filePath guaranteed by filter
          filePath: fb.filePath, // Store full file path
        }));
    } catch (err) {
      logger.warn("BlockLibrary", "File API unavailable", err);
      return [];
    }
  }, []);

  // Load blocks on mount and when storage settings change
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get storage locations from localStorage (only visible ones)
        const locations = getStorageLocations(false); // Exclude hidden

        // Load blocks from all sources
        const [predefined, custom, files] = await Promise.all([
          loadPredefinedBlocks(),
          Promise.resolve(loadCustomBlocks()),
          loadFileBlocks(),
        ]);

        setPredefinedBlocks(predefined);
        setCustomBlocks(custom.map((b) => ({ ...b, source: "localStorage" })));

        // If no visible locations configured, don't show any file blocks
        if (locations.length === 0) {
          setFileBlocks([]);
        } else {
          // Filter blocks to only show those from visible configured locations
          const allowedPaths = new Set(locations.map((loc) => loc.path));
          const filteredFiles = files.filter((block) => {
            if (!block.filePath) return false;
            // Check if block's file path matches any visible configured location
            return Array.from(allowedPaths).some((path) => block.filePath!.includes(path));
          });
          setFileBlocks(filteredFiles);
        }

        // Preload зображень з усіх блоків в кеш (в фоні, не блокує UI)
        const allBlocksForPreload = [
          ...predefined,
          ...custom.map((b) => ({ ...b, source: "localStorage" })),
          ...files,
        ];
        preloadBlocksImages(allBlocksForPreload).catch((error) => {
          // Ігноруємо помилки preloading - це не критично
          logger.warn("BlockLibrary", "Failed to preload block images", error);
        });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        logger.error("BlockLibrary", "Failed to load blocks", err);
        setError(`Failed to load blocks: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    loadBlocks();
  }, [loadFileBlocks, storageModalOpen]); // Reload when storage modal closes

  // Combine blocks based on selected source
  const allBlocks = useMemo(() => {
    switch (blockSource) {
      case "src":
        return predefinedBlocks;
      case "data":
        return fileBlocks;
      case "localStorage":
        return customBlocks;
      case "all":
      default:
        return [...predefinedBlocks, ...fileBlocks, ...customBlocks];
    }
  }, [blockSource, predefinedBlocks, fileBlocks, customBlocks]);

  // Get filtered blocks (using debounced search for performance)
  const filteredBlocks = useMemo(
    () =>
      searchBlocks(
        allBlocks,
        debouncedSearchQuery,
        selectedCategory === "All" ? undefined : selectedCategory
      ),
    [allBlocks, debouncedSearchQuery, selectedCategory]
  );

  // Get categories
  const categories = useMemo(() => getCategories(allBlocks), [allBlocks]);

  // Handle block deletion
  const handleDeleteBlock = useCallback(
    async (blockId: string) => {
      if (operationLoading) return;

      setOperationLoading(true);
      try {
        // Check if it's a file block
        const fileBlock = fileBlocks.find((b) => b.id === blockId);
        if (fileBlock) {
          try {
            await blockFileApi.deleteBlock(blockId);
            // Reload file blocks with proper filtering
            const files = await loadFileBlocks();
            const locations = getStorageLocations(false); // Exclude hidden

            if (locations.length === 0) {
              setFileBlocks(files);
            } else {
              const allowedPaths = new Set(locations.map((loc) => loc.path));
              const filteredFiles = files.filter((block) => {
                if (!block.filePath) return false;
                return Array.from(allowedPaths).some((path) => block.filePath!.includes(path));
              });
              setFileBlocks(filteredFiles);
            }
          } catch (error) {
            logger.error("BlockLibrary", "Failed to delete file block", error);
            setError(formatErrorMessage(error));
          }
          return;
        }

        // Check if it's a custom block
        const customBlock = customBlocks.find((b) => b.id === blockId);
        if (customBlock) {
          removeCustomBlock(blockId);
          setCustomBlocks(loadCustomBlocks().map((b) => ({ ...b, source: "localStorage" })));
          return;
        }

        // Predefined blocks - just remove from UI
        setPredefinedBlocks(predefinedBlocks.filter((b) => b.id !== blockId));
      } finally {
        setOperationLoading(false);
      }
    },
    [operationLoading, fileBlocks, customBlocks, predefinedBlocks, loadFileBlocks]
  );

  // Handle block update
  const handleUpdateBlock = useCallback(
    async (updatedBlock: EmailBlock) => {
      if (operationLoading) return;

      setOperationLoading(true);
      try {
        // Check if it's a file block
        const fileBlock = fileBlocks.find((b) => b.id === updatedBlock.id);
        if (fileBlock) {
          try {
            await blockFileApi.updateBlock(updatedBlock.id, {
              name: updatedBlock.name,
              category: updatedBlock.category,
              keywords: updatedBlock.keywords,
              html: updatedBlock.html,
              preview: updatedBlock.preview,
            });
            // Reload file blocks with proper filtering
            const files = await loadFileBlocks();
            const locations = getStorageLocations(false); // Exclude hidden

            if (locations.length === 0) {
              setFileBlocks(files);
            } else {
              const allowedPaths = new Set(locations.map((loc) => loc.path));
              const filteredFiles = files.filter((block) => {
                if (!block.filePath) return false;
                return Array.from(allowedPaths).some((path) => block.filePath!.includes(path));
              });
              setFileBlocks(filteredFiles);
            }
          } catch (error) {
            logger.error("BlockLibrary", "Failed to update file block", error);
            setError(formatErrorMessage(error));
          }
          return;
        }

        // Check if it's a custom block
        const customBlock = customBlocks.find((b) => b.id === updatedBlock.id);
        if (customBlock) {
          const updatedCustomBlocks: EmailBlock[] = customBlocks.map((b) =>
            b.id === updatedBlock.id ? { ...updatedBlock, source: "localStorage" as const } : b
          );
          try {
            saveCustomBlocks(updatedCustomBlocks);
            setCustomBlocks(updatedCustomBlocks);
          } catch (error) {
            logger.error("BlockLibrary", "Failed to save custom block", error);
            setError(formatErrorMessage(error));
          }
          return;
        }

        // Predefined block - save as new custom block
        const newCustomBlock: EmailBlock = {
          ...updatedBlock,
          isCustom: true,
          source: "localStorage" as const,
        };
        const updatedCustomBlocks: EmailBlock[] = [...customBlocks, newCustomBlock];
        try {
          saveCustomBlocks(updatedCustomBlocks);
          setCustomBlocks(updatedCustomBlocks);
        } catch (error) {
          logger.error("BlockLibrary", "Failed to save custom block", error);
          setError(formatErrorMessage(error));
        }
      } finally {
        setOperationLoading(false);
      }
    },
    [operationLoading, fileBlocks, customBlocks, loadFileBlocks]
  );

  // Handle block added
  const handleBlockAdded = useCallback(async () => {
    setAddModalOpen(false);

    // Get storage locations (only visible ones)
    const locations = getStorageLocations(false); // Exclude hidden

    // Reload both file blocks and localStorage blocks in parallel
    const [files, custom] = await Promise.all([
      loadFileBlocks(),
      Promise.resolve(loadCustomBlocks()),
    ]);

    // Filter file blocks based on visible configured locations
    if (locations.length === 0) {
      setFileBlocks(files);
    } else {
      const allowedPaths = new Set(locations.map((loc) => loc.path));
      const filteredFiles = files.filter((block) => {
        if (!block.filePath) return false;
        return Array.from(allowedPaths).some((path) => block.filePath!.includes(path));
      });
      setFileBlocks(filteredFiles);
    }

    setCustomBlocks(custom.map((b) => ({ ...b, source: "localStorage" })));
  }, [loadFileBlocks]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const [predefined, files, custom] = await Promise.all([
        Promise.resolve(loadPredefinedBlocks()),
        loadFileBlocks(),
        Promise.resolve(loadCustomBlocks()),
      ]);

      setPredefinedBlocks(predefined);

      // Filter file blocks based on visible storage locations
      const locations = getStorageLocations(false); // Exclude hidden
      if (locations.length === 0) {
        setFileBlocks(files);
      } else {
        const allowedPaths = new Set(locations.map((loc) => loc.path));
        const filteredFiles = files.filter((block) => {
          if (!block.filePath) return false;
          return Array.from(allowedPaths).some((path) => block.filePath!.includes(path));
        });
        setFileBlocks(filteredFiles);
      }

      setCustomBlocks(custom.map((b) => ({ ...b, source: "localStorage" as const })));
      setError(null);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='p-6'>
        <h1 className='text-2xl font-bold text-foreground mb-6'>Block Library</h1>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          {[...Array(GRID.SKELETON_COUNT)].map((_, index) => (
            <div
              key={index}
              className='bg-card border border-border/50 rounded-2xl shadow-soft p-4'
            >
              <div
                className='animate-pulse bg-muted rounded-xl'
                style={{ height: 200 }}
              />
              <div className='animate-pulse bg-muted rounded-md h-4 mt-3 w-full' />
              <div className='animate-pulse bg-muted rounded-md h-4 mt-2 w-3/5' />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <Note tone='error'>{error}</Note>
      </div>
    );
  }

  return (
    <div
      data-app-scroll='true'
      className='flex flex-col h-full'
      style={{ overflow: filteredBlocks.length === 0 ? "auto" : "hidden" }}
    >
      <div className='px-6 pt-6'>
        <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>Block Library</h1>
            <p className='text-xs text-muted-foreground mt-0.5'>
              📁 {predefinedBlocks.length + fileBlocks.length + customBlocks.length} blocks in
              library
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={handleRefresh}
              disabled={loading || operationLoading}
              className='flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-input text-foreground hover:bg-muted rounded-xl transition-all disabled:opacity-50'
            >
              <RefreshIcon size={16} /> Refresh
            </button>
            <button
              onClick={() => setStorageModalOpen(true)}
              className='flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-input text-foreground hover:bg-muted rounded-xl transition-all'
            >
              <SettingsIcon size={16} /> Storage
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className='flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm'
            >
              <AddIcon size={16} /> Add Block
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className='bg-card border border-border/50 rounded-2xl shadow-soft p-4 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-12 gap-3 items-center'>
            <div className='md:col-span-4 relative'>
              <SearchIcon
                size={16}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none'
              />
              <input
                type='text'
                placeholder='Search blocks...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='h-11 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
              />
            </div>
            <div className='md:col-span-3'>
              <select
                value={blockSource}
                onChange={(e) =>
                  setBlockSource(e.target.value as "all" | "src" | "data" | "localStorage")
                }
                className={selectClass}
              >
                <option value='all'>
                  🌐 All Sources ({predefinedBlocks.length + fileBlocks.length + customBlocks.length})
                </option>
                <option value='src'>📁 src/blocks/ ({predefinedBlocks.length})</option>
                <option value='data'>💾 data/blocks/files/ ({fileBlocks.length})</option>
                <option value='localStorage'>🔒 localStorage ({customBlocks.length})</option>
              </select>
            </div>
            <div className='md:col-span-3'>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={selectClass}
              >
                <option value='All'>All Categories</option>
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className='md:col-span-2'>
              <p className='text-sm text-muted-foreground text-center'>
                {filteredBlocks.length} {filteredBlocks.length === 1 ? "block" : "blocks"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Blocks Grid */}
      {filteredBlocks.length === 0 ? (
        <div className='flex flex-col items-center justify-center text-center p-6'
          style={{ minHeight: 400 }}
        >
          {getStorageLocations(false).length === 0 && !searchQuery && selectedCategory === "All" ? (
            <>
              <div className='mb-6 max-w-[600px]'>
                <Note tone='info'>
                  <p className='font-bold mb-1'>No visible storage locations configured!</p>
                  <p>
                    Please click the <strong>Storage</strong> button above to add locations where
                    your blocks will be stored. For example:{" "}
                    <code className='bg-muted px-1 py-0.5 rounded'>
                      /Users/your-name/Documents/blocks
                    </code>
                  </p>
                </Note>
              </div>
              <div className='w-[120px] h-[120px] rounded-full bg-muted flex items-center justify-center mb-4'>
                <SettingsIcon
                  size={60}
                  className='text-muted-foreground/50'
                />
              </div>
            </>
          ) : (
            <>
              <div className='w-[120px] h-[120px] rounded-full bg-muted flex items-center justify-center mb-4'>
                {searchQuery || selectedCategory !== "All" ? (
                  <SearchOffOutlined
                    size={60}
                    className='text-muted-foreground/50'
                  />
                ) : (
                  <AddIcon
                    size={60}
                    className='text-muted-foreground/50'
                  />
                )}
              </div>
              <h2 className='text-xl font-bold text-foreground mb-2'>
                {searchQuery || selectedCategory !== "All"
                  ? "No blocks found"
                  : "Your block library is empty"}
              </h2>
            </>
          )}
          <p className='text-sm text-muted-foreground mb-6 max-w-[400px]'>
            {searchQuery || selectedCategory !== "All"
              ? "Try different keywords or clear filters to see more blocks."
              : "Start building your email templates by creating your first custom block."}
          </p>
          {searchQuery || selectedCategory !== "All" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className='px-5 py-2.5 text-sm font-bold border border-input text-foreground hover:bg-muted rounded-xl transition-all'
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => setAddModalOpen(true)}
              className='flex items-center gap-2 px-5 py-3 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm'
            >
              <AddIcon size={18} /> Create First Block
            </button>
          )}
        </div>
      ) : (
        /* Virtualized Blocks Grid - рендерить лише видимі елементи */
        <div
          className='flex-1 px-6 pb-6'
          style={{ minHeight: 400 }}
        >
          <VirtualizedBlockGrid
            blocks={filteredBlocks}
            fileBlocks={fileBlocks}
            onDelete={handleDeleteBlock}
            onUpdate={handleUpdateBlock}
          />
        </div>
      )}

      {/* Add Block Modal */}
      <AddBlockModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onBlockAdded={handleBlockAdded}
      />

      {/* Block Storage Modal */}
      <BlockStorageModal
        open={storageModalOpen}
        onClose={() => setStorageModalOpen(false)}
      />
    </div>
  );
}
