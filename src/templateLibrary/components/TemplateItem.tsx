/**
 * Template Item Component
 * Displays a single template card with preview and actions
 */

import React, { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { html } from "@codemirror/lang-html";
import CodeMirror from "@uiw/react-codemirror";
import { X as CloseIcon, Copy as CopyIcon } from "lucide-react";

import { useTheme } from "@mui/material";
import { EmailSenderContext } from "../../emailSender/EmailSenderContext";
import { useThemeMode } from "../../theme";
import { EmailTemplate, TEMPLATE_CATEGORIES, TemplateCategory } from "../../types/template";
import { createCodeMirrorTheme } from "../../utils/codemirrorTheme";
import { preloadImages } from "../../utils/imageUrlReplacer";

import { getTemplateContent, removeTemplate, syncTemplate, updateTemplate } from "../utils/templateApi";
import { templateContentCache } from "../utils/templateContentCache";
import { PreviewConfig } from "./PreviewSettings";

import Modal from "./Modal";
import TemplateCard from "./TemplateCard";
import TemplatePreviewDialog from "./TemplatePreviewDialog";

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
  focusedBlock?: string;
}

function TemplateItem({ template, previewConfig, onDelete, onUpdate, onLoadTemplate, isOpen = false, onOpen, onClose, allTemplates = [], currentIndex = 0, onNavigate, savedScrollPosition: savedScrollPositionProp = 0, focusedBlock }: TemplateItemProps) {
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

  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setPreviewDialogOpen(isOpen);
  }, [isOpen]);

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
        const adjacentIds = [allTemplates[currentIndex - 1]?.id, allTemplates[currentIndex + 1]?.id].filter(Boolean) as string[];

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
          const adjacentIds = [allTemplates[currentIndex - 2]?.id, allTemplates[currentIndex - 1]?.id, allTemplates[currentIndex + 1]?.id, allTemplates[currentIndex + 2]?.id].filter(Boolean) as string[];

          if (adjacentIds.length > 0) {
            setTimeout(() => {
              templateContentCache.preload(adjacentIds, getTemplateContent);
            }, 0);
          }
        }
      } else {
        loadContent();
      }
    }
  }, [template.id, isOpen]);

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
        const adjacentIds = [allTemplates[currentIndex - 2]?.id, allTemplates[currentIndex - 1]?.id, allTemplates[currentIndex + 1]?.id, allTemplates[currentIndex + 2]?.id].filter(Boolean) as string[];

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
        console.warn("[TemplateItem] Failed to preload images:", error);
      });

      if (allTemplates.length > 1) {
        const adjacentIds = [allTemplates[currentIndex - 2]?.id, allTemplates[currentIndex - 1]?.id, allTemplates[currentIndex + 1]?.id, allTemplates[currentIndex + 2]?.id].filter(Boolean) as string[];

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

  return (
    <>
      <TemplateCard
        template={template}
        previewHtml={previewHtml}
        loading={loading}
        previewConfig={previewConfig}
        onOpenPreview={() => {
          setPreviewDialogOpen(true);
          onOpen?.();
        }}
        focusedBlock={focusedBlock}
        onLoadTemplate={handleLoadTemplate}
        onSendEmail={async () => {
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
        onCopyCode={handleCopyCode}
        onViewCode={() => setCodeDialogOpen(true)}
        onSync={handleSync}
        onEdit={() => setEditDialogOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
        syncing={syncing}
        sending={sending}
        areCredentialsValid={areCredentialsValid}
        sendEmailDirect={sendEmailDirect}
        cardRef={cardRef}
        renderKey={renderKey}
      />

      <TemplatePreviewDialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          onClose?.();
        }}
        template={template}
        previewHtml={previewHtml}
        loading={loading}
        previewConfig={previewConfig}
        allTemplates={allTemplates}
        currentIndex={currentIndex}
        onNavigate={onNavigate}
        renderKey={renderKey}
        savedScrollPositionProp={savedScrollPositionProp}
        focusedBlock={focusedBlock}
      />

      {/* Code Dialog */}
      <Modal
        open={codeDialogOpen}
        onClose={() => {
          setCodeDialogOpen(false);
          setCodeContent("");
        }}
        maxWidthClass='max-w-5xl'
        title={`HTML Code - ${template.name}`}
        actionsRow={
          <>
            <button
              onClick={async () => {
                try {
                  const contentToCopy = codeContent || previewHtml || "";
                  if (contentToCopy && contentToCopy !== "Loading..." && contentToCopy !== "Failed to load content") {
                    await navigator.clipboard.writeText(contentToCopy);
                    setSnackbar({ open: true, message: `"${template.name}" HTML copied to clipboard`, severity: "success" });
                  }
                } catch (error) {
                  setSnackbar({ open: true, message: `Copy failed: ${error instanceof Error ? error.message : String(error)}`, severity: "error" });
                }
              }}
              className='px-5 py-2.5 flex items-center gap-2 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm'>
              <CopyIcon size={16} /> Copy
            </button>
            <button
              onClick={() => {
                setCodeDialogOpen(false);
                setCodeContent("");
              }}
              className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
              Close
            </button>
          </>
        }>
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
      </Modal>

      {/* Edit Dialog */}
      <Modal
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidthClass='max-w-xl'
        title='Edit Template Metadata'
        actionsRow={
          <>
            <button onClick={() => setEditDialogOpen(false)} className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
              Cancel
            </button>
            <button onClick={handleSaveEdit} className='px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm'>
              Save
            </button>
          </>
        }>
        <div className='flex flex-col gap-5'>
          <div>
            <label className='block text-sm font-extrabold text-foreground mb-1.5'>Name</label>
            <input type='text' value={editedName} onChange={(e) => setEditedName(e.target.value)} className='w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground outline-none transition-all' />
          </div>
          <div>
            <label className='block text-sm font-extrabold text-foreground mb-1.5'>Category</label>
            <select value={editedCategory} onChange={(e) => setEditedCategory(e.target.value as TemplateCategory)} className='w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground outline-none transition-all appearance-none cursor-pointer'>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
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
      </Modal>

      {/* Delete Dialog */}
      <Modal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidthClass='max-w-md'
        title='Remove Template?'
        actionsRow={
          <>
            <button onClick={() => setDeleteDialogOpen(false)} className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} disabled={deleteLoading} className='px-5 py-2.5 text-sm font-bold bg-destructive hover:brightness-110 text-destructive-foreground rounded-xl transition-all shadow-sm disabled:opacity-50'>
              {deleteLoading ? "Removing..." : "Remove"}
            </button>
          </>
        }>
        <p className='text-foreground font-medium'>
          Remove <strong className='font-extrabold'>"{template.name}"</strong> from library?
        </p>
        <p className='text-sm text-muted-foreground mt-3 leading-relaxed'>
          This will not delete the file from your system. The file will remain at: <br />
          <code className='bg-muted px-1.5 py-0.5 rounded text-xs mt-1 block break-all font-mono border border-border/50'>{template.filePath}</code>
        </p>
      </Modal>

      {/* Simple Tailwind Snackbar Replacement */}
      {snackbar.open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-lg font-bold text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 ${snackbar.severity === "error" ? "bg-destructive text-destructive-foreground" : "bg-[#10b981] text-white"}`}>
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
  return prevProps.template.id === nextProps.template.id && prevProps.template.name === nextProps.template.name && prevProps.template.lastModified === nextProps.template.lastModified && prevProps.isOpen === nextProps.isOpen && prevProps.currentIndex === nextProps.currentIndex && prevProps.previewConfig === nextProps.previewConfig;
});
