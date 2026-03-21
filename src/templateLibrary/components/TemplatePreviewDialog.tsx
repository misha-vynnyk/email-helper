import React, { useEffect, useState } from "react";
import {
  ArrowLeft as ArrowBackIcon,
  ArrowRight as ArrowForwardIcon,
  Minus as RemoveIcon,
  RefreshCcw as RestartAltIcon,
  Plus as AddIcon,
} from "lucide-react";

import { EmailTemplate } from "../../types/template";
import { PreviewConfig } from "../PreviewSettings";
import { filterMarkedSections } from "../utils/htmlSectionFilter";

import Modal from "./Modal";
import ResizablePreview from "../ResizablePreview";
import ResponsiveToolbar from "../ResponsiveToolbar";

/**
 * Props for the TemplatePreviewDialog component.
 * Contains configuration, data, and callbacks needed to render the expanded template interactive preview.
 */
interface TemplatePreviewDialogProps {
  /** Controls whether the dialog is shown */
  open: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** The email template metadata being previewed */
  template: EmailTemplate;
  /** The fully loaded and cached HTML content of the template */
  previewHtml: string | null;
  /** Loading state for when template HTML is being fetched */
  loading: boolean;
  /** Configuration settings (e.g. dimensions, scroll behavior, hidden sections) */
  previewConfig: PreviewConfig;
  /** Array of all templates in the current filtered view, used for navigation */
  allTemplates: EmailTemplate[];
  /** The current index of the template in the allTemplates array */
  currentIndex: number;
  /** Optional callback to navigate to previous or next templates */
  onNavigate?: (direction: "prev" | "next", savedScrollPos?: number) => void;
  /** React key used to force re-render the iframe when specific preview configurations change */
  renderKey: number;
  /** Optionally pass a scroll position to restore to upon reopening the dialog */
  savedScrollPositionProp?: number;
}

/**
 * Component responsible for managing the full-screen expanded preview dialog of a template.
 * Manages its own zooming, container resize, scroll restoration, and navigation states.
 */
export default function TemplatePreviewDialog({
  open,
  onClose,
  template,
  previewHtml,
  loading,
  previewConfig,
  allTemplates,
  currentIndex,
  onNavigate,
  renderKey,
  savedScrollPositionProp = 0,
}: TemplatePreviewDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [viewportWidth, setViewportWidth] = useState<number | "responsive">(600);
  const [viewportOrientation, setViewportOrientation] = useState<"portrait" | "landscape">("portrait");

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const savedScrollPosition = React.useRef<number>(0);

  // Sync scroll positioning from props when it updates
  useEffect(() => {
    if (savedScrollPositionProp > 0) {
      savedScrollPosition.current = savedScrollPositionProp;
    }
  }, [savedScrollPositionProp]);

  // Restore scroll positions when preview fully loads
  useEffect(() => {
    if (previewConfig.saveScrollPosition && previewHtml && open && !loading) {
      const scrollPos = savedScrollPositionProp > 0 ? savedScrollPositionProp : savedScrollPosition.current;
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
    } else if (!previewConfig.saveScrollPosition && previewHtml && open && !loading) {
      const resetScroll = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      };
      setTimeout(resetScroll, 50);
      setTimeout(resetScroll, 200);
    }
  }, [previewHtml, open, loading, savedScrollPositionProp, previewConfig.saveScrollPosition]);

  const handleNavigation = (direction: "prev" | "next") => {
    const currentScrollPos = previewConfig.saveScrollPosition
      ? scrollContainerRef.current?.scrollTop || 0
      : 0;
    onNavigate?.(direction, currentScrollPos);
  };

  // Keyboard shortcut listeners 
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing combinations inside input boxes generally handled automatically
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
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
  }, [open, onNavigate, previewConfig.saveScrollPosition]);

  const sanitizePreviewHtml = (html: string): string => {
    if (!html) return html;
    let sanitized = html;

    // Apply specific hidden sections processing
    if (previewConfig.hiddenSections && previewConfig.hiddenSections.length > 0) {
      sanitized = filterMarkedSections(sanitized, previewConfig.hiddenSections);
    }

    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*{[^}]*}/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");

    return sanitized;
  };

  const handleClose = () => {
    setZoom(1);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
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
          <button onClick={handleClose} className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
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
    </Modal>
  );
}
