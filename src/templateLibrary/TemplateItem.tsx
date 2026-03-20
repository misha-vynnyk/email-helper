/**
 * Template Item Component
 * Displays a single template card with preview and actions
 */

import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { html } from "@codemirror/lang-html";
import {
  Plus as AddIcon,
  ArrowLeft as ArrowBackIcon,
  ArrowRight as ArrowForwardIcon,
  Code as CodeIcon,
  Copy as CopyIcon,
  Trash2 as DeleteIcon,
  Edit2 as EditIcon,
  Minus as RemoveIcon,
  RefreshCcw as RestartAltIcon,
  Send as SendIcon,
  RefreshCw as SyncIcon,
  Eye as Visibility,
  X as CloseIcon,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";

import { EmailSenderContext } from "../emailSender/EmailSenderContext";
import { useThemeMode } from "../theme";
import { EmailTemplate, TEMPLATE_CATEGORIES, TemplateCategory } from "../types/template";
import { useTheme } from "@mui/material"; // Keep for createCodeMirrorTheme parsing
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

const TailwindDialog = ({ open, onClose, title, children, maxWidthClass = "max-w-lg", actionsRow, headerExtra }: any) => {
  if (!open || typeof document === 'undefined') return null;
  const dialogContent = (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6'>
      <div className='absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity' onClick={onClose} />
      <div className={`relative w-full ${maxWidthClass} bg-card border border-border/50 rounded-2xl shadow-soft flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[95vh]`}>
        <div className='flex items-center justify-between px-6 py-4 border-b border-border/50 min-h-[72px]'>
          <div className='flex items-center gap-4 flex-grow'>
            <h2 className='text-lg font-bold text-foreground'>{title}</h2>
            {headerExtra}
          </div>
          <button onClick={onClose} className='p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors flex-shrink-0'>
            <CloseIcon size={20} />
          </button>
        </div>
        <div className='p-6 overflow-y-auto'>
          {children}
        </div>
        {actionsRow && (
          <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/20'>
            {actionsRow}
          </div>
        )}
      </div>
    </div>
  );
  return createPortal(dialogContent, document.body);
};

function TemplateItem({
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

  useEffect(() => {
    setPreviewDialogOpen(isOpen);
  }, [isOpen]);

  const handleNavigation = (direction: "prev" | "next") => {
    const currentScrollPos = previewConfig.saveScrollPosition
      ? scrollContainerRef.current?.scrollTop || 0
      : 0;
    onNavigate?.(direction, currentScrollPos);
  };

  useEffect(() => {
    if (!previewDialogOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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

  useEffect(() => {
    if (isVisible && !previewHtml && !loading) {
      const cachedContent = templateContentCache.get(template.id);
      if (cachedContent) {
        setPreviewHtml(cachedContent);
      } else {
        loadContent();
      }
    }
  }, [isVisible]);

  useEffect(() => {
    if (previewDialogOpen) {
      const cachedContent = templateContentCache.get(template.id);
      if (cachedContent && !previewHtml) {
        setPreviewHtml(cachedContent);
      } else if (!previewHtml && !loading) {
        loadContent();
      }

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
  }, [previewDialogOpen]);

  useEffect(() => {
    if (previewDialogOpen && isOpen && template.id) {
      if (previousTemplateIdRef.current === template.id && previewHtml) {
        return;
      }

      previousTemplateIdRef.current = template.id;

      const cachedContent = templateContentCache.get(template.id);
      if (cachedContent) {
        setPreviewHtml(cachedContent);
        setLoading(false);

        if (allTemplates.length > 1) {
          const adjacentIds = [
            allTemplates[currentIndex - 2]?.id,
            allTemplates[currentIndex - 1]?.id,
            allTemplates[currentIndex + 1]?.id,
            allTemplates[currentIndex + 2]?.id,
          ].filter(Boolean) as string[];

          if (adjacentIds.length > 0) {
            setTimeout(() => {
              templateContentCache.preload(adjacentIds, getTemplateContent);
            }, 0);
          }
        }
      } else {
        setZoom(1);
        loadContent();
      }
    }
  }, [template.id, isOpen]);

  useEffect(() => {
    if (savedScrollPositionProp > 0) {
      savedScrollPosition.current = savedScrollPositionProp;
    }
  }, [savedScrollPositionProp]);

  useLayoutEffect(() => {
    if (previewConfig.saveScrollPosition && previewHtml && previewDialogOpen && !loading) {
      const scrollPos =
        savedScrollPositionProp > 0 ? savedScrollPositionProp : savedScrollPosition.current;
      if (scrollPos > 0 && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollPos;
      }
    } else if (
      !previewConfig.saveScrollPosition &&
      previewHtml &&
      previewDialogOpen &&
      !loading &&
      scrollContainerRef.current
    ) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [
    previewHtml,
    previewDialogOpen,
    loading,
    savedScrollPositionProp,
    previewConfig.saveScrollPosition,
  ]);

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

        setTimeout(restoreScroll, 50);
        setTimeout(restoreScroll, 200);
        setTimeout(restoreScroll, 400);
      }
    } else if (!previewConfig.saveScrollPosition && previewHtml && previewDialogOpen && !loading) {
      const resetScroll = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      };
      setTimeout(resetScroll, 50);
      setTimeout(resetScroll, 200);
    }
  }, [
    previewHtml,
    previewDialogOpen,
    loading,
    savedScrollPositionProp,
    previewConfig.saveScrollPosition,
  ]);

  useEffect(() => {
    if (codeDialogOpen) {
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
  }, [codeDialogOpen, template.id]);

  useEffect(() => {
    if (previewHtml && isVisible) {
      setRenderKey((prev) => prev + 1);
    }
  }, [previewConfig.hiddenSections]);

  const loadContent = async () => {
    const cachedContent = templateContentCache.get(template.id);
    if (cachedContent) {
      setPreviewHtml(cachedContent);
      setLoading(false);

      if (allTemplates.length > 1) {
        const adjacentIds = [
          allTemplates[currentIndex - 2]?.id,
          allTemplates[currentIndex - 1]?.id,
          allTemplates[currentIndex + 1]?.id,
          allTemplates[currentIndex + 2]?.id,
        ].filter(Boolean) as string[];

        if (adjacentIds.length > 0) {
          setTimeout(() => {
            templateContentCache.preload(adjacentIds, getTemplateContent);
          }, 0);
        }
      }
      return;
    }

    const existingPromise = templateContentCache.getLoadingPromise(template.id);
    if (existingPromise) {
      try {
        const content = await existingPromise;
        setPreviewHtml(content);
        setLoading(false);
        return;
      } catch (error) {}
    }

    if (!previewHtml) {
      setLoading(true);
    }

    try {
      const loadPromise = getTemplateContent(template.id);
      templateContentCache.setLoadingPromise(template.id, loadPromise);

      const content = await loadPromise;

      templateContentCache.set(template.id, content);
      setPreviewHtml(content);

      preloadImages(content).catch((error) => {
        console.warn('[TemplateItem] Failed to preload images:', error);
      });

      if (allTemplates.length > 1) {
        const adjacentIds = [
          allTemplates[currentIndex - 2]?.id,
          allTemplates[currentIndex - 1]?.id,
          allTemplates[currentIndex + 1]?.id,
          allTemplates[currentIndex + 2]?.id,
        ].filter(Boolean) as string[];

        if (adjacentIds.length > 0) {
          setTimeout(() => {
            templateContentCache.preload(adjacentIds, getTemplateContent);
          }, 0);
        }
      }
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

  const sanitizePreviewHtml = (html: string): string => {
    if (!html) return html;
    let sanitized = html;

    if (previewConfig.hiddenSections && previewConfig.hiddenSections.length > 0) {
      sanitized = filterMarkedSections(sanitized, previewConfig.hiddenSections);
    }

    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*{[^}]*}/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");

    return sanitized;
  };

  const previewScale = previewConfig.containerHeight / previewConfig.cardHeight;

  return (
    <>
      <div 
        ref={cardRef} 
        className='bg-card flex flex-col rounded-[2rem] shadow-soft hover:shadow-lg border border-border/50 hover:border-border transition-all duration-300 group h-full overflow-hidden'
      >
        {/* Preview Area */}
        <div
          className='relative flex items-center justify-center overflow-hidden border-b border-border/50 cursor-pointer bg-muted/30 transition-colors hover:bg-muted/50'
          style={{ height: previewConfig.containerHeight, minHeight: 150 }}
          onClick={() => {
            setPreviewDialogOpen(true);
            onOpen?.();
          }}
        >
          {loading ? (
            <div className='flex items-center justify-center h-full'>
              <span className='text-sm text-muted-foreground font-medium'>Loading preview...</span>
            </div>
          ) : previewHtml ? (
            <iframe
              key={`preview-${template.id}-${renderKey}`}
              srcDoc={sanitizePreviewHtml(previewHtml)}
              title={`Preview of ${template.name}`}
              className='absolute top-0 left-0 border-none outline-none pointer-events-none origin-top-left'
              style={{
                width: `${previewConfig.cardWidth}px`,
                height: `${previewConfig.cardHeight}px`,
                transform: `scale(${previewScale})`,
              }}
              sandbox='allow-same-origin'
            />
          ) : (
            <span className='text-sm text-muted-foreground font-medium'>No Preview Available</span>
          )}

          {/* Quick Actions Overlay */}
          <div className='absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 bg-background/80 rounded-xl p-1 shadow-sm backdrop-blur-md z-10' onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCopyCode} className='p-1.5 text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors' title='Quick copy'>
              <CopyIcon size={16} />
            </button>
            <button onClick={() => setPreviewDialogOpen(true)} className='p-1.5 text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors' title='Full preview'>
              <Visibility size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-grow p-6 md:p-5 flex flex-col'>
          <div className='flex justify-between items-start mb-3'>
            <div>
              <h3 className='text-base font-extrabold text-foreground leading-tight'>{template.name}</h3>
              {template.folderPath && (
                <span className='flex items-center text-xs text-muted-foreground mt-1.5 font-medium'>
                  <span className='mr-1.5'>📂</span> {template.folderPath}
                </span>
              )}
            </div>
          </div>
          
          <div className='mb-3 w-fit flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20'>
            {getCategoryIcon(template.category)}
            <span>{template.category}</span>
          </div>

          {template.description && (
            <p className='text-sm text-muted-foreground mb-4 leading-snug'>{template.description}</p>
          )}

          <div className='flex flex-wrap gap-1.5 mb-4'>
            {template.tags.slice(0, 3).map(tag => (
              <span key={tag} className='px-2.5 py-1 rounded-full text-[10px] font-bold border border-border/60 bg-muted/40 text-foreground uppercase tracking-wider'>{tag}</span>
            ))}
            {template.tags.length > 3 && (
              <span className='px-2.5 py-1 rounded-full text-[10px] font-bold border border-border/60 bg-muted/40 text-foreground uppercase tracking-wider'>+{template.tags.length - 3}</span>
            )}
          </div>

          <span className='text-xs text-muted-foreground font-medium block mt-auto pt-2'>
            {formatFileSize(template.fileSize)} • {formatDate(template.lastModified)}
          </span>
        </div>

        {/* Actions Area */}
        <div className='px-6 pt-0 pb-6 md:px-5 md:pb-5 flex justify-between items-center'>
          <div className='flex gap-2.5'>
            <button onClick={handleLoadTemplate} className='flex items-center justify-center gap-1.5 bg-primary hover:brightness-110 text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-soft transition-all hover:-translate-y-0.5 active:scale-95 text-xs' title='Load into editor'>
              <AddIcon size={16} strokeWidth={3} /> <span className='hidden sm:inline'>Load</span>
            </button>
            <button 
              disabled={!sendEmailDirect || !areCredentialsValid || sending}
              onClick={async () => {
                if (!sendEmailDirect) return;
                try {
                  setSending(true);
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
                  if (!html || html.trim().length === 0) throw new Error("Template HTML is empty");
                  await sendEmailDirect(html, template.name || "Email Template");
                  setSnackbar({ open: true, message: "Email sent successfully!", severity: "success" });
                } catch (error) {
                  setSnackbar({ open: true, message: error instanceof Error ? error.message : "Failed to send email", severity: "error" });
                } finally {
                  setSending(false);
                }
              }} 
              className='flex items-center justify-center gap-1.5 border-2 border-primary text-primary hover:bg-primary/10 font-bold px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 text-xs'
              title={!sendEmailDirect ? "Email sender not available" : areCredentialsValid ? "Send as email" : "Configure email credentials first"}
            >
              <SendIcon size={14} strokeWidth={2.5} /> <span className='hidden sm:inline'>{sending ? "Sending" : "Send"}</span>
            </button>
            <button onClick={handleCopyCode} className='p-2 bg-muted/50 text-foreground hover:bg-muted hover:text-primary rounded-xl transition-all hover:scale-105 active:scale-95' title='Copy HTML code'>
              <CopyIcon size={18} />
            </button>
            <button onClick={() => setCodeDialogOpen(true)} className='p-2 bg-muted/50 text-foreground hover:bg-muted hover:text-primary rounded-xl transition-all hover:scale-105 active:scale-95' title='View code'>
              <CodeIcon size={18} />
            </button>
          </div>
          
          <div className='flex gap-1.5'>
            <button onClick={handleSync} disabled={syncing} className='p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50' title='Sync from file'>
              <SyncIcon size={16} className={syncing ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setEditDialogOpen(true)} className='p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full transition-all hover:scale-105 active:scale-95' title='Edit metadata'>
              <EditIcon size={16} />
            </button>
            <button onClick={() => setDeleteDialogOpen(true)} className='p-2 text-destructive hover:bg-destructive/10 rounded-full transition-all hover:scale-105 active:scale-95' title='Remove from library'>
              <DeleteIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <TailwindDialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setZoom(1);
          onClose?.();
        }}
        maxWidthClass="max-w-6xl"
        title={
          <div className="flex items-center gap-3">
            <span>{template.name} - Preview</span>
            {allTemplates.length > 1 && (
              <span className="text-sm font-medium text-muted-foreground">({currentIndex + 1} / {allTemplates.length})</span>
            )}
          </div>
        }
        headerExtra={
          <div className='flex gap-4 items-center ml-auto'>
            {allTemplates.length > 1 && onNavigate && (
              <div className='flex bg-muted rounded-lg p-1'>
                <button onClick={() => handleNavigation("prev")} className='p-1.5 hover:bg-background rounded-md transition-colors text-foreground' title='Previous template (←)'>
                  <ArrowBackIcon size={18} />
                </button>
                <button onClick={() => handleNavigation("next")} className='p-1.5 hover:bg-background rounded-md transition-colors text-foreground' title='Next template (→)'>
                  <ArrowForwardIcon size={18} />
                </button>
              </div>
            )}
            <div className='flex bg-muted rounded-lg p-1 items-center'>
              <button disabled={zoom <= 0.25} onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))} className='p-1.5 hover:bg-background rounded-md transition-colors text-foreground disabled:opacity-50' title='Zoom out (-)'>
                <RemoveIcon size={18} />
              </button>
              <button disabled={zoom === 1} onClick={() => setZoom(1)} className='p-1.5 hover:bg-background rounded-md transition-colors text-foreground disabled:opacity-50' title='Reset zoom (R)'>
                <RestartAltIcon size={18} />
              </button>
              <span className='px-3 text-sm font-semibold text-foreground min-w-[4.5rem] text-center'>
                {Math.round(zoom * 100)}%
              </span>
              <button disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, z + 0.1))} className='p-1.5 hover:bg-background rounded-md transition-colors text-foreground disabled:opacity-50' title='Zoom in (+)'>
                <AddIcon size={18} />
              </button>
            </div>
            {/* The ResponsiveToolbar needs to be placed or adapted. We'll render it here. */}
            <ResponsiveToolbar
              width={viewportWidth}
              onWidthChange={setViewportWidth}
              orientation={viewportOrientation}
              onOrientationChange={setViewportOrientation}
            />
          </div>
        }
        actionsRow={
          <div className='w-full flex justify-between items-center'>
            <p className='text-xs text-muted-foreground font-medium'>
              💡 Tip: Use <strong className='text-foreground'>←/→</strong> to navigate, <strong className='text-foreground'>+/-</strong> to zoom, <strong className='text-foreground'>R</strong> to reset, or <strong className='text-foreground'>Ctrl+Scroll</strong> to zoom
            </p>
            <button onClick={() => { setPreviewDialogOpen(false); setZoom(1); onClose?.(); }} className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
              Close
            </button>
          </div>
        }
      >
        {loading && !previewHtml ? (
          <div className='flex justify-center items-center p-12'>
            <span className='font-medium text-muted-foreground'>Loading...</span>
          </div>
        ) : previewHtml ? (
          <div 
            ref={scrollContainerRef}
            className='overflow-auto max-h-[70vh] flex justify-center items-start p-6 bg-muted/20 rounded-xl'
          >
            <ResizablePreview width={viewportWidth} onWidthChange={setViewportWidth} zoom={zoom}>
              <iframe
                key={`dialog-preview-${template.id}-${renderKey}`}
                srcDoc={sanitizePreviewHtml(previewHtml)}
                title={`Preview of ${template.name}`}
                className='w-full h-[70vh] min-h-[500px] border-none rounded-lg bg-background'
              />
            </ResizablePreview>
          </div>
        ) : null}
      </TailwindDialog>

      {/* Code Dialog */}
      <TailwindDialog
        open={codeDialogOpen}
        onClose={() => { setCodeDialogOpen(false); setCodeContent(""); }}
        maxWidthClass="max-w-5xl"
        title={`HTML Code - ${template.name}`}
        actionsRow={
          <>
            <button onClick={async () => {
              try {
                const contentToCopy = codeContent || previewHtml || "";
                if (contentToCopy && contentToCopy !== "Loading..." && contentToCopy !== "Failed to load content") {
                  await navigator.clipboard.writeText(contentToCopy);
                  setSnackbar({ open: true, message: `"${template.name}" HTML copied to clipboard`, severity: "success" });
                }
              } catch (error) {
                setSnackbar({ open: true, message: `Copy failed: ${error instanceof Error ? error.message : String(error)}`, severity: "error" });
              }
            }} className='px-5 py-2.5 flex items-center gap-2 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm'>
              <CopyIcon size={16} /> Copy
            </button>
            <button onClick={() => { setCodeDialogOpen(false); setCodeContent(""); }} className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
              Close
            </button>
          </>
        }
      >
        <div className='border border-border/50 rounded-xl overflow-hidden shadow-inner'>
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
        </div>
        <p className='text-xs text-muted-foreground font-medium mt-3'>
          💡 Tip: Use <strong className='text-foreground'>Ctrl+F</strong> / <strong className='text-foreground'>Cmd+F</strong> to search, <strong className='text-foreground'>Ctrl+Shift+[</strong> / <strong className='text-foreground'>Cmd+Shift+[</strong> to fold code blocks
        </p>
      </TailwindDialog>

      {/* Edit Dialog */}
      <TailwindDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidthClass="max-w-xl"
        title="Edit Template Metadata"
        actionsRow={
          <>
            <button onClick={() => setEditDialogOpen(false)} className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
              Cancel
            </button>
            <button onClick={handleSaveEdit} className='px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm'>
              Save
            </button>
          </>
        }
      >
        <div className='flex flex-col gap-5'>
          <div>
            <label className='block text-sm font-extrabold text-foreground mb-1.5'>Name</label>
            <input type='text' value={editedName} onChange={(e) => setEditedName(e.target.value)} className='w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground outline-none transition-all' />
          </div>
          <div>
            <label className='block text-sm font-extrabold text-foreground mb-1.5'>Category</label>
            <select value={editedCategory} onChange={(e) => setEditedCategory(e.target.value as TemplateCategory)} className='w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground outline-none transition-all appearance-none cursor-pointer'>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-extrabold text-foreground mb-1.5'>Tags (comma-separated)</label>
            <input type='text' value={editedTags} onChange={(e) => setEditedTags(e.target.value)} placeholder='e.g., promotional, product, sale' className='w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground outline-none transition-all' />
          </div>
          <div>
            <label className='block text-sm font-extrabold text-foreground mb-1.5'>Description</label>
            <textarea rows={3} value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className='w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground outline-none transition-all resize-none' />
          </div>
          <div className='mt-2 p-3 bg-muted/50 rounded-xl border border-border/50'>
            <p className='text-xs text-muted-foreground font-mono break-all'>
              <strong className='text-foreground font-bold mr-1'>File Path:</strong> {template.filePath}
            </p>
          </div>
        </div>
      </TailwindDialog>

      {/* Delete Confirmation Dialog */}
      <TailwindDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidthClass="max-w-md"
        title="Remove Template?"
        actionsRow={
          <>
            <button onClick={() => setDeleteDialogOpen(false)} className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} disabled={deleteLoading} className='px-5 py-2.5 text-sm font-bold bg-destructive hover:brightness-110 text-destructive-foreground rounded-xl transition-all shadow-sm disabled:opacity-50'>
              {deleteLoading ? 'Removing...' : 'Remove'}
            </button>
          </>
        }
      >
        <p className='text-foreground font-medium'>
          Remove <strong className='font-extrabold'>"{template.name}"</strong> from library?
        </p>
        <p className='text-sm text-muted-foreground mt-3 leading-relaxed'>
          This will not delete the file from your system. The file will remain at: <br/>
          <code className='bg-muted px-1.5 py-0.5 rounded text-xs mt-1 block break-all font-mono border border-border/50'>{template.filePath}</code>
        </p>
      </TailwindDialog>

      {/* Simple Tailwind Snackbar Replacement */}
      {snackbar.open && typeof document !== 'undefined' && createPortal(
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-lg font-bold text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          snackbar.severity === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-[#10b981] text-white'
        }`}>
          {snackbar.message}
          <button onClick={() => setSnackbar((prev) => ({ ...prev, open: false }))} className='p-1 hover:bg-white/20 rounded-full transition-colors'>
            <CloseIcon size={14} strokeWidth={3} />
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

export default React.memo(TemplateItem, (prevProps, nextProps) => {
  return (
    prevProps.template.id === nextProps.template.id &&
    prevProps.template.name === nextProps.template.name &&
    prevProps.template.lastModified === nextProps.template.lastModified &&
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.currentIndex === nextProps.currentIndex &&
    prevProps.previewConfig === nextProps.previewConfig
  );
});
