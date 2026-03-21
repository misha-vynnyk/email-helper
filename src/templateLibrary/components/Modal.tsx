import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X as CloseIcon } from "lucide-react";

export interface ModalProps {
  /** Opens or closes the modal */
  open: boolean;
  /** Callback fired when the modal requests to be closed */
  onClose: () => void;
  /** Title rendered in the modal header */
  title: React.ReactNode;
  /** Optional extra content to render in the header next to the title */
  headerExtra?: React.ReactNode;
  /** Main content of the modal */
  children: React.ReactNode;
  /** Optional footer actions row */
  actionsRow?: React.ReactNode;
  /** Optional Tailwind max-width class to constrain modal width (default: 'max-w-2xl') */
  maxWidthClass?: string;
}

/**
 * A generic, highly reusable Modal component managing its own portal, overlay, 
 * animations, and accessible close bindings.
 * 
 * Enforces the Single Responsibility Principle by decoupling dialog infrastructure
 * from specific business features like Preview Settings or Directory Management.
 */
export default function Modal({
  open,
  onClose,
  title,
  headerExtra,
  children,
  actionsRow,
  maxWidthClass = "max-w-2xl",
}: ModalProps) {
  // Prevent body scrolling when the modal is open
  useEffect(() => {
    if (open) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  // Handle escape key to close seamlessly
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      
      {/* Modal Dialog Container */}
      <div 
        className={`relative w-full ${maxWidthClass} bg-card border border-border/50 rounded-2xl shadow-soft flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[95vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 min-h-[72px]">
          <div className="flex items-center gap-4 flex-grow">
            <h2 className="text-lg font-bold text-foreground">
              {title}
            </h2>
            {headerExtra}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors flex-shrink-0"
            aria-label="Close dialog"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        
        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>

        {/* Footer Actions (Optional) */}
        {actionsRow && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
            {actionsRow}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
