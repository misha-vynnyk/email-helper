/**
 * Block Storage Modal
 * Manage storage locations for new blocks with add/remove capabilities
 */

import { FolderOpen, Plus as AddIcon, Star as StarIcon, Trash2 as DeleteIcon, Eye as VisibilityIcon, EyeOff as VisibilityOffIcon } from "lucide-react";
import { useState } from "react";

import { Note } from "../components/ui/primitives";
import { cn } from "../lib/utils";
import Modal from "../templateLibrary/components/Modal";
import {
  addStorageLocation,
  getStorageLocations,
  removeStorageLocation,
  setDefaultLocation,
  StorageLocation,
  toggleLocationVisibility,
} from "./blockStorageConfig";

interface BlockStorageModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const inputClass =
  "w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground outline-none transition-all";

export default function BlockStorageModal({ open, onClose, onSave }: BlockStorageModalProps) {
  const [locations, setLocations] = useState<StorageLocation[]>(getStorageLocations(true)); // Include hidden
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationPath, setNewLocationPath] = useState("");
  const [newLocationDescription, setNewLocationDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleAddLocation = () => {
    try {
      if (!newLocationName.trim() || !newLocationPath.trim()) {
        setError("Name and path are required");
        return;
      }

      // Validate that path is absolute (starts with /)
      const trimmedPath = newLocationPath.trim();
      if (!trimmedPath.startsWith("/")) {
        setError(
          "Path must be absolute (start with /). Example: /Users/your-name/Documents/blocks"
        );
        return;
      }

      const updated = addStorageLocation(newLocationName, trimmedPath, newLocationDescription);
      setLocations(updated);
      setNewLocationName("");
      setNewLocationPath("");
      setNewLocationDescription("");
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add location");
    }
  };

  const handleToggleVisibility = (id: string) => {
    try {
      const updated = toggleLocationVisibility(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle visibility");
    }
  };

  const handleRemoveLocation = (id: string) => {
    try {
      const updated = removeStorageLocation(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove location");
    }
  };

  const handleSetDefault = (id: string) => {
    try {
      const updated = setDefaultLocation(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default");
    }
  };

  const handleClose = () => {
    setLocations(getStorageLocations(true)); // Include hidden
    setNewLocationName("");
    setNewLocationPath("");
    setNewLocationDescription("");
    setShowAddForm(false);
    setError(null);
    setSaved(false);
    onClose();
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      if (onSave) onSave();
      handleClose();
    }, 500);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidthClass='max-w-2xl'
      title={
        <span className='flex items-center gap-2'>
          <FolderOpen size={20} /> Block Storage Locations
        </span>
      }
      actionsRow={
        <>
          <button
            onClick={handleClose}
            className='px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all'
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className='px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm'
          >
            Save Configuration
          </button>
        </>
      }
    >
      <div className='flex flex-col gap-4'>
        {saved && <Note tone='success'>Configuration saved!</Note>}
        {error && <Note tone='error'>{error}</Note>}

        <Note tone='info'>
          <strong>Paths:</strong> Use <strong>relative</strong> paths (e.g. `src/blocks`) or{" "}
          <strong>absolute</strong> paths within your Documents folder. Click ⭐ to set default.
        </Note>

        {/* Locations List */}
        {locations.length > 0 ? (
          <div className='flex flex-col gap-2'>
            {locations.map((location) => (
              <div
                key={location.id}
                className={cn(
                  "flex items-start justify-between gap-3 p-3 rounded-xl border",
                  location.isDefault ? "border-primary bg-primary/5" : "border-border bg-card"
                )}
              >
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span
                      className={cn(
                        "text-sm",
                        location.isDefault ? "font-semibold" : "font-normal",
                        location.isHidden && "line-through opacity-60"
                      )}
                    >
                      {location.name}
                    </span>
                    {location.isDefault && !location.isHidden && (
                      <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary'>
                        Default
                      </span>
                    )}
                    {location.isHidden && (
                      <span className='px-2 py-0.5 rounded-full text-[10px] font-bold border border-border text-muted-foreground'>
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground mt-1 break-all'>
                    📁 {location.path}
                  </p>
                  {location.description && (
                    <p className='text-xs text-muted-foreground mt-0.5'>{location.description}</p>
                  )}
                </div>
                <div className='flex items-center gap-1 shrink-0'>
                  <button
                    onClick={() => handleToggleVisibility(location.id)}
                    title={location.isHidden ? "Show location" : "Hide location"}
                    className='p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors'
                  >
                    {location.isHidden ? <VisibilityOffIcon size={16} /> : <VisibilityIcon size={16} />}
                  </button>
                  <button
                    onClick={() => handleSetDefault(location.id)}
                    disabled={location.isDefault || location.isHidden}
                    title='Set as default'
                    className='p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors disabled:opacity-40'
                  >
                    <StarIcon
                      size={16}
                      className={location.isDefault ? "fill-primary text-primary" : ""}
                    />
                  </button>
                  <button
                    onClick={() => handleRemoveLocation(location.id)}
                    title='Remove location'
                    className='p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors'
                  >
                    <DeleteIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Note tone='warning'>No storage locations configured. Add at least one location.</Note>
        )}

        {/* Add Location Form */}
        {showAddForm ? (
          <div className='border-2 border-dashed border-primary/50 p-4 rounded-xl'>
            <p className='text-sm font-bold text-foreground mb-3'>➕ Add New Location</p>
            <div className='flex flex-col gap-3'>
              <div>
                <label className='block text-xs font-bold text-foreground mb-1'>Location Name</label>
                <input
                  type='text'
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder='e.g., Custom Blocks, External Project'
                  className={inputClass}
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-foreground mb-1'>Directory Path</label>
                <input
                  type='text'
                  value={newLocationPath}
                  onChange={(e) => setNewLocationPath(e.target.value)}
                  placeholder='e.g., /Users/your-name/Documents/my-blocks'
                  className={inputClass}
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Must be an absolute path (start with /)
                </p>
              </div>
              <div>
                <label className='block text-xs font-bold text-foreground mb-1'>
                  Description (optional)
                </label>
                <input
                  type='text'
                  value={newLocationDescription}
                  onChange={(e) => setNewLocationDescription(e.target.value)}
                  placeholder='e.g., Shared blocks for multiple projects'
                  className={inputClass}
                />
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={handleAddLocation}
                  className='flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm'
                >
                  <AddIcon size={16} /> Add Location
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewLocationName("");
                    setNewLocationPath("");
                    setNewLocationDescription("");
                    setError(null);
                  }}
                  className='px-4 py-2.5 text-sm font-bold border border-input text-foreground hover:bg-muted rounded-xl transition-all'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className='w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold border-2 border-dashed border-input text-foreground hover:bg-muted rounded-xl transition-all'
          >
            <AddIcon size={16} /> Add Storage Location
          </button>
        )}

        <Note tone='warning'>
          <strong>Security:</strong> Paths outside project directory must be within your Documents
          folder. Backend validates all paths to prevent unauthorized access.
        </Note>
      </div>
    </Modal>
  );
}
