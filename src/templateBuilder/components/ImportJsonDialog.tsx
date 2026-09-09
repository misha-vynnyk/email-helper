import { useState } from "react";
import { toast } from "react-toastify";

import { Note } from "@/components/ui/primitives";

import Modal from "../../templateLibrary/components/Modal";
import { loadDocument } from "../state/builderStore";
import type { ValidationError } from "../validate";
import { validateBuilderDocument } from "../validate";

interface ImportJsonDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Paste-or-file JSON import for a whole `BuilderDocument` — trimmed-down version of
 * `figmaImport/FigmaImportPanel.tsx`'s proven "Дерево значень (JSON)" block (textarea + file
 * picker via `file.text()`), minus the title field and desktop/mobile pair (a Builder document is
 * a single tree, and its shell already carries a title). Same code path Phase 2's `build_template`
 * MCP tool will call: `validateBuilderDocument()` → `loadDocument(...)`.
 */
export function ImportJsonDialog({ open, onClose }: ImportJsonDialogProps) {
  const [raw, setRaw] = useState("");
  const [errors, setErrors] = useState<ValidationError[] | null>(null);

  const handleClose = () => {
    setRaw("");
    setErrors(null);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrors(null);
    setRaw(await file.text());
    e.target.value = "";
  };

  const handleLoad = () => {
    const result = validateBuilderDocument(raw);
    if (!result.valid || !result.shell || !result.nodes || !result.rootIds) {
      setErrors(result.errors);
      return;
    }
    loadDocument(result.shell, result.nodes, result.rootIds);
    toast.success(`Loaded ${result.rootIds.length} top-level block(s)`);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title='Import JSON'
      actionsRow={
        <>
          <button onClick={handleClose} className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
            Cancel
          </button>
          <button
            onClick={handleLoad}
            disabled={!raw.trim()}
            className='px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm disabled:opacity-50'>
            Load
          </button>
        </>
      }>
      <div className='flex flex-col gap-3'>
        <p className='text-xs text-muted-foreground'>Paste a BuilderDocument JSON below, or choose a .json file — this replaces the current canvas.</p>

        <textarea
          value={raw}
          onChange={(e) => {
            setErrors(null);
            setRaw(e.target.value);
          }}
          placeholder='Paste BuilderDocument JSON here...'
          rows={14}
          className='w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
        />

        <label className='self-start cursor-pointer rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground transition-all hover:bg-accent'>
          Choose file
          <input type='file' accept='.json' className='hidden' onChange={handleFileChange} />
        </label>

        {errors && (
          <Note tone='error'>
            <div className='font-bold mb-1'>Validation errors ({errors.length})</div>
            <ul className='list-disc pl-5 font-mono text-xs'>
              {errors.map((e, i) => (
                <li key={i}>
                  {e.path}: {e.message}
                </li>
              ))}
            </ul>
          </Note>
        )}
      </div>
    </Modal>
  );
}
