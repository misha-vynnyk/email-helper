/**
 * Block Library Component
 * Main component for browsing and managing email blocks
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  SearchOffOutlined,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";

import { EmailBlock } from "../types/block";

import AddBlockModal from "./AddBlockModal";
import { blockFileApi } from "./blockFileApi";
import BlockItem from "./BlockItem";
import {
  getCategories,
  loadCustomBlocks,
  loadPredefinedBlocks,
  removeCustomBlock,
  saveCustomBlocks,
  searchBlocks,
} from "./blockLoader";
import BlockStorageModal from "./BlockStorageModal";
import { getStorageLocations } from "./blockStorageConfig";
import { GRID, TIMEOUTS } from "./constants";
import { formatErrorMessage } from "./errorHandling";
import { useDebounce } from "../hooks/useDebounce";
import { logger } from "../utils/logger";

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

        // Load blocks based on configured locations
        const [custom, files] = await Promise.all([
          Promise.resolve(loadCustomBlocks()),
          loadFileBlocks(),
        ]);

        // Don't load predefined blocks from src - only show user-configured locations
        setPredefinedBlocks([]);
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

  if (loading) {
    return (
      <Box p={3}>
        <Typography
          variant='h4'
          gutterBottom
        >
          Block Library
        </Typography>
        <Grid
          container
          spacing={2}
        >
          {[...Array(GRID.SKELETON_COUNT)].map((_, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={index}
            >
              <Card>
                <CardContent>
                  <Skeleton
                    variant='rectangular'
                    height={200}
                  />
                  <Skeleton variant='text' />
                  <Skeleton
                    variant='text'
                    width='60%'
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      p={3}
      sx={{ overflow: "auto", maxHeight: "100vh" }}
    >
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Box>
          <Typography
            variant='h4'
            fontWeight={600}
          >
            Block Library
          </Typography>
          <Typography
            variant='caption'
            color='text.secondary'
          >
            📁 {predefinedBlocks.length + fileBlocks.length + customBlocks.length} blocks in library
          </Typography>
        </Box>
        <Box
          display='flex'
          gap={1}
        >
          <Button
            variant='outlined'
            startIcon={<RefreshIcon />}
            onClick={async () => {
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
            }}
            size='small'
            disabled={loading || operationLoading}
          >
            Refresh
          </Button>
          <Button
            variant='outlined'
            startIcon={<SettingsIcon />}
            onClick={() => setStorageModalOpen(true)}
            size='small'
          >
            Storage
          </Button>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
            size='small'
          >
            Add Block
          </Button>
        </Box>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid
            container
            spacing={2}
            alignItems='center'
          >
            <Grid
              item
              xs={12}
              md={4}
            >
              <TextField
                fullWidth
                placeholder='Search blocks...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={3}
            >
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  value={blockSource}
                  onChange={(e) =>
                    setBlockSource(e.target.value as "all" | "src" | "data" | "localStorage")
                  }
                  label='Source'
                >
                  <MenuItem value='all'>
                    <Box>
                      <Typography variant='body2'>🌐 All Sources</Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                      >
                        {predefinedBlocks.length + fileBlocks.length + customBlocks.length} blocks
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value='src'>
                    <Box>
                      <Typography variant='body2'>📁 src/blocks/</Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                      >
                        {predefinedBlocks.length} blocks
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value='data'>
                    <Box>
                      <Typography variant='body2'>💾 data/blocks/files/</Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                      >
                        {fileBlocks.length} blocks
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value='localStorage'>
                    <Box>
                      <Typography variant='body2'>🔒 localStorage</Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                      >
                        {customBlocks.length} blocks
                      </Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid
              item
              xs={12}
              md={3}
            >
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label='Category'
                >
                  <MenuItem value='All'>All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem
                      key={category}
                      value={category}
                    >
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid
              item
              xs={12}
              md={2}
            >
              <Typography
                variant='body2'
                color='text.secondary'
                textAlign='center'
              >
                {filteredBlocks.length} {filteredBlocks.length === 1 ? "block" : "blocks"}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Blocks Grid */}
      {filteredBlocks.length === 0 ? (
        <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
          minHeight={400}
          textAlign='center'
        >
          {getStorageLocations(false).length === 0 && !searchQuery && selectedCategory === "All" ? (
            <>
              <Alert
                severity='info'
                sx={{ mb: 3, maxWidth: 600 }}
              >
                <Typography
                  variant='body2'
                  gutterBottom
                >
                  <strong>No visible storage locations configured!</strong>
                </Typography>
                <Typography variant='body2'>
                  Please click the <strong>Storage</strong> button above to add locations where your
                  blocks will be stored. For example: <code>/Users/your-name/Documents/blocks</code>
                </Typography>
              </Alert>
              <Box
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
                <SettingsIcon sx={{ fontSize: 60, color: "text.disabled" }} />
              </Box>
            </>
          ) : (
            <>
              <Box
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
                {searchQuery || selectedCategory !== "All" ? (
                  <SearchOffOutlined sx={{ fontSize: 60, color: "text.disabled" }} />
                ) : (
                  <AddIcon sx={{ fontSize: 60, color: "text.disabled" }} />
                )}
              </Box>
              <Typography
                variant='h5'
                gutterBottom
                fontWeight={600}
              >
                {searchQuery || selectedCategory !== "All"
                  ? "No blocks found"
                  : "Your block library is empty"}
              </Typography>
            </>
          )}
          <Typography
            variant='body2'
            color='text.secondary'
            mb={3}
            maxWidth={400}
          >
            {searchQuery || selectedCategory !== "All"
              ? "Try different keywords or clear filters to see more blocks."
              : "Start building your email templates by creating your first custom block."}
          </Typography>
          {searchQuery || selectedCategory !== "All" ? (
            <Button
              variant='outlined'
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Clear Filters
            </Button>
          ) : (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => setAddModalOpen(true)}
              size='large'
            >
              Create First Block
            </Button>
          )}
        </Box>
      ) : (
        <Grid
          container
          spacing={2}
        >
          {filteredBlocks.map((block) => {
            const isFileBlock = fileBlocks.some((fb) => fb.id === block.id);

            return (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={`${block.source || "unknown"}-${block.id}`}
              >
                <BlockItem
                  block={block}
                  onDelete={handleDeleteBlock}
                  onUpdate={handleUpdateBlock}
                  isFileBlock={isFileBlock}
                />
              </Grid>
            );
          })}
        </Grid>
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
    </Box>
  );
}
