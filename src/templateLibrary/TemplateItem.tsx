/**
 * Template Item Component
 * Displays a single template card with preview and actions
 */

import React, { useContext, useEffect, useLayoutEffect, useState } from "react";

import { html } from "@codemirror/lang-html";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Remove as RemoveIcon,
  RestartAlt as RestartAltIcon,
  Send as SendIcon,
  Sync as SyncIcon,
  Visibility,
} from "@mui/icons-material";
import {
  alpha,
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";

import { EmailSenderContext } from "../emailSender/EmailSenderContext";
import { useThemeMode } from "../theme";
import { EmailTemplate, TEMPLATE_CATEGORIES, TemplateCategory } from "../types/template";
import { createCodeMirrorTheme } from "../utils/codemirrorTheme";
import { preloadImages } from "../utils/imageUrlReplacer";

import { PreviewConfig } from "./PreviewSettings";
import ResizablePreview from "./ResizablePreview";
import ResponsiveToolbar from "./ResponsiveToolbar";
import { getTemplateContent, removeTemplate, syncTemplate, updateTemplate } from "./templateApi";
import { getCategoryIcon } from "./templateCategoryIcons";
import { templateContentCache } from "./templateContentCache";
import { filterMarkedSections } from "./utils/htmlSectionFilter";

interface TemplateItemProps {
  template: EmailTemplate;
  previewConfig: PreviewConfig;
  onDelete?: (templateId: string) => void;
  onUpdate?: (updatedTemplate: EmailTemplate) => void;
  onLoadTemplate?: (html: string, template: EmailTemplate) => void;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  allTemplates?: EmailTemplate[];
  currentIndex?: number;
  onNavigate?: (direction: "prev" | "next", savedScrollPos?: number) => void;
  savedScrollPosition?: number;
}

export default function TemplateItem({
  template,
  previewConfig,
  onDelete,
  onUpdate,
  onLoadTemplate,
  isOpen = false,
  onOpen,
  onClose,
  allTemplates = [],
  currentIndex = 0,
  onNavigate,
  savedScrollPosition: savedScrollPositionProp = 0,
}: TemplateItemProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const codeMirrorTheme = createCodeMirrorTheme(theme, mode, style);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Track previous template ID to preserve content if same template
  const previousTemplateIdRef = React.useRef<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeContent, setCodeContent] = useState<string>("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const dialogContentRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const savedScrollPosition = React.useRef<number>(0);

  // Email Sender context (опціонально - може бути недоступний)
  const emailSenderContext = useContext(EmailSenderContext);
  const sendEmailDirect = emailSenderContext?.sendEmailDirect ?? null;
  const areCredentialsValid = emailSenderContext?.areCredentialsValid ?? false;

  // Edit state
  const [editedName, setEditedName] = useState(template.name);
  const [editedCategory, setEditedCategory] = useState<TemplateCategory>(template.category);
  const [editedTags, setEditedTags] = useState(template.tags.join(", "));
  const [editedDescription, setEditedDescription] = useState(template.description || "");

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [zoom, setZoom] = useState(1);
  const [renderKey, setRenderKey] = useState(0);
  const [viewportWidth, setViewportWidth] = useState<number | "responsive">(600);
  const [viewportOrientation, setViewportOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  // Синхронізувати локальний стан з prop
  useEffect(() => {
    setPreviewDialogOpen(isOpen);
  }, [isOpen]);

  // Helper function to handle navigation
  const handleNavigation = (direction: "prev" | "next") => {
    // Save scroll position BEFORE navigation (only if enabled)
    const currentScrollPos = previewConfig.saveScrollPosition
      ? scrollContainerRef.current?.scrollTop || 0
      : 0;
    onNavigate?.(direction, currentScrollPos);
  };

  // Keyboard shortcuts for zoom and navigation in preview dialog
  useEffect(() => {
    if (!previewDialogOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigation with arrow keys
      if (e.key === "ArrowLeft" && onNavigate) {
        e.preventDefault();
        handleNavigation("prev");
        return;
      }
      if (e.key === "ArrowRight" && onNavigate) {
        e.preventDefault();
        handleNavigation("next");
        return;
      }

      // Zoom controls
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => Math.min(3, z + 0.1));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoom((z) => Math.max(0.25, z - 0.1));
      } else if (e.key === "r" || e.key === "R" || e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom((z) => Math.min(3, z + 0.1));
        } else {
          setZoom((z) => Math.max(0.25, z - 0.1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [previewDialogOpen, onNavigate]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load content only when visible (check cache first)
  useEffect(() => {
    if (isVisible && !previewHtml && !loading) {
      // Check cache first
      const cachedContent = templateContentCache.get(template.id);
      if (cachedContent) {
        setPreviewHtml(cachedContent);
      } else {
        loadContent();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Preload content when dialog opens (check cache first)
  useEffect(() => {
    if (previewDialogOpen) {
      // Check cache first
      const cachedContent = templateContentCache.get(template.id);
      if (cachedContent && !previewHtml) {
        setPreviewHtml(cachedContent);
      } else if (!previewHtml && !loading) {
        // Start loading immediately
        loadContent();
      }

      // Preload adjacent templates when dialog opens
      if (allTemplates.length > 1 && cachedContent) {
        const adjacentIds = [
          allTemplates[currentIndex - 1]?.id,
          allTemplates[currentIndex + 1]?.id,
        ].filter(Boolean) as string[];

        if (adjacentIds.length > 0) {
          setTimeout(() => {
            templateContentCache.preload(adjacentIds, getTemplateContent);
          }, 100);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDialogOpen]);

  // Reload content when template changes (navigation)
  useEffect(() => {
    if (previewDialogOpen && isOpen && template.id) {
      // Check if same template - preserve content
      if (previousTemplateIdRef.current === template.id && previewHtml) {
        // Same template, keep existing content
        return;
      }

      previousTemplateIdRef.current = template.id;

      // Check cache first - load immediately without delay
      const cachedContent = templateContentCache.get(template.id);
      if (cachedContent) {
        // Use cached content immediately - no loading state
        setPreviewHtml(cachedContent);
        setLoading(false);

        // Preload more adjacent templates for faster navigation
        if (allTemplates.length > 1) {
          const adjacentIds = [
            allTemplates[currentIndex - 2]?.id,
            allTemplates[currentIndex - 1]?.id,
            allTemplates[currentIndex + 1]?.id,
            allTemplates[currentIndex + 2]?.id,
          ].filter(Boolean) as string[];

          if (adjacentIds.length > 0) {
            // Preload asynchronously - don't block
            setTimeout(() => {
              templateContentCache.preload(adjacentIds, getTemplateContent);
            }, 0);
          }
        }
      } else {
        // Don't reset previewHtml if it exists - show it while loading new one (optimistic UI)
        // Only reset zoom
        setZoom(1);

        // Start loading immediately - don't clear existing content
        loadContent();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id, isOpen]);

  // Update saved scroll position when prop changes
  useEffect(() => {
    if (savedScrollPositionProp > 0) {
      savedScrollPosition.current = savedScrollPositionProp;
    }
  }, [savedScrollPositionProp]);

  // Restore scroll position when previewHtml is updated after navigation
  // Use useLayoutEffect to restore before browser paint
  useLayoutEffect(() => {
    if (previewConfig.saveScrollPosition && previewHtml && previewDialogOpen && !loading) {
      const scrollPos =
        savedScrollPositionProp > 0 ? savedScrollPositionProp : savedScrollPosition.current;
      if (scrollPos > 0 && scrollContainerRef.current) {
        // Restore immediately in layout phase
        scrollContainerRef.current.scrollTop = scrollPos;
      }
    } else if (
      !previewConfig.saveScrollPosition &&
      previewHtml &&
      previewDialogOpen &&
      !loading &&
      scrollContainerRef.current
    ) {
      // Reset to top when scroll position saving is disabled
      scrollContainerRef.current.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    previewHtml,
    previewDialogOpen,
    loading,
    savedScrollPositionProp,
    previewConfig.saveScrollPosition,
  ]);

  // Also try with useEffect as fallback for async updates
  useEffect(() => {
    if (previewConfig.saveScrollPosition && previewHtml && previewDialogOpen && !loading) {
      const scrollPos =
        savedScrollPositionProp > 0 ? savedScrollPositionProp : savedScrollPosition.current;
      if (scrollPos > 0) {
        const restoreScroll = () => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollPos;
          }
        };

        // Try multiple times to ensure DOM is ready
        setTimeout(restoreScroll, 50);
        setTimeout(restoreScroll, 200);
        setTimeout(restoreScroll, 400);
      }
    } else if (!previewConfig.saveScrollPosition && previewHtml && previewDialogOpen && !loading) {
      // Reset to top when scroll position saving is disabled
      const resetScroll = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      };
      setTimeout(resetScroll, 50);
      setTimeout(resetScroll, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    previewHtml,
    previewDialogOpen,
    loading,
    savedScrollPositionProp,
    previewConfig.saveScrollPosition,
  ]);

  // Load code content when code dialog opens
  useEffect(() => {
    if (codeDialogOpen) {
      // Load content if not already loaded
      if (!previewHtml) {
        const cachedContent = templateContentCache.get(template.id);
        if (cachedContent) {
          setCodeContent(cachedContent);
        } else {
          setCodeLoading(true);
          getTemplateContent(template.id)
            .then((content) => {
              setCodeContent(content);
              templateContentCache.set(template.id, content);
            })
            .catch(() => {
              setCodeContent("Failed to load content");
            })
            .finally(() => {
              setCodeLoading(false);
            });
        }
      } else {
        setCodeContent(previewHtml);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeDialogOpen, template.id]);

  // Force preview update when hiddenSections config changes
  // This ensures that preview reflects the new filtering settings
  useEffect(() => {
    if (previewHtml && isVisible) {
      // Increment renderKey to force iframe re-render with new filtered content
      setRenderKey((prev) => prev + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewConfig.hiddenSections]);

  const loadContent = async () => {
    // Check cache first
    const cachedContent = templateContentCache.get(template.id);
    if (cachedContent) {
      setPreviewHtml(cachedContent);
      setLoading(false);

      // Preload more adjacent templates in background (2 in each direction)
      if (allTemplates.length > 1) {
        const adjacentIds = [
          allTemplates[currentIndex - 2]?.id,
          allTemplates[currentIndex - 1]?.id,
          allTemplates[currentIndex + 1]?.id,
          allTemplates[currentIndex + 2]?.id,
        ].filter(Boolean) as string[];

        if (adjacentIds.length > 0) {
          // Preload asynchronously - don't block
          setTimeout(() => {
            templateContentCache.preload(adjacentIds, getTemplateContent);
          }, 0);
        }
      }

      return;
    }

    // Check if already loading (deduplicate requests)
    const existingPromise = templateContentCache.getLoadingPromise(template.id);
    if (existingPromise) {
      try {
        const content = await existingPromise;
        setPreviewHtml(content);
        setLoading(false);
        return;
      } catch (error) {
        // Fall through to load normally
      }
    }

    // Only show loading if we don't have any content yet (optimistic UI)
    if (!previewHtml) {
      setLoading(true);
    }

    try {
      // Create loading promise for deduplication
      const loadPromise = getTemplateContent(template.id);
      templateContentCache.setLoadingPromise(template.id, loadPromise);

      const content = await loadPromise;

      // Cache the content
      templateContentCache.set(template.id, content);
      setPreviewHtml(content);

      // Preload зображень з контенту шаблону в кеш (в фоні)
      preloadImages(content).catch((error) => {
        // Ігноруємо помилки preloading - це не критично
        console.warn('[TemplateItem] Failed to preload images:', error);
      });

      // Preload more adjacent templates in background (2 in each direction)
      if (allTemplates.length > 1) {
        const adjacentIds = [
          allTemplates[currentIndex - 2]?.id,
          allTemplates[currentIndex - 1]?.id,
          allTemplates[currentIndex + 1]?.id,
          allTemplates[currentIndex + 2]?.id,
        ].filter(Boolean) as string[];

        if (adjacentIds.length > 0) {
          // Preload asynchronously - don't block
          setTimeout(() => {
            templateContentCache.preload(adjacentIds, getTemplateContent);
          }, 0);
        }
      }

      // Note: Scroll restoration is handled in useEffect hook that watches previewHtml
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to load template: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      let content = previewHtml;

      // Check cache first
      if (!content) {
        const cachedContent = templateContentCache.get(template.id);
        if (cachedContent) {
          content = cachedContent;
        } else {
          await loadContent();
          content = previewHtml || (await getTemplateContent(template.id));
        }
      }

      if (content) {
        await navigator.clipboard.writeText(content);
        setSnackbar({
          open: true,
          message: `"${template.name}" HTML copied to clipboard`,
          severity: "success",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Copy failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      });
    }
  };

  const handleLoadTemplate = async () => {
    try {
      let content = previewHtml;

      // Check cache first
      if (!content) {
        const cachedContent = templateContentCache.get(template.id);
        if (cachedContent) {
          content = cachedContent;
        } else {
          await loadContent();
          content = previewHtml || (await getTemplateContent(template.id));
        }
      }

      if (content) {
        onLoadTemplate?.(content, template);
        setSnackbar({
          open: true,
          message: `"${template.name}" loaded into editor`,
          severity: "success",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to load: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const synced = await syncTemplate(template.id);

      // Invalidate cache after sync (file content may have changed)
      templateContentCache.invalidate(template.id);

      onUpdate?.(synced);
      setSnackbar({
        open: true,
        message: `"${template.name}" synced successfully`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await updateTemplate(template.id, {
        name: editedName,
        category: editedCategory,
        tags: editedTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description: editedDescription || undefined,
      });

      // Invalidate cache if template was updated
      templateContentCache.invalidate(template.id);

      onUpdate?.(updated);
      setEditDialogOpen(false);
      setSnackbar({
        open: true,
        message: `"${template.name}" updated successfully`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Update failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await removeTemplate(template.id);

      // Remove from cache
      templateContentCache.invalidate(template.id);

      onDelete?.(template.id);
      setDeleteDialogOpen(false);
      setSnackbar({
        open: true,
        message: `"${template.name}" removed from library`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Delete failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Remove script tags and inline event handlers from HTML for safe preview
  // This prevents sandbox console errors and security issues
  // Also filters marked sections if configured (PREVIEW ONLY - code remains unchanged)
  const sanitizePreviewHtml = (html: string): string => {
    if (!html) return html;
    let sanitized = html;

    // First, filter marked sections if configured (PREVIEW ONLY)
    if (previewConfig.hiddenSections && previewConfig.hiddenSections.length > 0) {
      sanitized = filterMarkedSections(sanitized, previewConfig.hiddenSections);
    }

    // Remove all script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    // Remove inline event handlers (onclick, onload, onerror, etc.)
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*{[^}]*}/gi, "");

    // Remove javascript: protocol in href/src attributes
    sanitized = sanitized.replace(/javascript:/gi, "");

    return sanitized;
  };

  // Calculate scale to fit template in container
  const previewScale = previewConfig.containerHeight / previewConfig.cardHeight;

  return (
    <>
      <Card
        ref={cardRef}
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* Preview Area */}
        <Box
          sx={{
            position: "relative",
            height: previewConfig.containerHeight,
            minHeight: 150, // Minimum height for usability
            backgroundColor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderBottom: "1px solid",
            borderColor: "divider",
            cursor: "pointer",
            "&:hover .quick-actions": { opacity: 1 },
          }}
          onClick={() => {
            setPreviewDialogOpen(true);
            onOpen?.();
          }}
        >
          {loading ? (
            <Box
              display='flex'
              alignItems='center'
              justifyContent='center'
              height='100%'
            >
              <Typography
                variant='body2'
                color='text.secondary'
              >
                Loading preview...
              </Typography>
            </Box>
          ) : previewHtml ? (
            <iframe
              key={`preview-${template.id}-${renderKey}`}
              srcDoc={sanitizePreviewHtml(previewHtml)}
              title={`Preview of ${template.name}`}
              style={{
                width: `${previewConfig.cardWidth}px`,
                height: `${previewConfig.cardHeight}px`,
                border: "none",
                pointerEvents: "none",
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
              sandbox='allow-same-origin'
            />
          ) : (
            <Typography
              variant='body2'
              color='text.secondary'
            >
              No Preview Available
            </Typography>
          )}

          {/* Quick Actions Overlay */}
          <Box
            className='quick-actions'
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              opacity: 0,
              transition: "opacity 0.2s ease",
              display: "flex",
              gap: 0.5,
              bgcolor: "rgba(0, 0, 0, 0.7)",
              borderRadius: 1,
              p: 0.5,
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip title='Quick copy'>
              <IconButton
                size='small'
                onClick={handleCopyCode}
                sx={{ color: "white" }}
              >
                <CopyIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Full preview'>
              <IconButton
                size='small'
                onClick={() => setPreviewDialogOpen(true)}
                sx={{ color: "white" }}
              >
                <Visibility fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Content */}
        <CardContent sx={{ flexGrow: 1 }}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='flex-start'
            mb={1}
          >
            <Box>
              <Typography
                variant='h6'
                component='h3'
                fontWeight={600}
                sx={{ fontSize: "1rem" }}
              >
                {template.name}
              </Typography>
              {template.folderPath && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: "flex", alignItems: "center", mt: 0.5 }}
                >
                  📁 {template.folderPath}
                </Typography>
              )}
            </Box>
          </Box>

          <Chip
            icon={getCategoryIcon(template.category)}
            label={template.category}
            size='small'
            sx={{ mb: 1 }}
          />

          {template.description && (
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ mb: 1, fontSize: "0.85rem" }}
            >
              {template.description}
            </Typography>
          )}

          <Box
            display='flex'
            flexWrap='wrap'
            gap={0.5}
            mb={1}
          >
            {template.tags.slice(0, 3).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size='small'
                variant='outlined'
                sx={{ fontSize: "0.7rem", height: 20 }}
              />
            ))}
            {template.tags.length > 3 && (
              <Chip
                label={`+${template.tags.length - 3}`}
                size='small'
                variant='outlined'
                sx={{ fontSize: "0.7rem", height: 20 }}
              />
            )}
          </Box>

          <Typography
            variant='caption'
            color='text.secondary'
            display='block'
          >
            {formatFileSize(template.fileSize)} • {formatDate(template.lastModified)}
          </Typography>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
          <Box
            display='flex'
            gap={1}
          >
            <Tooltip title='Load into editor'>
              <Button
                size='small'
                variant='contained'
                startIcon={<AddIcon />}
                onClick={handleLoadTemplate}
              >
                Load
              </Button>
            </Tooltip>
            <Tooltip
              title={
                !sendEmailDirect
                  ? "Email sender not available"
                  : areCredentialsValid
                  ? "Send as email"
                  : "Configure email credentials first"
              }
            >
              <span>
                <Button
                  size='small'
                  variant='outlined'
                  color='primary'
                  startIcon={<SendIcon />}
                  disabled={!sendEmailDirect || !areCredentialsValid || sending}
                  onClick={async () => {
                    if (!sendEmailDirect) return;

                    try {
                      setSending(true);

                      // Завантажуємо HTML якщо ще не завантажено (check cache first)
                      let html = previewHtml;
                      if (!html) {
                        const cachedContent = templateContentCache.get(template.id);
                        if (cachedContent) {
                          html = cachedContent;
                          setPreviewHtml(html);
                        } else {
                          const content = await getTemplateContent(template.id);
                          html = content;
                          setPreviewHtml(html);
                          templateContentCache.set(template.id, html);
                        }
                      }

                      if (!html || html.trim().length === 0) {
                        throw new Error("Template HTML is empty");
                      }

                      // Відправляємо email напряму з HTML і subject
                      await sendEmailDirect(html, template.name || "Email Template");

                      setSnackbar({
                        open: true,
                        message: "Email sent successfully!",
                        severity: "success",
                      });
                    } catch (error) {
                      setSnackbar({
                        open: true,
                        message: error instanceof Error ? error.message : "Failed to send email",
                        severity: "error",
                      });
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  {sending ? "Sending..." : "Send"}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title='Copy HTML code'>
              <IconButton
                size='small'
                onClick={handleCopyCode}
              >
                <CopyIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='View code'>
              <IconButton
                size='small'
                onClick={() => setCodeDialogOpen(true)}
              >
                <CodeIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            display='flex'
            gap={0.5}
          >
            <Tooltip title='Sync from file'>
              <span>
                <IconButton
                  size='small'
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <SyncIcon fontSize='small' />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title='Edit metadata'>
              <IconButton
                size='small'
                onClick={() => setEditDialogOpen(true)}
              >
                <EditIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Remove from library'>
              <IconButton
                size='small'
                onClick={() => setDeleteDialogOpen(true)}
                color='error'
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setZoom(1);
          onClose?.();
        }}
        maxWidth={previewConfig.dialogMaxWidth}
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
          >
            <Box
              display='flex'
              alignItems='center'
              gap={2}
            >
              <Typography variant='h6'>{template.name} - Preview</Typography>
              {allTemplates.length > 1 && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                >
                  ({currentIndex + 1} / {allTemplates.length})
                </Typography>
              )}
            </Box>
            <Box
              display='flex'
              gap={1}
              alignItems='center'
            >
              {/* Navigation Buttons */}
              {allTemplates.length > 1 && onNavigate && (
                <ButtonGroup
                  size='small'
                  variant='outlined'
                >
                  <Tooltip title='Previous template (←)'>
                    <Button onClick={() => handleNavigation("prev")}>
                      <ArrowBackIcon fontSize='small' />
                    </Button>
                  </Tooltip>
                  <Tooltip title='Next template (→)'>
                    <Button onClick={() => handleNavigation("next")}>
                      <ArrowForwardIcon fontSize='small' />
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              )}

              {/* Zoom Controls */}
              <ButtonGroup
                size='small'
                variant='outlined'
              >
                <Tooltip title='Zoom out (-)'>
                  <span>
                    <Button
                      onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
                      disabled={zoom <= 0.25}
                    >
                      <RemoveIcon fontSize='small' />
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title='Reset zoom (R)'>
                  <span>
                    <Button
                      onClick={() => setZoom(1)}
                      disabled={zoom === 1}
                    >
                      <RestartAltIcon fontSize='small' />
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  disabled
                  sx={{ minWidth: 70 }}
                >
                  {Math.round(zoom * 100)}%
                </Button>
                <Tooltip title='Zoom in (+)'>
                  <span>
                    <Button
                      onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                      disabled={zoom >= 3}
                    >
                      <AddIcon fontSize='small' />
                    </Button>
                  </span>
                </Tooltip>
              </ButtonGroup>
            </Box>
          </Box>

          {/* Responsive Toolbar */}
          <Box
            display='flex'
            justifyContent='center'
            mt={2}
          >
            <ResponsiveToolbar
              width={viewportWidth}
              onWidthChange={setViewportWidth}
              orientation={viewportOrientation}
              onOrientationChange={setViewportOrientation}
            />
          </Box>
        </DialogTitle>
        <DialogContent ref={dialogContentRef}>
          {loading && !previewHtml ? (
            <Box
              display='flex'
              justifyContent='center'
              p={4}
            >
              <Typography>Loading...</Typography>
            </Box>
          ) : previewHtml ? (
            <Box
              ref={scrollContainerRef}
              sx={{
                overflow: "auto",
                maxHeight: "70vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                p: 2,
                bgcolor: "#f5f5f5",
              }}
            >
              <ResizablePreview
                width={viewportWidth}
                onWidthChange={setViewportWidth}
                zoom={zoom}
              >
                <Box
                  key={`dialog-preview-${template.id}-${renderKey}`}
                  sx={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top center",
                    transition: "transform 0.2s ease",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    backgroundColor: "#fff",
                    minHeight: 200,
                    p: 2,
                    boxShadow: 2,
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizePreviewHtml(previewHtml) }}
                />
              </ResizablePreview>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mr: "auto" }}
          >
            💡 Tip: Use <strong>←/→</strong> to navigate, <strong>+/-</strong> to zoom,{" "}
            <strong>R</strong> to reset, or <strong>Ctrl+Scroll</strong> to zoom
          </Typography>
          <Button
            onClick={() => {
              setPreviewDialogOpen(false);
              setZoom(1);
              onClose?.();
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Code Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={() => {
          setCodeDialogOpen(false);
          setCodeContent("");
        }}
        maxWidth='lg'
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>HTML Code - {template.name}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              mt: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
              "& .cm-selectionLayer .cm-selectionBackground": {
                backgroundColor: `${alpha(theme.palette.primary.main, 0.25)} !important`,
              },
              "& .cm-selectionBackground": {
                backgroundColor: `${alpha(theme.palette.primary.main, 0.25)} !important`,
              },
              "& .cm-content ::selection": {
                backgroundColor: `${alpha(theme.palette.primary.main, 0.25)} !important`,
              },
            }}
          >
            <CodeMirror
              value={codeLoading ? "Loading..." : codeContent || "No content available"}
              height='60vh'
              extensions={[html(), ...codeMirrorTheme]}
              theme={undefined}
              editable={false}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: false,
                highlightSelectionMatches: true,
                searchKeymap: true,
              }}
            />
          </Box>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mt: 1, display: "block" }}
          >
            💡 Tip: Use <strong>Ctrl+F</strong> / <strong>Cmd+F</strong> to search,{" "}
            <strong>Ctrl+Shift+[</strong> / <strong>Cmd+Shift+[</strong> to fold code blocks
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={async () => {
              try {
                const contentToCopy = codeContent || previewHtml || "";
                if (
                  contentToCopy &&
                  contentToCopy !== "Loading..." &&
                  contentToCopy !== "Failed to load content"
                ) {
                  await navigator.clipboard.writeText(contentToCopy);
                  setSnackbar({
                    open: true,
                    message: `"${template.name}" HTML copied to clipboard`,
                    severity: "success",
                  });
                }
              } catch (error) {
                setSnackbar({
                  open: true,
                  message: `Copy failed: ${error instanceof Error ? error.message : String(error)}`,
                  severity: "error",
                });
              }
            }}
            startIcon={<CopyIcon />}
          >
            Copy
          </Button>
          <Button
            onClick={() => {
              setCodeDialogOpen(false);
              setCodeContent("");
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>Edit Template Metadata</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='Name'
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label='Category'
            value={editedCategory}
            onChange={(e) => setEditedCategory(e.target.value as TemplateCategory)}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            {TEMPLATE_CATEGORIES.map((cat) => (
              <option
                key={cat}
                value={cat}
              >
                {cat}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label='Tags (comma-separated)'
            value={editedTags}
            onChange={(e) => setEditedTags(e.target.value)}
            helperText='e.g., promotional, product, sale'
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Description'
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
          />
          <Box mt={2}>
            <Typography
              variant='caption'
              color='text.secondary'
            >
              <strong>File Path:</strong> {template.filePath}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant='contained'
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth='xs'
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>Remove Template?</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>"{template.name}"</strong> from library?
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mt: 1 }}
          >
            This will not delete the file from your system. The file will remain at:{" "}
            <code>{template.filePath}</code>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color='error'
            variant='contained'
            disabled={deleteLoading}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
