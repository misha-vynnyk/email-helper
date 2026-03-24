/**
 * Directory Management Modal Component
 * Allows users to manage allowed directories for template import
 */

import { X as CloseIcon, Trash2 as DeleteIcon, FolderOpen as FolderOpenIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "./Modal";

import { addAllowedRoot, getAllowedRoots, removeAllowedRoot } from "../utils/templateApi";

interface DirectoryManagementModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DirectoryManagementModal({ open, onClose }: DirectoryManagementModalProps) {
  const [allowedDirectories, setAllowedDirectories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [manualPath, setManualPath] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (open) {
      loadAllowedDirectories();
    }
  }, [open]);

  const loadAllowedDirectories = async () => {
    try {
      const directories = await getAllowedRoots();
      setAllowedDirectories(directories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load allowed directories";
      setError(errorMessage);
    }
  };

  const addDirectoryToAllowed = async (directoryPath: string) => {
    try {
      setStatus("Adding directory to allowed folders...");
      await addAllowedRoot({ rootPath: directoryPath });
      await loadAllowedDirectories();
      setStatus(`Directory "${directoryPath}" added successfully!`);
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add directory";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleManualAdd = async () => {
    if (!manualPath.trim()) {
      setError("Please enter a directory path");
      return;
    }
    await addDirectoryToAllowed(manualPath.trim());
    setManualPath("");
    setShowManualInput(false);
  };

  const handleCancelManual = () => {
    setManualPath("");
    setShowManualInput(false);
    setError(null);
  };

  const handleRemoveDirectory = async (directoryPath: string) => {
    try {
      setStatus("Removing directory from allowed folders...");
      const result = await removeAllowedRoot({ rootPath: directoryPath });
      await loadAllowedDirectories();
      setStatus(`Directory "${directoryPath}" removed successfully! ${result.message}`);
      setTimeout(() => setStatus(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove directory");
    }
  };

  const handleClose = () => {
    setError(null);
    setStatus(null);
    setManualPath("");
    setShowManualInput(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title='Manage Allowed Directories'
      actionsRow={
        <button onClick={handleClose} className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
          Close
        </button>
      }>
      {error && (
        <div className='mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex justify-between items-start'>
          <p className='text-sm font-bold'>
            <strong>Error:</strong> {error}
          </p>
          <button onClick={() => setError(null)} className='p-1 hover:bg-destructive/20 rounded-lg transition-colors'>
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {status && (
        <div className='mb-4 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-start'>
          <p className='text-sm font-bold'>{status}</p>
        </div>
      )}

      <div className='mb-6 p-4 rounded-xl bg-muted/30 border border-border/50 text-foreground'>
        <p className='text-sm'>
          <strong>Allowed Directories:</strong> Only files in these directories can be imported into the template library.
        </p>
      </div>

      {allowedDirectories.length > 0 ? (
        <div className='space-y-2 mb-6'>
          {allowedDirectories.map((dir, index) => (
            <div key={index} className='flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 bg-card border border-border rounded-xl'>
              <p className='text-sm font-mono break-all text-foreground'>{dir}</p>
              <button onClick={() => handleRemoveDirectory(dir)} className='flex-shrink-0 px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 border-2 border-transparent hover:border-destructive/20 rounded-lg transition-all'>
                <DeleteIcon size={14} /> Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className='mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning-foreground'>
          <p className='text-sm font-medium'>No directories added yet. Click "Add Directory Path" to get started.</p>
        </div>
      )}

      {!showManualInput ? (
        <button onClick={() => setShowManualInput(true)} className='w-full flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all active:scale-95'>
          <FolderOpenIcon size={18} /> Add Directory Path
        </button>
      ) : (
        <div className='mt-6 p-5 border border-border/50 bg-background rounded-xl'>
          <p className='text-sm font-bold text-foreground mb-4'>Add New Directory Path</p>

          <div className='mb-4'>
            <input type='text' placeholder='e.g., /Users/yourname/Documents/Templates or ~/Documents/Templates' value={manualPath} onChange={(e) => setManualPath(e.target.value)} className='w-full px-4 py-2.5 text-sm rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none' autoFocus />
            <p className='text-xs text-muted-foreground mt-2'>Examples: ~/Documents/Templates, /Users/username/Documents, C:\Users\username\Documents</p>
          </div>

          <div className='p-3 bg-warning/10 border border-warning/20 rounded-lg mb-4'>
            <p className='text-xs font-bold text-warning-foreground mb-1'>Tips:</p>
            <ul className='text-xs text-warning-foreground/80 space-y-1 ml-4 list-disc'>
              <li>
                Use <code>~/</code> for home directory (e.g., ~/Documents)
              </li>
              <li>
                On Mac: <code>/Users/YourName/Documents</code>
              </li>
              <li>
                On Windows: <code>C:\Users\YourName\Documents</code>
              </li>
            </ul>
          </div>

          <div className='flex gap-2'>
            <button onClick={handleManualAdd} disabled={!manualPath.trim()} className='flex-1 px-4 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm disabled:opacity-50'>
              Add Directory
            </button>
            <button onClick={handleCancelManual} className='flex-1 px-4 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'>
              Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
