import { Plus as AddIcon, Code as CodeIcon, Copy as CopyIcon, Trash2 as DeleteIcon, Edit2 as EditIcon, Send as SendIcon, RefreshCw as SyncIcon, Eye as Visibility } from "lucide-react";
import React from "react";
import { EmailTemplate } from "../../types/template";
import { filterMarkedSections, keepOnlyMarkedSections } from "../utils/htmlSectionFilter";
import { getCategoryIcon } from "../utils/templateCategoryIcons";
import { PreviewConfig } from "./PreviewSettings";

/**
 * Props for the TemplateCard component.
 * Includes all essential data and action handlers for an individual template card.
 */
interface TemplateCardProps {
  template: EmailTemplate;
  previewHtml: string | null;
  loading: boolean;
  previewConfig: PreviewConfig;
  onOpenPreview: () => void;
  onLoadTemplate: () => void;
  onSendEmail: () => Promise<void>;
  onCopyCode: () => void;
  onViewCode: () => void;
  onSync: () => void;
  onEdit: () => void;
  onDelete: () => void;
  syncing: boolean;
  sending: boolean;
  areCredentialsValid: boolean;
  sendEmailDirect: any;
  cardRef: React.RefObject<HTMLDivElement>;
  renderKey: number;
  focusedBlock?: string;
}

/**
 * Renders a single email template card displaying its preview, metadata, and quick actions.
 * Extracts the UI rendering logic from the main TemplateItem for better readability and focus.
 *
 * @param {TemplateCardProps} props - The component props containing data and callbacks.
 */
export default function TemplateCard({ template, previewHtml, loading, previewConfig, onOpenPreview, onLoadTemplate, onSendEmail, onCopyCode, onViewCode, onSync, onEdit, onDelete, syncing, sending, areCredentialsValid, sendEmailDirect, cardRef, renderKey, focusedBlock }: TemplateCardProps) {
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

    if (focusedBlock && focusedBlock !== "All") {
      sanitized = keepOnlyMarkedSections(sanitized, [focusedBlock]);
    }

    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*{[^}]*}/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");

    return sanitized;
  };

  const previewScale = previewConfig.containerHeight / previewConfig.cardHeight;

  return (
    <div ref={cardRef} className='bg-card flex flex-col rounded-[2rem] shadow-soft hover:shadow-lg border border-border/50 hover:border-border transition-all duration-300 group h-full overflow-hidden'>
      {/* Preview Area */}
      <div className='relative flex items-center justify-center overflow-hidden border-b border-border/50 cursor-pointer bg-muted/30 transition-colors hover:bg-muted/50' style={{ height: previewConfig.containerHeight, minHeight: 150 }} onClick={onOpenPreview}>
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
          <button onClick={onCopyCode} className='p-1.5 text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors' title='Quick copy'>
            <CopyIcon size={16} />
          </button>
          <button onClick={onOpenPreview} className='p-1.5 text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors' title='Full preview'>
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

        {template.description && <p className='text-sm text-muted-foreground mb-4 leading-snug'>{template.description}</p>}

        <div className='flex flex-wrap gap-1.5 mb-4'>
          {template.tags.slice(0, 3).map((tag) => (
            <span key={tag} className='px-2.5 py-1 rounded-full text-[10px] font-bold border border-border/60 bg-muted/40 text-foreground uppercase tracking-wider'>
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && <span className='px-2.5 py-1 rounded-full text-[10px] font-bold border border-border/60 bg-muted/40 text-foreground uppercase tracking-wider'>+{template.tags.length - 3}</span>}
        </div>

        <span className='text-xs text-muted-foreground font-medium block mt-auto pt-2'>
          {formatFileSize(template.fileSize)} • {formatDate(template.lastModified)}
        </span>
      </div>

      {/* Actions Area */}
      <div className='px-6 pt-0 pb-6 md:px-5 md:pb-5 flex justify-between items-center'>
        <div className='flex gap-2.5'>
          <button onClick={onLoadTemplate} className='flex items-center justify-center gap-1.5 bg-primary hover:brightness-110 text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-soft transition-all hover:-translate-y-0.5 active:scale-95 text-xs' title='Load into editor'>
            <AddIcon size={16} strokeWidth={3} /> <span className='hidden sm:inline'>Load</span>
          </button>
          <button disabled={!sendEmailDirect || !areCredentialsValid || sending} onClick={onSendEmail} className='flex items-center justify-center gap-1.5 border-2 border-primary text-primary hover:bg-primary/10 font-bold px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 text-xs' title={!sendEmailDirect ? "Email sender not available" : areCredentialsValid ? "Send as email" : "Configure email credentials first"}>
            <SendIcon size={14} strokeWidth={2.5} /> <span className='hidden sm:inline'>{sending ? "Sending" : "Send"}</span>
          </button>
          <button onClick={onCopyCode} className='p-2 bg-muted/50 text-foreground hover:bg-muted hover:text-primary rounded-xl transition-all hover:scale-105 active:scale-95' title='Copy HTML code'>
            <CopyIcon size={18} />
          </button>
          <button onClick={onViewCode} className='p-2 bg-muted/50 text-foreground hover:bg-muted hover:text-primary rounded-xl transition-all hover:scale-105 active:scale-95' title='View code'>
            <CodeIcon size={18} />
          </button>
        </div>

        <div className='flex gap-1.5'>
          <button onClick={onSync} disabled={syncing} className='p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50' title='Sync from file'>
            <SyncIcon size={16} className={syncing ? "animate-spin" : ""} />
          </button>
          <button onClick={onEdit} className='p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full transition-all hover:scale-105 active:scale-95' title='Edit metadata'>
            <EditIcon size={16} />
          </button>
          <button onClick={onDelete} className='p-2 text-destructive hover:bg-destructive/10 rounded-full transition-all hover:scale-105 active:scale-95' title='Remove from library'>
            <DeleteIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
